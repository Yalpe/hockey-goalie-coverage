---
title: Goalie Coverage Visualiser — MVP spec
labels: [wayfinder:map]
status: closed
---

## Destination

A build-ready MVP spec for a web-based 3D goalie coverage visualiser: a coach poses a primitive goaltender (Stance + Glove/Blocker Hand targets, stick blade on ice) against a Puck and sees the Shot Cone, Coverage Shadow, Open Net and % covered — accounting for the Puck's size — with Setups shareable by link.

## Notes

- Domain: hockey goaltending coaching tool. Vocabulary lives in [GLOSSARY.md](../../GLOSSARY.md) — use and update it (call the `domain-modeling` skill when terms move).
- Tracker: local markdown. Tickets are sibling files here; frontmatter `blocked_by` lists ticket files that must be closed first; `assignee` is the claim; `status: open|closed`. Resolution goes in a `## Resolution` section at the bottom of the ticket.
- Research findings live in [docs/research/](../../docs/research/) and are linked from their ticket.
- Settled while charting (not tickets):
  - User is a **goalie coach**, on a **laptop** browser. Tablet is not MVP but not ruled out.
  - Real-world scale, **Hockey Canada** rules; goalie **height** is a UI parameter and gear size is derived from it (no micro-tuning).
  - Shots are **straight lines**; Puck is a **flat disk** (3" × 1"): goalie silhouette dilated by puck radius (1.5" horizontal, 0.5" vertical) for blocking; Goal Mouth shrunk by the same margins for scoring.
  - Torso and legs **fixed per Stance** (Stand-up, Butterfly, RVH left/right); **Glove and Blocker Hands movable**; stick held by the Blocker Hand with **blade staying on the ice**, sliding forward/back as the hand moves, lifting only when the shaft can't reach.
  - Coach moves: goalie position + facing, Stance, height, hand targets, catch side (left/right), Puck on the ice anywhere in the zone.
  - Views as **preset buttons**: Puck's view (default), Shooter's view, top-down, behind-net, free orbit (revised by [Coverage rendering prototype](05-coverage-prototype.md); the Puck is always visible per [Coach controls on laptop](06-coach-controls.md)).
  - On screen: % net covered, Shot Cone as **scoring lanes** into the Open Net (toggleable), Coverage Shadow and Open Net shaded on the goal plane, holes named (revised by [Coverage rendering prototype](05-coverage-prototype.md)).
  - Goalie mesh **built from primitives in code** first; posing works on named joints so the mesh can be swapped later.
  - Setups saved/shared **via link** (in MVP).

## Decisions so far

- [Regulation and youth gear dimensions](01-dimensions.md): HC numbers (72×48 in Goal Mouth, 6 ft semicircle crease, HC gear limits) + height-derived sizing rules; constants table in research doc
- [Computing the Coverage Shadow and Open Net % in the browser](02-coverage-computation.md): analytic: 3D puck-dilated convex hulls projected from the puck, unioned/clipped with clipper2-ts (~2 ms/frame, Node-measured)
- [Tech stack and hosting](03-tech-stack.md): plain Three.js + TS/Vite/npm, plain HTML/CSS panel, no automated tests, GitHub Pages; Setup in the hash as `#v1.<lz-string JSON>`; built by Claude Code
- [Posing feasibility prototype](04-posing-prototype.md): feasible. Pure `solvePose` module: Stance legs grounded, IK arms, hands as height fractions + wrist yaw/pitch/roll with per-Stance limits; stick heel on the ice, turning with the blocker wrist; RVH locked to the post (shoulder seals it); top of crease means toes on the arc
- [Coverage rendering prototype](05-coverage-prototype.md): A + scoring lanes: dark shadow and green Open Net on the goal plane, green lanes from the Puck into each hole, holes named in coach words on screen and in a "% covered" card; app opens in a new Puck's view preset
- [Coach controls on laptop](06-coach-controls.md): grab it in 3D, with a card for the selection; whole zone drawn with real boards. Puck dragged on the ice, or on a corner map in Puck's view. Goalie dragged with snaps, turned by a ring knob, depth in 1-inch steps. Hand arrows follow the shot, and the wheel moves a hand along it. The Puck is always visible, so Puck's view now looks over it.
- [Setup contents](07-setup-contents.md): `#v1.` link holds an optional name, goalie (placement-relative), hands, Puck, view preset, toggles and Follow the Puck. It leaves out values equal to frozen `v1` defaults and has a Copy link button. A broken link opens the default Setup with a notice; upgraders get added only when a `v2` is needed
- [MVP scope cut and build order](08-mvp-scope-and-build-order.md): everything decided is MVP except four fast-follows (Follow the Puck, Puck spots, Sweep, goalie on the corner map). Built in 7 slices plus a fast-follow slice, handed off in [docs/SPEC.md](../../docs/SPEC.md). Done means deployed and checked on the coach's own laptop

## Not yet specified

_Empty: the way to the destination is clear._

## Out of scope

- Curved shots, deflections, screens — the geometric model is straight lines only.
- Side-by-side comparison of two Setups.
- Tablet / touch support — this map ends at a laptop MVP; a later effort of its own ([MVP scope cut and build order](08-mvp-scope-and-build-order.md)).
- Later polish — raised puck (rebounds, puck on blade), rigged nicer-looking goalie model, kid-facing mode, angle/positioning guide lines, finer RVH and posing details (tighter shoulder seal, kid proportions, shaped glove and blocker). Beyond the MVP; a later effort ([MVP scope cut and build order](08-mvp-scope-and-build-order.md)).
