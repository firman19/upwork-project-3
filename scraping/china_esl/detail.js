import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/chinaesl_company_agencies_tmp.json" with { type: "json" }

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log("Length: " + tmp.length);

  for (let i = 0; i < tmp.length; i++) {
    let company_url = tmp[i].company_url;
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
          job_desc: job_desc.replace(/(\r\n|\n|\r|\t)/gm, "").replace('\t',''),
          business_name: business_name.trim(),
          email
        };
      } catch (error) {
        console.error(error);
      }
    }
  }

    console.log("Saving json...");
    await writeFile(
      `results/china_esl_company_agency_full.json`,
      JSON.stringify(tmp, null, 2)
    );

    console.log("Saving csv...");
    const csv = parse(tmp);
    await writeFile(`results/china_esl_company_agency_full.csv`, csv);
    await browser.close();
};

main();

function extract(str) {
  const email = 
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return str.match(email);
}