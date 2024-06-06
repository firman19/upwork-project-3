import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/glassdoor_200_tmp_aus.json" with { type: "json" }

const main = async () => {
  let results = [];
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  for (let i = 0; i < 4; i++) {
    let company_url = tmp[i].company_url;
    console.log(tmp[i].job_title, company_url);
    let obj = {
      website: "",
      country: "",
    };

    if (company_url) {
      await page.goto(company_url, {
        waitUntil: "domcontentloaded",
      });

      // wait for the job url to display
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            `ul[data-test="companyDetails"]>li>a[data-test="employer-website"]`
          ).length
      );
      // console.log("job url has been displayed");

      // wait for the country to display
      // await page.waitForFunction(
      //   () =>
      //     document.querySelectorAll(
      //       `ul[data-test="companyDetails"]>li:nth-child(2)`
      //     ).length
      // );
      // console.log("country has been displayed");

      let websiteElement =
        (await page.$(
          `ul[data-test="companyDetails"]>li>a[data-test="employer-website"]`
        )) || "";
      let countryElement =
        (await page.$(`ul[data-test="companyDetails"]>li:nth-child(2)`)) || "";

      const website = websiteElement
        ? await websiteElement.evaluate((el) => el.textContent)
        : "";

      const country = countryElement
        ? await countryElement.evaluate((el) => el.textContent)
        : "";
      obj = {
        website,
        country,
      };
    }
    results.push(obj);
  }

  console.log("Saving csv...");
  const csv = parse(results);
  await writeFile(`results/glassdoor_200_tmp_aus_company.csv`, csv);
  await browser.close();
};

main();
