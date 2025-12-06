import type { NextFunction, Request, Response } from "express";
import { ScrapeError } from "../services/scrapeService";
import { AIError } from "../services/aiService";

type ApiError = ScrapeError | AIError | (Error & { statusCode?: number });

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = (err as ApiError).statusCode || 500;
  const message =
    err instanceof ScrapeError || err instanceof AIError
      ? err.message
      : "Internal server error";

  if (status >= 500) {
    console.error("Unhandled error:", err);
  }

  res.status(status).json({ message });
}
