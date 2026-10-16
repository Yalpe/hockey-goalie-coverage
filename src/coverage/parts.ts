// The goalie as a list of convex parts in its own (posing) frame. Ported from the controls prototype's COVERAGE
// MODULE. The coverage dilates each part by the Puck; the goalie mesh draws the same parts, so what you see is what
// covers the net.
import type { Pose } from '../posing/posing';
import { add, dot, FWD, mul, norm, sub, type Vec } from '../posing/vec';
import { gearParts } from './gearShapes';

export type PartMat = 'body' | 'jersey' | 'pad' | 'glove' | 'blocker' | 'trim' | 'stick' | 'blade';

/** A capsule from a to b with radius r (a sphere when a = b). */
export interface CapsulePart { id: string; kind: 'capsule'; a: Vec; b: Vec; r: number; mat: PartMat }
/** An oriented box: l along u, d along n, w along u×n. */
export interface BoxPart { id: string; kind: 'box'; center: Vec; u: Vec; n: Vec; w: number; l: number; d: number; mat: PartMat }
/** Any convex shape, as the points it is the hull of (the gear: see gearShapes.ts). */
export interface HullPart { id: string; kind: 'hull'; pts: Vec[]; mat: PartMat }
export type Part = CapsulePart | BoxPart | HullPart;

export function goalieParts(pose: Pose): Part[] {
  const d = pose.dims, H = d.H, parts: Part[] = [];
  const cap = (id: string, a: Vec, b: Vec, r: number, mat: PartMat) => parts.push({ id, kind: 'capsule', a, b, r, mat });
  const box = (id: string, center: Vec, u: Vec, n: Vec, w: number, l: number, dp: number, mat: PartMat) =>
    parts.push({ id, kind: 'box', center, u, n, w, l, d: dp, mat });
  for (const l of pose.legs) {
    const s = l.side > 0 ? 'L' : 'R';
    cap('thigh' + s, l.hip, l.knee, 0.055 * H, 'body');
    cap('shin' + s, l.knee, l.ankle, 0.04 * H, 'body');
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
  parts.push(...gearParts(pose));
  return parts;
}

/** A part's geometry to 0.01 mm, ignoring its material: equal signatures mean nothing needs rebuilding. */
export const partSig = (p: Part) => JSON.stringify(p, (k, v) => k === 'mat' ? undefined : typeof v === 'number' ? Math.round(v * 1e5) : v);
