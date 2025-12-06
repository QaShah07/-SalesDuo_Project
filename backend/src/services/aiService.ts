import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OriginalListing } from "./scrapeService";

export type OptimizedListing = {
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
};

export class AIError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

type ParsedAIResponse = {
  title?: unknown;
  bullets?: unknown;
  description?: unknown;
  keywords?: unknown;
};

function extractJsonFromResponse(text: string): ParsedAIResponse {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonCandidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(jsonCandidate);
}

function validateParsedResponse(parsed: ParsedAIResponse): OptimizedListing {
  if (
    typeof parsed.title !== "string" ||
    !Array.isArray(parsed.bullets) ||
    typeof parsed.description !== "string" ||
    !Array.isArray(parsed.keywords)
  ) {
    throw new AIError(502, "AI returned an unexpected format.");
  }

  return {
    title: parsed.title.trim(),
    bullets: parsed.bullets.map((b) => String(b).trim()).filter(Boolean),
    description: parsed.description.trim(),
    keywords: parsed.keywords.map((k) => String(k).trim()).filter(Boolean)
  };
}

export async function optimizeListingMock(
  original: OriginalListing
): Promise<OptimizedListing> {
  return {
    title: original.title + " | Optimized",
    bullets: original.bullets.map((b, idx) => `Optimized bullet ${idx + 1}: ${b}`),
    description: original.description + " (Optimized for clarity and SEO.)",
    keywords: ["sample keyword 1", "sample keyword 2", "sample keyword 3"]
  };
}

export async function optimizeListing(
  original: OriginalListing
): Promise<OptimizedListing> {
  if (!genAI) {
    return optimizeListingMock(original);
  }

  try {
    const model = genAI.getGenerativeModel({ model: geminiModel });
    const prompt = [
      "You are an expert Amazon listing copywriter and SEO specialist.",
      "Rewrite the listing to improve click-through rate and search performance while staying factual and compliant.",
      "Return ONLY valid JSON with keys: title (string), bullets (array of 5 concise bullets), description (short paragraph), keywords (array of 3-8 search terms).",
      "Do not include prose or Markdown fences outside the JSON.",
      "",
      `ASIN: ${original.asin}`,
      `Title: ${original.title}`,
      "Bullets:",
      ...original.bullets.map((b) => `- ${b}`),
      "Description:",
      original.description
    ].join("\n");

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: ParsedAIResponse;
    try {
      parsed = extractJsonFromResponse(text);
    } catch (parseErr) {
      throw new AIError(502, "AI returned non-JSON output.");
    }

    return validateParsedResponse(parsed);
  } catch (err) {
    if (err instanceof AIError) {
      // Bubble up friendly error to the route so the frontend sees it.
      throw err;
    }

    console.error("Gemini optimization failed, falling back to mock:", err);
    return optimizeListingMock(original);
  }
}
