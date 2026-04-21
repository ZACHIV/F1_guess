# Archive Browsing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the standalone archive page into a complete, polished browsing experience with full catalog coverage, inline next/previous navigation, extracted metadata, refined motion, and mobile-friendly detail layouts.

**Architecture:** Keep the archive page isolated behind `archive.html`, move descriptive metadata into a dedicated archive data module, drive browsing through selection index helpers in `ArchiveApp`, and use archive-specific CSS transitions to preserve the editorial language across desktop and mobile.

**Tech Stack:** React 19, Vite, Vitest, Testing Library, CSS

---

### Task 1: Lock browsing-loop behavior with tests

**Files:**
- Modify: `tests/archive-app.test.jsx`
- Modify: `src/archive/ArchiveApp.jsx`

- [ ] **Step 1: Add failing tests for full-catalog browsing controls**
- [ ] **Step 2: Run `npm test -- --run tests/archive-app.test.jsx` and confirm the new behaviors fail**
- [ ] **Step 3: Implement minimal next/previous and keyboard navigation**
- [ ] **Step 4: Re-run the archive tests until they pass**

### Task 2: Extract archive metadata into a dedicated data layer

**Files:**
- Create: `src/archive/archive-metadata.js`
- Modify: `src/archive/ArchiveApp.jsx`

- [ ] **Step 1: Move archive-specific metadata and normalization out of the component**
- [ ] **Step 2: Rebuild the track list from `challenge-library.json` + archive metadata**
- [ ] **Step 3: Verify the archive page still exposes the full 24-track set**

### Task 3: Polish transitions and mobile layout

**Files:**
- Modify: `src/archive/ArchiveApp.jsx`
- Modify: `src/archive/archive.css`

- [ ] **Step 1: Add restrained motion for entering, leaving, and browsing detail mode**
- [ ] **Step 2: Add visible previous/next controls and a subtle position indicator**
- [ ] **Step 3: Rework the detail layout for smaller screens so content remains readable and tappable**
- [ ] **Step 4: Manually sanity-check rendered behavior in local browser output**

### Task 4: Verify archive isolation and completeness

**Files:**
- Modify: `tests/archive-app.test.jsx`
- Modify: `src/archive/ArchiveApp.jsx`
- Modify: `src/archive/archive.css`

- [ ] **Step 1: Run `npm test -- --run tests/archive-app.test.jsx`**
- [ ] **Step 2: Run `npm run build`**
- [ ] **Step 3: Run `npm test -- --run` and record unrelated failures separately if any remain**
