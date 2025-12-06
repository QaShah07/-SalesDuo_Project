# SalesDuo Backend

Basic Node.js + TypeScript Express backend for the SalesDuo intern assignment.

## Quick start

```bash
cd backend
npm install
cp .env.example .env   # fill in values
npm run dev            # start dev server on http://localhost:4000
```

## Available endpoints (skeleton)

- `POST /api/optimize` — Accepts `{ asin }`, returns mock original + optimized listing.
- `GET /api/history/:asin` — Returns mock history array for the given ASIN.

These are **placeholders** so that the frontend works immediately.  
You can replace the logic in:

- `src/services/scrapeService.ts` — Implement Amazon scraping.
- `src/services/aiService.ts` — Call your AI provider and generate real optimizations.
- `src/db/connection.ts` and `src/db/models/*` — Wire up MySQL and store history.