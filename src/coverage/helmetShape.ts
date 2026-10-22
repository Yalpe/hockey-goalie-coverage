// The goalie's mask, shared by the coverage (its hulls) and the mask model (helmetMesh.ts), so what is drawn is what
// covers: a fibreglass shell open at the face, a cat-eye cage over the opening, a back plate behind the head and a
// throat guard hanging from the chin. Proportions measured off a senior mask modelled in SolidWorks (sections through
// its shell and cage every 1–2 cm); only the measurements are used. Its origin sits where the head's centre does
// (forehead 2.5 cm inside the brow, crown 2.5 cm under the shell). Mask frame, metres: origin at the head's centre,
// x to the goalie's left, y up, z out through the cage. The tables are in centimetres.
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { Vector3 } from 'three';
import type { Frame, Pose } from '../posing/posing';
import { add, clamp, cross, mul, norm, sub, UP, V, type Vec } from '../posing/vec';
import type { Part } from './parts';

// The shell, by height: half-width, front (on the centreline) and back edge. Each section is half an ellipse round the
// front, from the centreline out to its widest a quarter of the way forward from the back edge, then straight back to
// the edge. A ridge on top; widest at the ears, where the sides flare back; narrowing to the chin cup, whose back
// edge comes forward under the jaw.
const SHELL: [y: number, half: number, front: number, back: number][] = [
  [14.2, 0, -1.5, -6], [14, 1, 0.1, -6.3], [13, 3.6, 5.2, -6.3], [12, 5.2, 7.2, -6.3], [10, 7.3, 9.7, -6.3],
  [8, 8, 11, -6.3], [6, 9, 11.7, -6.3], [4, 10.7, 12.2, -8.4], [2, 10.6, 12.3, -8.5], [0, 10.3, 12.3, -8.5],
  [-2, 9.9, 12, -8.4], [-4, 9.4, 11.6, -8.2], [-6, 8.7, 11.2, -7], [-8, 7.6, 11.2, -1.5], [-10, 6.7, 10.6, 1.1],
  [-12, 5.9, 10.2, 2.7], [-14, 5, 10, 4.9], [-16, 4.2, 9.9, 6.3],
];
// The face opening's half-width, by height: a straight top edge with rounded corners, narrowing to a round bottom
// over the chin.
const OPEN_TOP = 3.5;
const OPENING: [y: number, half: number][] = [
  [OPEN_TOP, 7.6], [3, 8.6], [2, 8.85], [0, 8.5], [-2, 7.8], [-4, 6.8], [-6, 5], [-7, 3.4], [-7.8, 0],
];
// The cage, by height: half-width (its frame bar), how far out it stands on the centreline, and how far back its
// sides reach, onto the shell. Across, it is half an ellipse from side to side.
const CAGE: [y: number, half: number, front: number, side: number][] = [
  [4, 9.3, 12.9, 4.5], [3, 9.8, 13.2, 3.5], [2, 9.7, 13.4, 3.5], [0, 9.3, 13.7, 3.8], [-2, 8.8, 13.8, 4.4],
  [-4, 8.2, 13.5, 5.4], [-5, 7.7, 13.2, 6.1], [-6, 7.1, 12.9, 7], [-7, 6.1, 12.5, 8.4], [-8, 4.2, 12, 10.4],
  [-8.6, 0, 11.6, 11.6],
];
export const CAGE_BAR_R = 0.0035;
/** The back plate: the back half of an ellipsoid round the back of the head, inside the shell's back edge. */
export const BACK_PLATE = { c: V(0, 0.015, -0.04), r: V(0.092, 0.085, 0.077) };
/** The head inside, so the face opening doesn't look through to the chest: forehead 2.5 cm inside the brow. */
export const HEAD = { c: V(0, 0, -0.005), r: V(0.078, 0.11, 0.1) };
export const SHELL_T = 0.005;
// Throat guard: tied under the front of the chin cup; senior size.
const GUARD = { hinge: V(0, -0.156, 0.088), w: 0.1, h: 0.085, t: 0.004, wrap: 0.008 };

/**
 * The mask's size for a goalie of height H: the model is a senior mask (on a 1.80 m goalie). Heads grow far slower than
 * bodies (about 10% from age 6 to grown up, against 50% in height), so the mask shrinks by 0.3 of the height.
 */
export const maskScale = (H: number) => clamp(1 - 0.3 * (1 - H / 1.8), 0.8, 1.05);

// Table lookups. Shell rows and the cage go by a smooth curve through their rows (Catmull-Rom on the uneven heights);
// the opening is straight between its rows.
function smoothAt<T extends number[]>(rows: T[], y: number): number[] {
  const n = rows.length;
  if (y >= rows[0][0]) return rows[0].slice(1);
  if (y <= rows[n - 1][0]) return rows[n - 1].slice(1);
  let i = 0;
  while (rows[i + 1][0] > y) i++;
  const y0 = rows[i][0], y1 = rows[i + 1][0], t = (y - y0) / (y1 - y0);
  const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const slope = (k: number, c: number) => {
    const a = rows[Math.max(0, k - 1)], b = rows[Math.min(n - 1, k + 1)];
    return (b[c] - a[c]) / (b[0] - a[0]) * (y1 - y0);
  };
  return rows[0].slice(1).map((_, j) => {
    const c = j + 1;
    return h00 * rows[i][c] + h10 * slope(i, c) + h01 * rows[i + 1][c] + h11 * slope(i + 1, c);
  });
}
function openingAt(y: number): number {
  if (y > OPEN_TOP || y < OPENING[OPENING.length - 1][0]) return 0;
  let i = 0;
  while (i < OPENING.length - 2 && OPENING[i + 1][0] > y) i++;
  const [y0, w0] = OPENING[i], [y1, w1] = OPENING[i + 1];
  return w0 + (w1 - w0) * (y - y0) / (y1 - y0);
}

/** One side of the shell (x ≥ 0) as a grid of points on its outside, metres, rows top to bottom, columns from the
 *  centreline (or the face opening's edge, where open) round to the back edge. */
export interface ShellGrid { rows: Vec[][]; open: boolean[] }
const ROUND_N = 18, SIDE_N = 6;
let shellMemo: ShellGrid | null = null;
export function shellGrid(): ShellGrid {
  if (shellMemo) return shellMemo;
  const ys: number[] = [];
  for (let y = SHELL[0][0]; y > SHELL[SHELL.length - 1][0]; y -= 0.5) ys.push(y);
  ys.push(SHELL[SHELL.length - 1][0]);
  // A row each side of the opening's top edge, so the edge runs straight across.
  ys.push(OPEN_TOP + 0.05, OPEN_TOP);
  ys.sort((a, b) => b - a);
  const rows: Vec[][] = [], open: boolean[] = [];
  for (const y of [...new Set(ys)]) {
    const [half, front, back] = smoothAt(SHELL, y), w = openingAt(y);
    const zc = back + 0.25 * (front - back), b = front - zc;
    const t0 = half > 0 ? Math.asin(Math.min(1, w / half)) : 0, row: Vec[] = [];
    for (let j = 0; j <= ROUND_N; j++) {
      const t = t0 + (Math.PI / 2 - t0) * j / ROUND_N;
      row.push(V(half * Math.sin(t), y, zc + b * Math.cos(t)));
    }
    for (let j = 1; j <= SIDE_N; j++) row.push(V(half, y, zc + (back - zc) * j / SIDE_N));
    rows.push(row.map(p => mul(p, 0.01)));
    open.push(w > 0);
  }
  return (shellMemo = { rows, open });
}

/** Where the cage stands at (x, y) (cm, in front view), in metres. */
function cagePoint(x: number, y: number): Vec {
  const [half, front, side] = smoothAt(CAGE, y), u = half > 0 ? clamp(x / half, -1, 1) : 0;
  return mul(V(x, y, side + (front - side) * Math.sqrt(1 - u * u)), 0.01);
}
const CAGE_TOP = CAGE[0][0], CAGE_BOTTOM = CAGE[CAGE.length - 1][0];
const cageHalf = (y: number) => smoothAt(CAGE, y)[0];
/** A cage bar running under the eyes, an arch from the cage's sides at ySide up to yMid on the centreline. */
function arch(ySide: number, yMid: number, n = 24): Vec[] {
  const half = cageHalf(ySide);
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = -half + 2 * half * i / n, u = x / half;
    return cagePoint(x, ySide + (yMid - ySide) * (1 - u * u));
  });
}
/**
 * The cage's bars, as lines through their centres (metres): the frame round the opening, the centre bar, an arch
 * under the eyes and one lower down, and a bar down each cheek between them. Above the arch the eyes look out through
 * two big windows: the cat-eye.
 */
let cageMemo: { lines: Vec[][]; closed: boolean[] } | null = null;
export function cageBars(): { lines: Vec[][]; closed: boolean[] } {
  if (cageMemo) return cageMemo;
  const frame: Vec[] = [], n = 24;
  for (let i = 0; i <= n; i++) { const y = CAGE_TOP + (CAGE_BOTTOM - CAGE_TOP) * i / n; frame.push(cagePoint(-cageHalf(y), y)); }
  for (let i = n - 1; i >= 0; i--) { const y = CAGE_TOP + (CAGE_BOTTOM - CAGE_TOP) * i / n; frame.push(cagePoint(cageHalf(y), y)); }
  for (let i = n - 1; i > 0; i--) { const x = cageHalf(CAGE_TOP) * (2 * i / n - 1); frame.push(cagePoint(x, CAGE_TOP)); }
  const centre = Array.from({ length: n + 1 }, (_, i) => cagePoint(0, CAGE_TOP + (CAGE_BOTTOM - CAGE_TOP) * i / n));
  const EYE: [number, number] = [-2.5, -1.2], LOW: [number, number] = [-5.5, -4];
  const eyeArch = arch(...EYE), lowArch = arch(...LOW);
  // The cheek bars, from the eye arch down to the lower one, 5.5 cm out.
  const cheek = (x: number) => {
    const at = (ySide: number, yMid: number) => { const u = x / cageHalf(ySide); return ySide + (yMid - ySide) * (1 - u * u); };
    const y0 = at(...EYE), y1 = at(...LOW);
    return Array.from({ length: 7 }, (_, i) => cagePoint(x, y0 + (y1 - y0) * i / 6));
  };
  return (cageMemo = { lines: [frame, centre, eyeArch, lowArch, cheek(5.5), cheek(-5.5)], closed: [true, false, false, false, false, false] });
}

// The coverage hull of the mask, cage and back plate, in the mask frame: the corners of the convex hull of points about
// 2 cm apart on them (a smooth surface puts nearly every point on the hull: this keeps it to a couple of hundred,
// within half a millimetre of the surface).
let maskHullMemo: Vec[] | null = null;
function maskHullPts(): Vec[] {
  if (maskHullMemo) return maskHullMemo;
  const pts: Vec[] = [], rows = shellGrid().rows, every = <T>(a: T[], k: number) => a.filter((_, i) => i % k === 0 || i === a.length - 1);
  for (const row of every(rows, 4)) for (const p of every(row, 3)) pts.push(p, V(-p.x, p.y, p.z));
  for (const line of cageBars().lines) for (const p of every(line, 3)) pts.push(add(p, V(0, 0, CAGE_BAR_R)));
  const { c, r } = BACK_PLATE;
  for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) {
    const th = Math.PI * (0.12 + 0.73 * i / 5), ph = Math.PI * (1 + j / 5);
    pts.push(V(c.x - r.x * Math.cos(ph) * Math.sin(th), c.y + r.y * Math.cos(th), c.z + r.z * Math.sin(ph) * Math.sin(th)));
  }
  const hull = new ConvexHull().setFromPoints(pts.map(p => new Vector3(p.x, p.y, p.z)));
  const corners = new Set<Vector3>();
  for (const f of hull.faces) { let e = f.edge; do { corners.add(e.head().point); e = e.next; } while (e !== f.edge); }
  return (maskHullMemo = [...corners].map(p => V(p.x, p.y, p.z)));
}

// Where the head turns: about the top of the neck, under the head's centre. The head follows the Puck as far as the
// neck turns (a goalie's eyes do the rest); without a Puck it looks at the ice a few metres out.
const NECK_DROP = 0.07, YAW_MAX = 70, UP_MAX = 25, DOWN_MAX = 55, REST_PITCH = -20;
const RAD = Math.PI / 180;

/** The mask frame in the goalie's, and the mask's size (maskScale). */
export type MaskFrame = Frame & { s: number };

/**
 * The mask's frame in the goalie's: turned toward target (in the goalie frame), from straight ahead of the shoulders
 * and level, as far as the neck goes; target null looks ahead and down at the ice. Scaled for the goalie's height.
 */
export function maskFrame(pose: Pose, target: Vec | null): MaskFrame {
  const s = maskScale(pose.dims.H), across = sub(pose.shoulders[1], pose.shoulders[-1]);
  const ahead = norm(V(-across.z, 0, across.x));   // across × up: square to the shoulders, level
  let yaw = 0, pitch = REST_PITCH;
  if (target) {
    const d = sub(target, pose.head);
    yaw = clamp(Math.atan2(ahead.z * d.x - ahead.x * d.z, ahead.x * d.x + ahead.z * d.z) / RAD, -YAW_MAX, YAW_MAX);
    pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)) / RAD, -DOWN_MAX, UP_MAX);
  }
  const a = yaw * RAD, p = pitch * RAD;
  const level = V(ahead.x * Math.cos(a) + ahead.z * Math.sin(a), 0, -ahead.x * Math.sin(a) + ahead.z * Math.cos(a));
  const z = add(mul(level, Math.cos(p)), mul(UP, Math.sin(p))), x = norm(cross(UP, z)), y = cross(z, x);
  const neck = sub(pose.head, mul(UP, NECK_DROP * s));
  return { o: add(neck, mul(y, NECK_DROP * s)), x, y, z, s };
}

const inFrame = (f: MaskFrame, p: Vec) => add(f.o, add(mul(f.x, p.x * f.s), add(mul(f.y, p.y * f.s), mul(f.z, p.z * f.s))));

/** The throat guard's corners in the goalie frame: a plate tied under the chin cup, so it swings with the head, its
 *  sides wrapped back a little round the neck, its bottom rounded. */
export function throatGuardPts(f: MaskFrame): Vec[] {
  const { hinge, w, h, t, wrap } = GUARD, outline: [number, number][] = [[-w / 2, 0], [w / 2, 0], [w / 2, -0.55 * h]];
  for (let i = 1; i < 8; i++) { const a = Math.PI * i / 8; outline.push([w / 2 * Math.cos(a), -0.55 * h - 0.45 * h * Math.sin(a)]); }
  outline.push([-w / 2, -0.55 * h]);
  return outline.flatMap(([u, v]) => [-t / 2, t / 2].map(k => inFrame(f, add(hinge, V(u, v, k - wrap * (2 * u / w) ** 2)))));
}

/** The mask's coverage: the shell, cage and back plate as one hull, and the throat guard. */
export function helmetParts(f: MaskFrame): Part[] {
  return [
    { id: 'mask', kind: 'hull', pts: maskHullPts().map(p => inFrame(f, p)), mat: 'mask' },
    { id: 'throatGuard', kind: 'hull', pts: throatGuardPts(f), mat: 'mask' },
  ];
}
