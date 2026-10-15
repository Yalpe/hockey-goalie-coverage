// The goalie as a list of convex parts in its own (posing) frame. Ported from the controls prototype's COVERAGE
// MODULE. The coverage dilates each part by the Puck; the goalie mesh draws the same parts, so what you see is what
// covers the net.
import type { Pose } from '../posing/posing';
import { add, cross, dot, FWD, mul, norm, sub, type Vec } from '../posing/vec';

export type PartMat = 'body' | 'jersey' | 'pad' | 'glove' | 'blocker' | 'stick' | 'blade';

/** A capsule from a to b with radius r (a sphere when a = b). */
export interface CapsulePart { id: string; kind: 'capsule'; a: Vec; b: Vec; r: number; mat: PartMat }
/** An oriented box: l along u, d along n, w along u×n. */
export interface BoxPart { id: string; kind: 'box'; center: Vec; u: Vec; n: Vec; w: number; l: number; d: number; mat: PartMat }
/** An elliptical slab: semi-axes rx along ax and ry along ay, thickness t. */
export interface DiskPart { id: string; kind: 'disk'; center: Vec; ax: Vec; ay: Vec; rx: number; ry: number; t: number; mat: PartMat }
export type Part = CapsulePart | BoxPart | DiskPart;

export function goalieParts(pose: Pose): Part[] {
  const d = pose.dims, H = d.H, parts: Part[] = [];
  const cap = (id: string, a: Vec, b: Vec, r: number, mat: PartMat) => parts.push({ id, kind: 'capsule', a, b, r, mat });
  const box = (id: string, center: Vec, u: Vec, n: Vec, w: number, l: number, dp: number, mat: PartMat) =>
    parts.push({ id, kind: 'box', center, u, n, w, l, d: dp, mat });
  for (const l of pose.legs) {
    const s = l.side > 0 ? 'L' : 'R';
    cap('thigh' + s, l.hip, l.knee, 0.055 * H, 'body');
    cap('shin' + s, l.knee, l.ankle, 0.04 * H, 'body');
    l.pads.forEach((b, i) => box('pad' + s + i, b.center, b.u, b.n, b.width, b.len, b.depth, 'pad'));
  }
  const tn = norm(sub(FWD, mul(pose.torsoDir, dot(FWD, pose.torsoDir))));
  box('pelvis', add(pose.pelvis, mul(pose.torsoDir, 0.02 * H)), pose.torsoDir, tn, 0.24 * H, 0.1 * H, 0.14 * H, 'body');
  box('chest', add(pose.pelvis, mul(pose.torsoDir, d.torso * 0.55)), pose.torsoDir, tn, 2 * d.shoulderHalf + 0.1, d.torso * 1.1, 0.15 * H, 'jersey');
  cap('head', pose.head, pose.head, 0.065 * H, 'body');
  for (const [w, h] of [['glove', pose.glove], ['blocker', pose.blocker]] as const) {
    cap(w + 'Shoulder', h.shoulder, h.shoulder, 0.05 * H, 'jersey');
    cap(w + 'UpperArm', h.shoulder, h.elbow, 0.04 * H, 'jersey');
    cap(w + 'Forearm', h.elbow, h.wrist, 0.035 * H, 'jersey');
  }
  const handOff = (h: Pose['glove'], o: number, u: number, f: number) => add(h.wrist, add(mul(h.out, o), add(mul(h.up, u), mul(h.face, f))));
  const gl = pose.glove;
  parts.push({ id: 'glove', kind: 'disk', center: handOff(gl, 0.05, 0.06, 0.04), ax: cross(gl.face, gl.up), ay: gl.up, rx: d.glove.w / 2, ry: d.glove.h / 2, t: 0.06, mat: 'glove' });
  const bl = pose.blocker;
  box('blocker', handOff(bl, 0.07, 0.05, 0.03), bl.up, bl.face, d.blocker.w, d.blocker.l, 0.05, 'blocker');
  const s = pose.stick, paddleEnd = add(s.heel, mul(s.dir, d.paddle.l));
  box('paddle', add(s.heel, mul(s.dir, d.paddle.l / 2)), s.dir, norm(sub(FWD, mul(s.dir, dot(FWD, s.dir)))), d.paddle.w, d.paddle.l, 0.02, 'stick');
  cap('shaft', paddleEnd, s.knob, 0.015, 'stick');
  box('blade', add(s.heel, add(mul(s.toeDir, d.blade.l / 2), mul(s.dir, d.blade.h / 2))), s.dir, cross(s.toeDir, s.dir), d.blade.l, d.blade.h, 0.015, 'blade');
  return parts;
}
