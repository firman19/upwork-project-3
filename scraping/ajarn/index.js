import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

// 
const baseUrl = `https://www.ajarn.com/`;
const selectorJobList = `section#premium_jobs>a`;
const titleEl = `section#premium_jobs>a div.titleText h1`;
const linkEl = `section#premium_jobs>a`;
const timeEl = `section#premium_jobs>a time.getAttribute("datetime")`;
const companyEl = `section#premium_jobs>a h2 strong`;
const salaryEl = `section#premium_jobs>a div.row.details > div:nth-child(2)`;
const cityEl = `section#premium_jobs>a div.row.details > div:nth-child(3)`;
const featuredEl = `section#premium_jobs>a img[class="featuredSash"]`;

// detail page
const jobTypeEl = `table.table>tbody>tr:nth-child(5)>td.text-muted`
const emailEl = `table.table>tbody>tr:nth-child(5)>td`
const descEl = `main.container.main>div.row>div:nth-child(2).innerHTML` // need to delete element h1, h3, div#sendResumeButton

// const URL = "https://www.glassdoor.com.au/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.com.ar/Empleo/teacher-empleos-SRCH_KO0,7.htm";
// const URL = "https://www.glassdoor.at/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://nl.glassdoor.be/Vacature/teaching-vacatures-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.com.br/Vaga/teaching-vagas-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.ca/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.com.hk/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.fr/Emploi/teaching-emplois-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.de/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.co.in/Job/teaching-jobs-SRCH_KO0,8.htm";

// const URL = "https://www.glassdoor.ie/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.it/Lavoro/teaching-lavori-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.com.mx/Empleo/teaching-empleos-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.nl/Vacature/teaching-vacatures-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.co.nz/Job/teaching-jobs-SRCH_KO0,8.htm";

// const URL = "https://www.glassdoor.sg/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.es/Empleo/teaching-empleos-SRCH_KO0,8.htm";
// const URL = "https://fr.glassdoor.ch/Emploi/teaching-emplois-SRCH_KO0,8.htm";
// const URL = "https://de.glassdoor.ch/Job/teaching-jobs-SRCH_KO0,8.htm";
// const URL = "https://www.glassdoor.co.uk/Job/teaching-jobs-SRCH_KO0,8.htm";
const URL = "https://www.glassdoor.com/Job/teaching-jobs-SRCH_KO0,8.htm";

// const currCountry = "aus";
// const currCountry = "ar";
// const currCountry = "at";
// const currCountry = "be";
// const currCountry = "br";
// const currCountry = "ca";
// const currCountry = "hk";
// const currCountry = "fr";
// const currCountry = "ger";
// const currCountry = "in";

// const currCountry = "ireland";
// const currCountry = "italy";
// const currCountry = "mexico";
// const currCountry = "ned";
// const currCountry = "nz";

// const currCountry = "sg";
// const currCountry = "spain";
// const currCountry = "swiss";
// const currCountry = "switzerland";
// const currCountry = "uk";
const currCountry = "us";

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
  const jobs_arr = [];
  let start = 1;
  let totalJob = 0;
  let max = 4050;
  let skip = 0;
  let autoSave = 10;

  while (jobs_arr.length < max) {
    // count how many total html element jobs
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

    for (let i = start; i <= totalJob; i++) {
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
      // let locElement = (await page.$(`ul[aria-label='Jobs List']>li[data-test='jobListing']:nth-child(${i}) div[data-test='emp-location']` )) || "";
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
      // const loc = locElement ? await locElement.evaluate((el) => el.textContent) : "";
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
      let location = "";
      try {
        // wait for the description to appear
        await page.waitForFunction(
          () =>
            document.querySelectorAll(
              "section>div[data-brandviews]>div[data-brandviews]"
            ).length
        );

        // get data from right component
        // EDIT THE BASE_URL
        // let BASE_URL = "https://www.glassdoor.com.au";
        // let BASE_URL = "https://www.glassdoor.com.ar";
        // let BASE_URL = "https://www.glassdoor.com.at";
        // let BASE_URL = "https://nl.glassdoor.be";
        // let BASE_URL = "https://www.glassdoor.com.br";
        // let BASE_URL = "https://www.glassdoor.ca";
        // let BASE_URL = "https://www.glassdoor.com.hk";
        // let BASE_URL = "https://www.glassdoor.fr";
        // let BASE_URL = "https://www.glassdoor.de";
        // let BASE_URL = "https://www.glassdoor.co.in";

        // let BASE_URL = "https://www.glassdoor.ie";
        // let BASE_URL = "https://www.glassdoor.it";
        // let BASE_URL = "https://www.glassdoor.com.mx";
        // let BASE_URL = "https://www.glassdoor.nl";
        // let BASE_URL = "https://www.glassdoor.co.nz";

        // let BASE_URL = "https://www.glassdoor.sg";
        // let BASE_URL = "https://www.glassdoor.es";
        // let BASE_URL = "https://fr.glassdoor.ch";
        // let BASE_URL = "https://de.glassdoor.ch";
        // let BASE_URL = "https://www.glassdoor.co.uk";
        let BASE_URL = "https://www.glassdoor.com";

        let companyUrlElement =
          (await page.$(`header[data-test='job-details-header'] a`)) || "";
        company_url = companyUrlElement
          ? BASE_URL +
            (await companyUrlElement.evaluate((el) => el.getAttribute("href")))
          : "";

        let rightLocElement =
          (await page.$(
            `header[data-test='job-details-header'] div[data-test="location"]`
          )) || "";
        location = rightLocElement
          ? await rightLocElement.evaluate((el) => el.textContent)
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

      jobs_arr.push({
        post_date: date,
        job_title: title,
        online: location.toLowerCase() == "remote" ? "Yes" : "No",
        description: desc,
        salary,
        city: location.toLowerCase() != "remote" ? location : "",
        business_name: company,
        company_url,
      });

      if (i % autoSave === 0) {
        console.log(`Saving json results/glassdoor_tmp_${currCountry}.json...`);
        await writeFile(
          `results/glassdoor_tmp_${currCountry}.json`,
          JSON.stringify(jobs_arr, null, 2)
        );

        console.log(`Saving csv results/glassdoor_tmp_${currCountry}.csv...`);
        const csv = parse(jobs_arr);
        await writeFile(`results/glassdoor_tmp_${currCountry}.csv`, csv);
      }
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
  await writeFile(
    `results/glassdoor_full_${currCountry}.json`,
    JSON.stringify(jobs_arr, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/glassdoor_full_${currCountry}.csv`, csv);
  await browser.close();
};

main();
