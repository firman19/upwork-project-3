import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";

const main = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto("https://allconferencealert.net/china.php", {
        waitUntil: "load",
    });

    // wait for the event list to display
    await page.waitForFunction(
        () =>
            document.querySelectorAll(
                "table.table.conf-list tr.aevent"
            ).length
    );
    console.log("event list has been displayed");

    const jobs_arr = [];
    let start = 1;
    let totalJob = 0;
    let max = 3000;
    let skip = 0;
    let autoSave = 30;

    while (jobs_arr.length < max) {
        // count how many total html element jobs
        totalJob = await page.evaluate(() => {
            const jobElements = document.querySelectorAll(
                "table.table.conf-list tr.aevent"
            );
            return jobElements.length;
        });
        console.log("total events", totalJob);

        for (let i = start; i <= totalJob; i++) {
            let dateElement =
                (await page.$(
                    `table.table.conf-list tr.aevent:nth-child(${i}) td.date`
                )) || "";
            let nameElement =
                (await page.$(
                    `table.table.conf-list tr.aevent:nth-child(${i}) td.name a`
                )) || "";
            let venueElement =
                (await page.$(
                    `table.table.conf-list tr.aevent:nth-child(${i}) td.venue`
                )) || "";

            let date = dateElement
                ? await dateElement.evaluate((el) => el.textContent)
                : "";
            let name = nameElement
                ? await nameElement.evaluate((el) => el.textContent)
                : "";
            let eventLink = nameElement
                ? await nameElement.evaluate((el) => el.getAttribute("href"))
                : "";
            let venue = venueElement
                ? await venueElement.evaluate((el) => el.textContent)
                : "";

            jobs_arr.push({
                date: date.replace(/(\r\n|\n|\r|\t)/gm, "").trim(),
                name: name.replace(/(\r\n|\n|\r|\t)/gm, "").trim(),
                venue: venue.replace(/(\r\n|\n|\r|\t)/gm, "").trim(),
                eventLink: eventLink.replace(/(\r\n|\n|\r|\t)/gm, "").trim()
            })

            if (i % autoSave === 0) {
                console.log(
                    `Saving json results/allconferencealertnet_aug_tmp.json...`
                );
                await writeFile(
                    `results/allconferencealertnet_aug_tmp.json`,
                    JSON.stringify(jobs_arr, null, 2)
                );

                console.log(
                    `Saving csv results/allconferencealertnet_aug_tmp.csv...`
                );
                const csv = parse(jobs_arr);
                await writeFile(`results/allconferencealertnet_aug_tmp.csv`, csv);
            }
        }

        start = totalJob + 1;
        await page.click(`.load-more button.addToCart`);

        await page.waitForFunction(() => {
            const button = document.querySelector('.load-more button.addToCart');
            return button && button.textContent.trim().toLowerCase() == 'load more';
        }, { timeout: 10000 });
    }

    console.log("Saving json...");
    await writeFile(
        `results/allconferencealert.net_aug_full.json`,
        JSON.stringify(jobs_arr, null, 2)
    );

    console.log("Saving csv...");
    const csv = parse(jobs_arr);
    await writeFile(`results/allconferencealert.net_aug_full.csv`, csv);
    await browser.close();

}

main();
