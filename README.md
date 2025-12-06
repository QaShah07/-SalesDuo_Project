# SalesDuo Full Stack

Amazon listing optimizer with a Node/Express + MySQL backend and React + Vite frontend, using Gemini for copy generation.

## Prerequisites
- Node.js 18+
- MySQL 8+
- Gemini API key

## Setup (backend)
```bash
cd backend
npm install
cp .env.example .env   # fill in DB + Gemini + Amazon settings
```

Create the database/tables:
```bash
mysql -u <user> -p -h <host> -P <port> < backend/db/schema.sql
```

Run dev server:
```bash
npm run dev  # http://localhost:4000
```

Key environment variables (`backend/.env`):
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `GEMINI_API_KEY`, `GEMINI_MODEL` (defaults to `gemini-1.5-flash`)
- `AMAZON_BASE_URL`, optional `AMAZON_FALLBACK_BASE_URL`
- `SCRAPE_DRIVER` (`auto` | `axios` | `puppeteer`), `SCRAPE_TIMEOUT_MS`

AI prompt (backend `aiService.ts`): instructs Gemini to rewrite title/bullets/description for Amazon CTR/SEO, return JSON with `title`, `bullets[]`, `description`, `keywords[]`, and stays factual/compliant.

## Setup (frontend)
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if different from default
npm run dev  # http://localhost:5173
```

## Running full stack
1) Start backend (`npm run dev` in `backend`).
2) Start frontend (`npm run dev` in `frontend`).
3) Open `http://localhost:5173`, enter an ASIN, run optimization, and browse history.

## Notes
- Errors bubble to the frontend with friendly messages (invalid ASIN, scraping blocked, rate limits, AI formatting issues).
- Optimizations and history are persisted to MySQL.

## Database design
- **products**: `id` (PK), `asin` (unique), `title_original`, `bullets_original` (JSON), `description_original`, `created_at`.
- **optimizations**: `id` (PK), `product_id` (FK → products.id), `title_optimized`, `bullets_optimized` (JSON), `description_optimized`, `keywords` (JSON), `created_at`.
- Relationship: one product → many optimizations (historical runs ordered by `created_at DESC`).

Schema file: `backend/db/schema.sql` — run via `mysql -u <user> -p -h <host> -P <port> < backend/db/schema.sql`.

## Low-level flow
- **POST /api/optimize**: validate ASIN → scrape live Amazon HTML (Axios → Puppeteer fallback) → Gemini optimize (with model fallback; mock if unavailable) → upsert product + insert optimization row → return `{ asin, timestamp, original, optimized }`.
- **GET /api/history/:asin**: lookup product by ASIN → fetch optimizations ordered by `created_at DESC` → map DB rows to API shape.
- **Error handling**: Scrape/AI errors surfaced with status codes; unknown errors handled by global middleware.

## AI prompt (backend `aiService.ts`)
- Role: Amazon listing copywriter/SEO specialist.
- Task: rewrite title, 5 bullets, short description, and 3–8 keywords; stay factual/compliant.
- Output: JSON only with keys `title`, `bullets`, `description`, `keywords`; rejects markdown or prose.

## Assumptions & notes
- Scraping may be blocked; Puppeteer/headless with extra headers is used, and falls back when Amazon returns error pages.
- If no Gemini model is available to the API key, the service falls back to mock optimization so the flow continues.
