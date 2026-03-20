# Trading Journal Mobile (Android)

Expo React Native app connected to the same backend used by the website.

## Cloud APK + GitHub Release (recommended)

This repository includes workflow:

- `.github/workflows/android-apk-release.yml`

It builds an APK on Expo EAS cloud and uploads it to GitHub Releases.

### Required GitHub Secrets

Set these in: `GitHub repo → Settings → Secrets and variables → Actions`

- `EXPO_TOKEN`: your Expo access token
- `EXPO_PUBLIC_API_BASE_URL`: your live website URL (example: `https://your-vercel-domain.vercel.app`)

### Trigger release build

Tag-based automatic release:

```bash
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```

Or run manually from GitHub Actions tab using `workflow_dispatch`.

After completion, APK is attached in GitHub Releases.

### If release has no APK file

Check these first in GitHub Actions:

1. `EXPO_TOKEN` secret is set
2. `EXPO_PUBLIC_API_BASE_URL` secret is set to your live web URL
3. Workflow run for your tag is green (not failed)

If needed, push a new tag to trigger a clean release run:

```bash
git tag mobile-v1.0.1
git push origin mobile-v1.0.1
```

## 1) Configure API URL

Create `.env` from the example and point it to your deployed website URL:

```bash
cp .env.example .env
```

Set:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-vercel-domain.vercel.app
```

For Android emulator with local backend, use:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

## 2) Run app

```bash
npm install
npm run android
```

## 3) Authentication

The app signs in via:

- `POST /api/auth/login` (returns token)

Then uses token in `Authorization: Bearer <token>` for:

- `GET /api/auth/me`
- `GET /api/trades`
- `POST /api/trades`

This keeps website and mobile app data fully synced.

## Auth + website data sync

- Login endpoint: `POST /api/auth/login`
- Mobile stores JWT securely via `expo-secure-store`
- API calls pass `Authorization: Bearer <token>`
- Trades are read/written through the same backend routes as web

So mobile and website share one user session model and one data source.
