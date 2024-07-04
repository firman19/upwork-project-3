// docs https://docs.google.com/document/d/1cyDW4irVlTeUC155dXUBdhskdaXv94Yo/edit
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = "https://www.adzuna.com.au/search?loc=105392&q=teaching&page=";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // handle pagination
  let counter = 1;
  let lastPage = 20;
  const jobs_arr = [];

  while (counter <= lastPage) {
    console.log("page: " + counter);
    try {
      const pageURL = URL + counter;
      counter = counter + 1;
      await page.goto(pageURL, {
        waitUntil: "load",
      });

      // wait for the job list to display
      await page.waitForFunction(
        () => document.querySelectorAll(`div.ui-search-results`).length
      );
      console.log("joblist has been displayed");
    } catch (error) {
      console.error(error);
      continue;
    }

    // count how many total html element jobs
    let totalJob = 0;
    totalJob = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(
        `div.ui-search-results>div[data-aid]`
      );
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    let start = 1;
    for (let i = start; i <= totalJob; i++) {
      try {
        /** Define elements */
        let jobLinkElement =
          (await page.$(
            `div.ui-search-results>div[data-aid]:nth-child(${i}) h2 a`
          )) || "";
        let businessLinkElement =
          (await page.$(
            `div.ui-search-results>div[data-aid]:nth-child(${i}) div.ui-company a`
          )) || "";
        let locationElement =
          (await page.$(
            `div.ui-search-results>div[data-aid]:nth-child(${i}) div.ui-location`
          )) || "";

        /** Retrieve values */
        let job_link = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.getAttribute("href"))
          : "";
        let title = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.textContent)
          : "";
        let company_url = businessLinkElement
          ? await businessLinkElement.evaluate((el) => el.getAttribute("href"))
          : "";
        let business_name = businessLinkElement
          ? await businessLinkElement.evaluate((el) => el.textContent)
          : "";
        let location = locationElement
          ? await locationElement.evaluate((el) => el.textContent)
          : "";

        jobs_arr.push({
          date_farmed: "04/07/2024",
          source: "Adzuna",
          scraped_url: job_link,
          d: "New Lead",
          e: "Opportunity",
          f: "Juan",
          g: "Juan",
          h: "Lara",
          i: "Scraping",
          j: "EDU Business",
          k: "EDU Jobs",
          l: "",
          post_date: "",
          n: "", // TODO: get feat job
          job_title: title.replace(/\n/g, "").trim(),
          p: "",
          job_type: "",
          description: "",
          s: "",
          t: "",
          salary: "",
          v: "",
          w_requirements: "",
          x_benefits: "",
          y: "",
          z: "",
          aa_state_province: location.replace(/\n/g, "").trim(),
          ab_country: "Australia",
          ac_region: "Oceania",
          business_name: business_name,
          ae_description: "",
          af_website: "",
          ag: "",
          ah: "",
          ai_country: "",
          company_url: company_url, // to get website
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(`results/adzuna_tmp.json`, JSON.stringify(jobs_arr, null, 2));

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/adzuna_tmp.csv`, csv);
  await browser.close();
};

main();
