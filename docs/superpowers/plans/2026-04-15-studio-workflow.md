# Studio Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal Studio web workflow that turns source URL ingestion, track vector import, telemetry import, and challenge drafting into one local tool page.

**Architecture:** Add a lightweight Node API for local-only operations that shell out to `yt-dlp` and `ffmpeg`, fetch OpenF1 data, and update a JSON challenge library. Pair it with a separate Vite Studio page that orchestrates the workflow and previews the generated draft state.

**Tech Stack:** Vite, vanilla JavaScript, CSS, Node.js, Express, Vitest

---

### Task 1: Add reusable workflow helpers

**Files:**
- Create: `server/lib/extract-workflow.mjs`
- Create: `server/lib/challenge-library.mjs`
- Test: `tests/extract-workflow.test.js`
- Test: `tests/challenge-library.test.js`

- [ ] Step 1: Write failing tests for command generation and challenge upsert behavior.
- [ ] Step 2: Run the tests and confirm the failures are correct.
- [ ] Step 3: Implement the helper modules with minimal behavior.
- [ ] Step 4: Re-run the targeted tests until they pass.

### Task 2: Add the local Studio API

**Files:**
- Create: `server/index.mjs`
- Create: `server/lib/openf1.mjs`
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] Step 1: Add API endpoints for extraction, track SVG download, OpenF1 lookup/import, and challenge save.
- [ ] Step 2: Add package scripts and dev dependencies for the local API workflow.
- [ ] Step 3: Proxy `/api` during Vite development.
- [ ] Step 4: Verify the server starts and the endpoints return JSON.

### Task 3: Create the Studio page

**Files:**
- Create: `studio.html`
- Create: `src/studio.js`
- Create: `src/studio.css`

- [ ] Step 1: Build the internal workflow layout and action forms.
- [ ] Step 2: Wire the forms to the local API and render status/output cards.
- [ ] Step 3: Add a draft preview panel and clear progress messaging.
- [ ] Step 4: Check desktop and mobile layouts for usability.

### Task 4: Move challenge data to a writable library

**Files:**
- Create: `src/data/challenge-library.json`
- Modify: `src/data/challenges.js`
- Modify: `README.md`

- [ ] Step 1: Move the current challenge into the library file.
- [ ] Step 2: Point the app data layer at the shared library.
- [ ] Step 3: Document the Studio workflow and run commands.
- [ ] Step 4: Verify the existing front-end still builds.
