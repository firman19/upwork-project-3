import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/glassdoor_tmp_us.json" with { type: "json" }

const main = async () => {
  let results = [];
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log("Length: " + tmp.length)
  for (let i = 0; i < tmp.length; i++) {
    let company_url = tmp[i].company_url;
    console.log("Process:" + i + "/" + tmp.length, company_url );
    let obj = {
      website: "",
      country: "",
    };

    if (company_url) {
      try {
        await page.goto(company_url, {
          waitUntil: "domcontentloaded",
        });
  
        // wait for the job url to display
        // await page.waitForFunction(
        //   () =>
        //     document.querySelectorAll(
        //       `ul[data-test="companyDetails"]>li>a[data-test="employer-website"]`
        //     ).length
        // );
  
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
          website : website,
          country : country,
        };
      } catch (error) {
        // console.error(error);
      }
      
    }
    results.push(obj);
  }

  console.log("Saving csv...");
  const csv = parse(results);
  await writeFile(`results/glassdoor_tmp_us_company.csv`, csv);
  await browser.close();
};

main();
