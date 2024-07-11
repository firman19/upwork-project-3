// docs [https://docs.google.com/document/d/1QMkfJKgeYMZizQSytuc2SSnIMI_ai4ZM/edit]
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = `https://10times.com/indonesia?kw=Education`;
// const URL = "https://www.adzuna.com.au/search?loc=105392&q=teaching&page=";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // handle pagination
  let counter = 1;
  let lastPage = 1;
  const jobs_arr = [];

  while (counter <= lastPage) {
    console.log("page: " + counter);
    try {
      const pageURL = URL;
      counter = counter + 1;
      await page.goto(pageURL, {
        waitUntil: "load",
      });

      // wait for the job list to display
      await page.waitForFunction(
        () => document.querySelectorAll(`table#listing-events`).length
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
        `table#listing-events tr`
        // `div.ui-search-results>div[data-aid]`
      );
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    let start = 1;
    for (let i = start; i <= totalJob; i++) {
      try {
        /** Define elements */
        let location_Element =
          (await page.$(`table#listing-events tr:nth-child(${i}) .venue`)) ||
          "";
        let job_titleElement =
          (await page.$(`table#listing-events tr:nth-child(${i}) td h2 a`)) ||
          "";
        let dateElement =
          (await page.$(
            `table#listing-events tr:nth-child(${i})>td>div.small.fw-500`
          )) || "";

        /** Retrieve values */
        let job_title = job_titleElement
          ? await job_titleElement.evaluate((el) => el.textContent)
          : "";
        let location = location_Element
          ? await location_Element.evaluate((el) => el.textContent)
          : "";
        let date = dateElement
          ? await dateElement.evaluate((el) => el.textContent)
          : "";

        console.log(date);

        jobs_arr.push({
          date_farmed: "04/07/2024",
          source: "",
          scraped_url: job_title,
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
          salary: "",
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
  // console.log("Saving json...");
  // await writeFile(
  //   `results/10Times_tmp.json`,
  //   JSON.stringify(jobs_arr, null, 2)
  // );

  // console.log("Saving csv...");
  // const csv = parse(jobs_arr);
  // await writeFile(`results/10Times_tmp.csv`, csv);
  // await browser.close();
};

main();
