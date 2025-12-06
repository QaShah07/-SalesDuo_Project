/**
 * This file will eventually be responsible for scraping Amazon product data.
 * For now it returns a simple mock object so that the app runs end-to-end.
 */

export type OriginalListing = {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
};

export async function fetchProductDetailsMock(asin: string): Promise<OriginalListing> {
  // TODO: Replace this with real scraping using axios + cheerio or Puppeteer.
  return {
    asin,
    title: "Sample Product Title",
    bullets: [
      "Sample bullet point one",
      "Sample bullet point two",
      "Sample bullet point three"
    ],
    description:
      "This is a sample product description used for development and testing."
  };
}