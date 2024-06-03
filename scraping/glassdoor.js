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
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#left-column");

  let currentListing = await page.evaluate(() => {
    const jobElements = document.querySelectorAll(
      "ul.JobsList_jobsList__lqjTr>li"
    );
    return jobElements.length;
  });

  console.log(currentListing);

  for (let i = 2; i <= 4; i++) {
    console.log(i);
    try {
      await page.click(`ul.JobsList_jobsList__lqjTr>li:nth-child(${i})`);
      // let element = await page.waitForSelector(
      //   "header[data-test='job-details-header'] h1.heading_Heading__BqX5J"
      // );
      // let value = await page.evaluate((el) => el.textContent, element);
      // console.log(value);
      await page.waitForSelector("section div[data-triggered-brandview]");

      let tmp = await page.evaluate(() => {
        const titleElement = document.querySelectorAll(
          "header[data-test='job-details-header']"
        );
        // const descElement = document.querySelectorAll(
        //   "section div[data-triggered-brandview]"
        // );

        return titleElement.innerText

        const job_title = titleElement.innerText;
        const job_description = descElement.innerText;

        // return {
        //   job_title,
        //   job_description,
        // };
      });
      console.log(tmp);
    } catch (error) {
      console.error(error);
    }
  }
  await page.click(`button[data-test="load-more"]`);

  // continue
};

main();
