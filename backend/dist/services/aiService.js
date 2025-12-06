"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeListingMock = optimizeListingMock;
exports.optimizeListing = optimizeListing;
const generative_ai_1 = require("@google/generative-ai");
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const genAI = geminiApiKey ? new generative_ai_1.GoogleGenerativeAI(geminiApiKey) : null;
function extractJsonFromResponse(text) {
    const trimmed = text.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonCandidate = fencedMatch ? fencedMatch[1] : trimmed;
    return JSON.parse(jsonCandidate);
}
async function optimizeListingMock(original) {
    return {
        title: original.title + " | Optimized",
        bullets: original.bullets.map((b, idx) => `Optimized bullet ${idx + 1}: ${b}`),
        description: original.description + " (Optimized for clarity and SEO.)",
        keywords: ["sample keyword 1", "sample keyword 2", "sample keyword 3"]
    };
}
async function optimizeListing(original) {
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
    }
    catch (err) {
        console.error("Gemini optimization failed, falling back to mock:", err);
        return optimizeListingMock(original);
    }
}
