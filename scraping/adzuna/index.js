// docs https://docs.google.com/document/d/1wU_dCMpIXph86xY_W8mrq-smYvqhJJEVky6msz8mD7w/edit
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = "https://30sjob.com/job/page/1/?s&filter-title=Education";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // handle pagination
  let counter = 1;
  let lastPage = 15;
  const jobs_arr = [];

  while (counter <= lastPage) {
    console.log("page: " + counter);
    try {
      const pageURL = URL + counter + filter;
      counter = counter + 1;
      await page.goto(pageURL, {
        waitUntil: "load",
      });

      // wait for the job list to display
      await page.waitForFunction(
        () => document.querySelectorAll(`div.jobs-wrapper.items-wrapper`).length
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
        `div.jobs-wrapper div.item-job`
      );
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    let start = 1;
    for (let i = start; i <= totalJob; i++) {
      try {
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
