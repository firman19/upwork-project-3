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
  `${today}_instantly_download_leads.log`
);
const logStream = fs.createWriteStream(logFileUpload, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logStream.write(fullMessage + "\n");
}

async function main(campaign_id) {
  if (!campaign_id) {
    log("❌ Error: campaign_id is required.");
    return;
  }

  let CAMPAIGN_ID = campaign_id;
  let CAMPAIGN_NAME = "";

  log(`ℹ️  Looking up campaign ID: ${CAMPAIGN_ID}...`);

  /** ========== Get campaign detail on Instantly begins ========== */
  try {
    const campaignDetail = await Instantly.getCampaignDetail(CAMPAIGN_ID);
    CAMPAIGN_NAME = campaignDetail.name;
    log(`✅ Campaign found: ${CAMPAIGN_NAME}`);
  } catch (err) {
    log(`❌ Failed to get campaign detail: ${err.message}`);
    return;
  }
  /** ========== Get campaign detail on Instantly ends ========== */

  /** ========== Get leads in campaign on Instantly begins ========== */
  let leads = null;
  try {
    leads = await Instantly.getLeads(CAMPAIGN_ID);
    log(`[INSTANTLY] Leads: ${leads?.items?.length ?? 0} leads`);
  } catch (err) {
    log(`❌ Failed to fetch leads: ${err.message}`);
    return;
  }

  if (!leads || leads?.items?.length === 0) {
    return;
  }
  //   Todo: store all leads on a campaign to a json file
  /** ========== Get leads in campaign on Instantly ends ========== */

  logStream.close();
}

const campaignIdFromCLI = process.argv[2];
main(campaignIdFromCLI);

// let CAMPAIGN_ID = `a51077ca-46bb-42f6-8e6d-154d598678a4`;
// let CAMPAIGN_NAME = `Cold Educator A/B`;
// let EMAIL = `firmansyah@elementaryschools.org`;
// Get the 3rd argument (0 = node, 1 = upload-lead-activity.js, 2 = your parameter)
