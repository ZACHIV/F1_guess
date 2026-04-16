# F1 Guess MVP

Mobile-first single-screen prototype for guessing an F1 circuit from onboard engine audio.

## Stack
- Vite
- Vanilla JavaScript
- WaveSurfer.js
- Node CLI for audio extraction

## Run the app
```bash
npm run install:deps
npm run setup:f1db
npm run dev
```

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
npm run test -- --run
```

## Notes
- The app ships with a seeded challenge record and a graceful missing-audio state.
- Max Verstappen image should be stored at `public/assets/max-verstappen.jpg`.
- Challenge library data lives in `src/data/challenge-library.json`.
- Telemetry payloads for runtime playback live in `public/telemetry`.
