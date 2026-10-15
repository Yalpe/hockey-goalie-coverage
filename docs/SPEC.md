# Goalie Coverage Visualiser — MVP build spec

Hand-off for Claude Code. This spec is the destination of the [Goalie Coverage Visualiser — MVP spec](../issues/goalie-coverage-mvp/MAP.md) map.

## What it is

A web page for a **goalie coach on a laptop**. The coach poses a primitive goaltender in the net against a Puck. The page shows the **Coverage Shadow**, the **Open Net**, scoring lanes into each hole, and the **% covered**, taking the Puck's real size into account. Each Setup can be shared as a link.

Use the vocabulary in [GLOSSARY.md](../GLOSSARY.md) in code, UI text and commits (Goal Mouth, Shot Cone, Coverage Shadow, Open Net, Stance, RVH, Glove Hand, Blocker Hand, Catch Side, Depth, Setup).

## How to read this spec

Every decision lives in exactly one ticket. **Read the tickets' Resolution sections before building. They are the requirements.** This spec only gives their gist, says which slice each one belongs to, and points at them.

| Decision | Ticket | Used in slices |
|---|---|---|
| Hockey Canada dimensions, sizing from height | [Regulation and youth gear dimensions](../issues/goalie-coverage-mvp/01-dimensions.md) + constants table in [docs/research/01-dimensions.md](research/01-dimensions.md) | 1, 2 |
| Analytic coverage pipeline (3D puck-dilated hulls → project → union/clip) | [Computing the Coverage Shadow and Open Net % in the browser](../issues/goalie-coverage-mvp/02-coverage-computation.md) + [docs/research/02-coverage-computation.md](research/02-coverage-computation.md) | 3 |
| Stack, hosting, link mechanism | [Tech stack and hosting](../issues/goalie-coverage-mvp/03-tech-stack.md) | 1, 7 |
| Posing model, hand limits, defaults, stick, RVH, top of crease | [Posing feasibility prototype](../issues/goalie-coverage-mvp/04-posing-prototype.md) (including its 2026-10-15 stick amendment) | 2, 5 |
| How coverage is drawn, scoring lanes, named holes, "% covered" card | [Coverage rendering prototype](../issues/goalie-coverage-mvp/05-coverage-prototype.md) | 3, 6 |
| Layout, selection, dragging, snaps, hand gizmo, rink, views, mouse wheel | [Coach controls on laptop](../issues/goalie-coverage-mvp/06-coach-controls.md) | 1, 4, 5, 8 |
| Link contents, frozen `v1` defaults, sharing UI, versioning | [Setup contents](../issues/goalie-coverage-mvp/07-setup-contents.md) | 7 |
| Scope, slices, definition of done | [MVP scope cut and build order](../issues/goalie-coverage-mvp/08-mvp-scope-and-build-order.md) | all |

Where two tickets disagree, the later one wins. In particular, **the Puck is always visible**, and Puck's view sits 1.4 m behind and 25 cm above the Puck ([Coach controls on laptop](../issues/goalie-coverage-mvp/06-coach-controls.md) revises [Coverage rendering prototype](../issues/goalie-coverage-mvp/05-coverage-prototype.md)).

## Code to port

[prototypes/controls-prototype.html](https://github.com/Yalpe/hockey-goalie-coverage/blob/prototype/controls/prototypes/controls-prototype.html) on the `prototype/controls` branch is the reference. It holds the latest copies of both pure modules and the interaction layer the coach accepted.

- **POSING MODULE** (between `==POSING MODULE START==` and `==POSING MODULE END==`): pure, no DOM, no three.js. Covers `solvePose`, `defaultHands`, `placeAtPost` and `placeAtCreaseTop`. Port it to `src/posing/` as typed TS with as little change as possible.
- **COVERAGE MODULE** (between `==COVERAGE MODULE START==` and `==COVERAGE MODULE END==`): covers `goalieParts`, `dilatedHull`, `hullToWorld` and `computeCoverage`, plus the per-part hull cache. Port it to `src/coverage/`. It depends only on three's `ConvexHull`/`Vector3` and `clipper2-ts`.
- **Page code** (scene, rink, views, selection, gizmos, cards, the `{ }` state drawer): a behaviour reference. Rewrite it into tidy modules rather than copying it, keeping the behaviour the coach accepted.

The prototypes are throwaway. Don't build on top of them; port from them.

## Ground rules

- TypeScript (strict), Vite, npm, plain Three.js (`OrbitControls`/`TransformControls` from `three/addons`), `clipper2-ts`, `lz-string`. The UI is plain HTML/CSS and should feel like a coaching tool, not a debug panel.
- No automated tests. Each slice ends with a **"Done when"** checklist that the coach checks by eye in `npm run dev` and on the deployed page.
- Each slice leaves a working, deployed page. Commit each slice on `main`. The GitHub Action deploys it to GitHub Pages.
- Use metres internally and real-world scale. UI readouts use feet/inches with metres where the tickets say so.

## Build slices

### 1. Scaffold + rink

- `git init`. Move each prototype onto its own throwaway branch (`prototype/posing`, `prototype/coverage`, `prototype/controls`), then remove `prototypes/` from `main`. Keep the files reachable from this spec by linking the branches.
- Vite + TS project, GitHub remote, a GitHub Pages Action deploying `main`, and Vite `base` set to the repo path.
- The whole defending zone: boards with a yellow kickplate, white boards and a red cap rail; rounded corners, goal line, blue line, end-zone circles with dots and hash marks, and neutral-zone dots. The net uses Hockey Canada dimensions (2 in posts).
- A fixed Puck at a default spot, and the five view presets top-left: Puck's view (default), Shooter's view, Top-down, Behind net, Free orbit. All follow the Puck except Free orbit, which opens on the zone overview. Orbiting by hand switches to Free orbit.

**Done when:** the deployed URL opens in Puck's view, showing the Puck at the bottom of the screen and the whole net above it. Every preset frames what the [Coach controls on laptop](../issues/goalie-coverage-mvp/06-coach-controls.md) resolution says.

### 2. Posed goalie

- Port the POSING MODULE and build the primitive goalie mesh on named joints, so the mesh can be swapped later.
- The goalie stands at the top of the crease, facing straight out. Hands sit at their per-Stance defaults (glove tilted down 20°).
- A goalie card (bottom-left; for now it's always shown) with Stance (Stand-up, Butterfly, RVH left/right), Catch Side, and Height in 1-inch steps reading e.g. 5′9″ (1.75 m). Gear is sized from height.
- RVH goes to its own post (`placeAtPost`).

**Done when:** every Stance and both Catch Sides look the way they did in the posing prototype at several heights. RVH seals its post, and the stick blade lies on the ice.

### 3. Coverage

- Port the COVERAGE MODULE with its per-part hull cache.
- On the goal plane: a dark Coverage Shadow (slate, ~80% opaque) and a green Open Net (~70%). Add the dashed Puck-size margin outline (the 69" × 47" scoring rectangle), on by default.
- The "% covered" card top-right: a big %, a covered/open bar, and "Open Net x% · n sq in".
- With the Puck on or behind the goal line, the scene and card say there is no shot.

**Done when:** changing Stance or height updates the shadow and % straight away. The picture and the number agree.

### 4. Puck and goalie moving

- **Selection:** click the Puck, the goalie's body or a hand; click empty space or press `Esc` to deselect. Dragging empty space orbits. The bottom-left card shows whatever is selected.
- **Puck:** drag it by its orange ring in every view except Puck's view, where the ring is hidden and the Puck moves on a corner map of the whole zone. It stays inside the boards, out to just past the blue line.
- **Goalie:** drag it on the ice. It snaps to the top of the crease, and in RVH it locks to its own post; anywhere else it stays where it's put. Turn it with the knob on a ring round its feet. Depth comes from the Top / Mid / Deep / Post buttons, or 1-inch steps on a slider, − / + buttons, or the mouse wheel over the slider or a selected goalie. It reads in m and ft/in.
- **Mouse wheel:** one step per notch, ignoring repeats less than 80 ms apart. With nothing selected it zooms.

**Done when:** the coach can put the Puck anywhere in the zone from every view, and set the goalie anywhere on the arc, at any depth or angle, and on either post. Coverage keeps up while dragging.

### 5. Hands

- When a hand is selected, its move arrows **follow the shot**: depth along the line from the Puck through the hand, one axis across it on the level, and one up and down. Rotation rings on the hand's own axes turn, tilt and twist it. `W` switches to move, `E` to rotate. The wheel moves a selected hand along the shot.
- Clamp to the per-Stance limits, then to arm reach. When a hand is held back, a note on screen says why.
- The stick follows the Blocker Hand and turns with its wrist, as in the posing ticket's amendment.
- Only the dragged arm, hand and stick rebuild their hulls.

**Done when:** in Puck's view the coach can close a glove-side-high hole by moving and turning the glove, and fan the stick by turning the blocker, with no visible lag.

### 6. Scoring lanes and named holes

- A translucent green lane (~18%, outlined) from the Puck into each hole of the Open Net. The "Shot Cone" toggle switches them on and off. The Puck-size margin toggle sits next to it.
- Every hole larger than 0.2% of the net is labelled at its centre in coach words, relative to the goalie as seen from the Puck, e.g. "Glove side high 6%", "Blocker side low 3%", "Five-hole 4%". At most six labels, biggest first. The same list appears in the "% covered" card. The thresholds are in the [Coverage rendering prototype](../issues/goalie-coverage-mvp/05-coverage-prototype.md) resolution.

**Done when:** hole names match what the coach sees from both sides, at both Catch Sides, and in RVH.

### 7. Setup link → MVP done

- Encode and decode everything listed in the [Setup contents](../issues/goalie-coverage-mvp/07-setup-contents.md) resolution as `#v1.<lz-string compressToEncodedURIComponent(JSON)>`: short keys, integer values, and values equal to the **frozen `v1` defaults** (kept in the decoder) left out. Hands store only what differs from their Stance's default.
- The decoder already accepts the Follow the Puck flag, even though the feature arrives in slice 8.
- Update the address bar as the coach edits, with a debounced `history.replaceState`.
- A name caption at the top centre ("Name this Setup…" in grey when empty; click to type, ≤ 60 chars), with a **Copy link** button that flashes "Link copied".
- No hash opens the default Setup. A broken link or unknown version opens the default Setup with "This link couldn't be read", and nothing crashes.

**Done when (the MVP is done):** slice 7 is deployed on GitHub Pages, and the coach, **on their own laptop**:

- [ ] drags a hand and the Puck with **no visible lag**;
- [ ] copies a link, opens it in a new tab, and gets the **exact same Setup** back (goalie, hands, Puck, view, toggles, name);
- [ ] opens a mangled link, sees the notice, and gets the default Setup.

### 8. Fast-follow (optional, after the MVP)

All of these are already decided in [Coach controls on laptop](../issues/goalie-coverage-mvp/06-coach-controls.md):

- **Follow the Puck:** keeps the goalie square to the Puck and on its angle. Off by default; turns off when the coach moves or turns the goalie. Saved in the Setup.
- **Puck spot buttons** (Slot, Dot…) in the Puck card.
- **Sweep:** a "▶ Sweep across the slot" button in the Puck card. The Puck skates back and forth along an arc across the slot (±65°, a 7 s cycle; see the prototype's render loop) while everything updates live. Grabbing anything stops it. Not saved in the Setup.
- **Dragging the goalie on the corner map.**

**Done when:** each one behaves as it did in the controls prototype.

## Not in this build

Curved shots, deflections and screens; side-by-side comparison of two Setups; tablet/touch; and later polish (raised puck, rigged model, kid-facing mode, guide lines, finer RVH and posing details). See the map's Out of scope section.
