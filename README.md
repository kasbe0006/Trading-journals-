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

### Default Login (Auto-created)

When `AUTH_ENABLED=true` and `DEFAULT_ADMIN_ENABLED=true`, the app auto-creates a default admin user on first DB connection:

- Username: `prathamesh kasbe`
- Email: `prathamesh@local.dev`
- Password: `Unnatikasbe06`

You can sign in using **username or email**.

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

## Hosting (Vercel + MongoDB Atlas)

1. Push code to GitHub (already done).
2. Create MongoDB Atlas cluster and copy connection string.
3. In Vercel, import your GitHub repo and set env vars:

- `MONGODB_URI` (Atlas URI)
- `JWT_SECRET` (strong random string)
- `AUTH_ENABLED=true`
- `DEFAULT_ADMIN_ENABLED=true`
- `DEFAULT_ADMIN_USERNAME=prathamesh kasbe`
- `DEFAULT_ADMIN_EMAIL=prathamesh@local.dev`
- `DEFAULT_ADMIN_PASSWORD=Unnatikasbe06`

4. Deploy and open your site.

After first successful login, update `DEFAULT_ADMIN_PASSWORD` to a new strong password.

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
