import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/ajarn_tmp.json" with { type: "json" }

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  console.log("Length: " + tmp.length);

  for (let i = 0; i < 140; i++) {
    let company_url = tmp[i].company_url;
    console.log("Process:" + i + "/" + tmp.length, company_url);

    if (company_url) {
      try {
        await page.goto(company_url, {
          waitUntil: "domcontentloaded",
        });

        let jobTypeElement =
          (await page.$(`table.table>tbody>tr:nth-child(4)>td span.text-muted`)) ||
          "";
        let emailElement =
          (await page.$(`table.table>tbody>tr:nth-child(5)>td`)) || "";
        let descElement =
          (await page.$(`main.container.main>div.row>div:nth-child(2)`)) || "";

        const job_type = jobTypeElement
          ? await jobTypeElement.evaluate((el) => el.textContent)
          : "";
        const email = emailElement
          ? await emailElement.evaluate((el) => el.textContent)
          : "";
        const description = descElement
          ? await descElement.evaluate((el) => el.textContent)
          : "";

        tmp[i] = {
          ...tmp[i],
          job_type,
          email,
          description: description.replace(/\n/g, "").trim(),
        };
      } catch (error) {}
    }
  }

  console.log("Saving json...");
  await writeFile(`results/ajarn_full.json`, JSON.stringify(tmp, null, 2));

  console.log("Saving csv...");
  const csv = parse(tmp);
  await writeFile(`results/ajarn_full.csv`, csv);
  await browser.close();
};

main();
