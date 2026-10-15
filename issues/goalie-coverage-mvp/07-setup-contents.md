---
title: Setup contents
labels: [wayfinder:grilling]
status: closed
assignee: carl.tremblay
blocked_by: []
---

## Question

Exactly what does a Setup capture in its `#v1.<lz-string JSON>` link, and what is left out? The state is now known (see the Resolution of [Coach controls on laptop](06-coach-controls.md)):

- Stance, height, Catch Side;
- goalie `{x, z, facingDeg}` plus its placement (`arc` with depth, `post`, or `free`);
- Follow the Puck;
- each hand's `{out, up, fwd, yaw, pitch, roll}`;
- the Puck `{x, z}`;
- the current view and the display toggles.

Decide:

- Is the view part of a Setup, or only the arrangement?
- Are the display toggles part of a Setup?
- Is Follow the Puck part of a Setup?
- Does a Setup carry a name? The glossary says "a named arrangement".
- Should the goalie be stored as raw `{x, z}` or as the placement plus depth and angle?
- What units and rounding keep links short?
- How does a later `v2` stay able to read `v1` links?

## Resolution

Decided with the coach (grilling session, 2026-10-15).

**Link format.** `#v1.<lz-string compressToEncodedURIComponent(JSON)>`, short keys, integer values. A value equal to its **frozen `v1` default** is left out. The `v1` decoder keeps its own copy of the defaults, so a missing value always means the `v1` default, even if the app's defaults change later.

**What a Setup holds:**

| Part | Stored as |
|---|---|
| Name | optional string, ≤ 60 chars |
| Stance, Height, Catch Side | Stance code (e.g. `bf`), height in whole inches, `l`/`r` |
| Goalie placement | `arc`: depth (whole inches, toes from the middle of the goal line) + facing (whole degrees); `post`: which post (position and facing derived from the RVH lock); `free`: x, z (integer cm) + facing (whole degrees) |
| Follow the Puck | flag |
| Each hand | only the fields that differ from that hand's default for the Setup's Stance and Catch Side: `out/up/fwd` as integer thousandths of height, `yaw/pitch/roll` as whole degrees; a hand at its default is left out entirely |
| Puck | x, z (integer cm) |
| View | preset name; Free orbit opens on its starting overview (no camera angles) |
| Display toggles | Shot Cone lanes, Puck-size margin |

Key names and code values are the builder's choice, kept short.

**Left out:** exact orbit camera, the current selection, gizmo mode (move/rotate), whether Sweep is running, and on-screen notes. The stick grip height (`gripAboveIn`) is a constant, not a coach setting.

**Sharing UI.**

- The address bar updates as the coach edits (debounced `history.replaceState`, per [Tech stack and hosting](03-tech-stack.md)).
- The name is a caption at the top centre. When empty it shows "Name this Setup…" in grey; click it to type.
- A **Copy link** button next to the caption copies the URL and flashes "Link copied".
- Opening the page with no hash gives the default Setup.

**Versioning.** For now there is only a `v1` decoder. An unknown version or a broken link opens the default Setup with the notice "This link couldn't be read", and the app doesn't crash. When a `v2` is ever needed, add one `v1 → v2` upgrade function then (a chain, so the app only works on the latest shape) and write links only in the latest version.
