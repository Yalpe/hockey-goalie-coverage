// POSING MODULE: pure (no DOM, no three.js), goalie-local frame, metres. Ported from the controls prototype with as
// little change as possible; see issues/goalie-coverage-mvp/04-posing-prototype.md for the decisions behind it.
// Frame: origin on the ice under the goalie's pelvis; +y up; +z = the goalie's forward; +x = the goalie's LEFT.
// Hand targets are fractions of height H: { out: sideways away from centreline, up: above ice, fwd: ahead }.
import { CREASE_RADIUS, IN, MOUTH_HALF_W, POST_R } from '../dims';
import { gearFor } from './gear';
import { add, clamp, cross, dot, FWD, len, mul, norm, sub, UP, V, type Vec } from './vec';

export type StanceKey = 'standup' | 'butterfly' | 'rvhL' | 'rvhR' | 'overlapL' | 'overlapR';
export type CatchSide = 'left' | 'right';
export type HandKey = 'glove' | 'blocker';
export type Side = 1 | -1;

export interface WristRot { yaw: number; pitch: number; roll: number }
/** A hand target: position as fractions of height, wrist angles in degrees. */
export interface HandTarget extends WristRot { out: number; up: number; fwd: number }

export interface PoseSetup {
  stance: StanceKey;
  heightM: number;
  catchSide: CatchSide;
  gripAboveIn: number;
  glove: HandTarget;
  blocker: HandTarget;
}

export type Dims = ReturnType<typeof goalieDims>;

// H is barefoot height. The body comes from Winter's ratios (research 01 §4.1); the gear from a stepped table of
// typical retail sizes by height (research 03 §6, see gear.ts).
export function goalieDims(H: number) {
  const gear = gearFor(H / IN), kneeRef = 0.285 * H + 0.1016;   // knee above ice, on skates
  return {
    H, band: gear.band,
    thigh: 0.245 * H, shank: 0.246 * H, upperArm: 0.186 * H, forearm: 0.146 * H,
    torso: 0.288 * H, shoulderHalf: 0.1295 * H, hipHalf: 0.06 * H,
    ankleH: 0.039 * H + 0.1016,                       // ankle above ice incl. skate lift
    padTop: kneeRef + gear.kneeToTop * IN, kneeRef,   // the pad top sits a chart distance above the knee
    padWidth: gear.padWidth * IN, padDepth: 0.09 * H, // depth simplified (shin, not knee stack)
    blocker: { w: gear.blocker.w * IN, l: gear.blocker.l * IN },
    glove: { w: gear.glove.w * IN, h: gear.glove.h * IN },
    blade: { l: gear.blade.l * IN, h: gear.blade.w * IN },
    paddle: { l: gear.paddle * IN, w: gear.blade.w * IN },
    stickLen: Math.min(1.397, 0.75 * H),
  };
}

type Triple = [number, number, number];
// Leg directions are [outward, up, forward]; thigh = hip->knee, shin = knee->ankle.
interface FixedLeg { thigh: Triple; shin: Triple; padFace?: Triple }
interface PlantedLeg { plant: { foot: [number, number]; pole: Triple } }
type LegDef = FixedLeg | PlantedLeg;

const STANDUP_LEG: FixedLeg = { thigh: [-0.05, -0.5, 0.87], shin: [0.3, -0.86, -0.4] };
const BUTTERFLY_LEG: FixedLeg = { thigh: [-0.12, -0.75, 0.6], shin: [1, 0, -0.45] };
// RVH post leg: the goalie sits almost on top of the post knee. The pad lies flat on the ice, and the shin runs out
// to the post along the goal line. Local directions are worked out for a body turned 30° toward the post:
// the shin is turned 30° forward, and the thigh drops slightly back and in, so that the knee sits on the pad's line
// just in front of the goal line. The pad stands on its inner edge like a butterfly pad, its face turned back 30° so
// it faces straight out from the net.
const RVH_POST_LEG: FixedLeg = { thigh: [-0.077, -0.40, -0.166], shin: [0.866, 0, 0.5], padFace: [-0.5, 0, 0.866] };
// RVH far leg: skate planted wide out to the side, knee forward and low, shin running out and down to the skate.
// Solved by IK to a foot spot [outward, forward] (fractions of H).
const RVH_FAR_LEG: PlantedLeg = { plant: { foot: [0.45, 0.02], pole: [0.2, 0.5, 1] } };
export const RVH_TURN_DEG = 30;   // body rotation toward the post
// Overlap: standing on the post, squared to a shooter driving wide, so turned well round toward the post.
export const OVERLAP_TURN_DEG = 67;

interface StanceDef {
  label: string;
  lean: number;
  sideLean?: number;
  leg?: FixedLeg;
  /** Post Stances (RVH, Overlap): which post (+1 = the goalie's left), and how far the body turns toward it. */
  post?: Side;
  postTurn?: number;
  /** The post-side leg, if it differs from leg (RVH, Overlap); RVH's far leg is planted instead. */
  postLeg?: FixedLeg;
  farLeg?: PlantedLeg;
}
export const STANCES: Record<StanceKey, StanceDef> = {
  standup:   { label: 'Stand-up',   lean: 45, leg: STANDUP_LEG },
  butterfly: { label: 'Butterfly',  lean: 12, leg: BUTTERFLY_LEG },
  rvhL:      { label: 'RVH left',   lean: 5, sideLean: 30, post: +1, postTurn: RVH_TURN_DEG, postLeg: RVH_POST_LEG, farLeg: RVH_FAR_LEG },
  rvhR:      { label: 'RVH right',  lean: 5, sideLean: 30, post: -1, postTurn: RVH_TURN_DEG, postLeg: RVH_POST_LEG, farLeg: RVH_FAR_LEG },
  overlapL:  { label: 'Overlap left',  lean: 45, leg: STANDUP_LEG, post: +1, postTurn: OVERLAP_TURN_DEG },
  overlapR:  { label: 'Overlap right', lean: 45, leg: STANDUP_LEG, post: -1, postTurn: OVERLAP_TURN_DEG },
};
export const STANCE_KEYS = Object.keys(STANCES) as StanceKey[];
/** Which way a post Stance faces when locked to its post (0 for the others). */
export const postFacing = (stance: StanceKey) => (STANCES[stance].post ?? 0) * (STANCES[stance].postTurn ?? 0);

// RVH at its own post: where the goalie's root goes so the end of the post pad sits at the post, the pad standing
// on edge just in front of the goal line and running along it from the post toward the middle of the net.
// Overlap at its own post: the goalie stands with its back against the post, the post behind its post-side hip and
// the post-side skate just outside it, so the short side is sealed.
// Top of the crease: the goalie stands on the crease arc, toes on the edge of the blue paint. Upright skates count
// at their toes; in a kneeling Stance, the front edge of whatever pad is on the ice counts instead.
export function frontReach(pose: Pose): number {
  let best = -Infinity;
  for (const l of pose.legs) {
    if (l.shinDir.y < -0.5) best = Math.max(best, l.ankle.z + 0.7 * 0.152 * pose.dims.H);   // skate toe
    else for (const b of l.pads) for (const c of boxCorners(b)) if (c.y < 0.05) best = Math.max(best, c.z);
  }
  return best;
}
export function placeAtCreaseTop(pose: Pose, facingDeg: number) {
  const f = facingDeg * RAD, r = CREASE_RADIUS - frontReach(pose);
  return { x: r * Math.sin(f), z: r * Math.cos(f) };
}
const POST_X = MOUTH_HALF_W + POST_R;    // post centre, from the middle of the Goal Mouth
const POST_PAD_AXIS_Z = 0.07;            // pad back face (axis - 4 cm) just clears the post
const OVERLAP_OUT = 2 * IN;              // how far the post-side skate is outside the post's centre
export function placeAtPost(pose: Pose, stance: StanceKey, facingDeg: number) {
  const side = STANCES[stance].post!, f = facingDeg * RAD;
  const turn = (p: Vec) => ({ x: p.x * Math.cos(f) + p.z * Math.sin(f), z: -p.x * Math.sin(f) + p.z * Math.cos(f) });
  if (!pose.postAnchor) {
    // Overlap, worked out in the goalie's own frame (so it holds at any turn): the post level with the hips, just
    // inside the post-side skate. How far behind the body it goes needs the body's shape: see postSpot in goalie.ts.
    const skate = pose.legs.find(l => l.side === side)!.ankle;
    const p = turn(V(side * (side * skate.x - OVERLAP_OUT), 0, 0));
    return { x: side * POST_X - p.x, z: -p.z };
  }
  const w = turn(pose.postAnchor);
  return { x: side * POST_X - w.x, z: POST_PAD_AXIS_Z - w.z };
}

// Hand targets also carry wrist angles in degrees: yaw = face turned outward, pitch = face tilted up, roll = top twisted outward.
const NO_ROT: WristRot = { yaw: 0, pitch: 0, roll: 0 };
export const DEFAULT_TARGETS: Record<'standup' | 'butterfly', Record<HandKey, HandTarget>> = {
  standup:   { glove: { out: 0.24, up: 0.47, fwd: 0.34, ...NO_ROT, pitch: -20 }, blocker: { out: 0.16, up: 0.38, fwd: 0.32, ...NO_ROT } },
  butterfly: { glove: { out: 0.24, up: 0.36, fwd: 0.26, ...NO_ROT, pitch: -20 }, blocker: { out: 0.16, up: 0.29, fwd: 0.25, ...NO_ROT } },
};
// RVH: the post-side hand seals the hole beside the post-side hip. A far glove sits in front of the chest;
// a far blocker stays low enough to keep the blade on the ice.
const RVH_POST_HAND = { out: 0.14, up: 0.22, fwd: 0.10 };   // low enough that the glove/blocker overlaps the pad top
const RVH_FAR_GLOVE = { out: 0.12, up: 0.42, fwd: 0.16 }, RVH_FAR_BLOCKER = { out: 0.10, up: 0.34, fwd: 0.14 };
export function defaultHands(stance: StanceKey, catchSide: CatchSide): Record<HandKey, HandTarget> {
  const st = STANCES[stance];
  if (!st.farLeg) return structuredClone(DEFAULT_TARGETS[st.leg === BUTTERFLY_LEG ? 'butterfly' : 'standup']);
  const gloveAtPost = (catchSide === 'left' ? 1 : -1) === st.post;
  return {
    glove: { ...(gloveAtPost ? RVH_POST_HAND : RVH_FAR_GLOVE), ...NO_ROT, pitch: -20 },
    blocker: { ...(gloveAtPost ? RVH_FAR_BLOCKER : RVH_POST_HAND), ...NO_ROT },
  };
}

// Reach boxes: positions as fractions of H, wrist angles in degrees; [min, max] per axis.
export type HandClamp = Record<keyof HandTarget, [number, number]>;
export type Clamps = Record<StanceKey, Record<HandKey, HandClamp>>;
const GLOVE_ROT = { yaw: [-45, 70], pitch: [-30, 60], roll: [-60, 60] } satisfies Record<keyof WristRot, [number, number]>;
const BLOCKER_ROT = { yaw: [-45, 45], pitch: [-40, 40], roll: [-45, 45] } satisfies Record<keyof WristRot, [number, number]>;
const KNEELING_CLAMP: Record<HandKey, HandClamp> = {
  glove:   { out: [0.04, 0.45], up: [0.20, 0.70], fwd: [0.00, 0.40], ...GLOVE_ROT },
  blocker: { out: [0.04, 0.38], up: [0.15, 0.50], fwd: [0.00, 0.40], ...BLOCKER_ROT },
};
const RVH_CLAMP: Record<HandKey, HandClamp> = {
  glove: { ...KNEELING_CLAMP.glove, up: [0.12, 0.70] },
  blocker: { ...KNEELING_CLAMP.blocker, up: [0.12, 0.50] },
};
const STANDUP_CLAMP: Record<HandKey, HandClamp> = {
  glove:   { out: [0.04, 0.45], up: [0.30, 0.85], fwd: [0.10, 0.45], ...GLOVE_ROT },
  blocker: { out: [0.04, 0.38], up: [0.22, 0.65], fwd: [0.10, 0.45], ...BLOCKER_ROT },
};
export const DEFAULT_CLAMPS: Clamps = {
  standup: structuredClone(STANDUP_CLAMP),
  butterfly: structuredClone(KNEELING_CLAMP),
  rvhL: structuredClone(RVH_CLAMP),
  rvhR: structuredClone(RVH_CLAMP),
  overlapL: structuredClone(STANDUP_CLAMP),
  overlapR: structuredClone(STANDUP_CLAMP),
};

const CLAMP_WORDS: Record<keyof HandTarget, [string, string]> = {
  out: ['across the body', 'too wide'], up: ['too low', 'too high'], fwd: ['behind the body', 'too far forward'],
  yaw: ['turned too far in', 'turned too far out'], pitch: ['tilted too far down', 'tilted too far up'], roll: ['twisted too far in', 'twisted too far out'],
};
export const ROT_KEYS: (keyof WristRot)[] = ['yaw', 'pitch', 'roll'];
const RAD = Math.PI / 180;
const rx = (v: Vec, a: number) => V(v.x, v.y * Math.cos(a) - v.z * Math.sin(a), v.y * Math.sin(a) + v.z * Math.cos(a));
const ry = (v: Vec, a: number) => V(v.x * Math.cos(a) + v.z * Math.sin(a), v.y, -v.x * Math.sin(a) + v.z * Math.cos(a));
const rz = (v: Vec, a: number) => V(v.x * Math.cos(a) - v.y * Math.sin(a), v.x * Math.sin(a) + v.y * Math.cos(a), v.z);
// Same as a three.js Euler(-pitch, side*yaw, -side*roll, 'YXZ').
const wristRotate = (v: Vec, side: Side, r: WristRot) => ry(rx(rz(v, -side * r.roll * RAD), -r.pitch * RAD), side * r.yaw * RAD);

function legDefFor(st: StanceDef, side: Side): LegDef {
  return side === st.post && st.postLeg ? st.postLeg : st.leg ?? st.farLeg!;
}

/** An oriented box: len along u, depth along n, width along u×n. */
export interface PadBox { center: Vec; u: Vec; n: Vec; len: number; width: number; depth: number }

// A pad is two boxes: the shin part (boot to knee roll) and the thigh rise, which follows the thigh up from the knee.
const KNEE_ROLL = 0.04;
/** The end of the pad's boot, on its axis: past the ankle by the skate's height, so the boot covers the skate. */
function bootEnd(d: Dims, knee: Vec, ankle: Vec): Vec {
  return sub(ankle, mul(norm(sub(knee, ankle)), d.ankleH - 0.01));
}
// face: the pad face direction (default straight ahead).
function padBoxes(d: Dims, hip: Vec, knee: Vec, ankle: Vec, face: Vec = FWD): PadBox[] {
  const box = (from: Vec, dir: Vec, l: number, width: number, depth: number): PadBox => {
    const n = norm(sub(face, mul(dir, dot(face, dir))));
    return { center: add(add(from, mul(dir, l / 2)), mul(n, depth / 2 - 0.04)), u: dir, n, len: l, width, depth };
  };
  const u = norm(sub(knee, ankle));                        // up the shin
  const bottom = bootEnd(d, knee, ankle);
  const shin = box(bottom, u, len(sub(knee, bottom)) + KNEE_ROLL, d.padWidth, d.padDepth);
  const rise = box(knee, norm(sub(hip, knee)), d.padTop - d.kneeRef, 0.6 * d.padWidth, 0.8 * d.padDepth);
  return [shin, rise];
}

export function boxCorners(b: PadBox): Vec[] {
  const w = cross(b.u, b.n), out: Vec[] = [];
  for (const a of [-1, 1]) for (const c of [-1, 1]) for (const e of [-1, 1])
    out.push(add(b.center, add(mul(b.u, a * b.len / 2), add(mul(b.n, c * b.depth / 2), mul(w, e * b.width / 2)))));
  return out;
}

function ikElbow(A: Vec, T: Vec, a: number, b: number, pole: Vec): Vec {
  const dir = norm(sub(T, A));
  const dist = clamp(len(sub(T, A)), Math.abs(a - b) + 1e-4, a + b - 1e-4);
  const cosA = (a * a + dist * dist - b * b) / (2 * a * dist);
  const perp = norm(sub(pole, mul(dir, dot(pole, dir))));
  return add(A, add(mul(dir, a * cosA), mul(perp, a * Math.sqrt(Math.max(0, 1 - cosA * cosA)))));
}

export interface Leg { side: Side; hip: Vec; knee: Vec; ankle: Vec; shinDir: Vec; pads: PadBox[] }
export interface Hand {
  side: Side;
  requested: Vec;
  wrist: Vec;
  elbow: Vec;
  shoulder: Vec;
  /** Why the hand was held back, in coach words; empty when it sits where asked. */
  flags: string[];
  rot: WristRot;
  /** The hand's own axes after the wrist turn: palm/face, up, and outward. */
  face: Vec;
  up: Vec;
  out: Vec;
  /** Where the hand actually ended up, as a target. */
  placedFrac: HandTarget;
}
export interface Stick {
  grip: Vec; heel: Vec; dir: Vec; knob: Vec; toeDir: Vec;
  headingDeg: number; gripDist: number; onIce: boolean; lift: number; bladeAhead: number; shaftAngleDeg: number;
}
export interface Pose {
  dims: Dims;
  pelvis: Vec;
  torsoDir: Vec;
  shoulderMid: Vec;
  shoulders: Record<Side, Vec>;
  head: Vec;
  legs: Leg[];
  glove: Hand;
  blocker: Hand;
  stick: Stick;
  /** RVH only: the end of the post-leg pad, on the ice, which goes against the post. (Overlap goes by its pad's corners.) */
  postAnchor: Vec | null;
}

export function solvePose(setup: PoseSetup, clamps: Clamps = DEFAULT_CLAMPS): Pose {
  const H = setup.heightM, d = goalieDims(H), st = STANCES[setup.stance];
  const gs: Side = setup.catchSide === 'left' ? 1 : -1;      // glove side sign (+x = goalie's left)

  // Legs hang from the pelvis at y=0, then the whole body is lifted until its lowest point touches the ice.
  // Planted legs (skate on the ice) are solved after, by IK from the grounded hip.
  type Hung = Leg | { side: Side; hip: Vec; plant: PlantedLeg['plant'] };
  const hung: Hung[] = ([1, -1] as Side[]).map(side => {
    const def = legDefFor(st, side);
    const dir = (v: Triple) => norm(V(side * v[0], v[1], v[2]));
    const hip = V(side * d.hipHalf, 0, 0);
    if ('plant' in def) return { side, hip, plant: def.plant };
    const shinDir = dir(def.shin);
    const knee = add(hip, mul(dir(def.thigh), d.thigh));
    const ankle = add(knee, mul(shinDir, d.shank));
    const pads = padBoxes(d, hip, knee, ankle, def.padFace && V(side * def.padFace[0], def.padFace[1], def.padFace[2]));
    // Pads can't pass through each other: push the lower leg out until its pads stop at the centreline.
    const inner = Math.min(...pads.flatMap(b => boxCorners(b).map(c => c.x * side)));
    const push = V(Math.max(0, -inner) * side, 0, 0);
    return { side, hip, knee: add(knee, push), ankle: add(ankle, push), shinDir, pads: pads.map(b => ({ ...b, center: add(b.center, push) })) };
  });
  let low = Infinity;
  for (const l of hung) {
    if ('plant' in l) continue;
    low = Math.min(low, l.ankle.y - d.ankleH * Math.max(0, -l.shinDir.y));  // skate blade only counts when upright
    for (const b of l.pads) for (const c of boxCorners(b)) low = Math.min(low, c.y);
  }
  const lift = V(0, -low, 0);
  const legs: Leg[] = hung.map(l => {
    const hip = add(l.hip, lift);
    if ('plant' in l) {
      const p = l.plant, side = l.side;
      // The skate rolls onto its inside edge: raise the foot until the pad's lowest corner rests on the ice.
      let footY = d.ankleH, leg!: Leg;
      for (let i = 0; i < 4; i++) {
        const footT = V(side * p.foot[0] * H, footY, p.foot[1] * H);
        const knee = ikElbow(hip, footT, d.thigh, d.shank, V(side * p.pole[0], p.pole[1], p.pole[2]));
        const shinDir = norm(sub(footT, knee)), ankle = add(knee, mul(shinDir, d.shank));
        leg = { side, hip, knee, ankle, shinDir, pads: padBoxes(d, hip, knee, ankle) };
        footY -= Math.min(0, ...leg.pads.flatMap(b => boxCorners(b).map(c => c.y)));
      }
      return leg;
    }
    return { ...l, hip, knee: add(l.knee, lift), ankle: add(l.ankle, lift), pads: l.pads.map(b => ({ ...b, center: add(b.center, lift) })) };
  });
  const pelvis = lift;
  // RVH: the end of the post-leg pad's boot is what goes against the post. (Anchoring the ankle instead left the
  // boot, which reaches a skate's height past the ankle, sticking out past the post.)
  const postLeg = st.farLeg ? legs.find(l => l.side === st.post)! : null;
  const boot = postLeg ? bootEnd(d, postLeg.knee, postLeg.ankle) : null;
  const postAnchor = boot ? V(boot.x, 0, boot.z) : null;

  const lean = st.lean * Math.PI / 180, sl = (st.sideLean || 0) * Math.PI / 180;
  const torsoDir = norm(V((st.post || 0) * Math.sin(sl), Math.cos(lean), Math.sin(lean)));
  const shoulderMid = add(pelvis, mul(torsoDir, d.torso));
  const lateral = norm(cross(torsoDir, FWD));                // toward the goalie's left
  const shoulders: Record<Side, Vec> = { 1: add(shoulderMid, mul(lateral, d.shoulderHalf)), [-1]: sub(shoulderMid, mul(lateral, d.shoulderHalf)) };
  const head = add(shoulderMid, add(mul(torsoDir, 0.06 * H), V(0, 0.05 * H, 0.02 * H)));

  const hand = (which: HandKey): Hand => {
    const side = (which === 'glove' ? gs : -gs) as Side, t = setup[which], c = clamps[setup.stance][which], flags: string[] = [];
    const placed = {} as HandTarget;
    for (const k of Object.keys(c) as (keyof HandTarget)[]) {
      const v = t[k] ?? 0;
      placed[k] = clamp(v, c[k][0], c[k][1]);
      if (v < c[k][0] - 1e-6) flags.push(CLAMP_WORDS[k][0]);
      if (v > c[k][1] + 1e-6) flags.push(CLAMP_WORDS[k][1]);
    }
    const shoulder = shoulders[side], reach = (d.upperArm + d.forearm) * 0.995;
    let wrist = V(side * placed.out * H, placed.up * H, placed.fwd * H);
    // A hand settled at arm's reach and stored to a thousandth of height can land a hair past it, so allow 2 mm
    // (still inside the full arm length) before calling it held back.
    if (len(sub(wrist, shoulder)) > reach + 0.002) { wrist = add(shoulder, mul(norm(sub(wrist, shoulder)), reach)); flags.push('out of arm reach'); }
    const elbow = ikElbow(shoulder, wrist, d.upperArm, d.forearm, V(side * 0.8, -1, -0.4));
    const rot = { yaw: placed.yaw, pitch: placed.pitch, roll: placed.roll };
    return { side, requested: V(side * t.out * H, t.up * H, t.fwd * H), wrist, elbow, shoulder, flags, rot,
      face: wristRotate(FWD, side, rot), up: wristRotate(UP, side, rot), out: wristRotate(V(side, 0, 0), side, rot),
      placedFrac: { out: wrist.x * side / H, up: wrist.y / H, fwd: wrist.z / H, ...rot } };
  };
  const glove = hand('glove'), blocker = hand('blocker');

  // Stick: straight shaft gripped gripDist up from the heel, turning with the blocker wrist. The neutral shaft (heel
  // straight ahead of the hand) is turned by the wrist angles; the blade stays flat on the ice, so only the shaft's
  // heading survives: the heel swings round the spot under the hand at the same distance, and the toe stays square to
  // the shaft, toward the glove side.
  const grip = blocker.wrist, gripDist = d.paddle.l + setup.gripAboveIn * IN;
  const onIce = grip.y < gripDist, reachOnIce = onIce ? Math.sqrt(gripDist ** 2 - grip.y ** 2) : 0;
  const turned = wristRotate(onIce ? norm(V(0, -grip.y, reachOnIce)) : FWD, blocker.side, blocker.rot);
  const heading = Math.hypot(turned.x, turned.z) > 1e-3 ? norm(V(turned.x, 0, turned.z)) : FWD;
  const heel = onIce ? add(V(grip.x, 0, grip.z), mul(heading, reachOnIce)) : V(grip.x, grip.y - gripDist, grip.z);
  const stickDir = norm(sub(grip, heel));
  const stick: Stick = { grip, heel, dir: stickDir, knob: add(heel, mul(stickDir, d.stickLen)), toeDir: mul(cross(UP, heading), gs),
    headingDeg: Math.round(Math.atan2(heading.x, heading.z) * 180 / Math.PI),
    gripDist, onIce, lift: onIce ? 0 : heel.y, bladeAhead: heel.z - grip.z,
    shaftAngleDeg: Math.asin(clamp(stickDir.y, -1, 1)) * 180 / Math.PI };

  return { dims: d, pelvis, torsoDir, shoulderMid, shoulders, head, legs, glove, blocker, stick, postAnchor };
}
