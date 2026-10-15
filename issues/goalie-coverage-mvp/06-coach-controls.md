---
title: Coach controls on laptop
labels: [wayfinder:prototype]
status: closed
assignee: carl.tremblay
blocked_by: [04-posing-prototype.md]
---

## Question

How does a coach on a laptop manipulate the scene: drag goalie and Puck on the ice, rotate the goalie's facing, move and rotate the Glove/Blocker Hands (wrist turn/tilt/twist as well as position: 3D drag handles vs sliders vs both), switch Stance / catch side / height, snap to spots (top of crease on the arc, RVH locked to its post, per [Posing feasibility prototype](04-posing-prototype.md)), and switch preset views? What layout and interactions feel right?

Context from [Coverage rendering prototype](05-coverage-prototype.md):

- The app opens in **Puck's view**, where the camera sits on the Puck and the Puck itself is hidden. How does the coach move the Puck from there: switch views, drag it on a mini-map, or use arrow keys?
- That prototype also tried some controls the coach hasn't judged yet:
  - an orange ring to grab and drag the Puck;
  - Puck spot buttons (slot, dot, sharp angle and so on);
  - a "square to the Puck" auto-facing toggle that keeps the goalie on the crease arc facing the Puck;
  - a "Deep" goalie spot;
  - a Sweep animation.

## Assets

- Prototype: [prototypes/controls-prototype.html](https://github.com/Yalpe/hockey-goalie-coverage/blob/prototype/controls/prototypes/controls-prototype.html) on the `prototype/controls` branch. Double-click to open; Three.js and clipper2-ts load from a CDN. It opens in Puck's view with the decided coverage drawing. Three variants are switchable with `?variant=A|B|C`, the black bar, or the `[` `]` keys (the arrow keys belong to C):
  - **A, Grab it in 3D:** no side panel. Click the Puck, the goalie or a hand; a card shows what can be changed. Drag the goalie on the ice (it snaps to the top of the crease, and to the post in RVH), turn it with a ring knob, and move or rotate a hand with a 3D gizmo (`W`/`E`). In Puck's view, a corner map from above is how you move the Puck.
  - **B, Control panel + rink map:** the 3D view is only for looking. The panel has a top-down rink map (drag the Puck, drag the goalie, turn it with a knob), Puck spots, position buttons (Top / Mid / Deep / Post), a Facing slider, and six named sliders per hand, limited to the Stance's reach box.
  - **C, Tools + keyboard:** pick a tool (`Q` Puck, `W` Goalie, `E` Glove, `R` Blocker). Drag anywhere to act on it. The wheel turns the goalie or moves a hand in and out; `Shift`/`Ctrl`+drag turns, tilts or twists a wrist; the arrow keys nudge; `1`–`5` switch views; right-drag orbits.
- All three share **Follow the Puck** (square to it and on its angle; it switches off when the coach moves or turns the goalie), Depth spots, and a `{ }` drawer showing the Setup state a link would carry (input for the **Setup contents** fog).

### Coach feedback while iterating (2026-10-15)

- Leaning to **A**. The corner map is fine for moving the Puck in Puck's view.
- **Hand arrows follow the shot**, not the rink. One axis runs along the line from the Puck through the hand (depth), the others across it and up/down. The mouse wheel also moves a selected hand along the shot. Built.
- **Render the entire zone:** boards with corners, goal line, blue line, end-zone circles, dots and hash marks, neutral-zone dots. The corner map shows the whole zone too. Built, using standard 200 × 85 ft markings; only the goal line and corner radius come from the research.
- **Snapping is probably good, but depth needs finer control.** The goalie card has a Depth slider (toes from the middle of the goal line, in m and ft/in), and the wheel works on a selected goalie in 5 cm steps. Built.
- **Follow the Puck:** not on by default.
- Bug fixed: in Shooter's view the Puck sat just below the bottom of the screen.
- **The Puck is always visible.** Puck's view moves from inside the Puck to 1.4 m behind and 25 cm above it, on its line to the net, zoomed so the Puck sits at the bottom with the whole net above. This revises the coverage prototype's "camera on the Puck, Puck hidden". The trade-off: the dark Puck-size rim no longer lines up exactly with the goalie's outline (a few cm of parallax). The orange grab ring is hidden in Puck's view, and orbiting away from it switches to Free orbit.
- Boards painted like real ones: yellow kickplate, white boards, red cap rail. Posts stay at Hockey Canada's 2 in (NHL frames are 2⅜ in).
- **Height and depth move in 1-inch steps:** the mouse wheel (over the slider, or over a selected goalie for depth), the − / + buttons, and the slider itself. Height reads in feet/inches, e.g. 5′9″ (1.75 m).

## Resolution

**Variant A, "Grab it in 3D", with the changes above.** The coach iterated on it live and accepted it (2026-10-15). The prototype's page code is the reference for the build's interaction layer. The posing and coverage modules are unchanged.

Decided:

- **Layout.** There is no side panel. The 3D scene fills the screen. The view presets sit top-left, and the "% covered" card sits top-right. A small card bottom-left shows the controls for whatever is selected.
- **Selecting.** Clicking the Puck, the goalie's body or a hand selects it. Clicking empty space or pressing `Esc` deselects. Dragging empty space orbits.
- **Puck.**
  - **Moving it:** drag it on the ice by its orange ring in every view except Puck's view. In Puck's view, drag it on a corner map of the whole zone.
  - **Where it can go:** it stays inside the boards and can go out to just past the blue line.
  - **Extras:** the Puck spot buttons (Slot, Dot…) and Sweep stay in the Puck card. The coach had no opinion on them.
- **Goalie.**
  - **Moving it:** drag the body on the ice. It snaps to the top of the crease, and in RVH it locks to its own post. Anywhere else, it stays where it is put.
  - **Turning:** drag the knob on a ring round its feet.
  - **Depth** is how far out the toes are from the middle of the goal line. Set it with the Top / Mid / Deep / Post buttons, or in 1-inch steps with a slider, − / + buttons, or the mouse wheel over the slider or the goalie. It reads in metres and feet/inches.
  - **Stance, Catch Side and Height** are in the goalie card. Height moves in 1-inch steps and reads as e.g. 5′9″ (1.75 m).
  - **Follow the Puck** (square to it and on its angle) is available but off by default. It turns off when the coach moves or turns the goalie.
- **Hands.**
  - **Moving:** the arrows on a selected hand follow the shot, not the rink. One axis runs along the line from the Puck through the hand (depth along the shot), one runs across it on the level, and one goes up and down in the picture. The mouse wheel also moves the hand along the shot (handy in Puck's view, where that arrow points at the camera).
  - **Rotating:** rings on the hand's own axes turn, tilt and twist it. `W` switches to move, `E` to rotate.
  - **Feedback:** when a hand is held back, a note on screen says why.
- **Scene.**
  - **Rink:** the whole defending zone, with boards, rounded corners, goal line, blue line, end-zone circles with dots and hash marks, and neutral-zone dots. The boards have a yellow kickplate, white boards and a red cap rail.
  - **Sources:** only the goal line position and corner radius come from the research. The other markings are standard 200 × 85 ft and cosmetic.
  - **Posts:** they stay at Hockey Canada's 2 in.
- **Views** (this revises the [Coverage rendering prototype](05-coverage-prototype.md)).
  - **The Puck is always visible.** Puck's view now puts the camera 1.4 m behind and 25 cm above the Puck, on its line to the net, zoomed so the Puck sits at the bottom with the whole net above it. The trade-off: the Puck-size rim no longer lines up exactly with the goalie's outline. Orbiting by hand out of Puck's view switches to Free orbit.
  - **Shooter's view** stands far enough back that the Puck stays in the picture. **Free orbit** starts on an overview of the whole zone.
- **Mouse wheel.** It takes one step per notch, ignoring repeat events less than 80 ms apart, because some mice send two events per notch. With nothing selected, it zooms.

Not chosen:

- **B, the control panel and rink map.** The coach found the panel map unclear.
- **C, tools and keyboard.**
- **Rink-aligned hand arrows.**
- **Hiding the Puck in Puck's view.**

What the controls now put in a Setup (input for **Setup contents**): Stance, height, Catch Side, goalie `{x, z, facingDeg}` plus its placement (`arc` with depth, `post`, or `free`), Follow the Puck, each hand's `{out, up, fwd, yaw, pitch, roll}`, the Puck `{x, z}`, plus the view and display toggles. The prototype's `{ }` drawer shows them live.

The prototype now lives on the `prototype/controls` branch (moved when the repo was initialised, 2026-10-15).
