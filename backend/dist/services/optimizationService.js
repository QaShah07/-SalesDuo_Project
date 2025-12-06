"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOptimization = runOptimization;
exports.getHistory = getHistory;
const connection_1 = require("../db/connection");
const scrapeService_1 = require("./scrapeService");
const aiService_1 = require("./aiService");
function parseStringArray(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
    }
    catch {
        return [];
    }
}
function mapRecord(product, opt) {
    return {
        asin: product.asin,
        timestamp: opt.created_at instanceof Date
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
async function upsertProduct(original) {
    const [insertResult] = await connection_1.pool.execute(`
    INSERT INTO products (asin, title_original, bullets_original, description_original)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title_original = VALUES(title_original),
      bullets_original = VALUES(bullets_original),
      description_original = VALUES(description_original),
      id = LAST_INSERT_ID(id)
    `, [
        original.asin,
        original.title,
        JSON.stringify(original.bullets),
        original.description
    ]);
    const productId = insertResult.insertId;
    const [rows] = await connection_1.pool.query("SELECT * FROM products WHERE id = ? LIMIT 1", [productId]);
    if (!rows[0]) {
        throw new Error("Failed to upsert product record.");
    }
    return rows[0];
}
async function insertOptimization(productId, optimized) {
    const [insertResult] = await connection_1.pool.execute(`
    INSERT INTO optimizations (
      product_id,
      title_optimized,
      bullets_optimized,
      description_optimized,
      keywords
    ) VALUES (?, ?, ?, ?, ?)
    `, [
        productId,
        optimized.title,
        JSON.stringify(optimized.bullets),
        optimized.description,
        JSON.stringify(optimized.keywords)
    ]);
    const [rows] = await connection_1.pool.query("SELECT * FROM optimizations WHERE id = ? LIMIT 1", [insertResult.insertId]);
    if (!rows[0]) {
        throw new Error("Failed to insert optimization record.");
    }
    return rows[0];
}
async function runOptimization(asin) {
    const original = await (0, scrapeService_1.fetchProductDetails)(asin);
    const productRow = await upsertProduct(original);
    const optimized = await (0, aiService_1.optimizeListing)(original);
    const optimizationRow = await insertOptimization(productRow.id, optimized);
    return mapRecord(productRow, optimizationRow);
}
async function getHistory(asin) {
    const [productRows] = await connection_1.pool.query("SELECT * FROM products WHERE asin = ? LIMIT 1", [asin]);
    const product = productRows[0];
    if (!product) {
        return [];
    }
    const [optimizationRows] = await connection_1.pool.query("SELECT * FROM optimizations WHERE product_id = ? ORDER BY created_at DESC", [product.id]);
    return optimizationRows.map((opt) => mapRecord(product, opt));
}
