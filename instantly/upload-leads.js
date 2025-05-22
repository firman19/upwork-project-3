import fs from "fs";
import path from "path";
import { exit } from "process";
import { Instantly } from "./services/instantly.js";
import knexConfig from './knexfile.js';
import Knex from 'knex';

const knex = Knex(knexConfig);
const today = new Date().toISOString().split("T")[0];
const __dirname = path.resolve();

fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });

const logFileUpload = path.join(__dirname, "logs", `${today}_upload-leads.log`);
const logUploadStream = fs.createWriteStream(logFileUpload, { flags: "a" });

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
        await knex('leads').where('email', leadPayload.email).update({ uploaded_at: new Date() });
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
  logUpload(`🚀 Starting upload-lead...`);

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
    logUpload("Reading posted_job...");
    let jobData = await knex('leads').where('category', 'posted_job').select('*');
    results.job.read = jobData.length;
    logUpload(`✅ Read ${jobData.length} job leads`);
    if (jobData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EDU_JOB, jobData, (success) => {
        if (success) results.job.uploaded++;
      });
      logUpload("✅ Job leads uploaded");
    }

    // Event leads
    logUpload("Reading posted_event...");
    let eventData = await knex('leads').where('category', 'posted_event').select('*');
    results.event.read = eventData.length;
    logUpload(`✅ Read ${eventData.length} event leads`);
    if (eventData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EVENT, eventData, (success) => {
        if (success) results.event.uploaded++;
      });
      logUpload("✅ Event leads uploaded");
    }

    // Ad leads
    logUpload("Reading invested_ad...");
    let adData = await knex('leads').where('category', 'invested_ad').select('*');
    results.adverts.read = adData.length;
    logUpload(`✅ Read ${adData.length} ad leads`);
    if (adData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EDU_ADVERTS, adData, (success) => {
        if (success) results.adverts.uploaded++;
      });
      logUpload("✅ Ad leads uploaded");
    }

    // Deal leads
    logUpload("Reading offered_deal...");
    let dealData = await knex('leads').where('category', 'offered_deal').select('*');
    results.deals.read = dealData.length;
    logUpload(`✅ Read ${dealData.length} deal leads`);
    if (dealData.length > 0) {
      await uploadLeadsToCampaign(CAMPAIGN_EDU_DEALS, dealData, (success) => {
        if (success) results.deals.uploaded++;
      });
      logUpload("✅ Deal leads uploaded");
    }

    // Cold educator leads
    logUpload("Reading educator...");
    let coldEduData = await knex('leads').where('category', 'educator').select('*');
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
    logUpload("Reading vendor...");
    let vendorData = await knex('leads').where('category', 'vendor').select('*');
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
    logUpload("Reading edu_business...");
    let businessData = await knex('leads').where('category', 'vendor').select('*');
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
  logUpload("============================");

  logUploadStream.close();
  exit();
}

export default main;
main();
