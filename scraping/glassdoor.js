import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL = "https://www.glassdoor.com.au/Job/teaching-jobs-SRCH_KO0,8.htm";

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
    () =>
      document.querySelectorAll(
        "ul[aria-label='Jobs List']>li[data-test='jobListing']"
      ).length
  );
  console.log("joblist has been displayed");

  // click each job list (looping)
  const jobs = [];
  let start = 1;
  let totalJob = 0;
  let max = 1200;
  let skip = 0;
  while (jobs.length < max) {
    // count how many total jobs
    totalJob = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(
        "ul[aria-label='Jobs List']>li[data-test='jobListing']"
      );
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    if (skip) {
      if (totalJob <= skip) {
        start = totalJob + 1;
        await page.click(`button[data-test="load-more"]`);
        await page.waitForFunction(
          () =>
            document.querySelectorAll(
              `button[data-test="load-more"][data-loading="false"]`
            ).length
        );
        continue;
      }
    }

    for (let i = start; i <= max; i++) {
      await page.click(
        `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i})`
      );

      // get some data from left components
      let companyElement =
        (await page.$(
          `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) div>span`
        )) || "";
      let titleElement =
        (await page.$(
          `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) a[data-test='job-title']`
        )) || "";
      let locElement =
        (await page.$(
          `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) div[data-test='emp-location']`
        )) || "";
      let salaryElement =
        (await page.$(
          `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) div[data-test='detailSalary']`
        )) || "";
      let descSnippetElement =
        (await page.$(
          `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) div[data-test='descSnippet']`
        )) || "";
      let dateElement =
        (await page.$(
          `ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) div[data-test='job-age']`
        )) || "";

      const company = companyElement
        ? await companyElement.evaluate((el) => el.textContent)
        : "";
      const title = titleElement
        ? await titleElement.evaluate((el) => el.textContent)
        : "";
      const loc = locElement
        ? await locElement.evaluate((el) => el.textContent)
        : "";
      const salary = salaryElement
        ? await salaryElement.evaluate((el) => el.textContent)
        : "";
      const descSnippet = descSnippetElement
        ? await descSnippetElement.evaluate((el) => el.textContent)
        : "";
      const date = dateElement
        ? await dateElement.evaluate((el) => el.textContent)
        : "";

      let desc = "";
      let company_url = "";
      try {
        // wait for the description to appear
        await page.waitForFunction(
          () =>
            document.querySelectorAll(
              "section>div[data-brandviews]>div[data-brandviews]"
            ).length
        );

        // get data from right component
        let companyUrlElement =
          (await page.$(`header[data-test='job-details-header'] a`)) || "";
        company_url = companyUrlElement
          ? "https://www.glassdoor.com.au" +
            (await companyUrlElement.evaluate((el) => el.getAttribute("href")))
          : "";

        let descElement =
          (await page.$(`section>div[data-brandviews]>div[data-brandviews]`)) ||
          "";
        desc = descElement
          ? await descElement.evaluate((el) => el.textContent)
          : "";
        console.log(desc ? i + " desc ok" : i + " desc empty");
      } catch (error) {
        console.error(error);
      }

      jobs.push({
        post_date: date,
        job_title: title,
        online: loc.toLowerCase() == "remote" ? "Yes" : "No",
        description: desc,
        salary,
        city: loc.toLowerCase() != "remote" ? loc : "",
        business_name: company,
        company_url,
      });
    }

    start = totalJob + 1;
    await page.click(`button[data-test="load-more"]`);
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          `button[data-test="load-more"][data-loading="false"]`
        ).length
    );
  }
  console.log("Saving json...");
  await writeFile(`glassdoor1000.json`, JSON.stringify(jobs, null, 2));

  console.log("Saving csv...");
  const csv = parse(jobs);
  await writeFile(`glassdoor1000.csv`, csv);
  // await browser.close();
};

main();
