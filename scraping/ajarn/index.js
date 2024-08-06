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

    salary = salary.replace(/\n/g, "")
    let index = salary.indexOf("least");
    salary = salary.substring(index + 5).trim();

    const baseUrl = `https://www.ajarn.com`;

    jobs_arr.push({
      a_date_farmed: "06/08/2024",
      b_source: "Ajarn",
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
      m_post_date: time,
      n_featured: featured ? "YES" : "NO",
      o_job_title: title.replace(/\n/g, "").trim(),
      p_online: "",
      q_job_type: "",
      r_description: "",
      s_student_category: "",
      t_subject: "",
      u_salary: salary.replace(/\n/g, "").trim(),
      v_currency: "",
      w_requirements: "",
      x_benefits: "",
      y_address: "",
      z_city: city.replace(/\n/g, "").trim(),
      aa_state: "",
      ab_country: "Thailand",
      ac_region: "South-East Asia",
      ad_business_name: company,
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
      zz_company_url: baseUrl + link,
    });
  }

  console.log("Saving json...");
  await writeFile(`results/ajarn_tmp.json`, JSON.stringify(jobs_arr, null, 2));
  await browser.close();
};

main();
