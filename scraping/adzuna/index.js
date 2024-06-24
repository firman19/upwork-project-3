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
      } catch (error) {
        console.error(error);
      }
    }
  }

  // console.log("Saving json...");
  // await writeFile(`results/adzuna_tmp.json`, JSON.stringify(jobs_arr, null, 2));

  // console.log("Saving csv...");
  // const csv = parse(jobs_arr);
  // await writeFile(`results/adzuna_tmp.csv`, csv);
  // await browser.close();
};

main();
