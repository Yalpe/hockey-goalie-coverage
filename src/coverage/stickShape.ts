// The goalie stick's shape, shared by the coverage (its convex pieces) and the stick model (its outline, thickness
// and curve), so what is drawn is what covers. Modelled on a carbon goalie stick seen flat on: a paddle the same width
// all the way up, ending in a short shoulder onto the narrower, thicker shaft; a big round on the outside of the heel
// and a smaller one in its inside corner; a blade of even height with a squared toe, rounded more at the top than at
// the bottom, curved a little toward the front face.
// Stick-plane coordinates, metres: X along the blade toward the toe, flat on the ice; Y up the stick's plane, square
// to the blade; Z out of the front face. The origin is the posing module's heel, the corner the blade's bottom and the
// paddle's back edge would make without the round. The paddle runs up the shaft from there at the lie: across it, the
// paddle is pw wide and the shaft's centre line is half a paddle width in from the back edge (as the grip assumes).
import { STICK_LIE_DEG, type Dims, type Stick } from '../posing/posing';
import { dot, mul, norm, sub, type Vec } from '../posing/vec';

export type P2 = [number, number];
export interface StickShape {
  /** The stick's outline, counter-clockwise. */
  outline: P2[];
  /** Convex pieces that tile the outline, on its own points: the coverage takes one hull per piece. */
  pieces: { id: string; pts: P2[] }[];
  /** Front to back, at a point. */
  thick(p: P2): number;
  /** The blade's curve: how far the stick's middle plane is out of the front face at X. */
  bend(x: number): number;
}

const SHAFT_W = 0.028, SHAFT_D = 0.022;       // about 1.1 × 0.85 in
const SHOULDER = 0.03;                        // the paddle's top, onto the shaft
// The heel's rounds, off a product photo (the paddle and blade, both 3.5 in, for scale): about 9 cm outside, 6 inside.
const HEEL_R = 0.09, CORNER_R = 0.06, TOE_TOP_R = 0.035, TOE_BOTTOM_R = 0.015;
// The blade's curve: straight to CURVE_FROM, then bending toward the front face, so the face is hollow. Its depth, by
// the rule's measure (heel to toe, out to the deepest point), is half an inch: a mid curve, under the NHL's 3/4 in.
const CURVE_DEPTH = 0.0127, CURVE_FROM = 0.1;
const STEP = 0.02;                            // points along the blade, so its curve shows

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Points on a circle round c from angle a0 to a1 (radians), both ends included. */
const arcPts = (c: P2, r: number, a0: number, a1: number, n: number): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });
/** The round of radius r in the corner at c between the lines out along unit u1 and u2: tangent points and arc, u1 to u2. */
function round(c: P2, u1: P2, u2: P2, r: number, n: number): P2[] {
  const half = Math.acos(u1[0] * u2[0] + u1[1] * u2[1]) / 2, k = r / Math.sin(half);
  const b = norm2([u1[0] + u2[0], u1[1] + u2[1]]), o: P2 = [c[0] + b[0] * k, c[1] + b[1] * k];
  const t = r / Math.tan(half), t1: P2 = [c[0] + u1[0] * t, c[1] + u1[1] * t], t2: P2 = [c[0] + u2[0] * t, c[1] + u2[1] * t];
  const a0 = Math.atan2(t1[1] - o[1], t1[0] - o[0]);
  let a1 = Math.atan2(t2[1] - o[1], t2[0] - o[0]);
  if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
  if (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
  return arcPts(o, r, a0, a1, n);
}
const norm2 = (v: P2): P2 => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
const along = (a: number, b: number, y: number): P2[] => {   // points every STEP along Y = y from X = a to b, ends excluded
  const n = Math.max(1, Math.round(Math.abs(b - a) / STEP)), out: P2[] = [];
  for (let i = 1; i < n; i++) out.push([a + (b - a) * i / n, y]);
  return out;
};

export function stickShape(d: Dims): StickShape {
  const lie = STICK_LIE_DEG * Math.PI / 180, S = Math.sin(lie), Co = Math.cos(lie);
  const pw = d.paddle.w, pl = d.paddle.l, bl = d.blade.l, bh = d.blade.h, L = d.stickLen;
  const Dir: P2 = [-Co, S];                                                 // up the shaft
  const P = (fx: number, fy: number): P2 => [fx * S - fy * Co, fx * Co + fy * S];   // across, up the shaft → X, Y
  const mid = 0.5 * pw, sr = SHAFT_W / 2;

  // The heel: the outside round at the origin (from up the back edge, round to the bottom), the inside one at C.
  const heel = round([0, 0], Dir, [1, 0], HEEL_R, 6);                      // from the back edge to the bottom
  const C: P2 = [(pw - bh * Co) / S, bh], Bk: P2 = [-bh * Co / S, bh];      // the front and back edges at the blade top
  const corner = round(C, [1, 0], Dir, CORNER_R, 4);                         // from the blade top to the front edge
  const T1 = corner[0], T2 = corner[corner.length - 1];
  const toeBottom = arcPts([bl - TOE_BOTTOM_R, TOE_BOTTOM_R], TOE_BOTTOM_R, -Math.PI / 2, 0, 3);
  const toeTop = arcPts([bl - TOE_TOP_R, bh - TOE_TOP_R], TOE_TOP_R, 0, Math.PI / 2, 5);
  const split = 0.5 * (CURVE_FROM + bl);
  const H1 = heel[heel.length - 1];

  const bladeHeel: P2[] = [...heel, ...along(H1[0], split, 0), [split, 0], [split, bh],
    ...along(split, T1[0], bh), T1, C, Bk];
  const bladeToe: P2[] = [[split, 0], ...along(split, toeBottom[0][0], 0), ...toeBottom, ...toeTop, ...along(toeTop[toeTop.length - 1][0], split, bh), [split, bh]];
  const paddle: P2[] = [Bk, C, T2, P(pw, pl), P(mid + sr, pl + SHOULDER), P(mid - sr, pl + SHOULDER), P(0, pl)];
  const end = Array.from({ length: 7 }, (_, i) => { const a = Math.PI * i / 6; return P(mid + sr * Math.cos(a), L - sr + sr * Math.sin(a)); });
  const shaft: P2[] = [P(mid - sr, pl + SHOULDER), P(mid + sr, pl + SHOULDER), ...end];
  const pieces = [
    { id: 'stickBlade0', pts: bladeHeel }, { id: 'stickBlade1', pts: bladeToe }, { id: 'stickPaddle', pts: paddle },
    ...corner.slice(1).map((p, i) => ({ id: `stickHeel${i}`, pts: [C, corner[i], p] })),
    { id: 'stickShaft', pts: shaft },
  ];

  const outline: P2[] = [
    ...along(H1[0], toeBottom[0][0], 0), ...toeBottom, ...toeTop,
    ...along(toeTop[toeTop.length - 1][0], T1[0], bh), ...corner,
    P(pw, pl), P(mid + sr, pl + SHOULDER), ...end, P(mid - sr, pl + SHOULDER), P(0, pl), Bk, ...heel,
  ];

  // Thickness: the blade thins toward the toe; the paddle thickens up to its shoulder, onto the shaft.
  const tBlade = (x: number) => x < 0.12 ? 0.012 : lerp(0.012, 0.008, (x - 0.12) / (bl - 0.12));
  const tUp = (fy: number) => fy < pl ? lerp(0.013, 0.016, fy / pl) : lerp(0.016, SHAFT_D, (fy - pl) / SHOULDER);
  const thick = ([x, y]: P2) => lerp(tBlade(x), tUp(-x * Co + y * S), smooth(bh - 0.01, bh + 0.01, y));
  // A parabola from CURVE_FROM, scaled so its deepest point is CURVE_DEPTH behind the line from heel to toe.
  const u2 = (x: number) => x < CURVE_FROM ? 0 : ((x - CURVE_FROM) / (bl - CURVE_FROM)) ** 2;
  let deepest = 0;
  for (let x = 0; x <= bl; x += 0.002) deepest = Math.max(deepest, x / bl - u2(x));
  const bend = (x: number) => CURVE_DEPTH / deepest * u2(x);
  return { outline, pieces, thick, bend };
}

/** The stick's frame in the goalie's: origin at the heel, x along the blade to the toe, y up the stick's plane, z out
 *  of the front face. Left-handed for one catch side (the toe points to the glove side), so draw it with its matrix. */
export function stickFrame(s: Stick): { o: Vec; x: Vec; y: Vec; z: Vec } {
  return { o: s.heel, x: s.toeDir, y: norm(sub(s.dir, mul(s.toeDir, dot(s.dir, s.toeDir)))), z: s.face };
}
