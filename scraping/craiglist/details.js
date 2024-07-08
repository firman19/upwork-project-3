import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

import tmp from "./results/craiglist_tmp.json" with { type: "json" }

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log("Length: " + tmp.length);

  for (let i = 0; i < tmp.length; i++) {
    let scraped_url = tmp[i].scraped_url;
    let company_url = tmp[i].company_url;
    console.log("Process:" + i + "/" + tmp.length);

    if (scraped_url) {
      try {
        console.log("Opening scraped_url");
        await page.goto(scraped_url, {
          waitUntil: "domcontentloaded",
        });

        /** Define elements */
        let businessNameElement = (await page.$(`h2.company-name`)) || "";
        let test = (await page.$(`ul.notices`)) || "";
        let jobDescElement = (await page.$(`section#postingbody`)) || "";
        let jobTypeElement = (await page.$(`.employment_type .valu`)) || "";
        let salaryElement = (await page.$(`.remuneration .valu`)) || "";
        let jobTitleElement = (await page.$(`.job_title .valu`)) || "";

        /**Extract from elements */
        let job_title = jobTitleElement
          ? await jobTitleElement.evaluate((el) => el.textContent)
          : "";
        let business_name = businessNameElement
          ? await businessNameElement.evaluate((el) => el.textContent)
          : "";
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";
        let job_type = jobTypeElement
          ? await jobTypeElement.evaluate((el) => el.textContent)
          : "";
        let salary = salaryElement
          ? await salaryElement.evaluate((el) => el.textContent)
          : "";

        tmp[i] = {
          ...tmp[i],
          job_title: job_title
          .replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
          job_type: job_type.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
          business_name: business_name.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
          salary: salary.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
          description: job_desc.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
        };
      } catch (error) {
        console.log(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(`results/craiglist_full.json`, JSON.stringify(tmp, null, 2));

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/craiglist_full.csv`, csv);
  await browser.close();
};

main();
