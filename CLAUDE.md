# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-first F1 audio guessing game. Players listen to an onboard lap clip, identify the circuit by engine note/braking rhythm/corner cadence, and get scored against a Verstappen benchmark time. Built with Vite + React (player) and an Express API server (Studio content workflow). Deployed to Vercel.

## Commands

```bash
npm run dev              # Start both Vite dev server + API server concurrently
npm run dev:web          # Vite dev server only (port 4173, proxies /api to 8787)
npm run dev:api          # Express API server only (port 8787)
npm run build            # Production build (outputs to dist/)
npm run preview          # Preview production build
npm run test             # Run all vitest tests
npx vitest tests/some-file.test.js  # Run a single test file
npm run install:deps     # Install system dependencies (ffmpeg, yt-dlp, etc.)
npm run setup:f1db       # Set up f1db track database
npm run build:archive-audio  # Build archive audio manifest
```

## Architecture

### Multi-page SPA

Vite builds four separate HTML entry points, each with its own JS bundle:

| Entry | HTML | JS Entry | Purpose |
|-------|------|----------|---------|
| Main (gallery) | `index.html` | `src/archive/main.jsx` | Immersive circuit gallery / app shell |
| Game | `guess.html` | `src/main.jsx` | The core guessing game (`src/player/App.jsx`) |
| Archive (legacy) | `archive.html` | `src/archive/main.jsx` | Legacy archive browser |
| Studio | `studio.html` | `src/studio.js` | Local content authoring workflow |
| Turn 1 test | `turn1.html` | `src/turn1/main.jsx` | Turn 1 crop editor desk test |

### Player Game (`src/player/`)

The core game loop is a state machine in `src/player/App.jsx`:
- **`idle`** → player sees poster stage, can start
- **`live`** → audio playing, clock ticking, player can submit guess or surrender
- **`result`** → round over, shows `ResultReviewPage` with track reveal + timing

Key player sub-modules:
- `game-config.js` — duel pool, benchmark times, MAX_GUESS_MS (60s)
- `answer-utils.js` — locale-aware answer matching (accepts track name, country, Chinese variants, aliases)
- `i18n.js` / `track-locales.js` — 8-language support (en, zh-Hans, zh-Hant, fr, es, it, ja, de, ko)
- `result-copy.js` — randomized localized result narratives per outcome
- `sync-utils.js` — synchronizes elapsed time between audio and telemetry
- `anthem.js` — plays Dutch anthem on loss/timeout/forfeit (mutable)

Telemetry pipeline: raw OpenF1 JSON → `telemetry-utils.js` (normalization + interpolation) → SVG track trace + HUD display.

### Studio (`src/studio.js` + `server/`)

Local-only content authoring tool. The Express server (`server/index.mjs`) provides:
- Challenge library CRUD (`/api/studio/challenges`, `/api/studio/library`)
- Audio extraction from YouTube (`/api/studio/extract`) via yt-dlp + ffmpeg
- Telemetry import from OpenF1 (`/api/studio/openf1/import`)
- Local f1db track SVG import (`/api/studio/tracks/import-local`)
- Video metadata parsing from YouTube titles

The server runs locally only (port 8787). On Vercel, only the read-only `/api/studio/library` endpoint works — write endpoints are gated by `requireLocalStudio()`.

### Data Flow

1. `src/data/challenge-library.json` — canonical challenge records (id, audioSrc, trackSvgSrc, telemetryLocationSrc, telemetryCarDataSrc, trackName, trackCountry, etc.)
2. `public/telemetry/*.json` — raw OpenF1 location + car_data arrays
3. `public/audio/*.mp3` — extracted onboard audio clips

The game loads challenges from the library, fetches telemetry JSON, normalizes them into usable frames, and drives the visualization in real-time during playback.

### Asset Storage

`server/lib/asset-storage.mjs` supports optional S3-compatible object storage (configured via env vars in `.env.vercel.example`) with local filesystem fallback. In production on Vercel, assets can be served from S3.

### Styling

Tailwind CSS v4 with PostCSS. Custom CSS lives in `src/player/index.css` and `src/styles.css`. Fonts: Chakra Petch + Manrope from Google Fonts.

### Testing

Vitest with jsdom and @testing-library/react. Tests live in `tests/` covering: player app, components, answer matching, i18n, telemetry utils, Studio state, challenge library CRUD, archive, and Turn 1 crop editor.
