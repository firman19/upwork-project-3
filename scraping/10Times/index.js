// docs [https://drive.google.com/drive/folders/1IEnoEqyTjMpuw-OJHpcmBuxQsAeHPrhk]
// docs [https://docs.google.com/document/d/1QMkfJKgeYMZizQSytuc2SSnIMI_ai4ZM/edit]
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const countries = [
  "argentina",
  "australia",
  "austria",
  "belgium",
  "brazil",
  "canada",
  "chile",
  "china",
  "denmark",
  "ecuador",

  "egypt",
  "france",
  "germany",
  "greece",
  "india",
  "indonesia",
  "ireland",
  "italy",
  "mexico",
  "netherlands",
];
const currCountry = countries[9];

const URL = `https://10times.com/${currCountry}?kw=Education`;

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // Function to scroll down the page
  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 1000;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
      });
    });
  }

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

    let previousHeight;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    let maxScrolls = 20; // Limit to avoid infinite loops
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      previousHeight = currentHeight;
      await autoScroll(page);
      // await page.waitForTimeout(2000); // Adjust timeout as needed
      currentHeight = await page.evaluate(() => document.body.scrollHeight);

      if (previousHeight === currentHeight) {
        break; // Break if no new content is loaded
      }
      scrollCount++;
    }

    // count how many total html element jobs
    let totalJob = 0;
    totalJob = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(`table#listing-events tr`);
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    let start = 1;
    for (let i = start; i <= totalJob; i++) {
      try {
        /** Define elements */
        let dateElement =
          (await page.$(
            `table#listing-events tr:nth-child(${i})>td>div.small.fw-500`
          )) || "";
        let job_titleElement =
          (await page.$(`table#listing-events tr:nth-child(${i}) td h2 a`)) ||
          "";
        let location_Element =
          (await page.$(`table#listing-events tr:nth-child(${i}) .venue`)) ||
          "";

        /** Retrieve values */
        let title = job_titleElement
          ? await job_titleElement.evaluate((el) => el.textContent)
          : "";
        let job_link = job_titleElement
          ? await job_titleElement.evaluate((el) => el.getAttribute("href"))
          : "";
        let location = location_Element
          ? await location_Element.evaluate((el) => el.textContent)
          : "";
        let date = dateElement
          ? await dateElement.evaluate((el) => el.textContent)
          : "";

        jobs_arr.push({
          a_date_farmed: "12/07/2024",
          b_source: "10Times",
          c_scraped_url: job_link,
          d: "New Lead",
          e: "Opportunity",
          f: "Juan",
          g: "Juan",
          h: "Lara",
          i: "Scraping",
          j: "EDU Business",
          k: "EDU Events",
          l: "",
          m_date_of_event: date,
          n_event_name: title,
          o_description: "",
          p: "",
          //
          q: "",
          r: "",
          s_state_province: location,
          t: "Ecuador",
          u: "South America",
          //
          v: "",
          w: "",
          x: "",
          y: "",
          z: "",
          aa: "",
          //
          ab_business_info: "",
          ac_website: "",
          ad: "",
          ae: "",
          af_country: "",
          ag: "",
          //
        });
      } catch (error) {
        console.error(error);
      }
    }
  }
  console.log("Saving json...");
  await writeFile(
    `results/10Times_tmp_${currCountry}.json`,
    JSON.stringify(jobs_arr, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/10Times_tmp_${currCountry}.csv`, csv);
  await browser.close();
};

main();
