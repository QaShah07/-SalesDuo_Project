"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOptimization = runOptimization;
exports.getHistory = getHistory;
const scrapeService_1 = require("./scrapeService");
const aiService_1 = require("./aiService");
const historyStore = {};
async function runOptimization(asin) {
    const original = await (0, scrapeService_1.fetchProductDetails)(asin);
    const optimized = await (0, aiService_1.optimizeListing)(original);
    const record = {
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
async function getHistory(asin) {
    if (!historyStore[asin]) {
        const firstRun = await runOptimization(asin);
        historyStore[asin] = [firstRun];
    }
    return historyStore[asin];
}
