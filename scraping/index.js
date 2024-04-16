import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const URL =
  "https://jobs.theguardian.com/searchjobs/?Keywords=teacher&radialtown=&LocationId=&RadialLocation=30&NearFacetsShown=true&CountryCode=&page=";

const main = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    const startPage = 91;
    const lastPage = 100;
    let jobListings = [];

    for (let i = startPage; i <= lastPage; i++) {
      console.log(`opening page ${i}/${lastPage}`);
      const pageURL = URL + i;

      await page.goto(pageURL, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector("#sp_message_container_1113437");

      // Deleting cookies prompt
      await page.evaluate(() => {
        const element = document.querySelector("#sp_message_container_1113437");
        if (element) {
          element.remove();
        }
      });

      let currentListing = await page.evaluate(() => {
        const listings = [];
        const jobElements = document.querySelectorAll(".lister__item");
        let flag = true;

        jobElements.forEach((jobElement) => {
          const titleElement = jobElement.querySelector(".lister__header");
          const linkElement = jobElement.querySelector("a");

          if (titleElement && linkElement) {
            const job_title = titleElement.innerText.trim();
            const link = linkElement.href;

            listings.push({
              job_title,
              link,
              bussiness_name: "",
              city: "",
              state: "",
              address: "",
              salary: "",
              job_type: "",
            });
          }
        });

        return listings;
      });

      jobListings = [...jobListings, ...currentListing];
    }

    console.log("jobListings length");
    console.log(jobListings.length);

    let count = 0;
    for (let job of jobListings) {
      console.log(`jobListings[${count}/${jobListings.length}]`);
      count++;
      const jobPage = await browser.newPage();
      await jobPage.goto(job.link, {
        waitUntil: "domcontentloaded",
      });

      let exist = false;
      await jobPage
        .waitForSelector(".mds-list__value")
        .then(() => {
          exist = true;
        })
        .catch((e) => {});
      if (!exist) {
        continue;
      }

      const detailedInfo = await jobPage.evaluate(() => {
        const elements = document.querySelectorAll(".mds-list__value");

        const bussiness_name = elements[0].textContent.trim() ?? "";

        const location = elements[1].textContent.trim() ?? "";
        const city = location.split(",")[0] ?? "";
        const state = location.split(",")[1] ?? "";
        const address = location.split(",")[2] ?? "";

        const salary = elements[2].textContent.trim();
        const job_type = elements[5].textContent.trim();
        let business_type = elements[7].textContent.trim();
        business_type = business_type.replace(/\n/g, "").trim();
        business_type = business_type.replace(/\+/g, "").trim();

        let job_description = document
          .querySelector(".mds-edited-text.mds-font-body-copy-bulk")
          .textContent.trim();
        job_description = job_description.replace(/\n/g, " ").trim();
        job_description = job_description.replace(/\+/g, "");

        const business_link = document.querySelector(".mds-list__value a").href;

        const closing_date = elements[3].textContent.trim();
        const contract = elements[4].textContent.trim();
        const listing_type = elements[6].textContent.trim();

        if (elements) {
          return {
            bussiness_name,
            city,
            state,
            address,
            salary,
            job_type,
            business_type,
            job_description,
            business_link,
          };
        }
        return null;
      });

      // hardcode
      let country = "UK";
      let region = "Europe";
      let source = "TheGuardianJobs";
      let detailedInfo2 = {
        website: "",
        telephone: "",
        country,
        region,
        source,
      };

      let canContinue = false;
      await jobPage
        .waitForSelector(".mds-grid-col-12>.mds-list .mds-list__value a", {
          timeout: 1000,
        })
        .then(() => {
          console.log("SUCCESS");
          canContinue = true;
        })
        .catch((e) => {
          console.log("FAIL");
        });

      if (canContinue) {
        await jobPage.click(".mds-grid-col-12>.mds-list .mds-list__value a");
        // await jobPage.waitForNavigation();
        canContinue = false;
        await jobPage
          .waitForSelector(".mds-list__value")
          .then(() => {
            canContinue = true;
          })
          .catch((e) => {});

        if (canContinue) {
          detailedInfo2 = await jobPage.evaluate(() => {
            let country = "UK";
            let region = "Europe";
            let source = "TheGuardianJobs";
            let website = "";
            let telephone = "";

            const elements = document.querySelectorAll(".mds-list__value");
            if (elements) {
              // website = elements[0].textContent.trim() ?? "";
              // telephone =
              //   elements[1].textContent.trim().replace(/\s+/g, "") ?? "";
              el = document.querySelector('[itemprop="url"]');
              if (el) {
                website = document
                  .querySelector('[itemprop="url"]')
                  .textContent.trim();
              }
              el = document.querySelector('[itemprop="telephone"]');
              if (el) {
                telephone = document
                  .querySelector('[itemprop="telephone"]')
                  .textContent.trim();
              }
              // const address = document
              //   .querySelector('[itemprop="streetAddress"]')
              //   .textContent.trim();
              // const city = document
              //   .querySelector('[itemprop="addressLocality"]')
              //   .textContent.trim();
            }

            return {
              website,
              telephone,
              country,
              region,
              source,
              // address,
              // city,
            };
          });
        }
      }

      for (const key in detailedInfo) {
        if (detailedInfo.hasOwnProperty(key)) {
          job[key] = detailedInfo[key];
        }
      }

      for (const key in detailedInfo2) {
        if (detailedInfo2.hasOwnProperty(key)) {
          job[key] = detailedInfo2[key];
        }
      }

      await jobPage.close();
    }

    console.log("Saving json...");
    await writeFile(
      `jobListings_${startPage}_${lastPage}.json`,
      JSON.stringify(jobListings, null, 2)
    );

    console.log("Saving csv...");
    const csv = parse(jobListings);
    await writeFile(`jobListings_${startPage}_${lastPage}.csv`, csv);
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await browser.close();
  }
};

main();
