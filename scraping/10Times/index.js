// docs [INSERT_GOOGLE_DOC_HERE]
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = `[INSERT_URL_HERE]`;
// const URL = "https://www.adzuna.com.au/search?loc=105392&q=teaching&page=";

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
        () => document.querySelectorAll(`[INSERT_SELECTOR_JOB_LIST]`).length
        // () => document.querySelectorAll(`div.ui-search-results`).length
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
        `[INSERT_SELECTOR_JOB_ITEM]`
        // `div.ui-search-results>div[data-aid]`
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
            `div.results.cl-results-page li[data-pid].cl-search-result:nth-child(${i}) a.posting-title`
            // `div.results.cl-results-page li[data-pid].cl-search-result:nth-child(${i}) a.posting-title`
          )) || "";

        /** Retrieve values */
        let job_link = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.textContent)
          : "";

        jobs_arr.push({
          date_farmed: "04/07/2024",
          source: "",
          scraped_url: job_link
            .replace(/(\r\n|\n|\r|\t)/gm, "")
            .replace("\t", "")
            .trim(),
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
          n: "",
          job_title: "",
          p: "",
          job_type: "",
          description: "",
          s: "",
          t: "",
          salary: salary,
          v: "",
          w_requirements: "",
          x_benefits: "",
          y: "",
          z: "",
          aa_state_province: "",
          ab_country: "USA",
          ac_region: "North America",
          business_name: "",
          ae_description: "",
          af_website: "",
          ag: "",
          ah: "",
          ai_country: "",
          company_url: "",
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(
    `results/10Times_tmp.json`,
    JSON.stringify(jobs_arr, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/10Times_tmp.csv`, csv);
  await browser.close();
};

main();
