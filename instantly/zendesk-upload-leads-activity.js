import { Instantly } from "./services/instantly.js";
import {
  Zendesk,
  generateNotesJson,
  generateTaskJson,
} from "./services/zendesk.js";
import fs from "fs";
import path from "path";

const today = new Date().toISOString().split("T")[0];
const __dirname = path.resolve();

fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });

const logFileUpload = path.join(
  __dirname,
  "logs",
  `${today}zendesk_upload_leads-activity.log`
);
const logStream = fs.createWriteStream(logFileUpload, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logStream.write(fullMessage + "\n");
}

async function main(campaign_id) {
  // todo: get leads from files

  let instantlyActivityLeads = 0;
  let zendeskLeads = 0;
  let totalNotesAdded = 0;
  let totalTasksAdded = 0;
  for (const element of leads.items) {
    let EMAIL = element.email;

    /** ========== Get lead's activities on Instantly begins ========== */
    let activity_list = [];
    try {
      activity_list = await Instantly.getActivity(campaign_id, EMAIL);
      log(
        `[INSTANTLY] Activities on ${EMAIL}: ${
          activity_list?.length ?? "⚠️  No activity found"
        }`
      );
    } catch (err) {
      log(`❌ Failed to get activity for ${EMAIL}: ${err.message}`);
      continue;
    }
    if (!activity_list || activity_list.length === 0) {
      continue;
    }
    instantlyActivityLeads++;
    /** ========== Get lead's activities on Instantly ends ========== */

    /** ========== Get lead detail on Zendesk begins ========== */
    let lead_zendesk = null;
    try {
      lead_zendesk = await Zendesk.getLeads(EMAIL);
      log(
        `[ZENDESK] Lead ID on ${EMAIL}: ${
          lead_zendesk?.id ?? " ⚠️  NOT FOUND"
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
    /** ========== Get lead detail on Zendesk ends ========== */

    /** ========== Get lead's owner detail on Zendesk begins ========== */
    const OWNER_ID = lead_zendesk.owner_id;
    let owner = null;
    let owner_email = "";
    try {
      owner = await Zendesk.getUser(OWNER_ID);
      owner_email = owner.email;
      log(`[ZENDESK] Email of Lead Owner: ${owner_email}`);
    } catch (err) {
      log(`❌ Failed to get Email of Lead Owner on Zendesk: ${err.message}`);
    }
    /** ========== Get lead's owner detail on Zendesk ends ========== */

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
        log(`[ZENDESK] Added Note for ${EMAIL} [${elmt?.event_type}]`);
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
          log(`[ZENDESK] Added Task for ${EMAIL} [${elmt?.event_type}]`);
        } catch (err) {
          log(`❌ Failed to add Task for ${EMAIL}: ${err.message}`);
        }
      }
    }
    /** ========== Adding notes and tasks ends ========== */
  }

  log("===== 🧾 FINAL SUMMARY =====");
  log(`📋 Campaign ${CAMPAIGN_NAME}`);
  log(`📋 Total leads in campaign: ${leads?.items?.length ?? 0}`);
  log(`✅ Leads with activity: ${instantlyActivityLeads}`);
  log(`🔍 Leads found in Zendesk: ${zendeskLeads}`);
  log(`📝 Total notes added: ${totalNotesAdded}`);
  log(`🧩 Total tasks added: ${totalTasksAdded}`);
  log("============================");

  logStream.close();
}

const campaignIdFromCLI = process.argv[2];
main(campaignIdFromCLI);

// let CAMPAIGN_ID = `a51077ca-46bb-42f6-8e6d-154d598678a4`;
// let CAMPAIGN_NAME = `Cold Educator A/B`;
// let EMAIL = `firmansyah@elementaryschools.org`;
// Get the 3rd argument (0 = node, 1 = upload-lead-activity.js, 2 = your parameter)
