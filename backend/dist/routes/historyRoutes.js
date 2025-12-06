"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const optimizationService_1 = require("../services/optimizationService");
const aiService_1 = require("../services/aiService");
const scrapeService_1 = require("../services/scrapeService");
const router = (0, express_1.Router)();
/**
 * GET /api/history/:asin
 *
 * Returns mock optimization history for a given ASIN.
 * Replace implementation with real DB lookup.
 */
router.get("/:asin", async (req, res) => {
    try {
        const { asin } = req.params;
        if (!asin) {
            return res.status(400).json({ message: "ASIN is required" });
        }
        const history = await (0, optimizationService_1.getHistory)(asin.trim());
        res.json(history);
    }
    catch (err) {
        if (err instanceof scrapeService_1.ScrapeError || err instanceof aiService_1.AIError) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error("Error in /api/history:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = router;
