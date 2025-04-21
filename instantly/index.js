import express from "express";
import { Instantly } from "./services/instantly.js";
import {
  Zendesk,
  generateNotesJson,
  generateTaskJson,
} from "./services/zendesk.js";
import { apiRequest } from "./services/http.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Fetch campaigns Instantly
app.get("/campaigns", async (req, res) => {
  try {
    const { data } = await apiRequest("get", "campaigns");
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Internal Server Error",
    });
  }
});

// Fetch leads from a campaign Instantly
app.get("/leads", async (req, res) => {
  try {
    const { campaign_id } = req.query;
    const payload = {
      campaign: campaign_id,
      limit: 100,
    };
    const { data } = await apiRequest("post", `leads/list`, payload);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Internal Server Error",
    });
  }
});

// Add lead to a campaign Instantly
app.post("/leads", async (req, res) => {
  const { campaign, email, last_name, first_name, company_name, phone } =
    req.body;

  const obj = {
    campaign,
    email,
    personalization: "",
    website: "",
    last_name,
    first_name,
    company_name,
    phone,
    // payload: {
    //   "test-key": "test-value",
    // },
    lt_interest_status: 1,
    pl_value_lead: "",
    assigned_to: "a71781c4-60b3-4bdd-8306-8935aa036c0a",
    skip_if_in_workspace: true,
    skip_if_in_campaign: true,
    skip_if_in_list: true,
    verify_leads_for_lead_finder: false,
    verify_leads_on_import: false,
  };
  try {
    const response = await apiRequest("post", "leads", obj);
    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Internal Server Error",
    });
  }
});

// Add blocklist entry Instantly
app.post("/blocklist", async (req, res) => {
  const { bl_value } = req.body;

  const obj = {
    bl_value,
  };

  try {
    const response = await apiRequest("post", "block-lists-entries", obj);
    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Internal Server Error",
    });
  }
});

// ZENDESK
app.get("/zendesk/leads", async (req, res) => {
  try {
    const { email } = req.query;

    const payload = {
      email,
    };

    const queryString = new URLSearchParams(payload).toString();

    const { data } = await apiZendesk("get", `leads?${queryString}`);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Internal Server Error",
    });
  }
});

// upload leads from Zendesk to Instantly
app.get("/instantly/upload-leads", async (req, res) => {
  res.json("OK");

  // get all leads from zendesk or get only new leads?
  // determine which lead goes to which campaign
});

// upload leads' activity from Instantly to Zendesk
app.get("/zendesk/upload-leads-activity", async (req, res) => {
  // 1. Get All Campaigns from Instantly
  // let campaigns = await Instantly.getCampaings();
  // console.log(
  //   `[INSTANTLY] Get All Campaigns from Instantly: ${campaigns?.items?.length} campaigns`
  // );
  // return res.json(campaigns);

  let CAMPAIGN_ID = `a51077ca-46bb-42f6-8e6d-154d598678a4-test`;
  let CAMPAIGN_NAME = `Cold Educator A/B-test`;
  const { campaign_id } = req.query;
  if (campaign_id) {
    CAMPAIGN_ID = campaign_id;
    let campaignDetail = await Instantly.getCampaingDetail(CAMPAIGN_ID);
    CAMPAIGN_NAME = campaignDetail.name;
  }

  // 2. Get List Leads by Campaign ID
  let leads = await Instantly.getLeads(CAMPAIGN_ID);
  let instantlyActivityLeads = 0;
  let zendeskLeads = 0;
  console.log(
    `[INSTANTLY] Leads in Campaign ${CAMPAIGN_NAME}: ${
      leads?.items?.length ?? 0
    } leads`
  );
  // return res.json(leads);

  // 3. Get Activity by Campaign ID and Email
  let EMAIL = `firmansyah@elementaryschools.org`;
  if (leads === false || leads?.items?.length == 0) {
    return res.json("Leads Not Found");
  }
  for (const element of leads.items) {
    EMAIL = element.email;
    let activity_list = await Instantly.getActivity(CAMPAIGN_ID, EMAIL);
    console.log(
      `[INSTANTLY] Activities in Campaign ${CAMPAIGN_NAME} from ${EMAIL}: ${activity_list.length}`
    );
    if (activity_list === false || activity_list.length == 0) {
      // this lead does not have activity yet
      continue;
      // return;
    }
    console.log(activity_list);
    instantlyActivityLeads++;

    // 4. Get Leads by Email
    let lead_zendesk = await Zendesk.getLeads(EMAIL);
    console.log(
      `[ZENDESK] Lead ID from ${EMAIL}: ${lead_zendesk?.id ?? "NOT FOUND"} `
    );
    // return res.json(lead_zendesk);

    if (lead_zendesk === false) {
      // this lead is not found on zendesk
      continue;
      // return;
    } else {
      zendeskLeads++;
      // 5. Get Users (Owner) Detail
      const OWNER_ID = lead_zendesk.owner_id;
      let owner = await Zendesk.getUser(OWNER_ID);
      let owner_email = "";
      if (owner) {
        owner_email = owner.email;
      }
      console.log(`[ZENDESK] Get Email of Lead Owner: ${owner_email}`);
      // return res.json(owner);

      // 6. Add Notes & Tasks
      for (const elmt of activity_list) {
        const notesJson = {
          resource_id: lead_zendesk?.id, // lead_id
          owner_email,
          campaign_name: CAMPAIGN_NAME,
          activity_type: elmt?.event_type,
          activity_timestamp: elmt?.datetime,
        };
        const body = generateNotesJson(notesJson);
        let addNotes = await Zendesk.addNotes(body);
        console.log(`[ZENDESK] Adding Notes: ${activity_list.length} Notes`);

        if (elmt?.event_type != "sent") {
          const taskJson = generateTaskJson({
            resource_id: lead_zendesk?.id, // lead_id
            owner_id: OWNER_ID,
            activity_type: elmt?.event_type,
          });
          let addTasks = await Zendesk.addTask(taskJson);
          console.log(`[ZENDESK] Adding Tasks: ${activity_list.length} Tasks`);
        }
      }
    }
  }

  // return res.json(leads);
  return res.json(
    `${CAMPAIGN_NAME}. Instantly leads ${leads?.items?.length}. Instantly leads with activity ${instantlyActivityLeads}. Zendesk leads ${zendeskLeads}`
  );

  // let opt = {
  //   method: "GET",
  //   headers: {
  //     "x-org-auth":
  //       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3X2lkIjoiYmE2NmZkZTQtYjQyZS00NDNhLTlmNTgtNmNlMmU3MDI3NmFiIiwiaWF0IjoxNzQxNDU2MjIwfQ.ec7zPefW8GoQ-nSnTeAS-PAlxI-LfuSZiN9MVb0lVUo",
  //     // accept: "application/json, text/plain, */*",
  //     // "accept-encoding": "gzip, deflate, br, zstd",
  //     // "accept-language": "en-US,en;q=0.9,id;q=0.8,la;q=0.7",
  //     // "cache-control": "no-cache",
  //     // pragma: "no-cache",
  //     // referer:
  //     //   "https://app.instantly.ai/app/campaign/31587373-9513-4e38-8cec-ebb099d5392d/leads",
  //     // "sec-ch-ua":
  //     //   '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  //     // "sec-ch-ua-mobile": "?0",
  //     // "sec-ch-ua-platform": '"macOS"',
  //     // "sec-fetch-dest": "empty",
  //     // "sec-fetch-mode": "cors",
  //     // "sec-fetch-site": "same-origin",
  //     // "user-agent":
  //     //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  //     // cookie: "cf_clearance=JQusYNqvI6qDM0yMxs2H...",
  //   },
  // };
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
