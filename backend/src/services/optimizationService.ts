import { fetchProductDetailsMock } from "./scrapeService";
import { optimizeListingMock } from "./aiService";

export async function runMockOptimization(asin: string) {
  const original = await fetchProductDetailsMock(asin);
  const optimized = await optimizeListingMock(original);

  const timestamp = new Date().toISOString();

  return {
    asin,
    timestamp,
    original,
    optimized
  };
}

// Temporary in-memory store for mock history
const historyStore: Record<string, any[]> = {};

export async function getMockHistory(asin: string) {
  if (!historyStore[asin]) {
    // Seed with a single example if none exist yet
    const firstRun = await runMockOptimization(asin);
    historyStore[asin] = [firstRun];
  }

  return historyStore[asin];
}