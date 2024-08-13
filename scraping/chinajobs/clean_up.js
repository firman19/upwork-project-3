import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { parse } from "json2csv";
import tmp from "./results/chinajobs_full.json" with { type: "json" }

const main = async () => {
    for (let i = 0; i < tmp.length; i++) {
        let currDesc = tmp[i].r_description;
        currDesc = currDesc.replace(/(\r\n|\n|\r|\t)/gm, "").trim();
        tmp[i] = {
            ...tmp[i],
            r_description: currDesc,
          };
    }

    console.log("Saving json...");
    await writeFile(`results/chinajobs_full_cleanup.json`, JSON.stringify(tmp, null, 2));

    console.log("Saving csv...");
    const csv = parse(tmp);
    await writeFile(`results/chinajobs_full_cleanup.csv`, csv);
}

main();
