import express from "express";
import { apiRequest } from "./services/http.js";
import { apiZendesk } from "./services/http.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Fetch campaigns on Instantly
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

// Fetch leads from a campaign on Instantly
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

// Add lead to a campaign on Instantly
app.post("/leads", async (req, res) => {
  const { campaign, email, last_name, first_name, company_name, phone } =
    req.body;

  const obj = {
    campaign, // campaign uuid
    email, // lead email
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
    assigned_to: "a71781c4-60b3-4bdd-8306-8935aa036c0a", // ID of the user assigned to the lead
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

// Add blocklist entry on Instantly
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

// Fetch leads on Zendesk
app.get("/zendesk/leads", async (req, res) => {
  try {
    const { email, per_page, page } = req.query;

    const payload = {
      email: email ?? "",
      per_page: per_page ?? 10,
      page: page ?? 1,
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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
