import { Router, type NextFunction } from "express";
import { getHistory } from "../services/optimizationService";
import { AIError } from "../services/aiService";
import { ScrapeError } from "../services/scrapeService";

const router = Router();

/**
 * GET /api/history/:asin
 * 
 * Returns mock optimization history for a given ASIN.
 * Replace implementation with real DB lookup.
 */
router.get("/:asin", async (req, res, next: NextFunction) => {
  try {
    const { asin } = req.params;
    if (!asin) {
      return res.status(400).json({ message: "ASIN is required" });
    }

    const history = await getHistory(asin.trim());
    res.json(history);
  } catch (err) {
    if (err instanceof ScrapeError || err instanceof AIError) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    console.error("Error in /api/history:", err);
    next(err);
  }
});

export default router;
