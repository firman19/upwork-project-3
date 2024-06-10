import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";

const URL = "https://www.ajarn.com/recruitment/jobs";

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
    () => document.querySelectorAll(`section#premium_jobs>a`).length
  );
  console.log("joblist has been displayed");

  const jobs_arr = [];
  let start = 1;
  let totalJob = 0;

  // count how many total html element jobs
  totalJob = await page.evaluate(() => {
    const jobElements = document.querySelectorAll(`section#premium_jobs>a`);
    return jobElements.length;
  });
  console.log("total jobs", totalJob);

  for (let i = start; i <= totalJob; i++) {
    let titleElement =
      (await page.$(
        `section#premium_jobs>a:nth-child(${i}) div.titleText h1`
      )) || "";
    let linkElement =
      (await page.$(`section#premium_jobs>a:nth-child(${i})`)) || "";
    let timeElement =
      (await page.$(`section#premium_jobs>a:nth-child(${i}) time`)) || "";
    let companyElement =
      (await page.$(`section#premium_jobs>a:nth-child(${i}) h2 strong`)) || "";
    let salaryElement =
      (await page.$(
        `section#premium_jobs>a:nth-child(${i}) div.row.details > div:nth-child(3)`
      )) || "";
    let cityElement =
      (await page.$(
        `section#premium_jobs>a:nth-child(${i}) div.row.details > div:nth-child(2)`
      )) || "";
    let featuredElement =
      (await page.$(
        `section#premium_jobs>a:nth-child(${i}) img[class="featuredSash"]`
      )) || "";

    let title = titleElement
      ? await titleElement.evaluate((el) => el.textContent)
      : "";
    let link = linkElement
      ? await linkElement.evaluate((el) => el.getAttribute("href"))
      : "";
    let time = timeElement
      ? await timeElement.evaluate((el) => el.getAttribute("datetime"))
      : "";
    let company = companyElement
      ? await companyElement.evaluate((el) => el.textContent)
      : "";
    let salary = salaryElement
      ? await salaryElement.evaluate((el) => el.textContent)
      : "";
    let city = cityElement
      ? await cityElement.evaluate((el) => el.textContent)
      : "";
    let featured = featuredElement ? true : false;

    const baseUrl = `https://www.ajarn.com`;

    jobs_arr.push({
      post_date: time,
      job_title: title.replace(/\n/g, "").trim(),
      salary: salary.replace(/\n/g, "").trim(),
      city: city.replace(/\n/g, "").trim(),
      business_name: company,
      company_url: baseUrl + link,
      featured: featured ? "YES" : "NO",
    });
  }

  console.log("Saving json...");
  await writeFile(`results/ajarn_tmp.json`, JSON.stringify(jobs_arr, null, 2));
  await browser.close();
};

main();
