# SalesDuo Backend

Basic Node.js + TypeScript Express backend for the SalesDuo intern assignment.

## Quick start

```bash
cd backend
npm install
cp .env.example .env   # fill in values
npm run dev            # start dev server on http://localhost:4000
```

### Gemini setup

Set `GEMINI_API_KEY` in your `.env` (and optionally `GEMINI_MODEL`, defaults to `gemini-1.5-flash`). If the key is missing or the API call fails, the service falls back to the mock optimizer so the rest of the app still works.

## Available endpoints

- `POST /api/optimize` — Accepts `{ asin }`, uses Gemini when configured, otherwise returns mock optimization.
- `GET /api/history/:asin` — Returns in-memory history for the given ASIN (seeded on first call).

Still TODO (placeholders in code):

- `src/services/scrapeService.ts` — Implement Amazon scraping.
- `src/db/connection.ts` and `src/db/models/*` — Wire up MySQL and store history.
