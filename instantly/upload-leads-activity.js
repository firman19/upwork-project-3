import {
  Zendesk,
  generateNotesJson,
  generateTaskJson,
} from "./services/zendesk.js";
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
  `${today}_upload_leads-activity.log`
);
const logStream = fs.createWriteStream(logFileUpload, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logStream.write(fullMessage + "\n");
}

export default async function uploadLeadsActivity(campaign_id) {
  if (!campaign_id) {
    log("❌ Error: campaign_id is required.");
    return;
  }

  log(`🚀 Starting upload-lead-activity...`);

  log("Reading database...");
  let CAMPAIGN_NAME = '';
  let leadsActivity = await knex('leads_activity').where('campaign_id', campaign_id).select('*');

  if (!leadsActivity || leadsActivity?.length == 0) {
    log(`❌ Leads activity is empty`);
    return
  }

  let leadsWithActivity = 0
  let zendeskLeads = 0;
  let totalNotesAdded = 0;
  let totalTasksAdded = 0;
  for (const element of leadsActivity) {
    let EMAIL = element.email;
    let activity_list = JSON.parse(element.activity_list)
    CAMPAIGN_NAME = element.campaign_name;
    if (activity_list.length > 0) leadsWithActivity++

    /** ========== Get lead detail on Zendesk begins ========== */
    let lead_zendesk = null;
    try {
      lead_zendesk = await Zendesk.getLeads(EMAIL);
      log(
        `Lead ID on ${EMAIL}: ${lead_zendesk?.id ?? "⚠️  NOT FOUND"
        } `
      );
    } catch (err) {
      log(
        `❌ Failed to get lead detail on Zendesk for ${EMAIL}: ${err.message}`
      );
    }
    if (!lead_zendesk) {
      continue;
    }
    zendeskLeads++;

    /** ========== Get lead's owner detail on Zendesk begins ========== */
    const OWNER_ID = lead_zendesk.owner_id;
    let owner = null;
    let owner_email = "";
    try {
      owner = await Zendesk.getUser(OWNER_ID);
      owner_email = owner.email;
      log(`Email of Lead Owner: ${owner_email}`);
    } catch (err) {
      log(`❌ Failed to get Email of Lead Owner on Zendesk: ${err.message}`);
    }

    /** ========== Adding notes and tasks on Zendesk begins ========== */
    for (const elmt of activity_list) {
      const notesJson = {
        resource_id: lead_zendesk?.id, // lead_id
        owner_email,
        campaign_name: CAMPAIGN_NAME,
        activity_type: elmt?.event_type,
        activity_timestamp: elmt?.datetime,
      };

      const body = generateNotesJson(notesJson);
      try {
        await Zendesk.addNotes(body);
        totalNotesAdded++;
        log(`Added Note for ${EMAIL} [${elmt?.event_type}]`);
      } catch (err) {
        log(`❌ Failed to add Note for ${EMAIL}: ${err.message}`);
      }

      if (elmt?.event_type != "sent") {
        const taskJson = generateTaskJson({
          resource_id: lead_zendesk?.id, // lead_id
          owner_id: OWNER_ID,
          activity_type: elmt?.event_type,
        });

        try {
          await Zendesk.addTask(taskJson);
          totalTasksAdded++;
          log(`Added Task for ${EMAIL} [${elmt?.event_type}]`);
        } catch (err) {
          log(`❌ Failed to add Task for ${EMAIL}: ${err.message}`);
        }
      }
    }

    await knex('leads_activity').where('campaign_id', campaign_id).where('email', EMAIL).update({ uploaded_at: new Date() });
  }

  log("===== 🧾 FINAL SUMMARY =====");
  log(`📋 Campaign ${CAMPAIGN_NAME}`);
  log(`📋 Total leads in the campaign: ${leadsActivity?.length ?? 0}`);
  log(`✅ Leads with activity: ${leadsWithActivity}`);
  log(`🔍 Leads found in Zendesk: ${zendeskLeads}`);
  log(`📝 Total notes added: ${totalNotesAdded}`);
  log(`🧩 Total tasks added: ${totalTasksAdded}`);
  log("============================");

  logStream.close();
  exit();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const campaignIdFromCLI = process.argv[2];
  uploadLeadsActivity(campaignIdFromCLI);
}