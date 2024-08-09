import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

let category = "";
// category = "company-agencies";
// import tmp from "./results/chinaesl_company-agencies_tmp.json" with { type: "json" }
// category = "middle-school";
// import tmp from "./results/chinaesl_middle-school_tmp.json" with { type: "json" }
// category = "nursery";
// import tmp from "./results/chinaesl_nursery_tmp.json" with { type: "json" }
// category = "others";
// import tmp from "./results/chinaesl_others_tmp.json" with { type: "json" }
// category = "primary";
// import tmp from "./results/chinaesl_primary_tmp.json" with { type: "json" }
// category = "training-company";
// import tmp from "./results/chinaesl_training-company_tmp.json" with { type: "json" }
category = "university";
import tmp from "./results/chinaesl_university_tmp.json" with { type: "json" }

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log("Length: " + tmp.length);

  for (let i = 0; i < tmp.length; i++) {
    let company_url = tmp[i].zz_company_url;
    console.log("Process:" + i + "/" + tmp.length, company_url);
    if (company_url) {
      try {
        await page.goto(company_url, {
          waitUntil: "domcontentloaded",
        });

        let jobDescElement = (await page.$(`div#job-description`)) || "";
        let businessNameElement = (await page.$(`div#job-details>p`)) || "";
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";
        let business_name = businessNameElement
          ? await businessNameElement.evaluate((el) => el.textContent)
          : "";

        business_name = business_name.replace(/(\r\n|\n|\r|\t)/gm, "");
        business_name = business_name.startsWith('at') ? business_name.substring(2) : business_name;

        let email = extract(job_desc) ? extract(job_desc)[0] : "";
        tmp[i] = {
          ...tmp[i],
          r_description: job_desc.replace(/(\r\n|\n|\r|\t)/gm, "").replace('\t', ''),
          ad_business_name: business_name.trim(),
          ao_contact_email: email
        };
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(
    `results/china_esl_${category}_full.json`,
    JSON.stringify(tmp, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/china_esl_${category}_full.csv`, csv);
  await browser.close();
};

main();

function extract(str) {
  const email =
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return str.match(email);
}