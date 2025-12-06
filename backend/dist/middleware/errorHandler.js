"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const scrapeService_1 = require("../services/scrapeService");
const aiService_1 = require("../services/aiService");
function errorHandler(err, _req, res, _next) {
    const status = err.statusCode || 500;
    const message = err instanceof scrapeService_1.ScrapeError || err instanceof aiService_1.AIError
        ? err.message
        : "Internal server error";
    if (status >= 500) {
        console.error("Unhandled error:", err);
    }
    res.status(status).json({ message });
}
