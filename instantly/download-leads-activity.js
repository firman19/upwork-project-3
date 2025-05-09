import { Instantly } from "./services/instantly.js";
import fs from "fs";
import path from "path";

const campaignIdFromCLI = process.argv[3];

const today = new Date().toISOString().split("T")[0];
const __dirname = path.resolve();

fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "data/leads-activity"), { recursive: true });

const leadsInstantlyFileName = `${today}_${campaignIdFromCLI}.json`;
const leadsInstantlyPath = path.join(__dirname, "data/leads-activity", leadsInstantlyFileName);

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

export default async function downloadLeadsActivity(campaign_id) {
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
        }

        all_leads = [...all_leads, ...newLeads];
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

  /** ========== Save to File ========== */
  const file_content = {
    campaign_name: CAMPAIGN_NAME,
    campaign_id: CAMPAIGN_ID,
    leads: all_leads
  }

  try {
    fs.writeFileSync(
      leadsInstantlyPath,
      JSON.stringify(file_content, null, 2),
      "utf8"
    );
    log(`📁 Leads saved to: ${leadsInstantlyPath}`);
  } catch (err) {
    log(`❌ Failed to write leads to file: ${err.message}`);
    return;
  }

  /** ========== Summary ========== */
  log(`✅ Lead fetch complete. Total leads collected: ${total_leads}`);
  log("============================");

  logStream.close();
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


// main(campaignIdFromCLI);
// let CAMPAIGN_ID = `a51077ca-46bb-42f6-8e6d-154d598678a4`;
// let CAMPAIGN_NAME = `Cold Educator A/B`;
// let EMAIL = `firmansyah@elementaryschools.org`;
// Get the 3rd argument (0 = node, 1 = instantly-download-leads.js, 2 = your parameter)
