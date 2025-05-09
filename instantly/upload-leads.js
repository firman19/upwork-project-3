import fs from "fs";
import path from "path";
import { Instantly } from "./services/instantly.js";

const today = new Date().toISOString().split("T")[0];
const __dirname = path.resolve();

fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "data/leads"), { recursive: true });

const logFileUpload = path.join(__dirname, "logs", `${today}_upload-leads.log`);
const logUploadStream = fs.createWriteStream(logFileUpload, { flags: "a" });

const eduBusinessFilename = `${today}_edu_business.json`;
const educatorFilename = `${today}_educator.json`;
const vendorFilename = `${today}_vendor.json`;
const postedJobFilename = `${today}_posted_job.json`;
const postedEventFilename = `${today}_posted_event.json`;
const investedAdFilename = `${today}_invested_ad.json`;
const offeredDealFilename = `${today}_offered_deal.json`;

const eduBusinessPath = path.join(__dirname, "data/leads", eduBusinessFilename);
const educatorPath = path.join(__dirname, "data/leads", educatorFilename);
const vendorPath = path.join(__dirname, "data/leads", vendorFilename);
const postedJobPath = path.join(__dirname, "data/leads", postedJobFilename);
const postedEventPath = path.join(__dirname, "data/leads", postedEventFilename);
const investedAdPath = path.join(__dirname, "data/leads", investedAdFilename);
const offeredDealPath = path.join(__dirname, "data/leads", offeredDealFilename);

const CAMPAIGN_EDU_JOB = process.env.CAMPAIGN_EDU_JOB || "";
const CAMPAIGN_EVENT = process.env.CAMPAIGN_EVENT || "";
const CAMPAIGN_EDU_ADVERTS = process.env.CAMPAIGN_EDU_ADVERTS || "";
const CAMPAIGN_EDU_DEALS = process.env.CAMPAIGN_EDU_DEALS || "";
const CAMPAIGN_COLD_EDUCATOR = process.env.CAMPAIGN_COLD_EDUCATOR || "";
const CAMPAIGN_VENDOR_ADVERT = process.env.CAMPAIGN_VENDOR_ADVERT || "";
const CAMPAIGN_EDU_BUSINESS = process.env.CAMPAIGN_EDU_BUSINESS || "";

function logUpload(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logUploadStream.write(fullMessage + "\n");
}

async function uploadLeadsToCampaign(campaign_id, leads, callback) {
  if (!campaign_id || !leads || leads.length === 0) {
    return callback(false);
  }

  let allLeadsUploaded = true;

  for (let i = 0; i < leads.length; i++) {
    const element = leads[i];
    if (element.email) {
      let leadPayload = {
        campaign: campaign_id,
        email: element.email,
        last_name: element.last_name,
        first_name: element.first_name,
        company_name: element.organization_name,
        phone: element.phone,
      };

      try {
        await Instantly.addLead(leadPayload);
        logUpload(`✅ Uploaded lead: ${leadPayload.email}`);
      } catch (err) {
        logUpload(
          `❌ Failed to upload lead ${leadPayload.email}: ${err.message}`
        );
        allLeadsUploaded = false;
      }
    }
  }

  callback(allLeadsUploaded);
}

async function main() {
  log(`🚀 Starting upload-lead...`);

  let results = {
    job: { read: 0, uploaded: 0, error: null },
    event: { read: 0, uploaded: 0, error: null },
    adverts: { read: 0, uploaded: 0, error: null },
    deals: { read: 0, uploaded: 0, error: null },
    educator: { read: 0, uploaded: 0, error: null },
    vendor: { read: 0, uploaded: 0, error: null },
    business: { read: 0, uploaded: 0, error: null },
  };

  try {
    // Job leads
    logUpload("📁 Reading postedJobPath...");
    const jobData = JSON.parse(fs.readFileSync(postedJobPath, "utf8"));
    results.job.read = jobData.length;
    logUpload(`✅ Read ${jobData.length} job leads`);
    if (jobData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EDU_JOB, jobData, (success) => {
        if (success) results.job.uploaded++;
      });
      logUpload("✅ Job leads uploaded");
    }

    // Event leads
    logUpload("📁 Reading postedEventPath...");
    const eventData = JSON.parse(fs.readFileSync(postedEventPath, "utf8"));
    results.event.read = eventData.length;
    logUpload(`✅ Read ${eventData.length} event leads`);
    if (eventData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EVENT, eventData, (success) => {
        if (success) results.event.uploaded++;
      });
      logUpload("✅ Event leads uploaded");
    }

    // Ad leads
    logUpload("📁 Reading investedAdPath...");
    const adData = JSON.parse(fs.readFileSync(investedAdPath, "utf8"));
    results.adverts.read = adData.length;
    logUpload(`✅ Read ${adData.length} ad leads`);
    if (adData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EDU_ADVERTS, adData, (success) => {
        if (success) results.adverts.uploaded++;
      });
      logUpload("✅ Ad leads uploaded");
    }

    // Deal leads
    logUpload("📁 Reading offeredDealPath...");
    const dealData = JSON.parse(fs.readFileSync(offeredDealPath, "utf8"));
    results.deals.read = dealData.length;
    logUpload(`✅ Read ${dealData.length} deal leads`);
    if (dealData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EDU_DEALS, dealData, (success) => {
        if (success) results.deals.uploaded++;
      });
      logUpload("✅ Deal leads uploaded");
    }

    // Cold educator leads
    logUpload("📁 Reading educatorPath...");
    const coldEduData = JSON.parse(fs.readFileSync(educatorPath, "utf8"));
    results.educator.read = coldEduData.length;
    logUpload(`✅ Read ${coldEduData.length} cold educator leads`);
    if (coldEduData.length > 0) {
      await uploadLeadsToCampaign(
        CAMPAIGN_COLD_EDUCATOR,
        coldEduData,
        (success) => {
          if (success) results.educator.uploaded++;
        }
      );
      logUpload("✅ Cold educator leads uploaded");
    }

    // Vendor leads
    logUpload("📁 Reading vendorPath...");
    const vendorData = JSON.parse(fs.readFileSync(vendorPath, "utf8"));
    results.vendor.read = vendorData.length;
    logUpload(`✅ Read ${vendorData.length} vendor leads`);
    if (vendorData.length > 0) {
      await uploadLeadsToCampaign(
        CAMPAIGN_VENDOR_ADVERT,
        vendorData,
        (success) => {
          if (success) results.vendor.uploaded++;
        }
      );
      logUpload("✅ Vendor leads uploaded");
    }

    // Edu business leads
    logUpload("📁 Reading eduBusinessPath...");
    const businessData = JSON.parse(fs.readFileSync(eduBusinessPath, "utf8"));
    results.business.read = businessData.length;
    logUpload(`✅ Read ${businessData.length} business leads`);
    if (businessData.length > 0) {
      await uploadLeadsToCampaign(
        CAMPAIGN_EDU_BUSINESS,
        businessData,
        (success) => {
          if (success) results.business.uploaded++;
        }
      );
      logUpload("✅ Business leads uploaded");
    }

    logUpload(JSON.stringify(results));
  } catch (error) {
    logUpload(`❌ Error in uploading leads: ${error.message}`);
  }
  log("============================");

  logUploadStream.close();
}

export default main;
