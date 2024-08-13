import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const curr_process = 0;

const arr_URL = [
  "https://www.glassdoor.com.au/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.com.ar/Empleo/teacher-empleos-SRCH_KO0,7.htm",
  "https://www.glassdoor.at/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://nl.glassdoor.be/Vacature/teaching-vacatures-SRCH_KO0,8.htm",
  "https://www.glassdoor.com.br/Vaga/teaching-vagas-SRCH_KO0,8.htm",

  "https://www.glassdoor.ca/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.com.hk/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.fr/Emploi/teaching-emplois-SRCH_KO0,8.htm",
  "https://www.glassdoor.de/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.co.in/Job/teaching-jobs-SRCH_KO0,8.htm",

  "https://www.glassdoor.ie/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.it/Lavoro/teaching-lavori-SRCH_KO0,8.htm",
  "https://www.glassdoor.com.mx/Empleo/teaching-empleos-SRCH_KO0,8.htm",
  "https://www.glassdoor.nl/Vacature/teaching-vacatures-SRCH_KO0,8.htm",
  "https://www.glassdoor.co.nz/Job/teaching-jobs-SRCH_KO0,8.htm",

  "https://www.glassdoor.sg/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.es/Empleo/teaching-empleos-SRCH_KO0,8.htm",
  "https://fr.glassdoor.ch/Emploi/teaching-emplois-SRCH_KO0,8.htm",
  "https://de.glassdoor.ch/Job/teaching-jobs-SRCH_KO0,8.htm",
  "https://www.glassdoor.co.uk/Job/teaching-jobs-SRCH_KO0,8.htm",

  "https://www.glassdoor.com/Job/teaching-jobs-SRCH_KO0,8.htm",
]

const arr_currCountry = [
  "aus",
  "ar",
  "at",
  "be",
  "br",

  "ca",
  "hk",
  "fr",
  "ger",
  "in",

  "ireland",
  "italy",
  "mexico",
  "ned",
  "nz",

  "sg",
  "spain",
  "swiss",
  "switzerland",
  "uk",

  "us",
]

const main = async (curr_process) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto(arr_URL[curr_process], {
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
        const arr_BASE_URL = [
          "https://www.glassdoor.com.au",
          "https://www.glassdoor.com.ar",
          "https://www.glassdoor.com.at",
          "https://nl.glassdoor.be",
          "https://www.glassdoor.com.br",

          "https://www.glassdoor.ca",
          "https://www.glassdoor.com.hk",
          "https://www.glassdoor.fr",
          "https://www.glassdoor.de",
          "https://www.glassdoor.co.in",

          "https://www.glassdoor.ie",
          "https://www.glassdoor.it",
          "https://www.glassdoor.com.mx",
          "https://www.glassdoor.nl",
          "https://www.glassdoor.co.nz",

          "https://www.glassdoor.sg",
          "https://www.glassdoor.es",
          "https://fr.glassdoor.ch",
          "https://de.glassdoor.ch",
          "https://www.glassdoor.co.uk",

          "https://www.glassdoor.com",
        ]

        let companyUrlElement =
          (await page.$(`header[data-test='job-details-header'] a`)) || "";
        company_url = companyUrlElement
          ? arr_BASE_URL[curr_process] +
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
        a_date_farmed: "13/08/2024",
        b_source: "Glassdoor",
        c_scraped_url: URL,
        d: "New Lead",
        e: "Opportunity",
        f: "",
        g: "Lara",
        h: "Lara",
        i: "Scraping",
        j: "EDU Business",
        k: "EDU Jobs",
        l_subcategory: "",
        m_post_date: date,
        n_featured: "",
        o_job_title: title,
        p_online: location.toLowerCase() == "remote" ? "Yes" : "No",
        q_job_type: "",
        r_description: desc,
        s_student_category: "",
        t_subject: "",
        u_salary: salary,
        v_currency: "",
        w_requirements: "",
        x_benefits: "",
        y_address: "",
        z_city: location.toLowerCase() != "remote" ? location : "",
        aa_state: location,
        ab_country: arr_currCountry[curr_process],
        ac_region: "North America",
        business_name: company,
        ae_description: "",
        af_website: "",
        ag_email: "",
        ah_phone: "",
        ai_country: "",
        aj_region: "",
        ak_first_name: "",
        al_last_name: "",
        am_job_title: "",
        an_linkedin: "",
        ao_contact_email: "",
        ap_countr: "",
        aq_region: "",
        ar_instagram: "",
        as_facebook: "",
        at_x_twitter: "",
        au_tiktok: "",
        av_youtube: "",
        aw_linkedin: "",
        ax_whatsapp: "",
        ay_wechat: "",
        az_line: "",
        ba_kakao: "",
        zz_company_url: company_url,
      });

      if (i % autoSave === 0) {
        console.log(
          `Saving json results/glassdoor_aug_tmp_${arr_currCountry[curr_process]}.json...`
        );
        await writeFile(
          `results/glassdoor_aug_tmp_${arr_currCountry[curr_process]}.json`,
          JSON.stringify(jobs_arr, null, 2)
        );

        console.log(
          `Saving csv results/glassdoor_aug_tmp_${arr_currCountry[curr_process]}.csv...`
        );
        const csv = parse(jobs_arr);
        await writeFile(`results/glassdoor_aug_tmp_${arr_currCountry[curr_process]}.csv`, csv);
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
    `results/glassdoor_aug_full_${arr_currCountry[curr_process]}.json`,
    JSON.stringify(jobs_arr, null, 2)
  );

  console.log("Saving csv...");
  const csv = parse(jobs_arr);
  await writeFile(`results/glassdoor_aug_full_${arr_currCountry[curr_process]}.csv`, csv);
  await browser.close();
};

main(curr_process);
