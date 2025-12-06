export type OriginalListing = {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
};

export type OptimizedListing = {
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
};

export type OptimizationResult = {
  asin: string;
  timestamp: string;
  original: OriginalListing;
  optimized: OptimizedListing;
};