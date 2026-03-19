# AI Trading Journal Pro

Production-ready personal trading journal with analytics and performance tracking.

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS (dark premium UI)
- MongoDB + Mongoose
- JWT auth (HTTP-only cookies)
- Recharts analytics

## Core Features

- Upload TradingView screenshots and auto-extract:
	- Entry
	- Stop Loss
	- Take Profit
	- Direction (`LONG` / `SHORT`)
	- Risk/Reward ratio
- Trade journal CRUD (`/journal`, `/trade/[id]`)
- Dashboard (`/dashboard`) with equity curve and key performance metrics
- Analytics (`/analytics`) with strategy, RR, drawdown, and day breakdown
- Settings page (`/settings`) with local preferences (risk defaults, timezone, currency)
- CSV trade import
- Journal search/filter/sort controls for faster review
- Emotion tracking, plan adherence, risk tracking, replay notes
- API health checks + DB offline banner for graceful degraded mode

## Project Structure

- `src/app/(app)` – authenticated pages (`dashboard`, `journal`, `trade/[id]`, `analytics`, `ai-chat`)
- `src/app/api` – auth, trades, analytics, AI routes
- `src/models` – `User`, `Trade`
- `src/lib` – DB, auth, OCR, AI, analytics, storage helpers
- `src/components` – UI, charts, dashboard, layout components

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set at minimum:

- `MONGODB_URI`
- `JWT_SECRET`

Feature flags:

- `AUTH_ENABLED` (`true` to require login/signup, `false` for direct demo access)
- `APP_DEMO_MODE` (`true` by default; used for UX messaging and guest-friendly flow)

Rate limiting:

- `RATE_LIMIT_ENABLED` (`true` by default)
- `RATE_LIMIT_WINDOW_MS` (default `60000`)
- `RATE_LIMIT_MAX_REQUESTS` (default `120`)
- `RATE_LIMIT_AUTH_MAX_REQUESTS` (default `20`)
- `RATE_LIMIT_UPLOAD_MAX_REQUESTS` (default `12`)

## Run Locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`

## Quality Checks

```bash
npm run lint
npm run build
```

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`
- `GET/POST /api/trades`
- `GET/PATCH/DELETE /api/trades/:id`
- `POST /api/trades/import-csv`
- `GET /api/analytics/summary`

## Notes

- Image files are stored locally in `public/uploads`.
- Reference folders `arthveda-main` and `journalit-main` are intentionally excluded from lint/build checks.
- In demo mode (`AUTH_ENABLED=false`), APIs run under a guest identity (`guest-user`) for local prototyping.
- API errors and rate-limit events are logged to server console for lightweight monitoring.
