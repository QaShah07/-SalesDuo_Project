import axios from "axios";
import { load } from "cheerio";
import puppeteer, { type Browser } from "puppeteer";

export type OriginalListing = {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
};

export class ScrapeError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

type ScrapeDriver = "axios" | "puppeteer" | "auto";

const baseUrl =
  (process.env.AMAZON_BASE_URL || "https://www.amazon.com").replace(/\/$/, "");
const fallbackBaseUrl = process.env.AMAZON_FALLBACK_BASE_URL?.replace(/\/$/, "");
const scrapeDriver = (process.env.SCRAPE_DRIVER as ScrapeDriver) || "auto";
const scrapeTimeoutMs = Number(process.env.SCRAPE_TIMEOUT_MS || "15000");

function getDriverOrder(): ScrapeDriver[] {
  if (scrapeDriver === "axios") return ["axios"];
  if (scrapeDriver === "puppeteer") return ["puppeteer"];
  return ["axios", "puppeteer"];
}

async function fetchWithAxios(url: string) {
  const response = await axios.get(url, {
    validateStatus: () => true, // we handle status manually for clearer errors
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    },
    timeout: scrapeTimeoutMs
  });

  if (response.status === 503) {
    throw new ScrapeError(503, "Amazon returned 503 (captcha/blocked). Try again later.");
  }

  if (response.status === 404) {
    throw new ScrapeError(
      404,
      `Amazon returned 404 for this ASIN at ${url}. Verify the ASIN and marketplace.`
    );
  }

  if (response.status >= 400) {
    throw new ScrapeError(
      response.status,
      `Amazon request failed with status ${response.status}.`
    );
  }

  return response.data as string;
}

async function fetchWithPuppeteer(url: string) {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: scrapeTimeoutMs
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: scrapeTimeoutMs });
    const content = await page.content();
    return content;
  } catch (err) {
    throw new ScrapeError(500, "Headless browser fetch failed.");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function fetchHtmlWithDrivers(url: string): Promise<string> {
  const drivers = getDriverOrder();
  let lastError: unknown = null;

  for (const driver of drivers) {
    try {
      if (driver === "axios") {
        return await fetchWithAxios(url);
      }
      if (driver === "puppeteer") {
        return await fetchWithPuppeteer(url);
      }
    } catch (err) {
      lastError = err;
      // Do not retry with another driver on a confirmed 404.
      if (err instanceof ScrapeError && err.statusCode === 404) {
        throw err;
      }
    }
  }

  if (lastError instanceof ScrapeError) {
    throw lastError;
  }
  throw new ScrapeError(500, "Failed to fetch product page.");
}

export async function fetchProductDetails(asin: string): Promise<OriginalListing> {
  const productPath = `/dp/${encodeURIComponent(asin)}`;
  let html: string | null = null;

  // Try primary marketplace, then optional fallback on any non-404 error.
  try {
    html = await fetchHtmlWithDrivers(`${baseUrl}${productPath}`);
  } catch (err) {
    if (
      fallbackBaseUrl &&
      err instanceof ScrapeError &&
      err.statusCode !== 404
    ) {
      html = await fetchHtmlWithDrivers(`${fallbackBaseUrl}${productPath}`);
    } else {
      throw err;
    }
  }

  const $ = load(html || "");

  const title = $("#productTitle").text().trim();
  const bullets = $("#feature-bullets li")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const description =
    $("#productDescription").text().trim() ||
    $("#aplus").text().trim() ||
    "";

  if (!title || bullets.length === 0 || !description) {
    throw new ScrapeError(
      400,
      "Could not find title/bullets/description. Amazon may have blocked scraping or selectors changed."
    );
  }

  return {
    asin,
    title,
    bullets,
    description
  };
}
