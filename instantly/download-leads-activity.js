import { Instantly } from "./services/instantly.js";
import fs from "fs";
import path from "path";
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
  `${today}_download-leads-activity.log`
);
const logStream = fs.createWriteStream(logFileUpload, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logStream.write(fullMessage + "\n");
}

// export default async function downloadLeadsActivity(campaign_id) {
async function downloadLeadsActivity(campaign_id) {
  if (!campaign_id) {
    log("❌ Error: campaign_id is required.");
    return;
  }

  let CAMPAIGN_ID = campaign_id;
  let CAMPAIGN_NAME = "";

  log(`🚀 Starting download-lead-activity...`);

  /** ========== Fetch Campaign Details ========== */
  log(`ℹ️  Looking up campaign with ID: ${CAMPAIGN_ID}...`);
  try {
    const campaignDetail = await Instantly.getCampaignDetail(CAMPAIGN_ID);
    CAMPAIGN_NAME = campaignDetail.name;
    log(`✅ Campaign found: ${CAMPAIGN_NAME}`);
  } catch (err) {
    log(`❌ Failed to get campaign detail: ${err.message}`);
    return;
  }

  /** ========== Fetch Leads for Campaign ========== */
  let leads = null;
  let starting_after = "";
  let total_leads = 0;
  log(`📥 Starting to fetch leads for campaign: ${CAMPAIGN_NAME}`);

  while (starting_after !== false) {
    try {
      // Fetch a page of leads using the current starting_after cursor
      leads = await Instantly.getLeads(CAMPAIGN_ID, starting_after);

      const firstLead = leads?.items[0]?.email;
      const nextCursor = leads?.next_starting_after;

      log(`🔹 Retrieved batch: ${firstLead ?? "No leads in this batch"}`);
      log(`🔁 Next cursor: ${nextCursor ?? "none (end of leads)"}`);

      if (leads?.items?.length) {
        // get activity for each leads
        let leadActivities = []

        // Merge new leads into the total collection
        let newLeads = leads.items.map((e, i) => {
          return {
            email: e.email,
          }
        })

        for (let i = 0; i < newLeads.length; i++) {
          const el = newLeads[i];
          leadActivities = await getLeadActivity(CAMPAIGN_ID, el.email)
          newLeads[i].activity_list = leadActivities

          const obj = {
            campaign_name: CAMPAIGN_NAME,
            campaign_id: CAMPAIGN_ID,
            email: el.email,
            activity_list: JSON.stringify(leadActivities)
          }

          const existingRecord = await knex('leads_activity').where({
            campaign_id: obj.campaign_id,
            email: obj.email
          }).first();

          if (!existingRecord) {
            await knex('leads_activity').insert(obj);
          } else {
            await knex('leads_activity').where('id', existingRecord.id).update({ activity_list: JSON.stringify(leadActivities) });
          }
        }

        // Increment the total count
        total_leads += newLeads.length;
      }

      // Update pagination cursor, or stop if none is returned
      starting_after = leads?.next_starting_after || false;
    } catch (err) {
      log(`❌ Failed to fetch leads: ${err.message}`);
      return;
    }
  }


  /** ========== Summary ========== */
  log(`✅ Lead fetch complete. Total leads collected: ${total_leads}`);
  log("============================");

  logStream.close();
  exit();
}

async function getLeadActivity(campaign_id, EMAIL) {
  let activity_list = [];
  try {
    activity_list = await Instantly.getActivity(campaign_id, EMAIL);
    log(
      `Activity of ${EMAIL}: ${activity_list?.length ?? "⚠️  No activity found"
      }`
    );
  } catch (err) {
    log(`❌ Failed to get activity for ${EMAIL}: ${err.message}`);
  }

  return activity_list
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const campaignIdFromCLI = process.argv[2];
  downloadLeadsActivity(campaignIdFromCLI);
}