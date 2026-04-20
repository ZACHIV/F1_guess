# F1 Archive Gallery Design

## Goal

Create a standalone editorial-style web page that closely matches the supplied reference composition:

- oversized white space
- tiny publication chrome in the top corners
- a perspective gallery centered low on the page
- slow continuous leftward motion by default
- direct manipulation through drag / swipe

## Content Direction

Replace the original photo gallery with F1 circuit posters built from existing repository SVG track assets. Each card should feel like a printed archive sheet rather than a racing dashboard.

## Implementation Shape

- add a separate Vite HTML entry so the page is independent from the main game flow
- render a React gallery with requestAnimationFrame-driven offset updates
- keep the carousel infinite by wrapping card positions instead of snapping pages
- style the page with a minimal editorial system and soft off-white lighting

## Success Criteria

- the new page is reachable without affecting the current app
- the gallery auto-scrolls left smoothly
- mouse / touch drag adjusts the gallery naturally
- the stage retains the calm, premium tone of the reference while using F1-specific visuals
