import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";

const jobListEl = `div#job-listings > div.row`;
const titleEl = `div#job-listings > div.row > span.row-info > a`; //text
const jobTypeEl = `div#job-listings > div.row > span.row-info > img`; //src
const linknEl = `div#job-listings > div.row > span.row-info > a`; //href
const timeEl = `div#job-listings > div.row > span.time-posted`;

// detail
const descEl = `div#job-description`;
const business_name_El = `div#job-details>p`;

// company agencies page 1
let URL = "http://www.chinaesljob.com/jobs/Company-Agencies/?p=1";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto(URL, {
    waitUntil: "load",
  });

  // wait for the job list to display
  await page.waitForFunction(
    () => document.querySelectorAll(`div#job-listings > div.row`).length
  );
  console.log("joblist has been displayed");

  const jobs_arr = [];
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

  console.log(jobs_arr);
  console.log("Saving json...");
  await writeFile(
    `results/chinaesl_company_agencies_tmp.json`,
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
