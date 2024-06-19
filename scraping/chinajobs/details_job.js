// detail_job
// r_description
// div.cj-job-desc-content > p:nth-child(2)

// w_requirements
// div.cj-job-desc-content > p:nth-child(4)

// x_benefits
// div.cj-job-desc-content > p:nth-child(6)

// ae_description
// div.cj-job-desc > p

// detail_company
// af_website
// ul.info-list>li:nth-child(1)>a

// ai_country
// ul.info-list>li:nth-child(2)>span
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/chinajobs_tmp.json" with { type: "json" }

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

        let jobDescElement =
          (await page.$(`div.cj-job-desc-content`)) || "";
        let job_desc = jobDescElement
          ? await jobDescElement.evaluate((el) => el.textContent)
          : "";

        let jobRequirementsElement =
          (await page.$(`div.cj-job-desc-content > p:nth-child(4)`)) || "";
        let w_requirements = jobRequirementsElement
          ? await jobRequirementsElement.evaluate((el) => el.textContent)
          : "";

        let jobBenefitsElement =
          (await page.$(`div.cj-job-desc-content > p:nth-child(6)`)) || "";
        let x_benefits = jobBenefitsElement
          ? await jobBenefitsElement.evaluate((el) => el.textContent)
          : "";

        let descriptionElement = (await page.$(`div.cj-job-desc > p`)) || "";
        let ae_description = descriptionElement
          ? await descriptionElement.evaluate((el) => el.textContent)
          : "";

        tmp[i] = {
          ...tmp[i],
          description: job_desc,
          w_requirements,
          x_benefits,
          ae_description,
        };
      } catch (error) {
        console.error(error);
      }
    }
    if (company_url) {
      console.log("Opening company_url");
      try {
        await page.goto(company_url, {
          waitUntil: "domcontentloaded",
        });

        let websiteElement =
          (await page.$(`ul.info-list>li:nth-child(1)>a`)) || "";
        let af_website = websiteElement
          ? await websiteElement.evaluate((el) => el.textContent)
          : "";
        let countryElement =
          (await page.$(`ul.info-list>li:nth-child(2)>span`)) || "";
        let ai_country = countryElement
          ? await countryElement.evaluate((el) => el.textContent)
          : "";

        tmp[i] = {
          ...tmp[i],
          af_website,
          ai_country,
        };
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(`results/chinajobs_full.json`, JSON.stringify(tmp, null, 2));

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/chinajobs_full.csv`, csv);
  await browser.close();
};

main();
