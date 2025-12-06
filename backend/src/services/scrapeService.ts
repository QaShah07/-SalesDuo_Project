import axios from "axios";
import { load } from "cheerio";

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

export async function fetchProductDetails(asin: string): Promise<OriginalListing> {
  const productUrl = `https://www.amazon.com/dp/${encodeURIComponent(asin)}`;

  try {
    const response = await axios.get(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    // Amazon occasionally returns 503 or other blocks; surface a meaningful error.
    if (response.status === 503) {
      throw new ScrapeError(503, "Amazon returned 503 (captcha/blocked). Try again later.");
    }

    const $ = load(response.data);

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
  } catch (err: unknown) {
    if (err instanceof ScrapeError) {
      throw err;
    }

    if (axios.isAxiosError(err)) {
      if (err.response) {
        const status = err.response.status || 500;
        throw new ScrapeError(
          status,
          `Amazon request failed with status ${status}.`
        );
      }
      throw new ScrapeError(500, "Network error while fetching Amazon product page.");
    }

    throw new ScrapeError(500, "Unexpected error while scraping Amazon.");
  }
}
