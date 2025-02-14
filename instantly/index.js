const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL_INSTANTLY = process.env.API_URL_INSTANTLY;
const API_TOKEN_INSTANTLY = process.env.API_TOKEN_INSTANTLY;

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

// Fetch campaigns
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

// Fetch leads from a campaign
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

// Add lead to a campaign
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

// Add blocklist entry
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
