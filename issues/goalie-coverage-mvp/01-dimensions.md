---
title: Regulation and youth gear dimensions
labels: [wayfinder:research]
status: closed
assignee: research-agent
blocked_by: []
---

## Question

What are the real-world dimensions the scene needs, under **Hockey Canada** rules: goal net (posts, crossbar, depth/frame shape), goal crease (shape and size), goal line position, puck; and goaltender equipment (leg pads, glove, blocker, stick paddle/blade/shaft length) across youth → intermediate → senior size bands? Also: a simple, defensible rule to **derive gear size and body proportions from goalie height** (e.g. pad height ≈ f(height), standard anthropometric limb ratios), so the UI only exposes a height parameter.

## Resolution

Hockey Canada numbers from the 2026-28 rulebook and the 2024 Rink Technical Guidelines; a constants table (m and in, sourced) is at the end of [docs/research/01-dimensions.md](../../docs/research/01-dimensions.md).

- **Net:** Goal Mouth 72 × 48 in inside the posts, 2 in posts and crossbar, 44 in base depth, 18 in corner radii, 88 in overall width. **Rink:** goal line 11 ft from the end boards. **Crease:** a 6 ft semicircle. **Puck:** 3 × 1 in.
- **Gear limits (all ages):** pads ≤ 11 × 38 in; blocker ≤ 8 × 15 in; glove ≤ 45 in around, heel to T ≤ 18 in; blade ≤ 15.5 × 3.5 in; paddle ≤ 26 in; stick ≤ 55 in.
- **Sizing from height H (m):**
  - Body: Winter/Drillis-Contini limb ratios.
  - Pad top: 0.395H + 0.10 m.
  - Pad width: 0.155H, clamped to 0.20 m – 11 in.
  - Glove, blocker and blade: legal max × H/1.83, clamped to 0.6–1.
  - Paddle: 0.37 × H in inches, clamped to 18–26 in.
- **Least certain:** youth and intermediate glove, blocker and pad widths (scaled, nothing published); adult ratios are coarse for small kids; the net's top-frame depth (looks only, no effect on coverage).
- **Amended 2026-10-15** (coach): gear is no longer linear in height. Pads (size, thigh rise, width, pad top), glove, blocker, paddle and blade now come from a stepped table of typical retail sizes by barefoot height, [docs/research/03-gear-sizing-by-height.md](../../docs/research/03-gear-sizing-by-height.md) §6, with junior pads one size up (Bauer). The body ratios above are unchanged. That research also corrects two details in `01`: GoalieMonkey's ATK is ankle bone to kneecap, and the paddle chart is Bauer's, not CCM's.
