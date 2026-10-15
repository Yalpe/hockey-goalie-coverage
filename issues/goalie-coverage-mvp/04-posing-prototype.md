---
title: Posing feasibility prototype
labels: [wayfinder:prototype]
status: closed
assignee: carl.tremblay
blocked_by: [01-dimensions.md, 03-tech-stack.md]
---

## Question

Is plausible hand posing cheap enough for the MVP? Build a primitive goalie with the three Stances (Stand-up, Butterfly, RVH left/right) and fixed torso/legs, 2-bone arm IK with Glove/Blocker Hand targets clamped to a reachable range, and the stick held by the Blocker Hand with the blade staying on the ice (sliding forward/back, lifting only when the shaft can't reach). Does it look and behave believably enough, and what are the clamp ranges per Stance?

## Assets

- Prototype: [prototypes/posing-prototype.html](../../prototypes/posing-prototype.html). Double-click to open; Three.js loads from a CDN. The pure posing module sits between the `POSING MODULE START/END` markers.

## Resolution

**Yes: plausible hand posing is cheap enough for the MVP.** I iterated with the coach (2026-10-15) until they judged it "not perfect but good enough". The pure posing module (`solvePose`, `defaultHands`, `placeAtPost`, `placeAtCreaseTop`) in the prototype is the starting point for the build.

Decided:

- **Model.** Each Stance fixes the legs and torso as directions on height-scaled Winter limb lengths. The body then drops until its lowest pad or skate touches the ice. Arms use 2-bone IK to the hand targets.
- **Hand state.** Each hand is stored as `{out, up, fwd}` (fractions of height, so a Setup survives a height change) plus wrist `{yaw, pitch, roll}` in degrees, mirrored by Catch Side. **The coach wants wrist rotation, not just position.**
- **Hand limits (clamp ranges).** Each Stance has a box per hand. Positions are fractions of height; wrist angles are in degrees.
  - **Stand-up, glove:** out 0.04–0.45, up 0.30–0.85, fwd 0.10–0.45.
  - **Stand-up, blocker:** out 0.04–0.38, up 0.22–0.65, fwd 0.10–0.45.
  - **Butterfly, glove:** out 0.04–0.45, up 0.20–0.70, fwd 0–0.40.
  - **Butterfly, blocker:** out 0.04–0.38, up 0.15–0.50, fwd 0–0.40.
  - **RVH:** as Butterfly, but `up` goes down to 0.12 for both hands.
  - **Wrist angles, all Stances:** glove yaw −45…70, pitch −30…60, roll ±60; blocker yaw ±45, pitch ±40, roll ±45.
  - **Arm reach:** after clamping, a hand also stops at the edge of arm reach.
  - **Feedback:** a held-back hand says why. The coach didn't tune these and doesn't need to; they are guard rails.
- **Default hands.** Hands are well out in front of the body.
  - **Stand-up:** glove (0.24, 0.47, 0.34), blocker (0.16, 0.38, 0.32).
  - **Butterfly:** glove (0.24, 0.36, 0.26), blocker (0.16, 0.29, 0.25).
  - **Glove tilt:** tilted down 20° in all Stances.
- **Stick.** It is straight and gripped 3 in above the paddle. The heel sits on the ice straight ahead of the blocker hand, so the blade slides forward or back as the hand moves. It lifts only when the hand is higher than the grip distance. The blade lies in the paddle's plane, with its toe toward the glove side. The coach accepted the long blade-ahead distance: the blade comes first, roughly in line with the hands and head.
  - **Amended 2026-10-15** (raised while reviewing the [Coverage rendering prototype](05-coverage-prototype.md)): **the stick turns with the blocker wrist.** The neutral shaft is rotated by the blocker's yaw/pitch/roll, and only its heading is kept, because the blade stays flat on the ice. The heel swings round the spot under the hand at the same distance, and the toe stays square to the shaft, pointing to the glove side. Turning the blocker out swings the blade out; twisting its top out swings the blade in; tilting it has no effect on the heading. "Straight ahead of the blocker" now holds only at neutral wrist angles.
- **Pads.** Each pad has a shin section (boot to knee roll) and a narrower thigh rise that follows the thigh. Pads never cross the centreline. Each lower leg is pushed out until its pads just meet, which gives the butterfly seal and pads touching at the knees in Stand-up.
- **RVH** (the glossary is updated). The body is turned 30° toward the post.
  - **Post leg:** the pad is down on its edge like a butterfly pad, along the goal line in front of it. It is locked to the post, with the post between the pad and the skate toe.
  - **Far leg:** spread wide, solved by IK, with the skate on its inside edge and the pad on the ice.
  - **Torso:** leaning 30° sideways so the post-side shoulder locks the post.
  - **Post-side hand:** low beside the hip; its glove or blocker overlaps the pad top to seal.
  - **Far hand:** a far glove sits in front of the chest; a far blocker stays low enough to keep the blade on the ice.
  - **Placement:** RVH at its own post anchors the post-leg ankle at the post (`placeAtPost`).
- **Top of crease** means toes on the crease arc: skate toes for upright skates, the pad front edge when kneeling. Turning the goalie keeps it on the arc (`placeAtCreaseTop`).

Known imperfections, accepted for the MVP and left as polish:

- The shoulder seal is approximate.
- The RVH far pad dips about 1 cm into the ice.
- Proportions are coarse for small kids.
- The glove and blocker are simple slabs.

The repo isn't under git yet, so the prototype stays in `prototypes/` rather than on a throwaway branch. Move it to a `prototype/posing` branch when the repo is initialised.
