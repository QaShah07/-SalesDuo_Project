import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OriginalListing } from "./scrapeService";

export type OptimizedListing = {
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
};

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

function extractJsonFromResponse(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonCandidate = fencedMatch ? fencedMatch[1] : trimmed;
  return JSON.parse(jsonCandidate);
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
      "Rewrite the listing to improve click-through rate and search performance while staying factual.",
      "Return JSON with keys: title (string), bullets (array of 5 concise bullets), description (short paragraph), keywords (array of 8-12 search terms).",
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
    const parsed = extractJsonFromResponse(text);

    return {
      title: parsed.title || original.title,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : original.bullets,
      description: parsed.description || original.description,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
    };
  } catch (err) {
    console.error("Gemini optimization failed, falling back to mock:", err);
    return optimizeListingMock(original);
  }
}
