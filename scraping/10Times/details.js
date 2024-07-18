import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

import tmp from "./results/10Times_tmp_vietnam.json" with { type: "json" }

const main = async () => {
  console.log("Length: " + tmp.length);

  for (let i = 0; i < tmp.length; i++) {
    let browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    let page = await browser.newPage();
    let scraped_url = tmp[i].c_scraped_url;
    console.log("Process:" + i + "/" + tmp.length);
    
    let companyUrl = "";
    if (scraped_url) {
      try {
        console.log("Opening scraped_url");
        await page.goto(scraped_url, {
          timeout: 3000,
          waitUntil: "domcontentloaded",
        });

        /** Define elements */
        let jobDescElement = (await page.$(`section.box.fs-14>p`)) || "";
        let locElement = (await page.$(`div.mt-1.text-muted.m-mins_lft`)) || "";
        let businessNameElement =
          (await page.$(`#organzr strong.fs-16 a`)) || "";

        /**Extract from elements */
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";
        let location = locElement
          ? await locElement.evaluate((el) => el.textContent)
          : "";
        let businessName = businessNameElement
          ? await businessNameElement.evaluate((el) => el.textContent)
          : "";
        companyUrl = businessNameElement
          ? await businessNameElement.evaluate((el) => el.getAttribute("href"))
          : "";

        tmp[i] = {
          ...tmp[i],
          o_description: job_desc
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
          s_state_province: location,
          ab_business_info: businessName,
          company_url: companyUrl,
        };
      } catch (error) {
        console.log(error);
      }
    }
    await browser.close();
    await timeout(30000);

    if (companyUrl) {
      try {
        console.log("Opening companyUrl");
        browser = await puppeteer.launch({
          headless: false,
          defaultViewport: null,
        });

        page = await browser.newPage();
        await page.goto(companyUrl, {
          timeout: 3000,
          waitUntil: "domcontentloaded",
        });

        /** Define elements */
        let websiteElement = (await page.$(`a.btn.btn-lg.btn-dark.me-3`)) || "";
        let countryElement = (await page.$(`a.text-white.text-decoration-none`)) || "";

        /**Extract from elements */
        let website = websiteElement
          ? await websiteElement.evaluate((el) => el.getAttribute("href"))
          : "";

        let country = countryElement
          ? await countryElement.evaluate((el) => el.textContent)
          : "";

        console.log("country");
        console.log(country);

        tmp[i] = {
          ...tmp[i],
          ac_website: website,
          af_country: country,
        };
      } catch (error) {}
      await browser.close();
      await timeout(30000);
    }

    console.log("Saving json...");
    await writeFile(`results/10Times_full_vietnam.json`, JSON.stringify(tmp, null, 2));

    console.log("Saving csv...");
    const csv = parse(tmp);
    await writeFile(`results/10Times_full_vietnam.csv`, csv);
  }
};

main();

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
