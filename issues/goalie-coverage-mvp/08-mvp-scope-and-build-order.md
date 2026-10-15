---
title: MVP scope cut and build order
labels: [wayfinder:grilling]
status: closed
assignee: carl.tremblay
blocked_by: [07-setup-contents.md]
---

## Question

With posing, coverage, controls and Setup contents settled, three things are left to decide:

1. **Scope.** Which pieces are truly MVP, and which are fast-follow? Candidates for fast-follow include the Puck spot buttons, Sweep, Follow the Puck, and the corner map's goalie dragging.
2. **Not-MVP items.** The map's fog lists tablet/touch support and the later polish items. Should they be ruled out of scope for this map?
3. **Build order.** In what order should the build be sliced for hand-off to Claude Code? Each slice should leave a working page.

The hand-off spec is the destination of this map.

## Resolution

Decided with the coach (grilling session, 2026-10-15). The hand-off spec is [docs/SPEC.md](../../docs/SPEC.md).

**Scope.**

- **MVP:** posing (Stance, Height, Catch Side, hands with wrist rotation, stick); coverage fills, the Puck-size margin, the "% covered" card, scoring lanes and named holes; all five view presets; dragging the Puck by its ring and on the corner map; dragging the goalie with snaps, the ring knob and Depth controls; the whole rink with painted boards; the Setup link with the name caption, Copy link and the broken-link notice.
- **Fast-follow** (written up in the spec as an optional last slice): Follow the Puck, the Puck spot buttons, Sweep, and dragging the goalie on the corner map. The `v1` decoder accepts the Follow the Puck flag from day one, so links never change shape.

**Fog.** Tablet/touch support and the later polish items are ruled out of scope for this map. Each would be a later effort of its own.

**Hand-off shape.** One `docs/SPEC.md`: an overview, links to the decisions (not restated), the prototype modules to port, then numbered build slices, each with a "done when" checklist the coach checks by hand. Slice 1 starts with `git init` and moves each prototype onto its `prototype/*` branch.

**Build order** (each slice leaves a working page):

1. Scaffold + rink
2. Posed goalie
3. Coverage
4. Puck and goalie moving
5. Hands
6. Scoring lanes and named holes
7. Setup link → **MVP done**
8. Fast-follow

The Setup link comes last so that its format covers fields that can already be edited.

**MVP done** means slice 7 is deployed on GitHub Pages and the coach, on their own laptop, has dragged a hand and the Puck with no visible lag and opened a shared link that brings back the Setup exactly.
