import https from "https";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_URL_INSTANTLY = process.env.API_URL_INSTANTLY;
const API_TOKEN_INSTANTLY = process.env.API_TOKEN_INSTANTLY;
const API_URL_ZENDESK = process.env.API_URL_ZENDESK;
const API_TOKEN_ZENDESK = process.env.API_TOKEN_ZENDESK;

export const apiRequest = async (method, endpoint, data = {}) => {
  const url = `${API_URL_INSTANTLY}${endpoint}`;
  const headers = { Authorization: `Bearer ${API_TOKEN_INSTANTLY}` };

  return axios({
    method,
    url,
    headers,
    data,
  });
};

export const apiZendesk = async (method, endpoint, data = {}) => {
  const url = `${API_URL_ZENDESK}${endpoint}`;
  const headers = { Authorization: `Bearer ${API_TOKEN_ZENDESK}` };

  return axios({
    method,
    url,
    httpsAgent: new https.Agent({ family: 4 }), // force IPv4
    headers,
    data,
  });
};
