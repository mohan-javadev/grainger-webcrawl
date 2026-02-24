import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

export default async function handler(req, res) {

    const url = req.query.url;

    if (!url)
        return res.status(400).json({ error: "Missing url parameter" });

    let browser;

    try {
        browser = await playwright.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

        // Product title
        const title = await page.locator("h1").first().innerText();

        // Item number
        let item = "";
        const itemEl = await page.locator("text=Item #").first();
        if (await itemEl.count()) {
            item = await itemEl.locator("xpath=following-sibling::*").first().innerText();
        }

        // Specs
        const specs = {};
        const rows = await page.locator("dt");

        const count = await rows.count();

        for (let i = 0; i < count; i++) {
            const key = await rows.nth(i).innerText();
            const value = await page.locator("dd").nth(i).innerText();
            specs[key.trim()] = value.trim();
        }

        await browser.close();

        return res.status(200).json({
            product: title,
            item: item,
            specs: specs
        });

    } catch (err) {

        if (browser) await browser.close();

        return res.status(500).json({
            error: err.toString()
        });
    }
}
