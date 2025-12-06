import { Router, type NextFunction } from "express";
import { runOptimization } from "../services/optimizationService";
import { AIError } from "../services/aiService";
import { ScrapeError } from "../services/scrapeService";

const router = Router();

/**
 * POST /api/optimize
 * Body: { asin: string }
 *
 * Uses Gemini if GEMINI_API_KEY is set, otherwise falls back to mock data.
 */
router.post("/", async (req, res, next: NextFunction) => {
  try {
    const { asin } = req.body;
    if (!asin || typeof asin !== "string") {
      return res.status(400).json({ message: "ASIN is required" });
    }
    if (!/^[A-Z0-9]{10}$/i.test(asin.trim())) {
      return res.status(400).json({ message: "Invalid ASIN format" });
    }

    const result = await runOptimization(asin.trim());
    res.json(result);
  } catch (err) {
    if (err instanceof ScrapeError || err instanceof AIError) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    console.error("Error in /api/optimize:", err);
    next(err);
  }
});

export default router;
