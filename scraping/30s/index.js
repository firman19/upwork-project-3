// docs https://docs.google.com/document/d/1DCh4ja_XIGLoFagw0lZKRzbM_q1yoh0rBOMtUJkzYH4/edit
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = "https://30sjob.com/job/page/";
const page = 1;
const filter = `/?s&filter-title=Education`;

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
        let jobLinkElement =
          (await page.$(
            `div.jobs-wrapper div.item-job:nth-child(${i}) .job-title>a`
          )) || "";
        let job_link = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.getAttribute("href"))
          : "";

        let titleElement =
          (await page.$(
            `div.jobs-wrapper div.item-job:nth-child(${i}) .job-title>a`
          )) || "";
        let title = titleElement
          ? await titleElement.evaluate((el) => el.textContent)
          : "";

        let locationElement =
          (await page.$(
            `div.jobs-wrapper div.item-job:nth-child(${i}) .job-location`
          )) || "";
        let location = locationElement
          ? await locationElement.evaluate((el) => el.textContent)
          : "";

        let jobTypeElement =
          (await page.$(
            `div.jobs-wrapper div.item-job:nth-child(${i}) .type-job`
          )) || "";
        let job_type = jobTypeElement
          ? await jobTypeElement.evaluate((el) => el.textContent)
          : "";

        jobs_arr.push({
          date_farmed: "26/06/2024",
          source: "30s Jobs",
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
          n: "",
          job_title: title.replace(/\n/g, "").trim(),
          p: "",
          job_type,
          description: "",
          s: "",
          t: "",
          salary:"",
          v: "",
          w_requirements: "",
          x_benefits: "",
          y: "",
          z: "",
          aa_state_province: location.replace(/\n/g, "").trim(),
          ab_country: "Vietnam",
          ac_region: "South-East Asia",
          business_name: "",
          ae_description: "",
          af_website: "",
          ag: "",
          ah: "",
          ai_country: "",
          company_url: "", // to get website
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(`results/30s_tmp.json`, JSON.stringify(jobs_arr, null, 2));

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/30s_tmp.csv`, csv);
  await browser.close();
};

main();
