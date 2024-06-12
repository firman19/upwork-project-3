import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";

/** Notes */
const jobListEl = `div#job-listings > div.row`;
const titleEl = `div#job-listings > div.row > span.row-info > a`; //text
const jobTypeEl = `div#job-listings > div.row > span.row-info > img`; //src
const linknEl = `div#job-listings > div.row > span.row-info > a`; //href
const timeEl = `div#job-listings > div.row > span.time-posted`;

// detail
const descEl = `div#job-description`;
const business_name_El = `div#job-details>p`;

let URL = "";
let category = "";
URL = "http://www.chinaesljob.com/jobs/Company-Agencies/?p=";
category = "company-agencies";
URL = "http://www.chinaesljob.com/jobs/Middle-School/?p=";
category = "middle-school";
URL = "http://www.chinaesljob.com/jobs/Nursery/?p=";
category = "nursery";
URL = "http://www.chinaesljob.com/jobs/Others/?p=";
category = "others";
URL = "http://www.chinaesljob.com/jobs/Primary/?p=";
category = "primary";
URL = "http://www.chinaesljob.com/jobs/Training-Company/?p=";
category = "training-company";
URL = "http://www.chinaesljob.com/jobs/University/?p=";
category = "university";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // handle pagination
  let counter = 1;
  let lastPage = false;
  const jobs_arr = [];

  while (!lastPage) {
    console.log("page: " + counter);
    const pageURL = URL + counter;
    await page.goto(pageURL, {
      waitUntil: "load",
    });
    counter = counter + 1;

    // wait for the job list to display
    await page.waitForFunction(
      () => document.querySelectorAll(`div#job-listings > div.row`).length
    );
    console.log("joblist has been displayed");

    // check if last page
    let lastPageElement =
      (await page.$(`div#job-listings > a:last-of-type`)) || "";
    let lastPageText = lastPageElement
      ? await lastPageElement.evaluate((el) => el.textContent)
      : "";
    if (isNaN(lastPageText)) {
      // "»"
      // means that this is not last page
    } else {
      lastPage = true;
    }
    let start = 1;
    let totalJob = 0;

    // count how many total html element jobs
    totalJob = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(`div#job-listings > div`);
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    for (let i = start; i <= totalJob; i++) {
      let titleElement =
        (await page.$(
          `div#job-listings > div:nth-child(${i}) span.row-info > a`
        )) || "";
      let jobTypeElement =
        (await page.$(
          `div#job-listings > div:nth-child(${i}) span.row-info > img`
        )) || "";
      let timeElement =
        (await page.$(
          `div#job-listings > div:nth-child(${i}) span.time-posted`
        )) || "";

      /** =========== */
      let title = titleElement
        ? await titleElement.evaluate((el) => el.textContent)
        : "";

      let job_type = jobTypeElement
        ? await jobTypeElement.evaluate((el) => el.getAttribute("src"))
        : "";

      let link = titleElement
        ? await titleElement.evaluate((el) => el.getAttribute("href"))
        : "";

      let time = timeElement
        ? await timeElement.evaluate((el) => el.textContent)
        : "";

      jobs_arr.push({
        post_date: time.replace(/\n/g, "").trim(),
        job_title: title.replace(/\n/g, "").trim(),
        job_type: getJobType(job_type),
        company_url: link,
        //   salary: salary.replace(/\n/g, "").trim(),
        //   city: city.replace(/\n/g, "").trim(),
        //   business_name: company,
        //   featured: featured ? "YES" : "NO",
      });
    }
  }

  console.log(jobs_arr);
  console.log("Saving json...");
  await writeFile(
    `results/chinaesl_${category}_tmp.json`,
    JSON.stringify(jobs_arr, null, 2)
  );
  await browser.close();
};

main();

function getJobType(str) {
  if (str.includes("fulltime")) {
    return "Full Time";
  }
  if (str.includes("parttime")) {
    return "Part Time";
  }
  return "";
}
