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
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

const leadsInstantlyFileName = `${today}_instantly.json`;
const leadsInstantlyPath = path.join(__dirname, "data", leadsInstantlyFileName);

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

  log(`ℹ️  Looking up campaign with ID: ${CAMPAIGN_ID}...`);

  /** ========== Fetch Campaign Details ========== */
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
  let all_leads = [];
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
        // Merge new leads into the total collection
        // todo: store only leads?.items[0]?.email;
        all_leads = [...all_leads, ...leads.items];
        // Increment the total count
        total_leads += leads.items.length;
      }

      // Update pagination cursor, or stop if none is returned
      starting_after = leads?.next_starting_after || false;
    } catch (err) {
      log(`❌ Failed to fetch leads: ${err.message}`);
      return;
    }
  }

  /** ========== Save to File ========== */
  try {
    fs.writeFileSync(
      leadsInstantlyPath,
      JSON.stringify(all_leads, null, 2),
      "utf8"
    );
    log(`📁 Leads saved to: ${leadsInstantlyPath}`);
  } catch (err) {
    log(`❌ Failed to write leads to file: ${err.message}`);
    return;
  }

  /** ========== Summary ========== */
  log(`✅ Lead fetch complete. Total leads collected: ${total_leads}`);
  logStream.close();
}

const campaignIdFromCLI = process.argv[2];
main(campaignIdFromCLI);

// let CAMPAIGN_ID = `a51077ca-46bb-42f6-8e6d-154d598678a4`;
// let CAMPAIGN_NAME = `Cold Educator A/B`;
// let EMAIL = `firmansyah@elementaryschools.org`;
// Get the 3rd argument (0 = node, 1 = instantly-download-leads.js, 2 = your parameter)
