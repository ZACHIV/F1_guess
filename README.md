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
4. Update `src/data/challenges.js` if you want to rename the clip or add more rounds.

## Test
```bash
npm run test -- --run
```

## Notes
- The app ships with a seeded challenge record and a graceful missing-audio state.
- Max Verstappen image should be stored at `public/assets/max-verstappen.jpg`.
