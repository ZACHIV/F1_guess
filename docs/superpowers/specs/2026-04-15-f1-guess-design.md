# F1 Engine Guess MVP Design

## Goal
Build a mobile-first single-screen web experience where a user listens to an extracted F1 onboard audio clip, guesses the circuit, and then sees a visual reveal with waveform, circuit outline, and elapsed clip time.

## Product Shape
- One vertically oriented hero card inspired by social short-video layouts.
- Three mandatory visual anchors:
  - audio waveform near the top
  - circuit outline in the lower left
  - elapsed time ring in the lower right
- The center visual uses a Max Verstappen photo instead of an in-car frame.
- The first release is an MVP shell with replaceable local challenge data and a local extraction workflow for future clips.

## User Flow
1. Open the page and see the active challenge card.
2. Press play to hear the clip when an extracted file exists.
3. Pick one circuit from multiple choices.
4. Reveal the answer with a short explanation and highlight the circuit.
5. Move to the next challenge when more clips are added later.

## Content and Data
- Challenge data lives in local JSON-like modules so clips can be swapped without code changes.
- Each challenge stores:
  - challenge id
  - clip title
  - local audio path
  - circuit name
  - circuit SVG path
  - clip duration label
  - descriptive prompt about why the clip is distinctive
  - four answer options
- The initial seed challenge can ship without a real audio file; the UI will explain how to add one.

## Audio Extraction Workflow
- A local Node CLI will accept a video URL, output name, and start/end timestamps.
- The CLI uses `yt-dlp` to download the source media, `ffmpeg` to extract a stereo WAV preview and compressed delivery file, and leaves room for optional vocal suppression later.
- Output clips land in a predictable public asset folder so the frontend can reference them immediately.

## Technical Approach
- Vite + vanilla JavaScript for a fast lightweight frontend.
- Custom CSS with a dark paddock-inspired palette, editorial typography, soft blur layers, and subtle motion.
- Waveform is rendered with WaveSurfer when a clip exists, and falls back to a stylized animated placeholder when no clip is present.
- Simple SVG circuit paths are stored with the challenge data and rendered inline for crisp scaling.

## Error Handling
- Missing audio file: show a clear “clip not loaded yet” state instead of a broken player.
- Missing local tools: CLI prints install guidance for `yt-dlp` or `ffmpeg`.
- Invalid URL or time range: CLI exits with actionable error text.

## Testing
- Unit tests cover the challenge normalization and clip path generation utilities.
- Manual verification covers:
  - mobile layout
  - waveform fallback
  - answer reveal flow
  - CLI dry run and validation errors

## Constraints and Assumptions
- This folder is not a git repository, so the design is saved locally without a commit.
- Max Verstappen imagery should come from a publicly accessible source with attribution-friendly licensing where possible.
- Audio quality depends on the source onboard video; extraction can improve access, not guarantee perfect isolation.
