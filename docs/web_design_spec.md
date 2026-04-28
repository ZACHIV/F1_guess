# Sound Circuit Web Design Specification

This document translates the reference UI in `generated_images/image_20260428_105918.png` into a practical web design system. Use it to generate pages that match the same dark, high-speed Formula-style dashboard aesthetic.

## 1. Visual Direction

The interface should feel like a premium motorsport telemetry product: black glass panels, red neon accents, precision grids, compact typography, and glowing audio/track visualization. The product mood is fast, technical, tense, and polished.

Primary design keywords:

- Motorsport dashboard
- Night race cockpit
- Audio waveform analysis
- Red neon precision
- Carbon fiber texture
- Compact telemetry UI

Avoid friendly SaaS styling, pastel palettes, oversized rounded cards, soft gradients, or playful illustration. The UI should feel engineered and sharp.

## 2. Page Composition

### Desktop Layout

Use a full-screen dark dashboard layout with dense information zones.

- Page background: near-black with subtle diagonal carbon-fiber texture.
- Main content width: `min(100vw, 1440px)` centered.
- Outer page padding: `24px` desktop, `16px` tablet, `12px` mobile.
- Core desktop shell:
  - Left brand/hero area or sidebar: `280-320px`.
  - Main interactive dashboard: flexible center area.
  - Secondary preview/mobile panels may sit to the right in design showcase contexts.
- Primary panel radius: `8px`.
- Nested component radius: `4-6px`.
- Use thin borders and faint grid lines to separate zones.

Recommended desktop dashboard grid:

```css
.dashboard {
  display: grid;
  grid-template-columns: 300px minmax(640px, 1fr);
  gap: 18px;
  min-height: 100vh;
}
```

### Mobile Layout

Mobile screens should look like a compact racing app, not a simplified marketing page.

- Viewport simulation width: `390px` when mocked, but actual web layout must be responsive.
- Use one-column content.
- Header height: `44-56px`.
- Bottom navigation height: `64-76px`.
- Main action button should be fixed near the lower interaction area, above bottom navigation where applicable.
- Keep cards compact and avoid tall empty sections.

## 3. Color System

### Core Palette

| Token | Hex | Usage |
| --- | --- | --- |
| `--color-bg` | `#000D0F` | Main page background |
| `--color-surface` | `#0A1115` | Primary panels |
| `--color-surface-raised` | `#111A1D` | Cards, inputs, selected controls |
| `--color-surface-deep` | `#05090B` | App frame, deepest areas |
| `--color-border` | `#273137` | Default panel borders |
| `--color-border-soft` | `#1A2328` | Subtle separators |
| `--color-text` | `#F7F8F8` | Primary text |
| `--color-text-muted` | `#B0B8B8` | Secondary text |
| `--color-text-dim` | `#6F797D` | Metadata, disabled text |
| `--color-red` | `#FF3330` | Primary action and active states |
| `--color-red-deep` | `#E10600` | F1-style brand red |
| `--color-red-dark` | `#8C100D` | Danger/pressed red |
| `--color-green` | `#00FF9C` | Correct, success, active telemetry |
| `--color-yellow` | `#FFB830` | Warning, trophies, medium state |
| `--color-blue` | `#4CA8FF` | Rain, cool metadata only |

### Background Treatment

Use layered backgrounds:

```css
body {
  background:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
    repeating-linear-gradient(
      135deg,
      rgba(255,255,255,0.025) 0,
      rgba(255,255,255,0.025) 1px,
      transparent 1px,
      transparent 8px
    ),
    #000d0f;
  background-size: 32px 32px, 32px 32px, 12px 12px, auto;
}
```

Panels may add a subtle top-left highlight:

```css
.panel {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.01)),
    rgba(10,17,21,0.92);
  border: 1px solid rgba(176,184,184,0.18);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.02) inset,
    0 18px 48px rgba(0,0,0,0.45);
}
```

## 4. Typography

The reference uses a condensed motorsport type language. Use a strong condensed display font for headings and a readable UI font for body text.

Recommended stack:

```css
--font-display: "Squadra One", "Rajdhani", "Arial Narrow", sans-serif;
--font-ui: "DIN Next Condensed", "Rajdhani", "Inter", system-ui, sans-serif;
--font-mono: "Roboto Mono", "SFMono-Regular", monospace;
```

If `Squadra One` is unavailable, use `Rajdhani` with uppercase text and heavier weights.

### Type Scale

| Role | Size | Weight | Style |
| --- | ---: | ---: | --- |
| Brand/logo text | `40-56px` | `700-900` | Uppercase, italic or skewed |
| Page title | `20-24px` | `600` | Uppercase |
| Section header | `13-16px` | `600` | Uppercase |
| Tab/nav item | `11-13px` | `600` | Uppercase |
| Body | `14-16px` | `400` | Normal |
| Small metadata | `10-12px` | `500` | Uppercase or numeric |
| Telemetry number | `32-64px` | `700` | Condensed, mono/technical |

Rules:

- Use uppercase for labels, tabs, section titles, buttons, and metadata.
- Keep letter spacing between `0.02em` and `0.08em`.
- Do not use negative letter spacing.
- Numeric telemetry should be large, condensed, and bright.
- Body text should be muted, short, and functional.

## 5. Iconography

Use thin-line icons with technical precision.

- Stroke width: `1.5-2px`.
- Size: `16px`, `20px`, or `24px`.
- Default color: `#B0B8B8`.
- Active icon color: `#FF3330`.
- Success icon color: `#00FF9C`.
- Icon buttons should be square, `32-40px`, with subtle border and dark fill.
- Use familiar symbols for play, pause, volume, settings, timer, target, lightning, flag, map pin, trophy, and headphones.

## 6. Spacing, Shape, and Borders

Use tight, repeatable spacing.

| Token | Value |
| --- | ---: |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |

Shape rules:

- Primary panels: `8px` radius.
- Buttons and inputs: `4-6px` radius.
- Mobile device frames: `24-32px` radius.
- Circular controls only for media buttons, progress rings, and knobs.
- Borders are thin and low-contrast: `1px solid rgba(176,184,184,0.16)`.

## 7. Header and Navigation

### Desktop Header

The dashboard header should include:

- Compact red logo at left.
- Horizontal nav: `PLAY`, `PRACTICE`, `CHALLENGES`, `STATS`, `SETTINGS`.
- Active nav item uses red underline and white text.
- Utility icons at right: volume, dark mode, settings.

Style:

```css
.top-nav {
  height: 56px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(176,184,184,0.16);
}

.nav-link.active {
  color: #f7f8f8;
  border-bottom: 2px solid #ff3330;
}
```

### Mobile Bottom Navigation

Bottom tabs:

- Play
- Practice
- Challenges
- Stats
- Settings

Use icon above label. Active tab is red. Inactive tabs are muted gray.

## 8. Buttons

### Primary Button

Use for main actions like `SUBMIT ANSWER`, `NEXT ROUND`, `USE HINT`.

```css
.button-primary {
  height: 44px;
  padding: 0 22px;
  border-radius: 5px;
  border: 1px solid rgba(255,80,76,0.65);
  background: linear-gradient(180deg, #ff3330 0%, #e10600 100%);
  color: #fff;
  font-family: var(--font-ui);
  font-weight: 700;
  text-transform: uppercase;
  box-shadow:
    0 0 18px rgba(255,51,48,0.35),
    inset 0 1px 0 rgba(255,255,255,0.25);
}
```

States:

- Hover: brighter red glow, slight upward contrast.
- Pressed: `#8C100D`, reduced glow.
- Disabled: dark gray background, muted text, no glow.

### Secondary Button

Dark fill, thin gray border, white text.

### Ghost Button

Transparent fill, gray border, muted text. Hover should reveal a soft dark fill.

### Danger Button

Deep red background with trash/delete icon when relevant.

## 9. Inputs and Selects

Inputs should be compact and technical.

- Height: `36-40px`.
- Background: `#0A1115`.
- Border: `1px solid #273137`.
- Radius: `4px`.
- Placeholder: `#6F797D`.
- Focus: red border and subtle red glow.

Search input includes a right-aligned magnifier icon.

Select inputs include a compact chevron and no native browser styling where practical.

## 10. Chips and Tags

Use chips for difficulty, year, mode, weather, and session filters.

- Height: `28-32px`.
- Radius: `6px`.
- Text: uppercase, `11-12px`.
- Border-only by default.

Recommended chip styles:

- Easy: green border/text.
- Medium: yellow border/text.
- Hard: red border/text.
- Rain: blue text/border.
- Night: gray text/border.
- Selected chip: filled dark surface with stronger colored border.

## 11. Audio Player Components

Audio is a primary visual language in the UI.

### Waveform

Use red waveform for active audio and gray waveform for inactive/paused audio.

- Active waveform color: `#FF3330`.
- Secondary waveform color: `rgba(255,51,48,0.45)`.
- Paused waveform: `rgba(176,184,184,0.35)`.
- Waveform area should sit on a dark grid.
- Add a faint red glow around peaks.

### Main Play Control

- Circular button: `64px` desktop, `56px` mobile.
- Border: `2px solid #FF3330`.
- Fill: near-black.
- Icon: white play triangle.
- Glow: `0 0 24px rgba(255,51,48,0.45)`.

### Timeline

- Track height: `3-4px`.
- Filled part: red.
- Unfilled part: muted gray.
- Thumb: red circular dot `10-12px`.
- Time labels: small mono or condensed text.

### Skip Controls

Use small circular `15s` back/forward controls around the main play button.

## 12. Track Map Style

Track maps are neon outlines on a dark technical grid.

Visual rules:

- Stroke color: `#FF3330`.
- Stroke width: `2-4px`.
- Add outer glow and inner white-hot highlight.
- Map should sit centered inside a dark bordered panel.
- Use a faint duplicate outline or offset shadow for depth.

CSS effect:

```css
.track-map {
  filter:
    drop-shadow(0 0 4px rgba(255,51,48,0.9))
    drop-shadow(0 0 14px rgba(255,51,48,0.65));
}
```

Metadata below a track card should include:

- Track name
- Country flag
- Track length
- Turns
- Weather/time icon

## 13. Cards and Panels

### Track Card

Contains neon track map, title, country, stats, and small status icon.

- Card size: about `220x180px` desktop.
- Use image/grid background.
- Bottom metadata row separated by a top border.

### Hint Card

Dark panel with concise clue text and a secondary or primary button.

### Stats Card

Rows with icon, label, and value:

- Correct
- Hints used
- Accuracy

Success rows use green icon accents.

### Info Card

Use a dark photographic background with overlay gradient. Text must remain legible.

```css
.info-card {
  background:
    linear-gradient(90deg, rgba(5,9,11,0.9), rgba(5,9,11,0.45)),
    url(...);
}
```

## 14. Answer Choices

Answer rows are compact selectable controls.

Default:

- Dark fill.
- Thin gray border.
- White/muted text.
- Left icon: track/map pin.

Selected:

- Red fill or red border.
- Red right-side arrow capsule.
- Stronger glow.

Correct:

- Green border/fill tint.
- Check icon on right.

Incorrect:

- Red border/fill tint.
- X icon on right.

Disabled:

- Dark muted fill.
- Text at `#4F585C`.
- No hover effect.

## 15. Progress and Telemetry

### Linear Progress

- Height: `4px`.
- Red filled segments.
- Muted gray remainder.
- Use segmented blocks for round progress.

### Stepper

- Small connected circles.
- Current step: white circle with dark number.
- Completed: red or white outline.
- Future: gray outline.

### Circular Progress

- Use red arc on dark track.
- Center text large and white.
- Example: `60%`.

### Countdown

- Circular dial with red hazard ticks.
- Large number in center.
- Use radial marks around the circle.

### Speedometer

Use a semi-circular gauge:

- Red arc.
- White tick labels.
- Large speed number.
- Unit below, e.g. `KM/H`.

## 16. Mobile Screen Patterns

### Listen Screen

Structure:

- Top status/header.
- Round label and segmented progress.
- Prompt: `Listen to the engine`.
- Large red waveform.
- Timeline and time labels.
- Play button centered.
- Volume slider near bottom.

### Guess Screen

Structure:

- Round label and progress.
- Prompt: `Guess the circuit`.
- Neon track outline.
- Stat row: length, turns, flag.
- Primary submit button fixed near lower area.

### Multiple Choice Screen

Structure:

- Prompt: `Choose your answer`.
- Stacked answer rows.
- Selected row red with arrow.
- Keep answer text left-aligned.

### Correct Result Screen

Structure:

- Green check icon and `CORRECT!`.
- Circuit name and subtitle.
- Track image.
- Stat row.
- Primary `NEXT ROUND` button.

## 17. Imagery

Use real or realistic racing imagery:

- F1-style car hero image with red motion trails.
- Track photos for circuit reveal cards.
- Pit lane, grandstand, asphalt texture, carbon fiber texture.

Treatment:

- Keep images dark and contrasty.
- Apply black-to-transparent gradients to preserve text readability.
- Add red motion streaks sparingly.
- Avoid generic stock imagery that does not show racing, circuits, cockpit, or track surfaces.

## 18. Effects and Motion

Use subtle, performance-friendly effects.

Recommended:

- Red glow on active controls and neon track maps.
- Waveform pulse while audio plays.
- Button hover glow.
- Progress fill animation.
- Correct state quick green flash.
- Incorrect state brief red shake, limited to selected row.

Durations:

- Hover/focus: `120-180ms`.
- Page/card entrance: `180-260ms`.
- Correct/incorrect feedback: `250-400ms`.

Easing:

```css
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);
```

Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 19. Accessibility

- Maintain at least `4.5:1` contrast for body text.
- Do not rely on color alone for answer states; include check, x, or arrow icons.
- Provide visible focus rings using red or white outlines.
- Keep touch targets at least `44x44px` on mobile.
- Buttons must have clear accessible names.
- Waveforms and maps need text alternatives where they communicate essential content.

## 20. Implementation Starter Tokens

```css
:root {
  --color-bg: #000d0f;
  --color-surface: #0a1115;
  --color-surface-raised: #111a1d;
  --color-surface-deep: #05090b;
  --color-border: #273137;
  --color-border-soft: #1a2328;
  --color-text: #f7f8f8;
  --color-text-muted: #b0b8b8;
  --color-text-dim: #6f797d;
  --color-red: #ff3330;
  --color-red-deep: #e10600;
  --color-red-dark: #8c100d;
  --color-green: #00ff9c;
  --color-yellow: #ffb830;
  --color-blue: #4ca8ff;

  --font-display: "Squadra One", "Rajdhani", "Arial Narrow", sans-serif;
  --font-ui: "DIN Next Condensed", "Rajdhani", "Inter", system-ui, sans-serif;
  --font-mono: "Roboto Mono", "SFMono-Regular", monospace;

  --radius-panel: 8px;
  --radius-control: 5px;
  --shadow-panel: 0 18px 48px rgba(0,0,0,0.45);
  --shadow-red-glow: 0 0 22px rgba(255,51,48,0.45);
}
```

## 21. Quality Checklist

Before considering a generated page complete, verify:

- The first viewport immediately communicates a dark motorsport audio quiz product.
- Red is used as the dominant accent, not as a full-page background.
- Panels have subtle borders, grid texture, and controlled glow.
- The page includes waveform, play control, track map, answer states, and telemetry-style stats where relevant.
- Typography is condensed, uppercase for controls, and compact.
- Mobile layout preserves the same visual language with a bottom navigation pattern.
- Text never overlaps controls or images.
- Success and error states use icon plus color.
- Buttons, sliders, chips, cards, and progress indicators match the token system.
