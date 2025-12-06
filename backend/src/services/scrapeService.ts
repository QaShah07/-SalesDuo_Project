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
    await page.setViewport({ width: 1366, height: 768 });
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      // Skip images/stylesheets/fonts to reduce blocks and load faster
      if (["image", "stylesheet", "font"].includes(req.resourceType())) {
        return req.abort();
      }
      req.continue();
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: scrapeTimeoutMs });
    // Give Amazon some time to hydrate dynamic sections, but cap to ~1.2s.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    // Attempt to wait for known selectors if present.
    await Promise.race([
      page.waitForSelector("#productTitle", { timeout: 1500 }).catch(() => null),
      page.waitForSelector("span#productTitle", { timeout: 1500 }).catch(() => null)
    ]);
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
  // Drop noisy nodes early.
  $("script, style, noscript").remove();

  const normalize = (val: string) => val.replace(/\s+/g, " ").trim();
  const isNoise = (val: string) => {
    const t = val.toLowerCase();
    return (
      t.includes("function(") ||
      t.includes(".aplus") ||
      t.includes("carousel") ||
      t.includes("{") ||
      t.includes("}") ||
      t.length < 3
    );
  };

  const title =
    normalize($("#productTitle").text()) ||
    normalize($("span#productTitle").text()) ||
    normalize($("#title_feature_div span#productTitle").text()) ||
    normalize($("meta[property='og:title']").attr("content") || "") ||
    normalize($("title").text());

  const bullets = Array.from(
    new Set(
      [
        ...$("#feature-bullets li span")
          .map((_, el) => $(el).text())
          .get(),
        ...$("#feature-bullets li")
          .map((_, el) => $(el).text())
          .get(),
        ...$("#featurebullets_feature_div li span.a-list-item")
          .map((_, el) => $(el).text())
          .get(),
        ...$("ul.a-unordered-list.a-vertical.a-spacing-mini li span.a-list-item")
          .map((_, el) => $(el).text())
          .get(),
        ...$("#detailBullets_feature_div li span.a-list-item")
          .map((_, el) => $(el).text())
          .get(),
        ...$("ul.a-unordered-list span.a-list-item")
          .map((_, el) => $(el).text())
          .get()
      ]
        .map(normalize)
        .filter((b) => b && !isNoise(b))
    )
  );

  const ldJsonDescription = (() => {
    const scripts = $("script[type='application/ld+json']")
      .map((_, el) => $(el).contents().text())
      .get();
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script);
        const candidate = Array.isArray(parsed)
          ? parsed.find((item) => item && item["@type"] === "Product")
          : parsed;
        if (candidate && typeof candidate.description === "string") {
          return candidate.description.replace(/\s+/g, " ").trim();
        }
      } catch {
        // ignore malformed JSON blocks
      }
    }
    return "";
  })();

  const descriptionCandidates = [
    $("#productDescription").text(),
    $("#productDescription p").text(),
    $("#aplus").text(),
    $("#aplus_feature_div").text(),
    $("div#aplus_feature_div").text(),
    $("div#productDescription").text(),
    $("meta[name='description']").attr("content") || "",
    ldJsonDescription
  ]
    .map(normalize)
    .filter((d) => d && !isNoise(d))
    // Deduplicate while preserving order
    .filter((d, idx, arr) => arr.indexOf(d) === idx);

  const cleanDescription = (text: string) =>
    text
      .replace(/previous page/gi, " ")
      .replace(/next page/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const description =
    descriptionCandidates.map(cleanDescription).find((d) => d.length > 20) ||
    cleanDescription(normalize($("title").text())) ||
    bullets.join(" ");

  const looksLikeErrorPage =
    /page not found/i.test(title) ||
    /signin|sign in/i.test(title) ||
    (bullets.length === 0 && /page not found/i.test(description));

  if (looksLikeErrorPage) {
    throw new ScrapeError(
      404,
      `Amazon returned an error page for ASIN ${asin}. Check marketplace or try later.`
    );
  }

  if (!title || (bullets.length === 0 && !description)) {
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
