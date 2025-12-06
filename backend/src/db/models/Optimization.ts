export type Optimization = {
  id: number;
  product_id: number;
  title_optimized: string;
  bullets_optimized: string; // JSON string
  description_optimized: string;
  keywords: string; // JSON string
  created_at: Date;
};