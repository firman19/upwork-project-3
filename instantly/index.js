const express = require("express");
const axios = require("axios");
require("dotenv").config();

const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL_INSTANTLY = process.env.API_URL_INSTANTLY;
const API_TOKEN_INSTANTLY = process.env.API_TOKEN_INSTANTLY;
const API_URL_ZENDESK = process.env.API_URL_ZENDESK;
const API_TOKEN_ZENDESK = process.env.API_TOKEN_ZENDESK;

// Middleware
app.use(express.json());

// Helper function for API requests
const apiRequest = async (method, endpoint, data = {}) => {
  return axios({
    method,
    url: `${API_URL_INSTANTLY}${endpoint}`,
    headers: { Authorization: `Bearer ${API_TOKEN_INSTANTLY}` },
    data,
  });
};

const apiZendesk = async (method, endpoint, data = {}) => {
  let url = `${API_URL_ZENDESK}${endpoint}`;
  console.log(url);

  return axios({
    method,
    url: `${API_URL_ZENDESK}${endpoint}`,
    headers: { Authorization: `Bearer ${API_TOKEN_ZENDESK}` },
    data,
  });
};

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

    console.log(email);

    const payload = {
      email,
    };

    const queryString = new URLSearchParams(payload).toString();

    console.log(queryString);

    const { data } = await apiZendesk("get", `leads?${queryString}`);
    res.json(data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Internal Server Error",
    });
  }
});

// ZENDESK
app.get("/test", async (req, res) => {
  let opt = {
    method: "GET",
    headers: {
      "x-org-auth":
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3X2lkIjoiYmE2NmZkZTQtYjQyZS00NDNhLTlmNTgtNmNlMmU3MDI3NmFiIiwiaWF0IjoxNzQxNDU2MjIwfQ.ec7zPefW8GoQ-nSnTeAS-PAlxI-LfuSZiN9MVb0lVUo",
      // accept: "application/json, text/plain, */*",
      // "accept-encoding": "gzip, deflate, br, zstd",
      // "accept-language": "en-US,en;q=0.9,id;q=0.8,la;q=0.7",
      // "cache-control": "no-cache",
      // pragma: "no-cache",
      // referer:
      //   "https://app.instantly.ai/app/campaign/31587373-9513-4e38-8cec-ebb099d5392d/leads",
      // "sec-ch-ua":
      //   '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      // "sec-ch-ua-mobile": "?0",
      // "sec-ch-ua-platform": '"macOS"',
      // "sec-fetch-dest": "empty",
      // "sec-fetch-mode": "cors",
      // "sec-fetch-site": "same-origin",
      // "user-agent":
      //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      // cookie: "cf_clearance=JQusYNqvI6qDM0yMxs2H...",
    },
  };

  let email = `firmansyah@elementaryschools.org`;
  let campaign_id = `a51077ca-46bb-42f6-8e6d-154d598678a4`;
  let activity_history = [];
  let event_types = [];

  try {
    let url = `https://app.instantly.ai/backend-alt/api/v1/activity/list?campaign_id=${campaign_id}&lead=${email}`;
    let opt = {
      method: "GET",
      headers: {
        "x-org-auth":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3X2lkIjoiYmE2NmZkZTQtYjQyZS00NDNhLTlmNTgtNmNlMmU3MDI3NmFiIiwiaWF0IjoxNzQxNDU2MjIwfQ.ec7zPefW8GoQ-nSnTeAS-PAlxI-LfuSZiN9MVb0lVUo",
      },
    };

    const resp = await fetchData(url, opt);
    activity_history = resp.activity_history;
    console.log(activity_history);
    
    if (activity_history.length > 0) {
      activity_history.forEach((element) => {
        let dateEvent = element.timestamp_created
        let event_type_converted = convertEventToText(element.event_type);
        event_types.push(`Educator ${event_type_converted} ${moment.utc(dateEvent).format('YYYY-MM-DD HH:mm')}`);
      });
    }

    event_types = event_types.reverse();
  } catch (error) {
    console.error(error);
  }

  let user_id = null;
  try {
    const payload = { email };
    const queryString = new URLSearchParams(payload).toString();
    const { data } = await apiZendesk("get", `leads?${queryString}`);
    user_id = data.items[0].data.id;
  } catch (error) {
    console.error(error);
  }

  if (!user_id) {
    res.json(`user_id not found`);
  }

  if (user_id) {
    try {
      const payload = {
        data: {
          tags: event_types,
        },
      };
      const { data } = await apiZendesk("put", `leads/${user_id}`, payload);

      console.log(data);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  }
});

async function fetchData(url, opt = {}) {
  const response = await fetch(url, opt);
  return response.json();
}

function convertEventToText(num) {
  // event_type: -3, auto reply
  // event_type: 1, sent
  // event_type: 2, opened
  let str = "";
  switch (num) {
    case 1:
      str = "sent";
      break;
    case 2:
      str = "opened";
      break;
    case -3:
      str = "auto reply";
      break;

    default:
      break;
  }

  return str;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
