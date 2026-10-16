// The goalie's gear as convex hulls shaped like the real thing: leg pads with a boot and a knee roll, a catching glove
// with a cuff, a blocker board with the hand behind it, and a stick with a tapered paddle and a rounded toe. One hull per
// piece keeps the coverage cheap. Chosen over the boxes and over a many-piece build in the gear-shapes prototype (branch
// prototype/gear-shapes). Sizes still come from goalieDims. The pad hulls stay inside the posing module's pad boxes,
// which placement (frontReach, the post) still goes by.
import type { Hand, PadBox, Pose } from '../posing/posing';
import { add, cross, dot, FWD, mul, norm, sub, type Vec } from '../posing/vec';
import type { Part, PartMat } from './parts';

/** A local frame: origin and three axes. */
interface Frame { o: Vec; x: Vec; y: Vec; z: Vec }
const at = (f: Frame, x: number, y: number, z: number) => add(f.o, add(mul(f.x, x), add(mul(f.y, y), mul(f.z, z))));

/** A rectangle [x0, x1] × [z0, z1] at height y with its corners rounded by r, as points in frame f. */
function ring(f: Frame, y: number, x0: number, x1: number, z0: number, z1: number, r: number, n = 3): Vec[] {
  r = Math.min(r, (x1 - x0) / 2, (z1 - z0) / 2);
  const out: Vec[] = [];
  for (const [cx, cz, a0] of [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, 90], [x0 + r, z0 + r, 180], [x1 - r, z0 + r, 270]])
    for (let i = 0; i <= n; i++) {
      const a = (a0 + 90 * i / n) * Math.PI / 180;
      out.push(at(f, cx + r * Math.cos(a), y, cz + r * Math.sin(a)));
    }
  return out;
}
/** An outline in the x–y plane, extruded from z0 to z1. bevel shrinks the two faces toward the outline's centre. */
function slab(f: Frame, outline: [number, number][], z0: number, z1: number, bevel = 0): Vec[] {
  const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length, cy = outline.reduce((s, p) => s + p[1], 0) / outline.length;
  const layer = (z: number, k: number) => outline.map(([x, y]) => at(f, cx + (x - cx) * k, cy + (y - cy) * k, z));
  if (!bevel) return [...layer(z0, 1), ...layer(z1, 1)];
  return [...layer(z0, 1 - bevel), ...layer(z0 + (z1 - z0) / 4, 1), ...layer(z1 - (z1 - z0) / 4, 1), ...layer(z1, 1 - bevel)];
}
/** Points on an elliptical arc centred (cx, cy), from a0 to a1 degrees. */
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });

const hull = (id: string, mat: PartMat, pts: Vec[]): Part => ({ id, kind: 'hull', pts, mat });

// Leg pads. Frame: x outward (away from the other leg; up in a butterfly, where the pad stands on its inner edge), y up
// the leg, z out of the face, origin at the posing box's centre. The shin piece narrows into a boot whose toe is pulled
// back over the skate and closes in a knee roll; the thigh rise tapers to its top.
function pads(pose: Pose, out: Part[]) {
  const frame = (b: PadBox, side: number): Frame => ({ o: b.center, x: mul(cross(b.u, b.n), side), y: b.u, z: b.n });
  for (const l of pose.legs) {
    const s = l.side > 0 ? 'L' : 'R', [shin, rise] = l.pads;
    let f = frame(shin, l.side), w = shin.width / 2, d = shin.depth / 2, y = (t: number) => (t - 0.5) * shin.len;
    const r = 0.35 * Math.min(w, d);
    out.push(hull(`pad${s}0`, 'pad', [
      ...ring(f, y(0), -0.78 * w, 0.74 * w, -d, 0.2 * d, r),
      ...ring(f, y(0.1), -0.95 * w, 0.95 * w, -d, 0.85 * d, r),
      ...ring(f, y(0.2), -w, w, -d, d, r),
      ...ring(f, y(0.88), -w, w, -d, d, r),
      ...ring(f, y(1), -0.9 * w, 0.9 * w, -0.8 * d, 0.8 * d, r),
    ]));
    f = frame(rise, l.side); w = rise.width / 2; d = rise.depth / 2; y = t => (t - 0.5) * rise.len;
    out.push(hull(`pad${s}1`, 'pad', [
      ...ring(f, y(0), -w, w, -d, d, 0.6 * r),
      ...ring(f, y(0.7), -0.85 * w, 0.85 * w, -0.9 * d, 0.9 * d, 0.6 * r),
      ...ring(f, y(1), -0.55 * w, 0.55 * w, -0.6 * d, 0.6 * d, 0.6 * r),
    ]));
  }
}

// Hands. Frame: x outward, y up the hand, z out of the glove's pocket or the blocker's board face.
const handFrame = (h: Hand, o: number, u: number, f: number): Frame =>
  ({ o: add(h.wrist, add(mul(h.out, o), add(mul(h.up, u), mul(h.face, f)))), x: h.out, y: h.up, z: h.face });

/** The catching glove's outline, as fractions of its width and height: cuff at the bottom, thumb inside, fingers outside. */
const MITT: [number, number][] = [
  [-0.24, -0.5], [0.24, -0.5], [0.28, -0.26], [0.47, -0.02], [0.5, 0.22], ...arc(0.22, 0.24, 0.28, 0.26, 0, 90, 4),
  [-0.1, 0.5], [-0.34, 0.42], [-0.46, 0.18], [-0.42, -0.08], [-0.28, -0.26],
];
function glove(pose: Pose, out: Part[]) {
  const W = pose.dims.glove.w, H = pose.dims.glove.h, D = 0.32 * W;
  out.push(hull('glove', 'glove', slab(handFrame(pose.glove, 0.05, 0.06, 0.04), MITT.map(([x, y]) => [x * W, y * H]), -D / 2, D / 2, 0.08)));
}

/** The blocker board: a rectangle with rounded corners, a little narrower at the top. */
const board = (W: number, L: number): [number, number][] => [
  ...arc(0.38 * W, -0.5 * L + 0.12 * W, 0.12 * W, 0.12 * W, 270, 360, 3),
  ...arc(0.33 * W, 0.5 * L - 0.14 * W, 0.14 * W, 0.14 * W, 0, 90, 3),
  ...arc(-0.33 * W, 0.5 * L - 0.14 * W, 0.14 * W, 0.14 * W, 90, 180, 3),
  ...arc(-0.38 * W, -0.5 * L + 0.12 * W, 0.12 * W, 0.12 * W, 180, 270, 3),
];
function blocker(pose: Pose, out: Part[]) {
  const W = pose.dims.blocker.w, L = pose.dims.blocker.l, f = handFrame(pose.blocker, 0.07, 0.05, 0.03);
  out.push(hull('blocker', 'blocker', slab(f, board(W, L), -0.025, 0.025, 0.05)));
  // The glove part, behind the board.
  out.push(hull('blockerHand', 'trim', [...ring(f, -0.32 * L, -0.28 * W, 0.28 * W, -0.11, -0.025, 0.02), ...ring(f, 0.2 * L, -0.28 * W, 0.28 * W, -0.11, -0.025, 0.02)]));
}

// Stick. Frame: origin at the heel on the ice, x toward the toe, y up the paddle, z out of the blade's front face.
function stick(pose: Pose, out: Part[]) {
  const d = pose.dims, s = pose.stick, pl = d.paddle.l, pw = d.paddle.w, bl = d.blade.l, bh = d.blade.h;
  const x = norm(sub(s.toeDir, mul(s.dir, dot(s.toeDir, s.dir)))), z = cross(x, s.dir);
  const f: Frame = { o: s.heel, x, y: s.dir, z: dot(z, FWD) < 0 ? mul(z, -1) : z };
  // Paddle: its back edge on the heel, tapering a little toward the shaft.
  out.push(hull('paddle', 'stick', slab(f, [[0, 0.02], [pw, bh], [0.85 * pw, pl], [0.12 * pw, pl]], -0.012, 0.012, 0.15)));
  // Shaft: about 1.1 × 1 in, with a knob at the top.
  const sx0 = 0.5 * pw - 0.014, sx1 = 0.5 * pw + 0.014;
  out.push(hull('shaft', 'stick', [...ring(f, pl - 0.02, sx0, sx1, -0.0125, 0.0125, 0.004), ...ring(f, d.stickLen - 0.03, sx0, sx1, -0.0125, 0.0125, 0.004)]));
  out.push({ id: 'knob', kind: 'capsule', a: at(f, 0.5 * pw, d.stickLen - 0.03, 0), b: at(f, 0.5 * pw, d.stickLen, 0), r: 0.019, mat: 'stick' });
  // Blade: square heel, rounded toe.
  out.push(hull('blade', 'blade', slab(f, [[0, 0], ...arc(bl - 0.45 * bh, 0.45 * bh, 0.45 * bh, 0.45 * bh, -90, 90, 5), [0, bh]], -0.008, 0.008)));
}

/** The gear parts: both leg pads (shin piece and thigh rise), the glove, the blocker and the stick. */
export function gearParts(pose: Pose): Part[] {
  const out: Part[] = [];
  pads(pose, out); glove(pose, out); blocker(pose, out); stick(pose, out);
  return out;
}
