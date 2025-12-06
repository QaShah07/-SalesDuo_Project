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
