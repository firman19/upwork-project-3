import { apiRequest } from "./http.js";
import { convertEventToText } from "./helpers.js";

export const Instantly = {
  getCampaings: async () => {
    let result = false;
    try {
      const { data } = await apiRequest("get", "campaigns?limit=100");
      result = data;
    } catch (error) {
      // console.error(error);
      result = false;
    }
    return result;
  },

  getCampaignDetail: async (id) => {
    let result = false;
    try {
      const { data } = await apiRequest("get", `campaigns/${id}`);
      result = data;
    } catch (error) {
      // console.error(error);
      result = false;
    }
    return result;
  },

  getLeads: async (campaign_id, starting_after = "") => {
    let result = false;
    try {
      const payload = {
        campaign: campaign_id,
        limit: 100, // max is 100
        starting_after: starting_after,
      };

      const { data } = await apiRequest("post", `leads/list`, payload);
      result = data;
    } catch (error) {
      // console.error(error);
      result = false;
    }
    return result;
  },

  addLead: async (payload) => {
    let result = false;
    const { campaign, email, last_name, first_name, company_name, phone } =
      payload;
    try {
      const obj = {
        campaign, // campaign uuid
        email, // lead email
        last_name,
        first_name,
        company_name,
        personalization: "",
        website: "",
        phone: "",
        lt_interest_status: 1,
        pl_value_lead: "",
        // assigned_to: "a71781c4-60b3-4bdd-8306-8935aa036c0a", // ID of the user assigned to the lead
        skip_if_in_workspace: false, // Skip lead if it exists in any campaigns in the workspace
        skip_if_in_campaign: false, // Skip lead if it exists in a campaign
        skip_if_in_list: false, // skip this email if it has been
        verify_leads_for_lead_finder: false,
        verify_leads_on_import: false,
      };

      const { data } = await apiRequest("post", `leads`, obj);
      result = data;
    } catch (error) {
      console.error(error);
      result = false;
    }
    return result;
  },

  getActivity: async (CAMPAIGN_ID, EMAIL) => {
    let result = false;
    let activity_history = [];
    let event_types = [];
    try {
      let url = `https://app.instantly.ai/backend-alt/api/v1/activity/list?campaign_id=${CAMPAIGN_ID}&lead=${EMAIL}`;
      let opt = {
        method: "GET",
        headers: {
          "x-org-auth":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3X2lkIjoiYmE2NmZkZTQtYjQyZS00NDNhLTlmNTgtNmNlMmU3MDI3NmFiIiwiaWF0IjoxNzQxNDU2MjIwfQ.ec7zPefW8GoQ-nSnTeAS-PAlxI-LfuSZiN9MVb0lVUo",
        },
      };

      const resp = await fetchData(url, opt);
      activity_history = resp.activity_history;

      if (activity_history.length > 0) {
        activity_history.forEach((element) => {
          let dateEvent = element.timestamp_created;
          let event_type_converted = convertEventToText(element.event_type);

          let obj = {
            datetime: dateEvent,
            event_type: event_type_converted,
          };
          event_types.push(obj);
        });
      }

      event_types = event_types.reverse();
      result = event_types;
    } catch (error) {
      // console.error(error);
      result = false;
    }

    return result;
  },
};

async function fetchData(url, opt = {}) {
  const response = await fetch(url, opt);
  return response.json();
}
