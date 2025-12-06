import { Router } from "express";
import { runMockOptimization } from "../services/optimizationService";

const router = Router();

/**
 * POST /api/optimize
 * Body: { asin: string }
 * 
 * This is a skeleton implementation that returns mock data.
 * Replace runMockOptimization with a real implementation later.
 */
router.post("/", async (req, res) => {
  try {
    const { asin } = req.body;
    if (!asin || typeof asin !== "string") {
      return res.status(400).json({ message: "ASIN is required" });
    }

    const result = await runMockOptimization(asin.trim());
    res.json(result);
  } catch (err) {
    console.error("Error in /api/optimize:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;