# F1 Guess MVP

Mobile-first single-screen prototype for guessing an F1 circuit from onboard engine audio.

## Stack
- Vite
- React
- WaveSurfer.js
- Express API for local studio tooling and read-only production routes

## Run the app
```bash
npm run install:deps
npm run setup:f1db
npm run dev
```

## Deploy On Vercel
This repo can be deployed on Vercel for the public game frontend.

Included config:
- [vercel.json](/Users/zz/workspace/claude_made/F1_guess/vercel.json)
- [api/index.mjs](/Users/zz/workspace/claude_made/F1_guess/api/index.mjs)
- [.env.vercel.example](/Users/zz/workspace/claude_made/F1_guess/.env.vercel.example)
- [docs/vercel-deploy.md](/Users/zz/workspace/claude_made/F1_guess/docs/vercel-deploy.md)

What works on Vercel:
- The Vite frontend
- Static challenge playback from `src/data/challenge-library.json`
- Read-only API routes such as `/api/health`, `/api/studio/library`, and OpenF1 lookup routes
- Remote asset URLs for audio, telemetry, SVG, and images

What stays local-only:
- Audio extraction with `yt-dlp` and `ffmpeg`
- Local `f1db` track import
- Telemetry file generation
- Any endpoint that writes back into the repo challenge library

Deploy steps:
1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add the asset storage env vars if your challenge records use remote URLs.
7. Visit `/api/health` after deploy and confirm the runtime reports `vercel`.

Fast follow:
- Use `.env.vercel.example` as the source of truth for production env vars.
- Use [docs/vercel-deploy.md](/Users/zz/workspace/claude_made/F1_guess/docs/vercel-deploy.md) as the deploy checklist.

Recommended Vercel env vars:
```bash
ASSET_STORAGE_BUCKET=...
ASSET_STORAGE_ENDPOINT=...
ASSET_STORAGE_PUBLIC_BASE_URL=...
ASSET_STORAGE_PREFIX=production
ASSET_STORAGE_REGION=auto
ASSET_STORAGE_ACCESS_KEY_ID=...
ASSET_STORAGE_SECRET_ACCESS_KEY=...
ASSET_STORAGE_FORCE_PATH_STYLE=false
```

After deploy:
- Visit `/api/health` to confirm the serverless function is live.
- Keep using local Studio for ingestion and content generation.
- Commit updated `src/data/challenge-library.json` when you add or edit challenges locally.

`npm run install:deps` installs:
- system tools: `ffmpeg`, `ffprobe`, `yt-dlp`
- npm packages from `package.json`

If your system `yt-dlp` package is broken, the installer downloads a local fallback binary to `.tools/bin/yt-dlp`, and the API prefers that copy automatically.

## Internal Studio
- Open the content workflow at `/studio.html`
- `npm run dev` starts both the local Studio API and the Vite frontend
- Put the full `f1db` repository at `submodule/f1db`
- If `submodule/f1db` is missing, run `npm run setup:f1db`
- Studio workflow:
  1. Paste a source video URL, auto-parse title/description into qualifying metadata, then extract the full onboard audio
  2. Generate a ready-to-copy LLM prompt, paste the model's JSON reply back into Studio, and apply the reviewed metadata
  3. Manage the local challenge library with category, status, tags, search, sorting, duplication, reordering, and deletion
  4. Import a track SVG from the local `submodule/f1db` circuit library
  5. Look up OpenF1 sessions, drivers, and laps
  6. Import telemetry for a chosen lap
  7. Save the challenge into `src/data/challenge-library.json`

## Remote Asset Storage
The Studio workflow can mirror generated assets to S3-compatible object storage instead of serving only local `public/` files.

Supported targets:
- Cloudflare R2
- AWS S3
- MinIO
- Any S3-compatible gateway

Set these env vars before starting `npm run dev` or your deployed API:

```bash
ASSET_STORAGE_BUCKET=f1-guess-assets
ASSET_STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
ASSET_STORAGE_PUBLIC_BASE_URL=https://cdn.example.com/f1-guess
ASSET_STORAGE_PREFIX=production
ASSET_STORAGE_REGION=auto
ASSET_STORAGE_ACCESS_KEY_ID=...
ASSET_STORAGE_SECRET_ACCESS_KEY=...
ASSET_STORAGE_FORCE_PATH_STYLE=false
```

Notes:
- If the storage env vars are missing, the app keeps using local `public/` URLs.
- `ASSET_STORAGE_PUBLIC_BASE_URL` should be the final public CDN origin users load from.
- Generated audio, telemetry JSON, and track SVGs are still written locally, then uploaded when remote storage is enabled.
- Your bucket/CDN must allow browser `GET` requests for audio, SVG, and JSON assets.
- Remote telemetry fetches require CORS to allow your frontend origin.

To refresh the local mirror on another machine:
```bash
node scripts/setup-f1db.mjs --refresh
```

## Add a real clip
1. Install local tools:
   ```bash
   brew install ffmpeg yt-dlp
   ```
2. Extract audio from a video URL:
   ```bash
   node scripts/extract-audio.mjs \
     --url "https://example.com/video" \
     --slug "suzuka-sector-1" \
     --start 00:04:12 \
     --end 00:04:28
   ```
3. Keep the generated file paths:
   - `public/audio/suzuka-sector-1.wav`
   - `public/audio/suzuka-sector-1.mp3`
4. Or use `/studio.html` to generate the full challenge record and telemetry asset paths.

## Test
```bash
npm test
```

## Notes
- The app ships with a seeded challenge record and a graceful missing-audio state.
- Max Verstappen image should be stored at `public/assets/max-verstappen.jpg`.
- Challenge library data lives in `src/data/challenge-library.json`.
- Telemetry payloads for runtime playback live in `public/telemetry`.
- In production, challenge records can now store absolute CDN URLs for `audioSrc`, `trackSvgSrc`, `telemetryLocationSrc`, and `telemetryCarDataSrc`.
