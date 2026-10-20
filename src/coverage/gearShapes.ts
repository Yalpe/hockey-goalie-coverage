// The goalie's gear as convex hulls shaped like the real thing: leg pads with a boot and a knee roll, a catching glove
// with a cuff, a blocker board with the hand behind it, and the stick (its shape is in stickShape.ts). One hull per
// piece keeps the coverage cheap. Chosen over the boxes and over a many-piece build in the gear-shapes prototype (branch
// prototype/gear-shapes). Sizes still come from goalieDims. The pad hulls stay inside the posing module's pad boxes
// (which placement, frontReach and the post, still go by), but for the boot, which reaches over the skate toe.
import { skateAxes, type Hand, type Leg, type Pose } from '../posing/posing';
import { add, cross, dot, mul, norm, sub, type Vec } from '../posing/vec';
import type { Part, PartMat } from './parts';
import { stickFrame, stickShape } from './stickShape';

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

// Leg pads: a full-width face, bent like the leg inside it. The shin piece runs along the shin at an even thickness
// from the ankle up past the knee (the knee block bulges out the back there) into the thigh rise, which carries straight
// on and thins to its top. At the ankle the pad bends: the boot runs forward along the foot, the same thickness, down
// over the skate to just past its toe. Two hulls, so the bend stays. Shin frame: origin at the posing box's centre,
// x across, y up the shin, z out of the face (the shin PAD_BACK, 4 cm at 5′9″, in front of the back); the boot's toe end is in the
// skate's frame.
function pads(pose: Pose, out: Part[]) {
  const L = 0.152 * pose.dims.H, toe = 0.7 * L;
  for (const l of pose.legs) {
    const s = l.side > 0 ? 'L' : 'R', [shin, rise] = l.pads, fs = skateFrame(pose, l);
    const f: Frame = { o: shin.center, x: cross(shin.u, shin.n), y: shin.u, z: shin.n };
    const w = shin.width / 2, d = shin.depth / 2, r = 0.3 * w;
    const along = (p: Vec) => dot(sub(p, shin.center), shin.u), ankle = along(l.ankle), knee = along(l.knee), top = knee + rise.len;
    const ankleRing = ring(f, ankle, -w, w, -d, d, r);
    out.push(hull(`pad${s}0`, 'pad', [
      ...ankleRing,
      ...ring(f, knee - 0.06, -w, w, -d, d, r),
      ...ring(f, knee + 0.02, -w, w, -d - 0.03, d, r),                 // knee block
      ...ring(f, top - 0.06, -w, w, d - 0.08, d, r),
      ...ring(f, top, -0.92 * w, 0.92 * w, d - 0.05, d, 1.5 * r),      // thin, rounded top of the rise
    ]));
    // The boot's underside lies flat on the skate, from the toe back under the whole pad.
    const back = Math.min(...ankleRing.map(p => dot(sub(p, fs.o), fs.x)));
    out.push(hull(`pad${s}1`, 'pad', [
      ...ankleRing,
      ...ring(fs, SKATE_LIFT + 0.04, back, toe + 0.005, -w, w, r),
      ...ring(fs, SKATE_LIFT + 0.01, back + 0.01, toe - 0.02, -0.92 * w, 0.92 * w, r),   // rounded toe
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

// Stick: one hull per convex piece of its shape (stickShape.ts), each piece's outline at the stick's thickness there,
// on the blade's curve. The stick model draws the same outline, so it stays inside these.
function stick(pose: Pose, out: Part[]) {
  const shape = stickShape(pose.dims), f = stickFrame(pose.stick);
  for (const pc of shape.pieces)
    out.push(hull(pc.id, 'stick', pc.pts.flatMap(p => {
      const t = shape.thick(p) / 2, z = shape.bend(p[0]);
      return [at(f, p[0], p[1], z - t), at(f, p[0], p[1], z + t)];
    })));
}

// Skates, under the ankle, toe pointing where the pad faces (the pad's toe is tied to it). Frame: origin at the bottom
// of the steel, x toward the toe, y up the skate, z across. On a leg standing on its skate (the same test as
// frontReach) the skate leans with the shin onto its edge (skateAxes). On a kneeling leg the ankle stays square: the sole faces out along the
// shin, just past the pad's boot, which covers the toe. The steel and holder lift the sole SKATE_LIFT (the lift in
// ankleH); the boot runs from the sole up into the pad, toe at 0.7 of the foot.
const SKATE_LIFT = 0.1016;
function skateFrame(pose: Pose, l: Leg): Frame {
  if (l.shinDir.y < -0.5) {
    const { fwd, up } = skateAxes(l);
    return { o: sub(l.ankle, mul(up, pose.dims.ankleH)), x: fwd, y: up, z: cross(fwd, up) };
  }
  const n = l.pads[0].n, up = mul(l.shinDir, -1), fwd = norm(sub(n, mul(up, dot(n, up))));
  return { o: sub(l.ankle, mul(up, pose.dims.ankleH)), x: fwd, y: up, z: cross(fwd, up) };
}
function skates(pose: Pose, out: Part[]) {
  const L = 0.152 * pose.dims.H, heel = -0.3 * L, toe = 0.7 * L, sole = SKATE_LIFT;
  for (const l of pose.legs) {
    const f = skateFrame(pose, l), s = l.side > 0 ? 'L' : 'R';
    out.push(hull(`skate${s}`, 'blade', [
      ...ring(f, sole, heel, toe, -0.045, 0.045, 0.03),
      ...ring(f, sole + 0.04, heel - 0.01, toe - 0.03, -0.05, 0.05, 0.03),
      ...ring(f, dot(sub(l.ankle, f.o), f.y) + 0.03, heel + 0.01, 0.2 * L, -0.045, 0.045, 0.03),
    ]));
    out.push(hull(`skateHolder${s}`, 'blade', slab(f, [[heel + 0.02, 0.03], [toe - 0.03, 0.03], [toe - 0.05, sole], [heel + 0.01, sole]], -0.012, 0.012)));
    out.push(hull(`skateSteel${s}`, 'trim', slab(f, [[heel + 0.01, 0.03], [heel + 0.02, 0.004], [toe - 0.06, 0], [toe - 0.025, 0.012], [toe - 0.02, 0.03]], -0.002, 0.002)));
  }
}

/** The gear parts: both leg pads, the skates, the glove, the blocker and the stick. */
export function gearParts(pose: Pose): Part[] {
  const out: Part[] = [];
  pads(pose, out); skates(pose, out); glove(pose, out); blocker(pose, out); stick(pose, out);
  return out;
}
