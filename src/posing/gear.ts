// Goalie gear by barefoot height: a stepped lookup of typical retail sizes, from docs/research/03-gear-sizing-by-height.md
// §6. It replaces the linear gear formulas of docs/research/01-dimensions.md §4.2; the body ratios (§4.1) stay.
// Build choice (coach, 2026-10-15): junior pads follow Bauer, about one size up from CCM's height chart, so a 4'8"
// goalie wears 28"+1 (the coach's own Bauer-padded goalie). Youth and senior rows follow the research table as is.
// Cells marked * in the research are derived, not published: glove, blocker and blade below senior, and pad top.

export type GearBand = 'youth' | 'junior' | 'int' | 'senior';

/** One row, all in inches. */
export interface GearRow {
  hMin: number; hMax: number; band: GearBand;
  /** Pad nominal size and thigh rise. */
  pad: number; rise: number;
  padWidth: number;
  /** Knee centre to pad top (it includes the rise), from Brian's chart. */
  kneeToTop: number;
  glove: { w: number; h: number };
  blocker: { w: number; l: number };
  /** Paddle length, already capped at Hockey Canada's 26 in. */
  paddle: number;
  blade: { l: number; w: number };
}

const YOUTH = { glove: { w: 6.8, h: 11.3 }, blocker: { w: 5.2, l: 9.7 } };
const JUNIOR = { glove: { w: 8.1, h: 13.5 }, blocker: { w: 6.2, l: 11.6 } };
const INT = { glove: { w: 8.8, h: 14.7 }, blocker: { w: 6.7, l: 12.6 } };
const SENIOR = { glove: { w: 10.5, h: 17.5 }, blocker: { w: 8, l: 15 } };   // the Hockey Canada maxima

const row = (hMin: number, hMax: number, band: GearBand, pad: number, rise: number, padWidth: number, kneeToTop: number,
  paddle: number, bladeL: number): GearRow => {
  const hands = { youth: YOUTH, junior: JUNIOR, int: INT, senior: SENIOR }[band];
  return { hMin, hMax, band, pad, rise, padWidth, kneeToTop, ...hands, paddle,
    blade: { l: bladeL, w: band === 'youth' || band === 'junior' ? 3 : 3.5 } };
};

export const GEAR_TABLE: GearRow[] = [
  //  h from–to  band       pad rise width  K      paddle blade
  row(43, 47, 'youth',  20, 0, 7.75, 6.25, 20, 11.9),
  row(48, 49, 'youth',  21, 0, 8.0,  6.5,  21, 12.5),
  row(50, 51, 'youth',  22, 0, 8.25, 6.75, 21, 12.5),
  row(52, 52, 'youth',  23, 0, 8.5,  7.0,  22, 13.1),
  row(53, 53, 'junior', 24, 1, 8.75, 8.25, 22, 13.1),   // Bauer route: one size up from CCM
  row(54, 55, 'junior', 26, 1, 9.0,  8.75, 23, 13.7),   // Bauer route
  row(56, 61, 'junior', 28, 1, 9.5,  9.5,  24, 14.3),   // Bauer route: the coach's 4'8" goalie in 28"+1
  row(62, 63, 'int',    29, 1, 10.1, 10.0, 24, 14.3),
  row(64, 65, 'int',    30, 1, 10.25, 10.5, 25, 14.9),
  row(66, 67, 'int',    31, 1, 10.5, 10.5, 26, 15.5),
  row(68, 69, 'senior', 32, 1, 11,   11,   26, 15.5),
  row(70, 71, 'senior', 33, 1, 11,   11,   26, 15.5),
  row(72, 73, 'senior', 34, 1, 11,   11,   26, 15.5),
  row(74, 75, 'senior', 35, 1, 11,   12,   26, 15.5),
  row(76, 77, 'senior', 36, 1, 11,   12,   26, 15.5),
  row(78, 79, 'senior', 37, 1, 11,   13,   26, 15.5),
];

/** The gear for a goalie of barefoot height h inches (rounded, clamped to the table's 43–79). */
export function gearFor(hIn: number): GearRow {
  const h = Math.min(79, Math.max(43, Math.round(hIn)));
  return GEAR_TABLE.find(r => h >= r.hMin && h <= r.hMax)!;
}
