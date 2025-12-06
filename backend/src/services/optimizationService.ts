import { fetchProductDetails, type OriginalListing } from "./scrapeService";
import { optimizeListing, type OptimizedListing } from "./aiService";

export type OptimizationRecord = {
  asin: string;
  timestamp: string;
  original: OriginalListing;
  optimized: OptimizedListing;
};

const historyStore: Record<string, OptimizationRecord[]> = {};

export async function runOptimization(asin: string): Promise<OptimizationRecord> {
  const original = await fetchProductDetails(asin);
  const optimized = await optimizeListing(original);

  const record: OptimizationRecord = {
    asin,
    timestamp: new Date().toISOString(),
    original,
    optimized
  };

  if (!historyStore[asin]) {
    historyStore[asin] = [];
  }
  historyStore[asin].unshift(record);

  return record;
}

export async function getHistory(asin: string) {
  if (!historyStore[asin]) {
    const firstRun = await runOptimization(asin);
    historyStore[asin] = [firstRun];
  }

  return historyStore[asin];
}
