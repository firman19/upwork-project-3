import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

import tmp from "./results/30s_tmp.json" with { type: "json" }

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

        let jobDescElement = (await page.$(`div.job-detail-description`)) || "";
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";

        let businessNameElement = (await page.$(`.employer-title`)) || "";
        let businessName = businessNameElement
          ? await businessNameElement.evaluate((el) => el.textContent)
          : "";

        let businessEmailElement = (await page.$(`.job-email .value`)) || "";
        let businessEmail = businessEmailElement
          ? await businessEmailElement.evaluate((el) => el.textContent)
          : "";

        let businessPhoneElement = (await page.$(`.job-phone .value a`)) || "";
        let businessPhone = businessPhoneElement
          ? await businessPhoneElement.evaluate((el) => el.textContent)
          : "";

        let postedDateElement =
          (await page.$(`.job-detail-detail > ul > li .details > .value`)) ||
          "";
        let postedDate = postedDateElement
          ? await postedDateElement.evaluate((el) => el.textContent)
          : "";

        tmp[i] = {
          ...tmp[i],
          post_date: postedDate,
          description: job_desc
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
          business_name: businessName
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
          ah: "'" + businessPhone
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
          ao_contact_email: businessEmail
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
        };
      } catch (error) {}
    }
  }
  console.log("Saving json...");
  await writeFile(`results/30s_full.json`, JSON.stringify(tmp, null, 2));

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/30s_full.csv`, csv);
  await browser.close();
};

main();
