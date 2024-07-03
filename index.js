const puppeteer = require("puppeteer");
const { Parser } = require('json2csv');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function getPageData(url, page, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Navigating to ${url} (Attempt ${attempt})`);

            await page.goto(url, { timeout: 100000 });

            await page.waitForFunction(
                'document.readyState === "complete"',
                { timeout: 100000 }
            );

            await page.waitForSelector(".lfPIob", { timeout: 10000 });
            const shopName = await page.$eval(
                ".lfPIob",
                (name) => name.textContent.trim()
            );

            await page.waitForSelector(".AG25L:nth-child(3) .kR99db", { timeout: 10000 });
            const address = await page.$eval(
                ".AG25L:nth-child(3) .kR99db",
                (address) => address.textContent.trim()
            );

            let website = "";
            const websiteSelector = ".ITvuef .kR99db";
            const websiteElement = await page.$(websiteSelector);
            if (websiteElement) {
                website = await page.$eval(websiteSelector, (element) => element.textContent.trim());
            }

            let phone = "";
            const phoneSelector = ".AG25L:nth-child(6) .kR99db";
            const phoneElement = await page.$(phoneSelector);
            if (phoneElement) {
                phone = await page.$eval(phoneSelector, (element) => element.textContent.trim());
            }

            const review = await page.$$eval(".OXD3gb div", elements => {
                return elements.map(element => element.textContent.trim());
            });

            const returnObj = {
                shop: shopName,
                address: address,
                website: website,
                contact: phone
            };

            return returnObj;

        } catch (error) {
            console.error(`Error retrieving data from ${url} on attempt ${attempt}:`, error);
            if (attempt === retries) {
                return {
                    shop: "Error retrieving shop name",
                    address: "Error retrieving address",
                    status: "Error retrieving status",
                    website: "Error retrieving website",
                    contact: "Error retrieving contact"
                };
            }
        }
    }
}

async function scrollAndExtractLinks(page) {
    let previousHeight;
    let links = [];

    try {
        while (true) {
            const scrollableElement = await page.$('.ecceSd div') || await page.$('.QjC7t div') || await page.$('.PLbyfe div');

            previousHeight = await page.evaluate(el => el.scrollHeight, scrollableElement);
            await page.evaluate(el => el.scrollBy(0, el.scrollHeight), scrollableElement);

            await page.waitForFunction(
                (scrollableElement, previousHeight) => scrollableElement.scrollHeight > previousHeight,
                { timeout: 10000 },
                scrollableElement,
                previousHeight
            ).catch(() => {});

            const newLinks = await page.evaluate(() => {
                const anchors = document.querySelectorAll("a");
                return Array.from(anchors)
                    .map((a) => a.href)
                    .filter((link) => link.includes("google.com/maps/place") && !link.includes("specific_url_to_skip"));
            });

            if (newLinks.length > links.length) {
                links = newLinks;
            } else {
                break;
            }
        }
    } catch (error) {
        console.error("Error during scrolling and extracting links:", error);
    }

    return links;
}

async function main() {
    const searchQuery = await askQuestion("Enter the search query: ");
    rl.close();

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    let scrapedData = [];

    try {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`, { timeout: 120000 });
        await page.waitForSelector(".ecceSd, .QjC7t", { timeout: 100000 });

        const allLinks = await scrollAndExtractLinks(page);

        console.log("All links:", allLinks);

        for (let link of allLinks) {
            const data = await getPageData(link, page);
            scrapedData.push(data);
        }

        const parserObj = new Parser();
        const csv = parserObj.parse(scrapedData);

        fs.writeFileSync('./data.csv', csv);

    } catch (error) {
        console.error("Error during scraping:", error);
    } finally {
        await browser.close();
        return scrapedData;
    }
}

main();
