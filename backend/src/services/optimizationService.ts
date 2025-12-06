import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db/connection";
import { fetchProductDetails, type OriginalListing } from "./scrapeService";
import { optimizeListing, type OptimizedListing } from "./aiService";

export type OptimizationRecord = {
  asin: string;
  timestamp: string;
  original: OriginalListing;
  optimized: OptimizedListing;
};

type ProductRow = RowDataPacket & {
  id: number;
  asin: string;
  title_original: string;
  bullets_original: string;
  description_original: string;
  created_at: Date;
};

type OptimizationRow = RowDataPacket & {
  id: number;
  product_id: number;
  title_optimized: string;
  bullets_optimized: string;
  description_optimized: string;
  keywords: string;
  created_at: Date;
};

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

function mapRecord(product: ProductRow, opt: OptimizationRow): OptimizationRecord {
  return {
    asin: product.asin,
    timestamp:
      opt.created_at instanceof Date
        ? opt.created_at.toISOString()
        : new Date(opt.created_at).toISOString(),
    original: {
      asin: product.asin,
      title: product.title_original,
      bullets: parseStringArray(product.bullets_original),
      description: product.description_original
    },
    optimized: {
      title: opt.title_optimized,
      bullets: parseStringArray(opt.bullets_optimized),
      description: opt.description_optimized,
      keywords: parseStringArray(opt.keywords)
    }
  };
}

async function upsertProduct(original: OriginalListing): Promise<ProductRow> {
  const [insertResult] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO products (asin, title_original, bullets_original, description_original)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title_original = VALUES(title_original),
      bullets_original = VALUES(bullets_original),
      description_original = VALUES(description_original),
      id = LAST_INSERT_ID(id)
    `,
    [
      original.asin,
      original.title,
      JSON.stringify(original.bullets),
      original.description
    ]
  );

  const productId = insertResult.insertId;
  const [rows] = await pool.query<ProductRow[]>(
    "SELECT * FROM products WHERE id = ? LIMIT 1",
    [productId]
  );

  if (!rows[0]) {
    throw new Error("Failed to upsert product record.");
  }

  return rows[0];
}

async function insertOptimization(
  productId: number,
  optimized: OptimizedListing
): Promise<OptimizationRow> {
  const [insertResult] = await pool.execute<ResultSetHeader>(
    `
    INSERT INTO optimizations (
      product_id,
      title_optimized,
      bullets_optimized,
      description_optimized,
      keywords
    ) VALUES (?, ?, ?, ?, ?)
    `,
    [
      productId,
      optimized.title,
      JSON.stringify(optimized.bullets),
      optimized.description,
      JSON.stringify(optimized.keywords)
    ]
  );

  const [rows] = await pool.query<OptimizationRow[]>(
    "SELECT * FROM optimizations WHERE id = ? LIMIT 1",
    [insertResult.insertId]
  );

  if (!rows[0]) {
    throw new Error("Failed to insert optimization record.");
  }

  return rows[0];
}

export async function runOptimization(asin: string): Promise<OptimizationRecord> {
  const original = await fetchProductDetails(asin);
  const productRow = await upsertProduct(original);
  const optimized = await optimizeListing(original);
  const optimizationRow = await insertOptimization(productRow.id, optimized);

  return mapRecord(productRow, optimizationRow);
}

export async function getHistory(asin: string) {
  const [productRows] = await pool.query<ProductRow[]>(
    "SELECT * FROM products WHERE asin = ? LIMIT 1",
    [asin]
  );

  const product = productRows[0];
  if (!product) {
    return [];
  }

  const [optimizationRows] = await pool.query<OptimizationRow[]>(
    "SELECT * FROM optimizations WHERE product_id = ? ORDER BY created_at DESC",
    [product.id]
  );

  return optimizationRows.map((opt) => mapRecord(product, opt));
}
