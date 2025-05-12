import fs from "fs";
import path from "path";
import { apiZendesk } from "./services/http.js";
import knexConfig from './knexfile.js';
import Knex from 'knex';
import { exit } from "process";

const knex = Knex(knexConfig);

const today = new Date().toISOString().split("T")[0];
const __dirname = path.resolve();
fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
const logFileUpload = path.join(
  __dirname,
  "logs",
  `${today}_download-leads.log`
);
const logStream = fs.createWriteStream(logFileUpload, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logStream.write(fullMessage + "\n");
}

async function main() {
  let page = 1;
  let per_page = 100;
  let next_page = true;
  let obj_userType_edu_business = [];
  let obj_userType_educator = [];
  let obj_userType_vendor = [];
  let obj_triggerType_posted_job = [];
  let obj_triggerType_posted_event = [];
  let obj_triggerType_invested_ad = [];
  let obj_triggerType_offered_deal = [];
  let total_leads = 0;

  log(`🚀 Starting download-lead...`);
  while (next_page) {
    log(`📦 Fetching page ${page}...`);

    const payload = { per_page, page };
    const queryString = new URLSearchParams(payload).toString();
    let data = null;
    try {
      const resp = await apiZendesk("get", `leads?${queryString}`);
      data = resp.data
      if (data?.items) {
        log(`  → Retrieved ${data.items.length} items.`);
        total_leads += data.items.length;

        for (let i = 0; i < data.items.length; i++) {
          const element = data.items[i];
          const custom_fields = element.data.custom_fields;

          let newElement = {
            email: element.data.email,
            last_name: element.data.last_name,
            first_name: element.data.first_name,
            organization_name: element.data.organization_name,
            phone: element.data.phone,
          }

          let userTypeArray = custom_fields?.["User Type"] || [];
          let userTypes;
          if (Array.isArray(userTypeArray)) {
            userTypes = userTypeArray.map((t) => t.toLowerCase())
          } else {
            userTypes = userTypeArray.toLowerCase();
          }

          let triggerTypeArray = custom_fields?.["Trigger type"] || [];
          let triggerTypes;
          if (Array.isArray(triggerTypeArray)) {
            triggerTypes = triggerTypeArray.map((t) => t.toLowerCase())
          } else {
            triggerTypes = triggerTypeArray.toLowerCase();
          }

          if (triggerTypes.includes("posted a job")) {
            obj_triggerType_posted_job.push(newElement);
            newElement.category = 'posted_job'
          }

          if (triggerTypes.includes("posted an event")) {
            obj_triggerType_posted_event.push(newElement);
            newElement.category = 'posted_event'
          }

          if (triggerTypes.includes("invested in an ad")) {
            obj_triggerType_invested_ad.push(newElement);
            newElement.category = 'invested_ad'
          }

          if (triggerTypes.includes("offered a deal")) {
            obj_triggerType_offered_deal.push(newElement);
            newElement.category = 'offered_deal'
          }

          if (!triggerTypes || triggerTypes.length == 0) {
            if (userTypes.includes("edu business")) {
              obj_userType_edu_business.push(newElement);
              newElement.category = 'edu_business'
            }

            if (userTypes.includes("educator")) {
              obj_userType_educator.push(newElement);
              newElement.category = 'educator'
            }

            if (userTypes.includes("vendor")) {
              obj_userType_vendor.push(newElement);
              newElement.category = 'vendor'
            }
          }

          if (newElement.category) {
            const existingLead = await knex('leads').where('email', newElement.email).first();
            if (!existingLead) {
              await knex('leads').insert(newElement);
            }
          }
        }
      } else {
        log(`  → No items found on page ${page}.`);
      }
    } catch (err) {
      log(`  → Error getting page ${page}: ${err.message}.`);
    }

    page++;
    next_page = data?.meta.links?.next_page ?? false;
  }

  log(`✅ Finished. Total leads fetched: ${total_leads}`);
  log(`📁 Saved ${obj_userType_edu_business.length} to data/edu_business.json`);
  log(`📁 Saved ${obj_userType_educator.length} to data/educator.json`);
  log(`📁 Saved ${obj_userType_vendor.length} to data/vendor.json`);
  log(`📁 Saved ${obj_triggerType_posted_job.length} to data/posted_job.json`);
  log(
    `📁 Saved ${obj_triggerType_posted_event.length} to data/posted_event.json`
  );
  log(
    `📁 Saved ${obj_triggerType_invested_ad.length} to data/invested_ad.json`
  );
  log(
    `📁 Saved ${obj_triggerType_offered_deal.length} to data/offered_deal.json`
  );
  log("============================");

  logStream.close();
  exit();
}

export default main;