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

  getCampaingDetail: async (id) => {
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

  getLeads: async (campaign_id) => {
    let result = false;
    try {
      const payload = {
        campaign: campaign_id,
        limit: 20,
      };

      const { data } = await apiRequest("post", `leads/list`, payload);
      result = data;
    } catch (error) {
      // console.error(error);
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
