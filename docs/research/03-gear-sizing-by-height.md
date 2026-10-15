# 03: Gear sizing by barefoot height (stepped lookup)

Replaces the linear gear rules in `01-dimensions.md` §4.2 with a stepped table keyed by the goalie's **barefoot height H in whole inches** (43–79 in, 3'7"–6'7"). Body proportions still come from `01-dimensions.md` §4.1. Vocabulary follows `GLOSSARY.md`.

Researched 2026-10-15. Manufacturers publish almost every chart as an image or inside a JavaScript size-guide widget, so most values below come from retailer copies of a named maker's chart. The maker is given for each one. Where a page only rendered through a script, I downloaded the raw HTML and read the size-guide table directly. Pages I could not read are listed as such.

## Sources

| Key | What it is (maker → where read) | URL |
|---|---|---|
| BA-PAD | **Bauer** "Goalie Pad Size Guide": level, size, pad size, shin (floor-to-knee) height, **pad width**. Read from the HTML size-guide table on Source for Sports' Bauer GSX pad pages; the same rows are reproduced by True North (TN) | https://www.sourceforsports.ca/products/bauer-gsx-senior-goalie-pads-2026 , https://www.sourceforsports.ca/products/bauer-gsx-junior-goalie-pads-2026 |
| CCM-PAD | **CCM** leg-pad chart: pad size, **goalie height**, floor-to-knee, sizes 20–37. Read via True North's reproduction | https://truenorthgoaltending.com/how-to-size-goalie-pads/ |
| CCM-JR | **CCM** junior pad chart (24"+1 to 30"+1, with height and FTK), on Ice Warehouse's CCM Phenom page | https://www.icewarehouse.com/CCM_Phenom/descpage-PHELP.html |
| BR-PAD | **Brian's** leg-pad chart: pad size, ankle-to-knee, **thigh rise = knee centre to pad top**, sizes 21–38+1. Read via True North | https://truenorthgoaltending.com/how-to-size-goalie-pads/ |
| TR-PAD | **True** leg-pad chart: size vs FTK (31–37) and knee-to-top by +0…+4 rise. Read via True North | https://truenorthgoaltending.com/how-to-size-goalie-pads/ |
| TN | True North Goaltending pad-sizing guide (coaching site; reproduces the Bauer, CCM, Brian's and True charts and gives fit guidance) | https://truenorthgoaltending.com/how-to-size-goalie-pads/ |
| IW-FIT | Ice Warehouse "How to size a goalie leg pad" (retailer guide): knee centred on the knee block; thigh-rise size defined as mid-kneecap to top; 34"+1 → 11.5 in, 34"+2 → 12.5 in | https://www.icewarehouse.com/lc/goalie-gear/how-to-size-a-goalie-leg-pad.html |
| GM | GoalieMonkey leg-pad sizing (retailer, multi-brand; the brand charts on it are images I could not read). Same source as `01` key GM | https://goaliemonkey.com/learn/goalie-leg-pad-sizing-chart |
| GC | Goalie Coaches pad chart (coaching site, says one chart covers Warrior/CCM/Brian's/Vaughn/True; **not a maker chart**), with heights | https://goaliecoaches.com/goalie-pad-sizing/ |
| GM-GLV | GoalieMonkey glove size chart by hand length (no maker named; numbers match Bauer's chart on SFS glove pages per search results) | https://www.goaliemonkey.com/learn/youth-goalie-glove-size-chart |
| GM-BLK | GoalieMonkey Bauer Prodigy youth blocker page, "Measurement" note on matching glove and blocker to the pad age group | https://www.goaliemonkey.com/bauer-goalie-blockers-prodigy-youth-24.html |
| BA-STK | **Bauer** "Goalie Stick Size Guide": paddle, age, height. Read from the HTML size guide on a Bauer stick page at Source for Sports. **The same rows appear, without the Bauer label, on the CCM stick page that `01` cites as key SFS** | https://www.sourceforsports.ca/products/bauer-gsx-junior-goalie-stick-2026-p31 |
| CCM-STK | **CCM** stick charts on Ice Warehouse: CCM paddle vs "universal" paddle (heel of blade to start of shaft), height, age | https://www.icewarehouse.com/CCM_Phenom/descpage-PHGSJ.html , https://www.icewarehouse.com/CCM_YTFlex/descpage-EYG.html |
| MEGA | MEGA Goaltending stick guide (coaching site, no maker named): paddle ranges by height | https://megagoaltending.com/blog/goalie-stick-sizing-guide/ |
| HSM | HockeyStickMan stick guide (retailer; its chart is an image I could not read, text only) | https://www.hockeystickman.ca/blogs/news/goalie-stick-sizing-guide-and-sizing-chart |
| HC | Hockey Canada Playing Rules 2026-2028 (see `01-dimensions.md`) | https://cdn.hockeycanada.ca/hockey-canada/Hockey-Programs/Officiating/Downloads/2026-28-hc-rulebook-e.pdf |
| NHL | NHL Rule 11.2, 4 in skate allowance (see `01-dimensions.md`) | https://media.nhl.com/site/asset/public/ext/2024-25/2024-25Rules.pdf |
| W | Winter / Drillis–Contini knee height 0.285·H (see `01-dimensions.md` §4.1) | (book) |

**Could not read:** Pure Goalie / Pure Hockey sizing pages (Cloudflare 403). The Hockey Shop's Vaughn and Bauer product pages (404, or the chart not in the page text). Bauer UK product page (404). Every image-only chart on GoalieMonkey and HockeyStickMan. Search-result snippets from these pages are quoted below only where marked **(snippet, unverified)**.

---

## 1. Leg pads

### 1.1 What the charts key on

- **FTK (floor to knee):** barefoot, knee slightly bent, floor to the centre of the kneecap. Used by Bauer, CCM and True (BA-PAD, CCM-PAD, TR-PAD, IW-FIT).
- **ATK (ankle to knee):** "from the center of the ankle bone to the middle of the knee cap" (GM, quoted). Used by Brian's (BR-PAD) and by GM's generic chart.
- **Correction to `01` §3:** that section calls GM's ATK "the barefoot floor-to-mid-kneecap measurement". GM defines it as **ankle bone to kneecap**, which is roughly 1.5–3 in shorter than FTK. The GM ATK columns therefore cannot be compared directly with Bauer or CCM FTK columns.
- **CCM-PAD is the only maker chart that lists height.** GC also lists height, but it is not a maker chart.

### 1.2 Nominal size by height (CCM-PAD) and by FTK

| Pad size (in) | CCM goalie height | CCM FTK (in) | Bauer size and FTK (in) | GC height (cross-check) |
|---|---|---|---|---|
| 20 | 3'10" | < 13 | Youth S, 12.5–13.5 | 19": ≤ 3'9" |
| 21 | 4'0" | 13–13.5 | n/a | 3'11" |
| 22 | 4'2" | 13.5–14 | Youth M, 13–14 | n/a |
| 23 | 4'4" | 14–14.5 | n/a | 4'2" |
| 24 | 4'6" | 15–15.5 | Youth L, 13.5–14.5 | 4'5" |
| 26 | 4'8" | 15.5–16 | Junior S, 14–15 | 4'8" |
| 28 | 5'0" | 16–16.5 | Junior M, 15–16 (Int XS 15–17) | 4'10.5" |
| 29 | 5'2" | 16.5–17 | n/a | n/a |
| 30 | 5'4" | 17–17.5 | Junior L, 16–18 (Int S 16–18) | 5'0" |
| 31 | 5'6" | 17.5–18 | Int M, 17.5–18.5 | 5'4" |
| 32 | 5'8" | 18.5–19.5 | Int L / Sr XS, 18–19 | 5'6" |
| 33 | 5'10" | 19.5–20.5 | Sr S, 19–20 | 5'8" |
| 34 | 6'0" | 20.5–21.5 | Sr M, 19.5–20.5 | 5'10.5" |
| 35 | 6'2" | 22–23 | Sr L, 20–21.5 | 6'0" |
| 36 | 6'4" | 22.5–23.5 | Sr XL, 21.5–22.5 | 6'1.5" |
| 37 | 6'6" | 23.5–24.5 | Sr XXL, 22.5+ | 6'3" |

CCM-JR lists the junior sizes as **24"+1 … 30"+1**, at 4'8", 4'10", 5'0" and 5'4". Its 24" row says 4'8", while the full CCM-PAD chart puts 4'6" against 24" and 4'8" against 26". The two CCM reproductions therefore disagree by one row at 24–26".

**Check against the body model.** Winter knee height 0.285·H fits CCM's height/FTK pairs to within about 1 in: 3'10" gives 13.1 (CCM < 13), 4'8" gives 16.0 (CCM 15.5–16), 6'0" gives 20.5 (CCM 20.5–21.5) and 6'4" gives 21.7 (CCM 22.5–23.5). Using §4.1's knee ratio alongside these pad charts is therefore consistent.

**Bauer runs about one size larger than CCM for a given FTK** below senior. For example, FTK 15–16 is Bauer 28" but CCM 24–26".

### 1.3 Thigh rise

- CCM junior pads are sold as **+1** (CCM-JR). Brian's lists youth sizes 21/23/25 **without** a "+" and 27+1 and up **with +1** (BR-PAD). CCM youth sizes 20/22 are listed without a "+" (CCM-PAD).
- "+1 thigh rise is typical and it is uncommon to see a goalie wear any more than +2" (GM). GC says most pads come standard with +1, and that +1.5 and +2 are custom orders.
- Vaughn sells V10 junior, intermediate and senior pads as **+2** (snippet from The Hockey Shop, unverified; the product pages returned 404).
- **Rule used in the table:** +0 for sizes ≤ 23 in, and +1 for 24 in and up.

### 1.4 Pad face width (BA-PAD, the only maker chart with widths)

| Bauer size | Youth S/M/L | Junior S/M/L | Int XS/S/M/L | Senior (all) |
|---|---|---|---|---|
| Pad size (in) | 20 / 22 / 24 | 26 / 28 / 30 | 28 / 30 / 31 / 32 | 32–37 |
| **Width (in)** | **7.75 / 8.25 / 8.75** | **9 / 9.5 / 10** | **10 / 10.25 / 10.5 / 10.5** | **11** |

GM also says "most brands use a 10.5" or 10.75" core" for intermediate and 11 in for senior, which agrees. A Bauer UK listing reportedly gives youth M/L as 9.25 and 9.75 in, which conflicts with the figures above (snippet, unverified; page 404). The 11 in senior width equals the HC 3.5(b) maximum.

### 1.5 Pad top height on ice: how nominal size maps to vertical height

The makers tie fit to the knee. "Properly sized pads have the knee sitting comfortably in the middle of the knee block" (TN). The knee "should sit centered on the knee block when you're in your game-ready stance" (IW-FIT). Brian's, True and the IW-FIT example then publish the **distance from the knee centre to the pad top** (their "thigh rise" column; it already includes the +rise):

| Pad | Knee → top (in) | Source |
|---|---|---|
| 21 / 23 / 25 | 6.5 / 7 / 7.5 | BR-PAD |
| 27+1 / 29+1 / 30+1 / 31+1 | 9 / 10 / 10.5 / 10.5 | BR-PAD |
| 32+1 / 33+1 / 34+1 | 11 / 11 / 11 | BR-PAD |
| 35+1 / 36+1 / 37+1 / 38+1 | 12 / 12 / 13 / 13 | BR-PAD |
| 32+0 … 37+0 | 9.5 … 12 (= 0.5·size − 6.5) | TR-PAD |
| 34+1 / 34+2 | 11.5 / 12.5 | TR-PAD, IW-FIT |

**Derived rule (mine, not a maker's):**

`pad_top_on_ice = knee_barefoot + skate_lift + knee_to_top(size, rise)`

with `knee_barefoot = 0.285·H` (W), `skate_lift = 4 in` (NHL 11.2) and `knee_to_top` from BR-PAD. The table's in-between sizes are linear interpolations: 20 → 6.25, 22 → 6.75, 24+1 → 8.25, 26+1 → 8.75 and 28+1 → 9.5. That works out to Brian's slope of 0.25 in of knee-to-top per inch of size, plus 1 in for the +1 rise. The interpolated 27+1 lands exactly on Brian's published 9.0.

**Closure check.** The rest of the pad must reach from the knee down towards the ice. For a 6'0" goalie in 34+1: the knee on skates is 20.5 + 4 = 24.5 in, and the pad below the knee is 34 + 1 − 11 = 24 in. That leaves the boot 0.5 in above the ice, which is consistent. For 4'8" in 28+1: the knee is 20.0 in, and the pad below the knee is 19.5 in, which is also consistent. For the smallest youth (3'10", 20"), the pad below the knee is 13.75 in against a knee height of 17.1 in, which would leave a 3.4 in gap. Youth skates are probably shorter than the NHL's 4 in allowance, and child legs are relatively shorter (`01` §4.1 caveat), so the youth pad-top values are probably **0.5–2 in too high**. I found no youth skate stack height to fix this (unverified).

**What this means for `01`:**
- The "pad top ≈ 0.9 × nominal" assumption is **not supported**. The knee-anchored rule gives a pad top of about **1.04–1.09 × nominal for intermediate/senior** (nominal + rise + 0.5–2 in) and about 1.15–1.17 × nominal for youth (see the closure caveat above).
- `01` §4.2's `0.395H + 0.1016` is the **NHL limiting distance**, which caps the pad top at 45% up the thigh. Retail pads sit higher, at about 60–70% up the thigh (K / 0.245H) with Brian's knee-to-top figures. The NHL formula is therefore about 1–4.5 in lower than this table, with the gap growing with height. GM's softer guidance, "pad top should reach the middle of the thigh when standing", gives `0.285H + 0.5·0.245H + 4 in = 0.4075H + 4 in`. That is about 2–3.5 in under the Brian's-based value. Treat it as a lower bound.

### 1.6 Coach data point: 4'8" (1.42 m) youth in 28"+1

- By the **height** charts, 4'8" is a **26"** (CCM-PAD; GC also gives 26" at 4'8" and 28" at 4'10.5"). The coach's goalie is **one size up** from that.
- By **FTK**, Winter gives 16.0 in. That falls in **Bauer Junior M = 28"** (FTK 15–16) and on the CCM boundary between 26" and 28" (15.5–16 | 16–16.5). The coach's 28"+1 is therefore exactly what Bauer's chart predicts.
- IW-FIT also tolerates up-sizing for kids: for younger goalies the kneecap may sit up to 1 in below the knee-stack centre.
- Pad top for the coach's goalie by the §1.5 rule: 15.96 + 4 + 9.5 = **29.5 in (0.75 m)**. For comparison, `01`'s formula gives 26.1 in and 0.9 × 28 gives 25.2 in.
- The table below follows CCM's height column (26"+1 at 56–59 in, pad top 28.7–29.6 in), so it is **0.8 in lower** than the coach's real goalie. If matching this coach matters more than matching CCM, shift the 26/28 boundary down to 56 in, which is Bauer's FTK route.
- **Build choice (coach, 2026-10-15):** the coach's goalie wears Bauer pads, so the build shifts the **junior** rows one size up (Bauer's route): 53 in → 24"+1, 54–55 → 26"+1, 56–61 → 28"+1, with widths and K to match. Youth and senior rows are as in the table below. See `src/posing/gear.ts`.

## 2. Catching glove

- **Size bands by hand length** (heel of palm to middle fingertip; GM-GLV, which matches Bauer's chart per search results): Youth 4.5–5.5 in, Junior 5.5–6.5, Intermediate 6–7, Senior 7–8.5. Other charts differ by about ¼ in. For example, the SFS Bauer catcher pages give Youth 4.5–5.75, Junior 5.75–6.33 and Intermediate 6.33–7 (snippet). Vaughn gives Junior 5.38–6.25 and Brian's gives Junior 5–6 (snippets, unverified).
- **By height/age:** no glove chart keys on height. GM-BLK: "Most manufacturers do not make blocker or glove sizing guidelines for stock options. In most cases, a catch glove and blocker sized to the same age group as the goalie's leg pads should provide a proper fit." The table does exactly this and takes the glove band from the pad band.
- **Dimensions (perimeter, heel-to-T, cuff) per band: not published.** I found no maker or retailer listing them for youth, junior or intermediate gloves. Only the HC/NHL senior maxima exist: perimeter ≤ 45 in, heel-to-T ≤ 18 in, base ≤ 8 in.
- **Derived (mine):** scale `01`'s senior ellipse by the ratio of band mid-hand-length to senior mid-hand-length. That gives Youth 5.0/7.75 = 0.645, Junior 6.0/7.75 = 0.774 and Intermediate 6.5/7.75 = 0.839. The orientation is **width × height = 10.5 × 17.5 in** at senior, with the long axis heel-to-T, which is vertical when the glove faces the shooter. Using pad-width ratios instead would give larger factors (Youth ≈ 0.70–0.80, Junior ≈ 0.82–0.86, Intermediate ≈ 0.93). Treat the hand ratio as a lower bound.

## 3. Blocker

- **Size bands:** the same hand-length bands as the glove. Warrior and CCM charts via SFS give Youth 4.5–5.75, Junior 5.75–6.33, Intermediate 6.33–7 and Senior 7–8.5 in (snippet). The band follows the pad age group (GM-BLK).
- **Board dimensions per band: not published.** I searched maker and retailer pages for Bauer, CCM, Warrior, Brian's, True and Vaughn. Every one gives hand-length bands only. Pure Hockey's guide reportedly says "the size of the blocker board correlates directly with the size of the palm on the glove" (snippet; the page is behind Cloudflare). The only fixed number is the senior maximum of 8 × 15 in (HC 3.5(c), bindings excluded).
- **Derived (mine):** 8 × 15 in × the same hand ratio as the glove.

## 4. Stick

### 4.1 Paddle by height

| Paddle (in) | BA-STK level, age and height | CCM-STK | MEGA (coaching site) |
|---|---|---|---|
| 18 (CCM) = 20 universal | n/a | up to 4', ≤ 7 yrs | n/a |
| 20 | Youth, 5–6 yrs, up to 4'2" | CCM 20 = 22 universal, up to 4' | Youth 18–20, up to 4'2" |
| 21 | Junior, 7–8, 4'0"–4'4" | CCM 21 = 23 universal, 3'9"–4'9", 6–12 yrs | Junior 21–23, 4'0"–4'9" |
| 22 | Junior, 7–8, 4'4"–4'6" | n/a | n/a |
| 23 / 24 | Intermediate, 9–14, **4'6"–4'9"** (both sizes) | CCM 23 = 25 universal, 3'9"–4'9" | Int 23.5–24.5, 4'6"–5'4" |
| 24 (AG5NT only) / 26 / 27 | Senior, 14+, 5'6"–6'1" | n/a | Senior 24+, 5'0"+ |

- **Corrections to `01` §3:** (a) the "CCM chart" there is the **Bauer** Goalie Stick Size Guide (BA-STK). SFS shows the same rows unlabelled on CCM stick pages. (b) Its intermediate rows run 4'6"–4'9", not to 5'6". The chart has **no rows for 4'10"–5'5"** and no 25" paddle.
- **The gap from 4'10" to 5'5"** is filled from MEGA (intermediate 23.5–24.5 in up to 5'4") and HSM (senior "starts at 25"", text only). Both are non-maker sources.
- **Brand offsets:** CCM's nominal paddle is 2 in shorter than its "universal" heel-to-shaft length (CCM-STK). SFS says "Warrior goalie stick sizing is one size above other brands… a Bauer 25" would be nearly equivalent in size to a 26" Warrior" (BA-STK page text). The HC limit is a paddle ≤ 26 in from the heel (`01` §2). Retail senior 27 in sticks therefore have to be capped at 26 in the scene.

### 4.2 Blade length and width

- **No maker chart publishes blade length or width per band.** I searched Bauer, CCM, Warrior and retailer guides, and every one gives paddle length only.
- HC 3.3(c) applies to every age group: blade ≤ 15.5 in, width 3–3.5 in.
- **Derived (mine):** blade length = 15.5 × paddle / 26, capped at 15.5. This assumes the blade scales with the paddle. Blade width is 3.5 in for senior and intermediate, and 3.0 in (the HC minimum) for youth and junior. Both are **unverified**.

---

## 5. Caveats and conflicts

1. **Charts differ by about ±1 size between brands** at any height. Bauer runs about one size larger than CCM below senior (§1.2), and Warrior sticks run one size larger. The table follows CCM for pads, because CCM is the only maker that keys pads by height, and Bauer for paddles.
2. **Height is a secondary key.** Ice Warehouse says that "when height is listed, use it as a supporting data point, not the deciding factor", and every maker sizes pads by FTK or ATK. A height table is inherently ±1 size.
3. **Youth and junior skate lift is unknown.** The 4 in NHL allowance is a senior figure. The youth pad-top values are probably high by 0.5–2 in (§1.5 closure check).
4. **Glove and blocker per-band dimensions and stick blade length are entirely derived.** No source publishes them.
5. **Bands overlap.** Bauer sells a 28" pad as both Junior M (9.5 in wide) and Int XS (10 in wide), and a 32" as both Int L (10.5) and Sr XS (11). The table assigns bands by height: Youth < 54 in, Junior 54–61, Intermediate 62–67, Senior ≥ 68. These breakpoints are my choice (pad sizes ≤ 23 youth, 24–28 junior, 29–31 intermediate, ≥ 32 senior, consistent with GM's ranges and BA-PAD), not a maker's.
6. **The pad-top rule assumes a straight standing leg** with the knee centred on the knee block. In a crouched stance the vertical height is lower. Computing that is the job of the pose model, not this table.

---

## 6. CODE-READY TABLE

**How to use**
- This table **replaces the gear rules in `01-dimensions.md` §4.2** (pad top, pad width, blocker, glove, paddle and blade, plus the `g` scale factor for those items). It does **not** replace the body ratios in §4.1. Keep using §4.1 for the knee, hip, shoulder and so on, and compute the pad top with the formula below so it moves with the body.
- Look up by `h = round(H_barefoot_in)`, clamped to 43..79. Each row covers `h_min ≤ h ≤ h_max`.
- These are **typical retail sizes, not legal limits**. Still clamp to the Hockey Canada maxima from `01` §5: pad width ≤ 11, pad length (nominal + rise) ≤ 38, blocker ≤ 8 × 15, glove perimeter ≤ 45, paddle ≤ 26, blade ≤ 15.5 (all in). In practice only the paddle bites: retail 27 in becomes 26 in.
- Pad top on ice (in), standing on skates: `0.285·h + 4 + K`, where K is the knee-to-top value in the row. The "pad top" column shows the result at `h_min`–`h_max`.

**Cell marks:** no mark = taken directly from a maker chart (source key in the column header). `~` = from a non-maker (coach or retailer) chart only. `*` = interpolated or derived by me, unverified. `‡` = the HC maximum used as the senior retail size (it is the legal cap; I did not verify that stock senior gear is exactly that size).

Column sources: pad nominal **CCM-PAD** (and CCM-JR for +1); thigh rise **CCM-JR / BR-PAD / GM**; pad width **BA-PAD**; K **BR-PAD**; pad top **derived: W + NHL + BR-PAD** (whole column `*`); glove and blocker **GM-GLV / GM-BLK bands × HC max**; paddle **BA-STK** (gaps from MEGA/HSM); blade **derived from paddle + HC**.

| h_min | h_max | Height | Band | Pad nominal (in) | Thigh rise (in) | Pad face width (in) | K knee→top (in) | Pad top on ice* (in) | Glove ellipse W × H (in) | Blocker board W × L (in) | Paddle (in) | Blade length* (in) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 43 | 47 | 3'7"–3'11" | Youth | 20 | 0 | 7.75 | 6.25* | 22.5–23.6 | 6.8 × 11.3* | 5.2 × 9.7* | 20 | 11.9 |
| 48 | 49 | 4'0"–4'1" | Youth | 21 | 0 | 8.0* | 6.5 | 24.2–24.5 | 6.8 × 11.3* | 5.2 × 9.7* | 21 | 12.5 |
| 50 | 51 | 4'2"–4'3" | Youth | 22 | 0 | 8.25 | 6.75* | 25.0–25.3 | 6.8 × 11.3* | 5.2 × 9.7* | 21 | 12.5 |
| 52 | 53 | 4'4"–4'5" | Youth | 23 | 0 | 8.5* | 7.0 | 25.8–26.1 | 6.8 × 11.3* | 5.2 × 9.7* | 22 | 13.1 |
| 54 | 55 | 4'6"–4'7" | Junior | 24 | 1 | 8.75 | 8.25* | 27.6–27.9 | 8.1 × 13.5* | 6.2 × 11.6* | 23 | 13.7 |
| 56 | 57 | 4'8"–4'9" | Junior | 26 | 1 | 9.0 | 8.75* | 28.7–29.0 | 8.1 × 13.5* | 6.2 × 11.6* | 24 | 14.3 |
| 58 | 59 | 4'10"–4'11" | Junior | 26 | 1 | 9.0 | 8.75* | 29.3–29.6 | 8.1 × 13.5* | 6.2 × 11.6* | 24~ | 14.3 |
| 60 | 61 | 5'0"–5'1" | Junior | 28 | 1 | 9.5 | 9.5* | 30.6–30.9 | 8.1 × 13.5* | 6.2 × 11.6* | 24~ | 14.3 |
| 62 | 63 | 5'2"–5'3" | Int | 29 | 1 | 10.1* | 10.0 | 31.7–32.0 | 8.8 × 14.7* | 6.7 × 12.6* | 24~ | 14.3 |
| 64 | 65 | 5'4"–5'5" | Int | 30 | 1 | 10.25 | 10.5 | 32.7–33.0 | 8.8 × 14.7* | 6.7 × 12.6* | 25* | 14.9 |
| 66 | 67 | 5'6"–5'7" | Int | 31 | 1 | 10.5 | 10.5 | 33.3–33.6 | 8.8 × 14.7* | 6.7 × 12.6* | 26 | 15.5 |
| 68 | 69 | 5'8"–5'9" | Senior | 32 | 1 | 11.0 | 11.0 | 34.4–34.7 | 10.5 × 17.5‡ | 8.0 × 15.0‡ | 26 | 15.5‡ |
| 70 | 71 | 5'10"–5'11" | Senior | 33 | 1 | 11.0 | 11.0 | 35.0–35.2 | 10.5 × 17.5‡ | 8.0 × 15.0‡ | 27 (cap 26) | 15.5‡ |
| 72 | 73 | 6'0"–6'1" | Senior | 34 | 1 | 11.0 | 11.0 | 35.5–35.8 | 10.5 × 17.5‡ | 8.0 × 15.0‡ | 27 (cap 26) | 15.5‡ |
| 74 | 75 | 6'2"–6'3" | Senior | 35 | 1 | 11.0 | 12.0 | 37.1–37.4 | 10.5 × 17.5‡ | 8.0 × 15.0‡ | 27* (cap 26) | 15.5‡ |
| 76 | 77 | 6'4"–6'5" | Senior | 36 | 1 | 11.0 | 12.0 | 37.7–37.9 | 10.5 × 17.5‡ | 8.0 × 15.0‡ | 27* (cap 26) | 15.5‡ |
| 78 | 79 | 6'6"–6'7" | Senior | 37 | 1 | 11.0 | 13.0 | 39.2–39.5 | 10.5 × 17.5‡ | 8.0 × 15.0‡ | 27* (cap 26) | 15.5‡ |

Row notes:
- **43–47:** CCM's smallest size is 20" ("3'10"", FTK < 13). GM lists a 19" youth size, so 20" may be oversized for a 3'7" goalie.
- **56–57 (coach check):** CCM gives 26"+1, but Bauer's FTK route gives 28"+1, which is what the 4'8" coach goalie actually wears (§1.6).
- **Paddle 54–57:** BA-STK allows 23 or 24 for 4'6"–4'9". I split the range at 56 in (`*` for the split, the values are sourced).
- **Paddle 58–63 (`~`):** MEGA only. BA-STK has no rows for this range.
- **Paddle ≥ 74:** BA-STK stops at 6'1"; I held 27 and capped it at 26 (HC).
- **Blade (whole column):** derived as 15.5 × paddle / 26, capped at 15.5 (HC). Use 3.5 in width for Int/Senior and 3.0 in for Youth/Junior, both `*`.
- **Pad top (whole column):** derived (`*`). For youth rows it is probably 0.5–2 in high (§1.5). With the NHL-limit formula from `01` the values would be about 1–4.5 in lower, and with the GM "mid-thigh" rule about 2–3.5 in lower.
- **Metres:** multiply by 0.0254. Pad top in metres is `0.285·H + 0.1016 + 0.0254·K`, with H in metres.
