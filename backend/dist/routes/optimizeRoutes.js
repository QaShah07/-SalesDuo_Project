"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const optimizationService_1 = require("../services/optimizationService");
const aiService_1 = require("../services/aiService");
const scrapeService_1 = require("../services/scrapeService");
const router = (0, express_1.Router)();
/**
 * POST /api/optimize
 * Body: { asin: string }
 *
 * Uses Gemini if GEMINI_API_KEY is set, otherwise falls back to mock data.
 */
router.post("/", async (req, res, next) => {
    try {
        const { asin } = req.body;
        if (!asin || typeof asin !== "string") {
            return res.status(400).json({ message: "ASIN is required" });
        }
        if (!/^[A-Z0-9]{10}$/i.test(asin.trim())) {
            return res.status(400).json({ message: "Invalid ASIN format" });
        }
        const result = await (0, optimizationService_1.runOptimization)(asin.trim());
        res.json(result);
    }
    catch (err) {
        if (err instanceof scrapeService_1.ScrapeError || err instanceof aiService_1.AIError) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error("Error in /api/optimize:", err);
        next(err);
    }
});
exports.default = router;
