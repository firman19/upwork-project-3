import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

import tmp from "./results/adzuna_tmp.json" with { type: "json" }

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
        let job_type_Element = (await page.$(`table>tbody>tr:last-child`)) || "";
        let jobDescElement = (await page.$(`section.adp-body`)) || "";

        /**Extract from elements */
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";
        let job_type = job_type_Element
          ? await job_type_Element.evaluate((el) => el.textContent)
          : "";
        let salary = salary_Element
          ? await salary_Element.evaluate((el) => el.textContent)
          : "";

        tmp[i] = {
          ...tmp[i],
          description: job_desc.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
          job_type: job_type.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
          salary: salary.replace(/(\r\n|\n|\r|\t)/gm, "")
          .replace("\t", "")
          .trim(),
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
