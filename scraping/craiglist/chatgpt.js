import puppeteer from "puppeteer";

const main = async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  // Go to the Craigslist page
  await page.goto(
    "https://albany.craigslist.org/search/edu#search=1~thumb~0~6",
    {
      waitUntil: "load",
      timeout: 0,
    }
  );

  // Wait for the results to load
  console.log("Wait for the results to load");
  await page.waitForSelector(".result-row");

  // Extract data from the page
  console.log("Extract data from the page");
  const jobListings = await page.evaluate(() => {
    // Select all job listings
    console.log("Select all job listings");
    const jobNodes = document.querySelectorAll(".result-row");

    // Extract data from each listing
    const jobs = [];
    jobNodes.forEach((node) => {
      const titleNode = node.querySelector(".result-title");
      const dateNode = node.querySelector(".result-date");
      const linkNode = node.querySelector("a.result-title");

      if (titleNode && dateNode && linkNode) {
        jobs.push({
          title: titleNode.innerText,
          date: dateNode.innerText,
          link: linkNode.href,
        });
      }
    });

    return jobs;
  });

  // Print out the results
  console.log(jobListings);

  // Close the browser
  await browser.close();
};

main();
