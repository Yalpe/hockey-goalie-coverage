# 01: Real-world dimensions (Hockey Canada) and deriving gear from height

Answers the open question in `issues/goalie-coverage-mvp/01-dimensions.md`. Vocabulary follows `GLOSSARY.md` (Goal Mouth, Crease, Puck, Stance, Glove Hand, Blocker Hand).

**Governing source:** Hockey Canada (HC) Playing Rules 2026-2028, effective 2026-27 season. NHL 2024-25 and IIHF 2026/27 are given only to point out where they differ.

## Sources (primary)

| Key | Document | URL |
|---|---|---|
| HC | Hockey Canada Playing Rules 2026-2028 (English) | https://cdn.hockeycanada.ca/hockey-canada/Hockey-Programs/Officiating/Downloads/2026-28-hc-rulebook-e.pdf |
| HC-RTG | Hockey Canada Rink Technical Guidelines, Aug 2024 (mirrored by Hockey Saskatchewan) | https://hockeysask.ca/pub/./Members/MHA%20Portal/hockey-canada-rink-technical-guidelines---august-2024.pdf |
| NHL | NHL Official Rules 2024-25 | https://media.nhl.com/site/asset/public/ext/2024-25/2024-25Rules.pdf |
| IIHF | IIHF Official Rule Book 2026/27 v1.0 | https://blob.iihf.com/iihf-media/iihfmvc/media/downloads/rule%20book/2026-27_iihf_rule_book.pdf |
| W | D.A. Winter, *Biomechanics and Motor Control of Human Movement*, 4th ed. (2009), Fig. 4.1: segment lengths as fractions of body height H, after Drillis & Contini (1966) | (book) |
| GM | GoalieMonkey leg-pad sizing chart (retailer, multi-brand) | https://goaliemonkey.com/learn/goalie-leg-pad-sizing-chart |
| SFS | Source For Sports, CCM goalie-stick product pages with paddle-by-height chart (retailer) | https://www.sourceforsports.ca/products/ccm-extreme-flex-youth-goalie-stick |

I read all three rulebooks as downloaded PDFs. Manufacturers mostly publish their size charts as images on product pages, so the retail figures below come from retailer copies of those charts. Treat them as typical values, not limits.

---

## 1. Rink and goal

### Goal line
- **HC 1.3(a):** a red line 5.08 cm (2 in) wide, "marked 3.35 m (11 ft) from each end of the rink, parallel to the end boards."
- **HC-RTG:** the goal line is 3.35 m on every surface, including small ones. Measurements are taken "from the back of the goal line," meaning the edge nearer the end boards.
- **NHL 1.5:** 11 ft, which agrees with HC.
- **IIHF 1.5:** **4.0 m.** This is a conflict with HC and the NHL.
- The scene only needs the end boards for context, so placing them 3.35 m behind the goal line is enough. HC 1.2(a) adds a corner radius of 8.53 m (28 ft) and a board height of 1.02–1.22 m.

### Goal frame and Goal Mouth
- **HC 1.4(b):** posts are 1.83 m (6 ft) apart measured from the inside of the posts, and stand 1.22 m (4 ft) high. "The outside measurement of both the goal posts and the cross bar will be **5.08 cm (2 in.) in diameter**." The Goal Mouth is therefore **1.83 × 1.22 m inside the posts and bar**.
- **HC-RTG (Goal Posts and Netting):** the goal "will have a **depth of 111.76 cm (44 in.)**. The base of the goal is rounded with **45.7 cm (18 in.) radii** and an overall width of **223.5 cm (88 in.)**." Posts, crossbar and exterior framework are red (HC 1.4(d)). The net is white nylon with 6.35 cm mesh, and the skirt rises no more than 2.54 cm above the base (HC 1.4 Notes).
- **NHL 2.1 and the approved goal-frame diagram (p. v):** 6 ft × 4 ft inside, but the frame is **2 3/8 in OD Schedule-40 pipe (60.3 mm)**, the base depth is **40 in**, the base corners are R20 in, and the posts are 74 3/8 in centre-to-centre. The diagram also labels an 18 in dimension at the top "short angle" elbow. That is most likely the depth of the top frame back from the crossbar, but the text extraction does not show this unambiguously. **Unverified.**
- **IIHF 2.1:** 1.83 × 1.22 m inside. The text gives no post diameter or depth.
- **HC gives no top-frame shape.** For modelling, I propose a standard "Mylec-style" frame: a base that runs back 44 in (HC) with 18 in corner radii, and a top return of about 18 in (0.46 m) from the crossbar down to the back of the base. This is cosmetic only. Coverage is computed on the Goal Mouth plane, so the frame shape behind it does not change the result.
- **Placement:** the posts sit on the goal line. IIHF 2.1 says the peg holes must be "exactly on the goal line". Treat the Goal Mouth plane as the goal-line plane, as `GLOSSARY.md` already does.

### Crease
- **HC 1.5(b) and HC-RTG:** a **pure semicircle of radius 1.82 m (6 ft)**, centred on the midpoint of the goal line, with a 5.08 cm red line. The radius is **"measured from the back of the goal line"** (HC-RTG). Small 12.7 cm (5 in) L-marks sit where an imaginary line 1.22 m (4 ft) out from the goal line meets the arc. The interior is light blue. Per HC 1.5(c), the crease volume "extend[s] vertically to the level of the top of the goal frame."
- **NHL 1.7 (conflict):** a truncated semicircle. Straight side lines start 1 ft outside each post, run 4 ft 6 in out at right angles to the goal line, and are joined by a 6 ft radius arc. The 5 in marks are 4 ft out.
- **IIHF 1.7:** refers to the Appendix VI infographic. The extracted labels show 183 cm, consistent with a 1.83 m radius, but I could not confirm the exact outline from the text. **Partially verified.**
- **For the scene:** use the HC semicircle, R = 1.83 m, measured from the back edge of the goal line.

### Puck
- **HC 3.8(a):** vulcanized rubber, **2.54 cm (1 in) thick, 7.62 cm (3 in) diameter**, 156–170 g (5.5–6 oz), black. U9 and below may use a lighter puck (at least 113.4 g) of the same size.
- **NHL 13.1:** 1 × 3 in, 5.5–6 oz, which matches HC.
- **IIHF:** 2.5 × 7.6 cm, 156–170 g, which matches within rounding.

---

## 2. Goaltender equipment limits

HC limits are the same for every age group. HC Rule 3.5 has no youth-specific maximums, so youth gear is limited only by what manufacturers make.

| Item | Hockey Canada (2026-28) | NHL (2024-25) | IIHF (2026/27) |
|---|---|---|---|
| Leg pad width | ≤ 27.94 cm (11 in), measured on goalie (3.5(b)) | ≤ 11 in extreme width on leg (11.2) | ≤ 28 cm (11.2) |
| Leg pad length | **≤ 96.52 cm (38 in)**, measured on goalie (3.5(b)) | **No fixed length.** Per-goalie "Limiting Distance Size" = floor-to-knee + 45% × knee-to-pelvis + 4 in skate allowance, a vertical measure from the ice (11.2) | No length limit in the text |
| Pad boot | ≥ 17.78 cm (7 in) | ≥ 7 in; pad depth ≤ 10.5 in | n/a |
| Blocker board | ≤ 20.3 cm × 38.1 cm (8 × 15 in), bindings **excluded** (3.5(c), Note 1) | ≤ 8 × 15 in, bindings **included**, rectangular; thumb flap ≤ 7 in (11.7) | ≤ 20.5 × 38.5 cm; thumb ≤ 18.0 cm (11.7) |
| Catching glove | Circumference ≤ 114.3 cm (45 in); heel to top of T ≤ 46 cm (18 in); base width ≤ 20.32 cm (8 in) (3.5(c)) | Perimeter ≤ 45 in; heel to T ≤ 18 in; cuff 4 in wide, ≤ 8 in long (11.6) | Perimeter ≤ 114.5 cm; heel to T ≤ 46.0 cm; cuff 10.5 cm wide, ≤ 20.5 cm long (11.6) |
| Stick overall | ≤ 1.40 m (55 in), heel to end of shaft (3.3(c)) | Not stated for goalies in the excerpt read (players: 63 in) | n/a |
| Stick blade | ≤ 39.37 cm (15.5 in) long; width 7.62–8.89 cm (3–3.5 in); heel ≤ 11.43 cm (4.5 in) (3.3(c)) | ≤ 15.5 in long; ≤ 3.5 in wide; heel ≤ 4.5 in (10.2) | ≤ 39.5 cm; ≤ 9.0 cm wide; heel ≤ 11.5 cm; curve ≤ 1.5 cm (10.2) |
| Paddle (widened shaft) | ≤ 66.04 cm (26 in) from heel; width 7.62–8.89 cm (3–3.5 in) | ≤ 26 in from heel; ≤ 3.5 in wide | **≤ 71 cm (28 in)** from heel; ≤ 9.0 cm wide |
| Chest/arm | Elbow layering ≤ 17.78 cm; shoulder cap ≤ 2.54 cm above shoulder; clavicle protectors ≤ 17.78 cm wide (3.5(d)) | Anatomically proportional, measured per goalie (11.3) | Anatomically proportional (11.3) |

**Conflicts worth knowing:**
- **Pad height:** HC uses a flat 38 in cap. The NHL ties pad height to the goalie's own leg measurements, which is exactly the "derive from body" idea this project needs.
- **IIHF paddle:** 28 in, against 26 in for HC and the NHL.
- **Goal line:** IIHF uses 4.0 m, against 11 ft for HC and the NHL.
- **Crease:** the NHL uses a truncated shape.
- **Post diameter:** the NHL frame is 2 3/8 in, against 2 in for HC.
- **Net depth:** the NHL is 40 in, against 44 in in the HC guidelines.

## 3. Retail size bands (typical, not limits)

**Leg pads** (GM chart, multi-brand). The nominal size is the pad's length in inches, worn with a "+1/+2" thigh-rise option. Shops size pads by ATK, the barefoot floor-to-mid-kneecap measurement:

| Band | Nominal pad length | ATK range | Width |
|---|---|---|---|
| Youth | 19–23 in | ~10.25–13.5 in | not published by GM (about 9–10 in is typical, **unverified**) |
| Junior | 24–30 in | ~13–16.5 in | not published |
| Intermediate | 29–32 in | ~15–18 in | about 10.5–10.75 in core (GM) |
| Senior | 32–36 in (+1/+2) | ~16.5–20 in | 11 in (GM) |

Ratio check: nominal pad length ≈ 1.8–1.9 × ATK in every band. Vaughn and Bauer charts quoted on retailer pages differ by about ±1 in, especially at junior and intermediate.

**Goalie stick paddle** (SFS, which repeats a CCM chart):

| Band | Paddle | Typical age and height |
|---|---|---|
| Youth | 18–20 in | up to about 4'2" |
| Junior | 21–22 in | about 4'0"–4'6" |
| Intermediate | 23–24 in | about 4'6"–5'6" |
| Senior | 25–27 in | about 5'6"–6'1"+ |

Brands measure paddle length differently. CCM's "universal paddle length" runs heel to shaft and reads about 2 in longer than its nominal size. That explains why a retail "27 in" paddle can still be legal under a 26 in rule.

**Blocker and glove:** retailers size these by hand length (palm heel to middle fingertip): youth about 4.5–5.75 in, junior about 5.75–6.3 in, intermediate about 6.3–7 in, senior about 7–8.5 in. I found no primary source that publishes youth or intermediate board dimensions, so section 4 scales them down from the senior maximum.

---

## 4. Proposed derivation rule: everything from height H

Design intent: one input (H, the barefoot height in metres). Body segments come from standard adult ratios. Gear is sized by the same logic the NHL uses for pads, capped by the HC limits. All values are coarse and good for a visualiser, not for fitting real equipment.

### 4.1 Body: Winter / Drillis–Contini ratios (fractions of H)

| Landmark / segment | Ratio | Notes |
|---|---|---|
| Eye height | 0.936 | |
| Chin height | 0.870 | head (chin to top) = 0.130 |
| Shoulder (acromion) height | 0.818 | |
| Chest (nipple) height | 0.720 | |
| Elbow height | 0.630 | |
| Hip (greater trochanter) height | 0.530 | |
| Wrist height | 0.485 | |
| Knee height | 0.285 | |
| Ankle height | 0.039 | |
| Shoulder width (biacromial) | 0.259 | |
| Hip width | 0.191 | |
| Upper arm | 0.186 | |
| Forearm | 0.146 | |
| Hand | 0.108 | |
| Thigh (hip to knee) | 0.245 | |
| Shank (knee to ankle) | 0.246 | |
| Foot length / breadth | 0.152 / 0.055 | |

**Caveat:** these are adult ratios. Young children have relatively larger heads and shorter legs, with sitting height about 55–57% of stature at age 6 against about 52% in adults. This comes from general growth-reference knowledge and is **not sourced here**. For a coarse visualiser the adult ratios are defensible. Optionally, for H < 1.40 m, add 0.01–0.02·H of head height taken from leg length.

**Skates:** raise the whole body by **s = 0.10 m (4 in)**, the NHL's own skate allowance in Rule 11.2.

### 4.2 Gear

Let `in = 0.0254` and `g = clamp(H / 1.83, 0.6, 1.0)`. The gear scale factor g reaches 1 at 6'0", where senior gear is at its legal maximum.

| Item | Rule | Basis |
|---|---|---|
| Pad top height above ice, standing | `0.285H + 0.45·0.245H + 0.1016 = 0.395H + 0.1016` | NHL Limiting Distance formula with Winter knee and hip ratios. It puts the pad top 45% of the way up the thigh. The HC 38 in cap never binds below about 2.2 m |
| Pad width (each) | `clamp(0.155H, 0.20, 0.2794)` m | Matches 11 in at H ≈ 1.80 and about 10.4 in at 1.70 (intermediate) |
| Pad depth | `≈ 0.14H`, ≤ 0.267 m (10.5 in) | NHL 11.2 depth limit, scaled |
| Blocker board | `g · (8 × 15 in)` = `g · (0.203 × 0.381 m)`, about 0.05 m thick | HC 3.5(c) maximum, scaled |
| Catching glove face | ellipse `g · (17.5 × 10.5 in)` = `g · (0.445 × 0.267 m)` | An ellipse of 17.5 × 10.5 in has a perimeter of about 44.7 in, so it fits the 45 in limit at the maximum. This is a modelling simplification, not a published shape |
| Stick blade | 15.5 × 3.5 in at H ≥ 1.70, else × g | HC 3.3(c) |
| Paddle (widened portion) | length `clamp(0.37·H/in, 18, 26)` in; width 3.5 in (3 in if g < 0.8) | Fits the SFS height bands; capped at the HC 26 in |
| Stick overall | `min(1.40, 0.75H)` m | Capped at HC 55 in |
| Chest/arm shell | torso box `shoulder width 0.259H + 2·0.05` m wide | Shoulder caps ≤ 1 in above shoulder (HC 3.5(d)) |

Worked check (computed from the rules above):

| H | Pad top | Pad width | g | Blocker | Glove ellipse | Paddle |
|---|---|---|---|---|---|---|
| 1.20 m (3'11") | 0.576 m (22.7 in) | 0.200 m (7.9 in) | 0.66 | 5.2 × 9.8 in | 11.5 × 6.9 in | 18 in |
| 1.40 m (4'7") | 0.655 m (25.8 in) | 0.217 m (8.5 in) | 0.77 | 6.1 × 11.5 in | 13.4 × 8.0 in | 20.4 in |
| 1.60 m (5'3") | 0.734 m (28.9 in) | 0.248 m (9.8 in) | 0.87 | 7.0 × 13.1 in | 15.3 × 9.2 in | 23.3 in |
| 1.70 m (5'7") | 0.773 m (30.4 in) | 0.264 m (10.4 in) | 0.93 | 7.4 × 13.9 in | 16.3 × 9.8 in | 24.8 in |
| 1.80 m (5'11") | 0.813 m (32.0 in) | 0.279 m (11.0 in) | 0.98 | 7.9 × 14.8 in | 17.2 × 10.3 in | 26 in |
| 1.90 m (6'3") | 0.852 m (33.5 in) | 0.279 m (11.0 in) | 1.00 | 8.0 × 15.0 in | 17.5 × 10.5 in | 26 in |

Sanity check against retail: a 1.80 m goalie has an ATK of about 0.513 m (20.2 in). Retail charts would put him in a 35–36 in (+1) senior pad. The *nominal* pad length is longer than the *vertical* pad-top height (32 in) because the boot wraps over the skate toe and the pad curves. For the scene, the vertical pad-top height is what matters.

---

## 5. Code-ready constants

Origin suggestion: ice level, at the midpoint of the goal line's *back* edge. Hockey Canada governs unless marked otherwise.

| Constant | Metres | Inches | Source |
|---|---|---|---|
| GOAL_MOUTH_WIDTH (inside posts) | 1.8288 | 72 | HC 1.4(b) |
| GOAL_MOUTH_HEIGHT (ice to underside of bar) | 1.2192 | 48 | HC 1.4(b) |
| POST_BAR_DIAMETER | 0.0508 | 2 | HC 1.4(b) (NHL 0.0603 / 2.375) |
| NET_BASE_DEPTH | 1.1176 | 44 | HC-RTG (NHL 1.016 / 40) |
| NET_BASE_CORNER_RADIUS | 0.4572 | 18 | HC-RTG (NHL 0.508 / 20) |
| NET_BASE_OVERALL_WIDTH | 2.2352 | 88 | HC-RTG |
| NET_TOP_DEPTH (proposed, cosmetic) | 0.457 | 18 | NHL diagram reading, **unverified** |
| GOAL_LINE_WIDTH | 0.0508 | 2 | HC 1.3(a) |
| GOAL_LINE_TO_END_BOARDS | 3.3528 | 132 (11 ft) | HC 1.3(a) (IIHF 4.0 m) |
| CREASE_RADIUS (from back of goal line) | 1.8288 | 72 | HC 1.5(b) (HC prints 1.82 m) |
| CREASE_LINE_WIDTH | 0.0508 | 2 | HC 1.5(a) |
| CREASE_L_MARK_OFFSET / LENGTH | 1.2192 / 0.127 | 48 / 5 | HC 1.5(b) |
| BOARD_CORNER_RADIUS | 8.5344 | 336 (28 ft) | HC 1.2(a) |
| PUCK_DIAMETER | 0.0762 | 3 | HC 3.8(a) |
| PUCK_THICKNESS | 0.0254 | 1 | HC 3.8(a) |
| PAD_WIDTH_MAX | 0.2794 | 11 | HC 3.5(b) |
| PAD_LENGTH_MAX | 0.9652 | 38 | HC 3.5(b) |
| PAD_BOOT_MIN | 0.1778 | 7 | HC 3.5(b) |
| PAD_DEPTH_MAX | 0.2667 | 10.5 | NHL 11.2 |
| BLOCKER_MAX (w × l) | 0.2032 × 0.381 | 8 × 15 | HC 3.5(c) |
| GLOVE_PERIMETER_MAX | 1.143 | 45 | HC 3.5(c) |
| GLOVE_HEEL_TO_T_MAX | 0.4572 | 18 | HC 3.5(c) |
| GLOVE_BASE_WIDTH_MAX | 0.2032 | 8 | HC 3.5(c) |
| GLOVE_FACE_ELLIPSE (proposed) | 0.445 × 0.267 | 17.5 × 10.5 | derived |
| STICK_LENGTH_MAX | 1.397 | 55 | HC 3.3(c) |
| BLADE_LENGTH_MAX | 0.3937 | 15.5 | HC 3.3(c) |
| BLADE_WIDTH (min–max) / HEEL_MAX | 0.0762–0.0889 / 0.1143 | 3–3.5 / 4.5 | HC 3.3(c) |
| PADDLE_LENGTH_MAX (from heel) | 0.6604 | 26 | HC 3.3(c) (IIHF 0.71 / 28) |
| PADDLE_WIDTH (min–max) | 0.0762–0.0889 | 3–3.5 | HC 3.3(c) |
| SKATE_LIFT | 0.1016 | 4 | NHL 11.2 allowance |
| GEAR_SCALE g | clamp(H/1.83, 0.6, 1) | | proposed |
| PAD_TOP(H) | 0.395H + 0.1016 | | NHL 11.2 + Winter |
| PAD_WIDTH(H) | clamp(0.155H, 0.20, 0.2794) | | proposed |
| PADDLE_LEN(H) | clamp(0.37H/0.0254, 18, 26) in | | SFS fit, HC cap |
| STICK_LEN(H) | min(1.397, 0.75H) | | proposed |
| SHOULDER_W / HIP_W | 0.259H / 0.191H | | Winter |
| SHOULDER_H / HIP_H / KNEE_H (barefoot) | 0.818H / 0.530H / 0.285H | | Winter |
| UPPER_ARM / FOREARM / HAND | 0.186H / 0.146H / 0.108H | | Winter |
| THIGH / SHANK / FOOT | 0.245H / 0.246H / 0.152H | | Winter |
| HEAD (chin to top) | 0.130H | | Winter |
