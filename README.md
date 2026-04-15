# F1 Guess MVP

Mobile-first single-screen prototype for guessing an F1 circuit from onboard engine audio.

## Stack
- Vite
- Vanilla JavaScript
- WaveSurfer.js
- Node CLI for audio extraction

## Run the app
```bash
npm install
npm run dev
```

## Internal Studio
- Open the content workflow at `/studio.html`
- `npm run dev` starts both the local Studio API and the Vite frontend
- Studio workflow:
  1. Paste a source video URL and extract the full onboard audio
  2. Download a track SVG from an open-source URL
  3. Look up OpenF1 sessions, drivers, and laps
  4. Import telemetry for a chosen lap
  5. Save the challenge into `src/data/challenge-library.json`

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
