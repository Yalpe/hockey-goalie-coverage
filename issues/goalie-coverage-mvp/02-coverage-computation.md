---
title: Computing the Coverage Shadow and Open Net % in the browser
labels: [wayfinder:research]
status: closed
assignee: research-agent
blocked_by: []
---

## Question

What is the best technique, in a Three.js web app, to compute and display the **Coverage Shadow** (goalie silhouette projected from the Puck onto the Goal Mouth), the **Open Net** region, and the **% net covered** — accounting for the Puck as a flat disk (goalie dilated by 1.5" horizontally / 0.5" vertically; Goal Mouth shrunk by the same)? Compare at least: (a) GPU approach — render from the puck's viewpoint toward the goal plane (shadow map / offscreen render + pixel counting); (b) analytic approach — project mesh silhouettes to the goal plane and do 2D polygon union/clipping (e.g. clipper libraries). Cover accuracy, performance for interactive dragging, implementation complexity, and how each handles the anisotropic puck dilation.

## Resolution

**Analytic polygon pipeline with `clipper2-ts`** (not GPU). Findings: [docs/research/02-coverage-computation.md](../../docs/research/02-coverage-computation.md).

- Puck dilation done **in 3D** per primitive: convex hull of primitive samples ⊕ puck-cylinder rim points (three.js `ConvexHull`; read vertices from `hull.faces`). Dilating the 2D silhouette is wrong under perspective.
- Hulls cached in goalie-local frame (puck is symmetric about the vertical, so puck drags and goalie move/rotate need no rebuild); only moved parts (hands/stick) rebuild, ~1.4 ms each.
- Per frame: clip hulls at goal line → project from puck → 2D hull each → union → intersect with the shrunk Goal Mouth (69" × 47") → areas. ~2 ms for 35 primitives (measured in Node 22, not yet in a laptop browser).
- Display: result polygons (with holes) → `ShapeGeometry` for Coverage Shadow and Open Net, so % and visuals share one source of truth.
- GPU render-target counting kept only as a test oracle (readback stalls or lags ≥1 frame); shadow maps rejected.
