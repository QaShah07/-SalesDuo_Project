import { Router } from "express";
import { getMockHistory } from "../services/optimizationService";

const router = Router();

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

    const history = await getMockHistory(asin.trim());
    res.json(history);
  } catch (err) {
    console.error("Error in /api/history:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;