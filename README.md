# Trading Journal Pro

Personal trading journal with analytics, dashboard insights, CSV import, and settings.

## Features

- Trade journal CRUD (`/journal`, `/trade/[id]`)
- Dashboard metrics + equity chart (`/dashboard`)
- Analytics breakdowns (`/analytics`)
- CSV import for trades
- Settings (risk defaults, timezone, currency)
- Auth flow (toggleable via env)
- Health check endpoint (`/api/health`)

## Tech Stack

- Next.js (App Router + TypeScript)
- Tailwind CSS
- MongoDB + Mongoose
- JWT auth (HTTP-only cookies)
- Recharts

## Quick Start (Beginner Friendly)

1. Install dependencies:

```bash
npm install
```

2. Create and auto-configure local env:

```bash
npm run setup
```

3. Ensure MongoDB is running, then test DB connection:

```bash
npm run db:check
```

4. Start the app:

```bash
npm run dev
```

5. Open in browser:

- `http://localhost:3000`

## Environment Variables

The project uses these keys from `.env.local`:

- `MONGODB_URI`
- `JWT_SECRET`
- `AUTH_ENABLED`
- `APP_DEMO_MODE`
- `RATE_LIMIT_ENABLED`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_AUTH_MAX_REQUESTS`
- `RATE_LIMIT_UPLOAD_MAX_REQUESTS`

### Auth Mode

- Demo mode (no login required): `AUTH_ENABLED=false`
- Real auth mode (login/signup enabled): `AUTH_ENABLED=true`

## Database Setup Notes

If local MongoDB is not running, `npm run db:check` will fail with `ECONNREFUSED`.

### Option A: Local MongoDB (Homebrew on macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Option B: MongoDB Atlas

- Create a free cluster
- Copy your connection string to `MONGODB_URI` in `.env.local`

## Useful Commands

```bash
npm run setup
npm run db:check
npm run dev
npm run verify
```

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

## Storage Note

Uploaded images are stored in `public/uploads` (local disk).
