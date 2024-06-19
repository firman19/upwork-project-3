import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL =
  "https://www.chinajob.com/job/index.php?j=&c=&l=&n=industry_20&t=&d=-1&m=a&f=Teacher/Instructor/Professor/Scholar&p=";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // handle pagination
  let counter = 1;
  let lastPage = 152;
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
        () => document.querySelectorAll(`div.cj-job-list`).length
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
        `div.cj-job-list>div.cj-job-item`
      );
      return jobElements.length;
    });
    console.log("total jobs", totalJob);

    let start = 1;

    for (let i = start; i <= totalJob; i++) {
      try {
        let jobLinkElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) div[onclick*="location.href"]`
          )) || "";
        let job_link = jobLinkElement
          ? await jobLinkElement.evaluate((el) => el.getAttribute("onclick"))
          : "";
        let match_job_link = job_link.match(/location\.href='([^']+)'/);
        if (match_job_link) {
          job_link = `https://www.chinajob.com/job/` + match_job_link[1];
        }

        let titleElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) div.job-title`
          )) || "";
        let title = titleElement
          ? await titleElement.evaluate((el) => el.textContent)
          : "";

        let postDateElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) div.job-post`
          )) || "";
        let post_date = postDateElement
          ? await postDateElement.evaluate((el) => el.textContent)
          : "";
        const regex = /Posted (\d+ \w+ ago)/;
        let match = post_date.match(regex);
        if (match) {
          post_date = match[1];
        }

        let businessNameElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) div.job-post a`
          )) || "";
        let business_name = businessNameElement
          ? await businessNameElement.evaluate((el) => el.textContent)
          : "";
        let business_link = businessNameElement
          ? `https://www.chinajob.com/job/` +
            (await businessNameElement.evaluate((el) =>
              el.getAttribute("href")
            ))
          : "";

        let jobTypeElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) p.job-info .info-txt:nth-child(1)`
          )) || "";
        let job_type = jobTypeElement
          ? await jobTypeElement.evaluate((el) => el.textContent)
          : "";

        let locationElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) p.job-info .info-txt:nth-child(2)`
          )) || "";
        let location = locationElement
          ? await locationElement.evaluate((el) => el.textContent)
          : "";

        let salaryElement =
          (await page.$(
            `div.cj-job-list>div.cj-job-item:nth-child(${i}) p.job-info .info-txt:nth-child(3)`
          )) || "";
        let salary = salaryElement
          ? await salaryElement.evaluate((el) => el.textContent)
          : "";

        jobs_arr.push({
          date_farmed: "19/06/2024",
          source: "ChinaJobs",
          scraped_url: job_link,
          d: "New Lead",
          e: "Opportunity",
          f: "Juan",
          g: "Juan",
          h: "Lara",
          i: "Scraping",
          j: "EDU Business",
          k: "EDU Jobs",
          l: "Recruiters",
          post_date: post_date,
          n: "",
          job_title: title.replace(/\n/g, "").trim(),
          p: "",
          job_type,
          description: "",
          s: "",
          t: "",
          salary,
          v: "",
          w_requirements: "",
          x_benefits: "",
          y: "",
          z: "",
          aa_state_province: location,
          ab_country: "China",
          ac_region: "East Asia",
          business_name: business_name,
          ae_description: "",
          af_website: "",
          ag: "",
          ah: "",
          ai_country: "",
          company_url: business_link, // to get website
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  console.log("Saving json...");
  await writeFile(
    `results/chinajobs_tmp.json`,
    JSON.stringify(jobs_arr, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/chinajobs_tmp.csv`, csv);
  await browser.close();
};

main();
