# Vercel Deploy Checklist

## Best Fit
- Use Vercel for the public player experience.
- Keep local Studio workflows on your machine.
- Treat `/api/studio/extract` and repo-writing flows as local-only.

## Before You Deploy
1. Make sure the challenge library points at assets that will exist in production.
2. If records use local `public/` paths, confirm those files are committed.
3. If records use remote CDN URLs, add the asset storage env vars from `.env.vercel.example`.

## Vercel Project Settings
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root

The repository already includes [vercel.json](/Users/zz/workspace/claude_made/F1_guess/vercel.json), which rewrites `/api/*` to the Node handler in [api/index.mjs](/Users/zz/workspace/claude_made/F1_guess/api/index.mjs).

## Environment Variables
Add these only if you serve audio, SVG, or telemetry from object storage:

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

## Post-Deploy Checks
1. Open `/api/health` and confirm `runtime` reports `vercel`.
2. Open the homepage and start a duel.
3. Confirm one round loads audio, waveform, and timer correctly.
4. If using remote assets, verify the browser can fetch audio, SVG, and telemetry JSON without CORS errors.

## What Not To Expect On Vercel
- No local audio extraction with `yt-dlp` or `ffmpeg`
- No local `f1db` import flow
- No repo writes back into `src/data/challenge-library.json`
