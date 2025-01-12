import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

import tmp from "./results/adzuna_tmp.json" assert { type: "json" };

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
        let salary_Element = (await page.$(`table>tbody`)) || "";
        let contract_type_Element = (await page.$(`.ui-contract-type`)) || "";
        let contract_time_Element = (await page.$(`.ui-contract-time`)) || "";
        let jobDescElement = (await page.$(`section.adp-body`)) || "";

        /**Extract from elements */
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";
        let contract_type = contract_type_Element
          ? await contract_type_Element.evaluate((el) => el.textContent)
          : "";
        let contract_time = contract_time_Element
          ? await contract_time_Element.evaluate((el) => el.textContent)
          : "";
        let salary = salary_Element
          ? await salary_Element.evaluate((el) => el.textContent)
          : "";
        contract_type = contract_type
          .replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim();
        contract_time = contract_time
          .replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim();

        tmp[i] = {
          ...tmp[i],
          description: job_desc
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
          // TODO: extract Requirements from description
          job_type: contract_type + ", " + contract_time,
          // salary: salary
          //   .replace(/(\r\n|\n|\r|\t)/gm, "")
          //   .replace("\t", "")
          //   .trim(),
        };
      } catch (error) {
        console.log(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(`results/adzuna_full.json`, JSON.stringify(tmp, null, 2));

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/adzuna_full.csv`, csv);
  await browser.close();
};

main();
