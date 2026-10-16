# 04: Which goalie model dimensions move "% covered"

Step 1 of issue #1 ("Refine the goalie model against real goalies"). Each model dimension was changed by ±10% across a fixed set of Setups, and the change in "% covered" was recorded. The goal is to rank the dimensions, so that only the ones that matter get researched and fixed. Vocabulary follows `GLOSSARY.md`.

Run 2026-10-16 against commit `56f0e67`.

## Method

**Pipeline.** The script uses the app's own modules, in the same order as `main.ts`: `setStance` → `applyFollow` → `solvePose` → `placeGoalie` → `goalieParts` → `HullCache` → `hullToWorld` → `computeCoverage`. When bundling, two hooks wrap `goalieDims` and `goalieParts`, so a changed size goes through posing **and placement**. A bigger pad changes `frontReach`, and so moves the goalie on the arc; at the post, the body's shape decides where `postSpot` puts the goalie. Nothing in `src/` was changed.

**Setups.** There are 24, all with the glove on the left, Follow on, and the top of the crease (arc 72 in), unless the Setup is locked to the post:

| | Slot (0, 6) | Dot (6.7, 6.1) | Sharp angle (−3.2, 1.0) |
|---|---|---|---|
| Stand-up | ✓ | ✓ | ✓ |
| Butterfly | ✓ | ✓ | ✓ |
| RVH right (at post) | | | ✓ |
| Overlap right (at post) | | | ✓ |

Each Setup is run at three heights, using the default hand spots for its Stance:
- youth 50 in (4′2″),
- junior 56 in (4′8″, the coach's goalie),
- senior 72 in (6′0″).

**Changes.**
- Sizes are changed by ±10%.
- Leg *directions* are turned by ±5°. Ten per cent of a component close to zero means nothing.
- The default hand spots are coach settings, not part of the model. They are reported separately, for scale.

**Score.** For each Setup, the score is max(|Δ−|, |Δ+|) in percentage points (pp) of "% covered".
- **mean** is the average of that score over the Setups the dimension applies to.
- **+ − −** is the average of (Δ+ − Δ−), so a positive value means bigger covers more.
- **holes** counts the Setups where the number of named holes (>0.2% of the net) changed.

## Baseline

| Setup | youth | junior | senior |
|---|---:|---:|---:|
| Stand-up / slot | 59.0 | 65.2 | 70.0 |
| Butterfly / slot | 60.8 | 73.0 | 85.8 |
| Stand-up / dot | 71.8 | 81.1 | 87.0 |
| Butterfly / dot | 67.5 | 79.0 | 92.3 |
| Stand-up / sharp | 88.5 | 84.7 | **72.5** |
| Butterfly / sharp | 99.9 | 100.0 | 100.0 |
| RVH right / sharp | 80.4 | 82.1 | 86.3 |
| Overlap right / sharp | 94.8 | 92.2 | **81.4** |

### At the sharp angle, a bigger goalie covers less in Stand-up and Overlap

At first this looked like a placement bug, but it isn't.

- **The goalie is where it should be.** In Stand-up, Follow puts it at about (−1.45, 0.44), on the line from the Puck to the middle of the net. That is outside the post in x but in front of the goal line, between the Puck and the net.
- **The open area is one hole between the legs.** It is a five-hole spreading across the middle of the net (senior: x −0.67…0.88 m, y 0.23…1.01 m).
- **That gap is magnified about 6×.** The Puck is 1 m off the goal line at about 17° to it. A gap between the skates is stretched about 1.8× because the goalie is halfway to the Puck, and about 3.4× more because the shot hits the goal plane so obliquely.
- **Why size makes it worse:** a taller goalie's skates are further apart, and its upper body projects above the crossbar, where it covers nothing.
- **Checked with placement frozen:** turning the shin ±5° gives the same Δ in Stand-up (the goalie moves 0 cm). In Overlap, the goalie moves 3–4 cm and Δ changes by about 15%. Placement is only a small part of the effect.

So the model is right here, given its Stand-up legs. These Setups are kept in. Close to the net at a sharp angle, the gap between the legs is what decides the result.

## Ranking (body, gear and Stance shape; 24 Setups)

| # | Dimension | kind | mean | max | worst Setup | + − − | holes | Stand-up | Butterfly | RVH | Overlap | youth | junior | senior |
|---:|---|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Stand-up stance width (shin ±5°) | stance | 3.72 | 10.95 | standup/sharp/senior | −5.27 | 3/12 | 3.20 | – | – | 5.28 | 2.49 | 3.20 | 5.45 |
| 2 | Overlap turn to post | stance | 1.83 | 2.32 | overlapR/sharp/senior | −0.43 | 1/3 | – | – | – | 1.83 | 1.28 | 1.88 | 2.32 |
| 3 | leg length (thigh + shank) | body | 1.68 | 7.98 | standup/sharp/senior | −1.97 | 3/24 | 2.05 | 0.60 | 1.91 | 3.59 | 1.22 | 1.49 | 2.33 |
| 4 | pad width | gear | 1.06 | 3.06 | standup/slot/senior | 1.80 | 3/24 | 1.55 | 1.07 | 0.19 | 0.42 | 0.95 | 1.11 | 1.11 |
| 5 | RVH turn to post | stance | 0.96 | 1.78 | rvhR/sharp/senior | 1.76 | 1/3 | – | – | 0.96 | – | 0.71 | 0.39 | 1.78 |
| 6 | RVH side lean | stance | 0.71 | 0.86 | rvhR/sharp/junior | 1.34 | 1/3 | – | – | 0.71 | – | 0.45 | 0.86 | 0.82 |
| 7 | torso length | body | 0.50 | 2.33 | rvhR/sharp/youth | 0.83 | 2/24 | 0.11 | 0.81 | 1.19 | 0.03 | 0.86 | 0.53 | 0.10 |
| 8 | arm length | body | 0.40 | 1.85 | rvhR/sharp/senior | 0.55 | 0/24 | 0.34 | 0.20 | 1.41 | 0.16 | 0.29 | 0.34 | 0.56 |
| 9 | glove size | gear | 0.39 | 1.26 | butterfly/slot/junior | 0.74 | 2/24 | 0.47 | 0.57 | 0.00 | 0.00 | 0.39 | 0.43 | 0.33 |
| 10 | shoulder half-width | body | 0.37 | 0.96 | rvhR/sharp/senior | 0.71 | 1/24 | 0.26 | 0.49 | 0.73 | 0.00 | 0.36 | 0.36 | 0.39 |
| 11 | blocker size | gear | 0.31 | 0.98 | butterfly/slot/senior | 0.59 | 0/24 | 0.36 | 0.42 | 0.16 | 0.00 | 0.26 | 0.39 | 0.28 |
| 12 | stick paddle length | gear | 0.27 | 1.91 | standup/sharp/senior | −0.17 | 0/24 | 0.40 | 0.01 | 0.36 | 0.60 | 0.12 | 0.12 | 0.58 |
| 13 | chest width (the +10 cm) | gear | 0.23 | 0.65 | butterfly/dot/senior | 0.41 | 0/24 | 0.18 | 0.31 | 0.36 | 0.03 | 0.22 | 0.17 | 0.31 |
| 14 | pad depth | gear | 0.22 | 0.95 | standup/sharp/senior | −0.17 | 1/24 | 0.32 | 0.05 | 0.31 | 0.35 | 0.15 | 0.17 | 0.34 |
| 15 | Butterfly pad flare (shin ±5°) | stance | 0.20 | 0.88 | butterfly/slot/junior | −0.38 | 0/9 | – | 0.20 | – | – | 0.25 | 0.31 | 0.05 |
| 16 | arm radii | body | 0.17 | 0.74 | rvhR/sharp/senior | 0.33 | 1/24 | 0.07 | 0.22 | 0.53 | 0.00 | 0.19 | 0.20 | 0.13 |
| 17 | Butterfly knee width (thigh ±5°) | stance | 0.10 | 0.23 | butterfly/slot/senior | −0.07 | 0/9 | – | 0.10 | – | – | 0.09 | 0.07 | 0.16 |
| 18 | head radius | body | 0.10 | 0.69 | rvhR/sharp/youth | 0.19 | 1/24 | 0.00 | 0.12 | 0.45 | 0.01 | 0.18 | 0.10 | 0.03 |
| 19 | Stand-up/Overlap lean | stance | 0.07 | 0.15 | standup/dot/junior | 0.07 | 0/12 | 0.07 | – | – | 0.06 | 0.08 | 0.09 | 0.04 |
| 20 | pelvis box (no pants) | gear | 0.05 | 0.64 | overlapR/sharp/senior | −0.03 | 0/24 | 0.00 | 0.04 | 0.01 | 0.30 | 0.02 | 0.03 | 0.11 |
| 21 | thigh/shin radii | body | 0.04 | 0.45 | rvhR/sharp/senior | 0.07 | 0/24 | 0.00 | 0.01 | 0.32 | 0.00 | 0.03 | 0.03 | 0.06 |
| 22 | Butterfly lean | stance | 0.04 | 0.10 | butterfly/dot/senior | 0.07 | 0/9 | – | 0.04 | – | – | 0.04 | 0.04 | 0.05 |
| 23 | stick blade length | gear | 0.03 | 0.34 | standup/dot/senior | 0.03 | 0/24 | 0.07 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.08 |
| 24 | RVH far skate spread | stance | 0.02 | 0.07 | rvhR/sharp/youth | 0.04 | 0/3 | – | – | 0.02 | – | 0.07 | 0.00 | 0.00 |
| 25 | chest depth | gear | 0.01 | 0.08 | standup/dot/youth | 0.03 | 0/24 | 0.01 | 0.01 | 0.03 | 0.00 | 0.02 | 0.01 | 0.01 |
| 26 | hip half-width | body | 0.00 | 0.04 | rvhR/sharp/youth | −0.01 | 0/24 | 0.00 | 0.00 | 0.03 | 0.00 | 0.00 | 0.00 | 0.01 |
| 27 | pad rise (above the knee) | gear | 0.00 | 0.03 | butterfly/dot/junior | 0.01 | 0/24 | 0.00 | 0.01 | 0.00 | 0.00 | 0.01 | 0.01 | 0.00 |

**Default hand spots, for scale (±10%):** blocker out 0.57, glove height 0.46, blocker height 0.40, glove out 0.37. A 10% change in where the coach puts the hands matters about as much as glove size.

## Findings

1. **The gap between the skates matters most.** Stand-up stance width (3.7) and leg length (1.7) sit at the top, and most of that comes from the sharp-angle Setups (Stand-up and Overlap), where the five-hole is magnified about 6×. A wider stance or longer legs *lower* coverage there: the gap grows, and the extra height goes over the crossbar.
2. **Stand-up and Butterfly from the slot and the dot:** pad width matters most (1.6 pp in Stand-up, 1.1 in Butterfly). Next come glove size, blocker size, shoulder width and leg length, at 0.4–0.7 each.
3. **Post Stances:** how far the goalie turns to the post matters (Overlap 1.8, RVH 1.0), and so does RVH's side lean (0.7). Exactly where they stand at the post plays only a small part (see the frozen-placement check).
4. **The issue's guesses, checked:**
   - Torso width: **no**. Shoulder width is 0.37, the extra chest width 0.23 and chest depth 0.01.
   - Butterfly pad flare: **no**. It's 0.20, and knee width is 0.10.
   - Glove size: **yes**, but mid-table (0.39).
   - Head and arms hardly matter: **yes**. Head 0.10, arm radii 0.17.
5. **Youth proportions:** what matters is leg and torso length (1.68 and 0.50), the ratios where children differ from adults. Head size (0.10, youth 0.18) isn't worth a youth correction.
6. **Not worth modelling better:** pants or the pelvis box, chest depth, arm-pad bulk, pad rise, pad depth, hip width and blade length. All are ≤ 0.2 pp on average.

## What this means for issue #1

- **Step 3 candidates, in order:**
  1. the Stand-up legs: how far apart the skates and knees are, so the five-hole is the right size;
  2. youth leg/torso ratios;
  3. pad width by height;
  4. how far RVH and Overlap turn to the post, and RVH's side lean;
  5. glove and blocker sizes below senior (still marked `*` in `03-gear-sizing-by-height.md`).
- **What the step 2 photos should measure:** skate spacing and the gap between the knees in Stand-up (one photo from the slot and one from a sharp angle), leg length relative to torso, pad face width as it appears from the slot, and the angle to the post in RVH and Overlap.
- **Can be dropped from the issue:** chest protector shape, pants, arm-pad bulk and the pad knee stack.

## Caveats

- These are local, one-at-a-time sensitivities at ±10%. They don't capture interactions, such as a wider pad combined with a wider stance.
- Hole counts jump when a gap opens or closes. Some 0 pp results sit right next to such a jump, for example the five-hole closing at the sharp angle.
- The ranking depends on the Setups chosen. Butterfly at the sharp angle is fully covered (99.9–100%), so it contributes almost nothing. The sharp-angle Setups, by contrast, put a lot of weight on the gap between the legs.
- The Puck is on the ice in every Setup, as in the app. A raised shot would see the gap between the legs less, and the upper body more.
