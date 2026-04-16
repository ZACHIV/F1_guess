# F1 Immersive Player Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the player-facing F1 Guess page as a mobile-first immersive poster experience using React and Tailwind while preserving synced waveform, track trace, timer ring, and answer modes.

**Architecture:** Keep the existing Vite app and backend/data contract, but replace the player page entrypoint with a React tree composed of focused UI/HUD components. Reuse the telemetry and challenge utility modules, add a small React-specific state layer for playback and answer modes, and leave the Studio tooling on the current vanilla JS path.

**Tech Stack:** Vite, React, Tailwind CSS, existing WaveSurfer integration, Vitest

---

### Task 1: Add the React and Tailwind foundation

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `src/main.js`
- Create: `src/player/App.jsx`
- Create: `src/player/index.css`

- [ ] **Step 1: Add a failing build expectation**

Document expected command:

```bash
npm run build
```

Expected: FAIL because React/Tailwind entry files do not exist yet.

- [ ] **Step 2: Add the React/Tailwind dependencies and config**

Create the Tailwind/PostCSS config and update `package.json` dependencies/devDependencies to include React, React DOM, Tailwind CSS, and the Vite React plugin.

- [ ] **Step 3: Replace the player entrypoint with a minimal React mount**

Mount a placeholder `<App />` from `src/main.js` and import the new Tailwind-driven stylesheet.

- [ ] **Step 4: Run the build again**

Run:

```bash
npm run build
```

Expected: PASS with a bundled React app.

### Task 2: Lock answer-mode and matching behavior with tests

**Files:**
- Create: `tests/player-answers.test.js`
- Create: `src/player/answer-utils.js`

- [ ] **Step 1: Write failing tests for player answer matching**

Cover:
- debug mode uses multiple-choice metadata
- formal mode accepts circuit name
- formal mode accepts country
- formal mode accepts configured aliases/abbreviations

- [ ] **Step 2: Run the focused test file**

Run:

```bash
npm test -- tests/player-answers.test.js
```

Expected: FAIL because `src/player/answer-utils.js` does not exist yet.

- [ ] **Step 3: Implement the minimal answer utility**

Add a small matcher that normalizes user input and checks against challenge-provided names, countries, and aliases.

- [ ] **Step 4: Re-run the focused test file**

Run:

```bash
npm test -- tests/player-answers.test.js
```

Expected: PASS.

### Task 3: Build the immersive poster shell and HUD components

**Files:**
- Create: `src/player/App.jsx`
- Create: `src/player/components/PosterStage.jsx`
- Create: `src/player/components/WaveformHUD.jsx`
- Create: `src/player/components/TrackHUD.jsx`
- Create: `src/player/components/TimerRing.jsx`
- Create: `src/player/components/AnswerDock.jsx`
- Create: `src/player/components/TelemetryStrip.jsx`
- Modify: `src/lib/waveform.js`
- Modify: `src/lib/challenge-utils.js`
- Modify: `src/data/challenge-library.json` (only if aliases/mode metadata are needed)

- [ ] **Step 1: Write a failing smoke test for the React player shell**

Cover:
- challenge title renders
- waveform area renders
- track HUD renders
- timer ring renders
- answer dock renders in the default mode

- [ ] **Step 2: Run the focused smoke test**

Run:

```bash
npm test -- tests/player-app.test.js
```

Expected: FAIL because the React player shell is not implemented yet.

- [ ] **Step 3: Implement the player shell and focused components**

Build the mobile-first layered poster layout, reusing existing library/telemetry utilities and passing only the data each component needs.

- [ ] **Step 4: Re-run the focused smoke test**

Run:

```bash
npm test -- tests/player-app.test.js
```

Expected: PASS.

### Task 4: Reconnect playback, telemetry sync, and reveal flow

**Files:**
- Modify: `src/player/App.jsx`
- Modify: `src/player/components/WaveformHUD.jsx`
- Modify: `src/player/components/TrackHUD.jsx`
- Modify: `src/player/components/TimerRing.jsx`
- Modify: `src/player/components/AnswerDock.jsx`
- Modify: `src/lib/challenge-assets.js`

- [ ] **Step 1: Write a failing interaction test for playback-driven UI updates**

Cover:
- play/pause changes player state
- elapsed timer updates
- telemetry marker position updates when playback time changes
- reveal/feedback state appears after an answer submission

- [ ] **Step 2: Run the focused interaction test**

Run:

```bash
npm test -- tests/player-interactions.test.js
```

Expected: FAIL because playback state wiring is incomplete.

- [ ] **Step 3: Implement the minimal state wiring**

Reconnect WaveSurfer events to React state, sync the timer/marker, and show lightweight answer feedback without overpowering the poster UI.

- [ ] **Step 4: Re-run the focused interaction test**

Run:

```bash
npm test -- tests/player-interactions.test.js
```

Expected: PASS.

### Task 5: Verify the full experience

**Files:**
- Modify as needed: touched files above

- [ ] **Step 1: Run the full automated test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual verification**

Run:

```bash
npm run dev:web
```

Verify on a narrow/mobile viewport:
- poster layout reads as a single immersive screen
- waveform/track/timer are visible at first glance
- play/pause works
- debug mode shows multiple choice
- formal mode supports text input and fuzzy matching
