// docs https://docs.google.com/document/d/1EKrGcN-ni5-wP0S7zSjOAYiE8G_DlZYA/edit
import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = "https://albany.craigslist.org/search/edu#search=1~thumb~0~6";

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
        () =>
          document.querySelectorAll(
            `div.results.cl-results-page li.cl-search-result`
          ).length
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
        `div.results.cl-results-page li[data-pid].cl-search-result`
      );
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    let start = 1;
    for (let i = start; i <= totalJob; i++) {
      try {
        /** Define elements */
        let locationElement =
          (await page.$(
            `div.results.cl-results-page li[data-pid].cl-search-result:nth-child(${i})
            div.supertitle`
          )) || "";
        let jobLinkElement =
          (await page.$(
            `div.results.cl-results-page li[data-pid].cl-search-result:nth-child(${i})
            a.posting-title`
          )) || "";
        let dateElement =
          (await page.$(
            `div.results.cl-results-page li[data-pid].cl-search-result:nth-child(${i})
            div.meta span`
          )) || "";
        let salaryElement =
          (await page.$(
            `div.results.cl-results-page li[data-pid].cl-search-result:nth-child(${i})
            div.meta span:nth-child(2)`
          )) || "";

        /** Retrieve values */
        let location = locationElement
          ? await locationElement.evaluate((el) => el.textContent)
          : "";
        let job_link = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.getAttribute("href"))
          : "";
        let title = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.textContent)
          : "";
        let date = dateElement
          ? await dateElement.evaluate((el) => el.getAttribute("title"))
          : "";
        // TODO
        let salary = salaryElement
          ? await salaryElement.evaluate((el) => el.textContent)
          : "";

        jobs_arr.push({
          date_farmed: "04/07/2024",
          source: "CraigList",
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
          post_date: date,
          n: "", // TODO: get feat job
          job_title: title.replace(/\n/g, "").trim(),
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
          aa_state_province: location.replace(/\n/g, "").trim(),
          ab_country: "USA",
          ac_region: "North America",
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
  await writeFile(
    `results/craiglist_tmp.json`,
    JSON.stringify(jobs_arr, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/craiglist_tmp.csv`, csv);
  await browser.close();
};

main();
