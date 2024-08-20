import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/glassdoor_aug_tmp_br.json" with { type: "json" }

const main = async () => {
  console.log("Length: " + tmp.length)

  for (let i = 0; i < tmp.length; i++) {
    let company_url = tmp[i].zz_company_url;
    console.log("Process:" + i + "/" + tmp.length, company_url);

    if (company_url) {
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });
      const page = await browser.newPage();
      try {
        await page.goto(company_url, {
          waitUntil: "domcontentloaded",
          timeout: 10000
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

        tmp[i] = {
          ...tmp[i],
          af_website: website,
          ai_country: country,
        };
      } catch (error) {
        console.error(error);
      } finally {
        await browser.close();
      }
    }
  }

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/glassdoor_aug_tmp_br_company.csv`, csv);
};

main();
