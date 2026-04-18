# F1 Guess

A mobile-first F1 audio guessing game.

Players listen to an onboard lap, guess the circuit, and then review the result with a track reveal and timing comparison against Max. The public game is built with Vite + React. The repo also includes a local Studio workflow for preparing challenge data, telemetry, and assets.

## What Is In This Repo

- `src/player/`: the public game UI
- `src/data/challenge-library.json`: challenge records used by the game
- `public/audio`, `public/assets/tracks`, `public/telemetry`: runtime assets
- `server/`: local Studio API plus read-only production-safe routes
- `src/studio.js` and `studio.html`: local content workflow

## Local Development

Install dependencies and run the app:

```bash
npm run install:deps
npm run setup:f1db
npm run dev
```
