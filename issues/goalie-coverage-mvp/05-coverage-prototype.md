---
title: Coverage rendering prototype
labels: [wayfinder:prototype]
status: closed
assignee: carl.tremblay
blocked_by: [02-coverage-computation.md, 04-posing-prototype.md]
---

## Question

Using the chosen computation technique on the posed goalie, how should the Shot Cone, Coverage Shadow, Open Net and % net covered look and update while the goalie, hands and Puck move? Confirm it stays interactive and reads clearly in Shooter's view and the other preset views.

## Assets

- Prototype: [prototypes/coverage-prototype.html](../../prototypes/coverage-prototype.html). Double-click to open; Three.js and clipper2-ts load from a CDN. Three variants are switchable with `?variant=A|B|C`, the bottom bar, or ← →:
  - **A, Light from the Puck:** a full translucent Shot Cone, a dark Coverage Shadow, a green Open Net, and a big "% covered" card.
  - **B, Scoring lanes:** shows only what's open. Red lanes run from the Puck into each hole, each hole is labelled in coach words ("Glove side high 6%"), and the card leads with "% open".
  - **C, Puck's-eye card:** a light touch in 3D (cone edges and flat fills), plus a card showing the net as the Puck sees it, a % donut, and a top-down mini-map of the angle.
  - **D, A + scoring lanes:** added after the coach preferred A and liked B's lanes. It keeps A's fills and "% covered" card. Instead of the whole cone, green lanes run into each hole, and each hole is named on screen and in the card.
- **Puck's view** camera preset, added at the coach's request: the camera sits on the Puck and is zoomed to fit the net, with the cone hidden. The Coverage Shadow then lines up with the goalie's silhouette, and the thin dark rim around the goalie is the Puck-size margin. `?view=shooter|top|behind|puck|orbit` picks the view.
- The pure `COVERAGE MODULE` (`goalieParts`, `dilatedHull`, `hullToWorld`, `computeCoverage`) is the build's starting point. In Node it measured ~1–2 ms per update and ~7 ms to rebuild all 22 hulls; per-part hull caching means a hand drag rebuilds only the arm, hand and stick.

## Resolution

**Variant D, "A + scoring lanes".** The coach preferred A, liked B's scoring lanes, and asked for a view from the Puck itself (2026-10-15). The prototype's `COVERAGE MODULE` is the starting point for the build.

Decided:

- **On the goal plane.** The Coverage Shadow is a dark fill (slate, ~80% opaque). The Open Net is a green fill (~70%). Both are drawn as polygons from the analytic pipeline, so the picture and the number always agree.
- **Shot Cone = scoring lanes.** The cone is not drawn whole. Instead, a translucent green lane (~18%, with an outline) runs from the Puck into each hole of the Open Net. The "Shot Cone" toggle switches the lanes. This replaces the "translucent faces + edge lines" cone from charting.
- **Holes are named in coach words, on screen and in the card.** Each hole bigger than 0.2% of the net gets a label at its centre, giving the side relative to the goalie as seen from the Puck, the height, and the hole's share of the net: e.g. "Glove side high 6%", "Blocker side low 3%", "Five-hole 4%". At most six holes are labelled, biggest first. The thresholds are prototype values: five-hole = within 14 cm of the goalie's centre and below 45 cm; low < 32 cm; high > 78 cm.
- **The number is "% covered".** A dark card at the top right shows a big "% covered", a covered/open bar, "Open Net x% · n sq in", and the list of named holes. Areas are measured on the scoring rectangle (69" × 47": the Goal Mouth shrunk by the Puck's size).
- **The app opens in Puck's view.** It is a fifth preset that puts the camera on the Puck, zoomed to fit the net, with the Puck mesh and lanes hidden. From there the Coverage Shadow peeks out as a thin dark rim around the goalie, which is the Puck-size margin. The presets are Puck's view (default), Shooter's view (standing behind the Puck, following it), Top-down (framing the net and the Puck), Behind net, and Free orbit. All of them follow the Puck except Free orbit.
- **Puck-size margin.** The scoring rectangle is drawn as a dashed outline inside the posts and can be turned off. The coach didn't object; it stays on by default.
- **No Shot Cone when the Puck is on or behind the goal line.** The scene and card say so.
- **Performance.** A full coverage update takes ~1–2 ms in Node and ~2.2 ms in a headless browser using software WebGL. Rebuilding all 22 dilated hulls takes ~7 ms in Node. Hulls are cached per part in the goalie frame, so dragging the Puck or moving the goalie rebuilds nothing, and dragging a hand rebuilds only that arm, the hand and the stick. Smoothness on the coach's own laptop was not explicitly confirmed.

Side decision: **the stick turns with the blocker wrist**, recorded as an amendment on [Posing feasibility prototype](04-posing-prototype.md).

Not chosen:

- B on its own (red "% open" framing, no shadow fill).
- C (the 2D Puck's-eye card and mini-map). Puck's view now shows the net from the Puck in 3D instead.
- A's whole translucent cone, including keeping it as a toggle next to the lanes. The coach picked lanes only.

The repo isn't under git yet, so the prototype stays in `prototypes/`. Move it to a `prototype/coverage` branch when the repo is initialised.
