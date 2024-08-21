import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/allconferencealertnet_aug_tmp.json" with { type: "json" }

const main = async () => {
    console.log("Length: " + tmp.length)

    for (let i = 0; i < tmp.length; i++) {
        // let company_url = "eventdetails.php?id=2596497";
        // let company_url = "https://allconferencealert.net/eventdetails.php?id=2287794";

        let company_url = tmp[i].eventLink;
        console.log("Process:" + i + "/" + tmp.length, company_url);
        if (company_url) {
            if (!company_url.includes("https://")) {
                company_url = "https://allconferencealert.net/" + company_url
            }
            
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

                // Define the values you're looking for
                const searchValues = ["Objective of the Conference", "Contact Person", "Organized By", "Event Enquiries", "Deadline", "Visit Website"];

                // Evaluate the page context to find the <tr> elements
                const result = await page.evaluate((searchValues) => {

                    // Function to clean up and extract the relevant part of the text
                    const cleanText = (text, target) => {
                        // Remove leading/trailing whitespace and newlines
                        return text.replace(target, '').replace(/.*\n\s*/, '').trim();
                    };

                    // Find all <tr> elements
                    const rows = Array.from(document.querySelectorAll('tr'));

                    // Map the search values to their corresponding text content
                    const matchedTexts = {};
                    searchValues.forEach(value => {
                        const row = rows.find(row => row.textContent.includes(value));
                        if (row) {
                            if (value === "Visit Website") {
                                const aTags = (row.querySelector('a'));
                                const link = aTags.getAttribute("href")
                                matchedTexts[value] = link;
                            } else {
                                matchedTexts[value] = cleanText(row.textContent, value);
                            }
                        } else {
                            matchedTexts[value] = null; // Handle cases where the value is not found
                        }
                    });

                    return matchedTexts;
                }, searchValues);


                tmp[i] = {
                    ...tmp[i],
                    ...result
                };

                // Convert the result to JSON format
                // const jsonResult = JSON.stringify(result, null, 2);
            } catch (error) {
                console.error(error);
            } finally {
                await browser.close();
            }
        }
    }

    console.log("Saving json...");
    await writeFile(
        `results/allconferencealertnet_aug_full.net_aug_full.json`,
        JSON.stringify(tmp, null, 2)
    );

    console.log("Saving csv...");
    const csv = parse(tmp);
    await writeFile(`results/allconferencealertnet_aug_full.csv`, csv);
}

main();
