---
title: Tech stack and hosting
labels: [wayfinder:grilling]
status: closed
assignee: carl.tremblay
blocked_by: []
---

## Question

Which web stack and hosting do we build on: vanilla Three.js vs react-three-fiber (+ drei), language/build tooling (TypeScript + Vite?), UI controls library, static hosting target, and how Setup state lives in the URL?

## Resolution

Decided with the coach (grilling session, 2026-10-15):

- **Rendering:** plain Three.js (not react-three-fiber). `OrbitControls` / `TransformControls` from `three/addons`; geometry (coverage pipeline) and posing (IK, stick) live in framework-free modules.
- **Language / build:** TypeScript (strict) + Vite + npm. Local development via `npm run dev`.
- **Libraries:** `clipper2-ts` (polygon union/clip, per [Computing the Coverage Shadow and Open Net % in the browser](02-coverage-computation.md)), three's `ConvexHull`, `lz-string` for link compression.
- **UI controls:** plain HTML/CSS toolbar/panel — should feel like a coaching tool, not a debug panel. Layout is decided by [Coach controls on laptop](06-coach-controls.md).
- **Tests:** none automated; the coach tests manually by eye.
- **Hosting:** GitHub Pages via a GitHub Action deploying from `main`, Vite `base` set to the repo path. Needs `git init` + a GitHub remote when the build starts.
- **Setup link mechanism:** hash fragment `#v1.<lz-string compressToEncodedURIComponent(JSON)>` — no server, shorter links, `v1.` prefix for future-proof decoding. Updated with debounced `history.replaceState` as the coach edits; decoded on load. (What the JSON contains is still fog.)
- **Builder:** Claude Code — the final spec should be written as an agent hand-off.
