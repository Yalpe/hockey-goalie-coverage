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
  /** Butterfly only: the butt drop, 0 = the usual butterfly, 1 = sat right back. */
  flare?: number;
  /** Stand-up only: ankle to ankle, in whole inches; unset = the usual stance. */
  feetWidthIn?: number;
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
    stickLen: Math.min(1.397, 0.9 * H),   // cut at nose height, like a player's stick; HC's 55 in at most
  };
}

type Triple = [number, number, number];
// A leg by its joints, in degrees, from standing straight. Hip: flex swings the thigh forward, abd swings it out to
// the side, rot turns the kneecap in (internal rotation). The knee is a hinge: it only bends, so the shin always swings
// in the plane the kneecap faces, and a leg can't be made that a real knee couldn't hold.
export interface JointLeg { flex: number; abd: number; rot: number; knee: number }
// Joint ranges: a flexible athlete's, with internal rotation at the goalie end (the butterfly needs about 70°). Past
// 70° it stands in for the knee and ankle twist a full Flare also takes, which a hinge knee can't do.
export const LEG_RANGE: Record<keyof JointLeg, [number, number]> = {
  flex: [-20, 125], abd: [-30, 50], rot: [-45, 90], knee: [0, 150],
};
// The planted leg is solved by IK to a foot spot [outward, forward] (fractions of H); the pole says where the knee points.
interface PlantedLeg { plant: { foot: [number, number]; pole: Triple } }
type LegDef = JointLeg | PlantedLeg;

// Stand-up, from goalies seen side on (angles forward of vertical; the ankle behind the knee). Every goalie sits down
// into the knees like an NHL goalie: thigh about 55°, shin about 30°. A tall one leans its back about 55°, the hips back
// so the head and shoulders come out over the toes; a small one sits low with its back much more upright (a 4′8″ goalie
// in a game photo), about 35°. The back blends from 4′6″ to 6′0″.
// The hip turned in (19°) splays the shins into an A: pads together at the knees, skates 27 in apart at 5′9″.
const STANDUP_LEG: JointLeg = { flex: 55, abd: -3, rot: 19, knee: 87 };
const STANDUP_LEAN = { small: 35, tall: 55 };
const standupLean = (H: number) =>
  STANDUP_LEAN.small + clamp((H / IN - 54) / (72 - 54), 0, 1) * (STANDUP_LEAN.tall - STANDUP_LEAN.small);
// Goalies over 5′9″ also stand wider to get down to their size: the hips turn in 1.5° more per inch (about an inch
// more between the skates). Smaller ones stand a little wider for their size too (0.25° per inch under 5′9″): a 4′8″
// goalie's skates about 25 in apart, as in a game photo.
function standupLeg(H: number, rot = STANDUP_LEG.rot + 1.5 * Math.max(0, H / IN - 69) + 0.25 * Math.max(0, 69 - H / IN)): JointLeg {
  return { ...STANDUP_LEG, rot };
}
// Overlap stands taller on its post.
const OVERLAP_LEG: JointLeg = { flex: 60, abd: -3, rot: 18, knee: 86 };
const BUTTERFLY_LEG: JointLeg = { flex: 39, abd: -7, rot: 70, knee: 112 };
// Flare, the butterfly's butt drop (0 to 1): the goalie sits back, so the hips drop (more hip flex) and the feet flare
// out (the hip turns further in). The knee bends to keep the shin flat on the ice.
const FLARE_MAX = { flex: 16, rot: 20 };
function flareLeg(flare: number): JointLeg {
  const flex = BUTTERFLY_LEG.flex + FLARE_MAX.flex * flare, rot = BUTTERFLY_LEG.rot + FLARE_MAX.rot * flare;
  return kneeForTilt({ ...BUTTERFLY_LEG, flex, rot }, BUTTERFLY_LEG);
}
/**
 * The knee bend that gives leg jl the same shin tilt (up or down) as ref. Two bends give any tilt: one with the ankle
 * behind the knee, one with it in front. Only the one on ref's side counts (a stand-up goalie with its knees behind
 * its feet would fall over); of those, the nearest to ref's own bend.
 */
function kneeForTilt(jl: JointLeg, ref: JointLeg): JointLeg {
  const r = jointDirs(ref).shin;
  let knee = jl.knee, best = Infinity;
  for (let k = LEG_RANGE.knee[0]; k <= LEG_RANGE.knee[1]; k++) {
    const s = jointDirs({ ...jl, knee: k }).shin;
    if (Math.sign(s.z) !== Math.sign(r.z)) continue;
    const off = Math.abs(s.y - r.y) + 1e-4 * Math.abs(k - ref.knee);
    if (off < best) { best = off; knee = k; }
  }
  return { ...jl, knee };
}
// Stand-up feet width: the hips turn in, which swings the skates out under knees that stay where they are (spreading
// the hips instead would open the five-hole). The shins angle out, the skates go onto their inside edges and the hips drop.
// The width is measured on the leg as it hangs, after the pads have pushed the knees apart.
// From pads parallel and touching, to where the pad's boot comes down onto the ice (the skates leaning about 40°).
const FEET_ROT: [number, number] = [0, 34];
const feetWidthAt = (d: Dims, rot: number) => 2 * hangLeg(d, 1, standupLeg(d.H, rot), true).ankle.x;
/** The stand-up feet widths a goalie of height H can hold, ankle to ankle, in whole inches. */
export function feetWidthRangeIn(H: number): [number, number] {
  const d = goalieDims(H);
  return [Math.ceil(feetWidthAt(d, FEET_ROT[0]) / IN), Math.floor(feetWidthAt(d, FEET_ROT[1]) / IN)];
}
let feetMemo = { key: '', leg: STANDUP_LEG };   // both legs, and the next pose at the same height and width, reuse it
function feetWidthLeg(d: Dims, widthM: number): JointLeg {
  const key = `${d.H} ${widthM}`;
  if (feetMemo.key === key) return feetMemo.leg;
  // The width grows with the turn, so halve the range down to a quarter degree.
  let [lo, hi] = FEET_ROT;
  while (hi - lo > 0.25) { const mid = (lo + hi) / 2; if (feetWidthAt(d, mid) < widthM) lo = mid; else hi = mid; }
  feetMemo = { key, leg: standupLeg(d.H, (lo + hi) / 2) };
  return feetMemo.leg;
}
// RVH post leg: in the butterfly position, the pad flat on the ice with its toe at the post. A flat shin can't point
// any further forward than the butterfly's flare (about 25° behind straight out) without turning the hip in past what
// it can, so the hips stay square to the net (see hipTurn) while the shoulders turn to the post, and the pad runs
// from the post out along the ice, the knee a little in front of the goal line.
const RVH_POST_LEG = BUTTERFLY_LEG;
// RVH far leg: skate planted wide out to the side, knee forward and low, shin running out and down to the skate.
const RVH_FAR_LEG: PlantedLeg = { plant: { foot: [0.45, 0.02], pole: [0.2, 0.5, 1] } };
export const RVH_TURN_DEG = 30;   // body rotation toward the post
const RVH_HIP_TURN_DEG = 30;      // the hips turned back from that, square to the net
// Stick lie: the angle between the shaft and the blade line behind the heel, measured off a product photo of a carbon
// goalie stick laid flat (the paddle's edges against the blade's bottom): about 60°. (It was 75°, read off a stance
// photo with the shaft about 14° off vertical, but a stick seen in a stance only shows its lie when the blade is flat
// and the stick square to the camera.)
export const STICK_LIE_DEG = 60;
// Overlap: standing on the post, squared to a shooter driving wide, so turned well round toward the post.
export const OVERLAP_TURN_DEG = 67;

interface StanceDef {
  label: string;
  lean: number;
  sideLean?: number;
  leg?: JointLeg;
  /** Post Stances (RVH, Overlap): which post (+1 = the goalie's left), and how far the body turns toward it. */
  post?: Side;
  postTurn?: number;
  /** How far the hips turn back from the post, against the shoulders (a twist at the waist). */
  hipTurn?: number;
  /** The post-side leg, if it differs from leg (RVH, Overlap); RVH's far leg is planted instead. */
  postLeg?: JointLeg;
  farLeg?: PlantedLeg;
}
export const STANCES: Record<StanceKey, StanceDef> = {
  standup:   { label: 'Stand-up',   lean: 55, leg: STANDUP_LEG },
  butterfly: { label: 'Butterfly',  lean: 20, leg: BUTTERFLY_LEG },
  rvhL:      { label: 'RVH left',   lean: 15, sideLean: 30, post: +1, postTurn: RVH_TURN_DEG, hipTurn: RVH_HIP_TURN_DEG, postLeg: RVH_POST_LEG, farLeg: RVH_FAR_LEG },
  rvhR:      { label: 'RVH right',  lean: 15, sideLean: 30, post: -1, postTurn: RVH_TURN_DEG, hipTurn: RVH_HIP_TURN_DEG, postLeg: RVH_POST_LEG, farLeg: RVH_FAR_LEG },
  overlapL:  { label: 'Overlap left',  lean: 45, leg: OVERLAP_LEG, post: +1, postTurn: OVERLAP_TURN_DEG },
  overlapR:  { label: 'Overlap right', lean: 45, leg: OVERLAP_LEG, post: -1, postTurn: OVERLAP_TURN_DEG },
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
// Stand-up: how far out each hand is and how it's turned, set by a coach; how high and how far forward are worked out
// for the goalie (standupHands).
export const DEFAULT_TARGETS: Record<'standup' | 'butterfly' | 'overlap', Record<HandKey, HandTarget>> = {
  standup:   { glove: { out: 0.237, up: 0.359, fwd: 0.372, ...NO_ROT, pitch: -20 }, blocker: { out: 0.217, up: 0.318, fwd: 0.379, ...NO_ROT } },
  butterfly: { glove: { out: 0.24, up: 0.292, fwd: 0.243, ...NO_ROT, pitch: -20 }, blocker: { out: 0.222, up: 0.29, fwd: 0.25, ...NO_ROT } },
  overlap:   { glove: { out: 0.24, up: 0.47, fwd: 0.34, ...NO_ROT, pitch: -20 }, blocker: { out: 0.222, up: 0.38, fwd: 0.321, ...NO_ROT } },
};
// RVH: the post-side hand seals the hole beside the post-side hip. A far glove sits in front of the chest;
// a far blocker stays low enough to keep the blade on the ice.
const RVH_POST_HAND = { out: 0.14, up: 0.22, fwd: 0.10 };   // low enough that the glove/blocker overlaps the pad top
const RVH_FAR_GLOVE = { out: 0.12, up: 0.42, fwd: 0.16 }, RVH_FAR_BLOCKER = { out: 0.10, up: 0.34, fwd: 0.14 };
/** Everything about the body but the hands: what the default hands depend on. */
export type BodySetup = Omit<PoseSetup, 'glove' | 'blocker'>;
export function defaultHands(body: BodySetup): Record<HandKey, HandTarget> {
  const { stance, catchSide } = body, st = STANCES[stance];
  if (stance === 'standup') return standupHands(body);
  if (!st.farLeg) return structuredClone(DEFAULT_TARGETS[st.leg === BUTTERFLY_LEG ? 'butterfly' : 'overlap']);
  const gloveAtPost = (catchSide === 'left' ? 1 : -1) === st.post;
  return {
    glove: { ...(gloveAtPost ? RVH_POST_HAND : RVH_FAR_GLOVE), ...NO_ROT, pitch: -20 },
    blocker: { ...(gloveAtPost ? RVH_FAR_BLOCKER : RVH_POST_HAND), ...NO_ROT },
  };
}

// Stand-up hands, from photos of goalies front and side on: the stick stands nearly upright, leaning back about 15°
// with the blade just ahead of the toes, so the blocker hand sits at the height that gives the stick that lean (a few
// centimetres under the hip, higher for a small goalie, whose paddle is long for its size). The glove is well above it.
// Seen from the side, the paddle, the hands and the head make one line: the line through the head parallel to the
// stick says how far forward each hand goes.
// The stick never stands upright, seen from the side: it leans back at least MIN_STICK_LEAN_DEG.
const STICK_LEAN_DEG = 15, MIN_STICK_LEAN_DEG = 10, GLOVE_OVER_BLOCKER = 0.09;   // the glove: a fraction of H (16 cm at 5′9″)
/** How high the blocker hand is when it holds the stick with its blade flat on the ice, leaning back by leanDeg seen
 *  from the side (see the stick in solvePose): the higher the hand, the more upright the stick. */
function stickTop(d: Dims, gripAboveIn: number, leanDeg: number): number {
  const lie = STICK_LIE_DEG * RAD;
  return (d.paddle.l + gripAboveIn * IN + 0.5 * d.paddle.w / Math.tan(lie)) * Math.sin(lie) * Math.cos(leanDeg * RAD);
}
function standupHands(body: BodySetup): Record<HandKey, HandTarget> {
  const H = body.heightM, t = structuredClone(DEFAULT_TARGETS.standup);
  let p = solvePose({ ...body, ...t });
  const d = p.dims, top = stickTop(d, body.gripAboveIn, MIN_STICK_LEAN_DEG);
  const reach = (d.upperArm + d.forearm) * 0.995;
  // If the line is out of arm's reach, raise the hands a centimetre at a time: the stick stands up and the line comes
  // back toward the body, but only as far as the stick's least lean.
  for (let by = Math.min(stickTop(d, body.gripAboveIn, STICK_LEAN_DEG), top - 0.005); ; by = Math.min(by + 0.01, top - 0.005)) {
    const gy = by + GLOVE_OVER_BLOCKER * H;
    // Targets are measured in the Stance's usual pose: add back how far Feet width has dropped the hips.
    t.blocker.up = (by + p.sink) / H; t.glove.up = (gy + p.sink) / H;
    t.blocker.fwd = t.glove.fwd = 0.2;   // well within reach, so the stick's lean is read at exactly this height
    p = solvePose({ ...body, ...t });
    const v = sub(p.blocker.wrist, p.stick.heel), zAt = (y: number) => p.head.z + (y - p.head.y) * v.z / v.y;
    t.blocker.fwd = zAt(by) / H; t.glove.fwd = zAt(gy) / H;
    const far = (h: Hand, y: number, z: number) => len(sub(V(h.requested.x, y, z), h.shoulder)) > reach;
    if (by >= top - 0.005 || !far(p.blocker, by, zAt(by)) && !far(p.glove, gy, zAt(gy))) break;
  }
  const k = (x: number) => Math.round(x * 1000) / 1000;   // the link's steps
  for (const h of [t.glove, t.blocker]) { h.up = k(h.up); h.fwd = k(h.fwd); }
  return t;
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
// Forward to 0.55: a small goalie's paddle is long for its size, so its hands reach well out on the stick line (the arm is the real limit).
const STANDUP_CLAMP: Record<HandKey, HandClamp> = {
  glove:   { out: [0.04, 0.45], up: [0.30, 0.85], fwd: [0.10, 0.55], ...GLOVE_ROT },
  blocker: { out: [0.04, 0.38], up: [0.22, 0.65], fwd: [0.10, 0.55], ...BLOCKER_ROT },
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

/** A leg's thigh (hip->knee) and shin (knee->ankle) directions from its joints, for a left leg (+x outward). */
export function jointDirs(j: JointLeg): { thigh: Vec; shin: Vec } {
  const a = (k: keyof JointLeg) => clamp(j[k], LEG_RANGE[k][0], LEG_RANGE[k][1]) * RAD;
  const hip = (v: Vec) => rx(rz(ry(v, -a('rot')), a('abd')), -a('flex'));
  const thigh = hip(V(0, -1, 0)), kneecap = hip(FWD), k = a('knee');
  return { thigh, shin: sub(mul(thigh, Math.cos(k)), mul(kneecap, Math.sin(k))) };
}

function legDefFor(setup: PoseSetup, d: Dims, side: Side): LegDef {
  if (setup.stance === 'butterfly' && setup.flare) return flareLeg(setup.flare);
  if (setup.stance === 'standup') return setup.feetWidthIn ? feetWidthLeg(d, setup.feetWidthIn * IN) : standupLeg(d.H);
  const st = STANCES[setup.stance];
  return side === st.post && st.postLeg ? st.postLeg : st.leg ?? st.farLeg!;
}

/** An oriented box: len along u, depth along n, width along u×n. */
export interface PadBox { center: Vec; u: Vec; n: Vec; len: number; width: number; depth: number }

// A pad is two boxes: the shin part (boot to knee roll) and the thigh rise, which carries straight on up from the knee:
// a pad is rigid, so the rise stays in line with the shin (standing it juts forward over the knee; kneeling it lies on
// the ice, past the knee toward the other pad).
const KNEE_ROLL = 0.04;
/** The end of the pad's boot, on its axis: past the ankle by the skate's height, so the boot covers the skate. */
function bootEnd(d: Dims, knee: Vec, ankle: Vec): Vec {
  return sub(ankle, mul(norm(sub(knee, ankle)), d.ankleH - 0.01));
}
// The pad faces straight ahead, as far as its leg lets it.
// The shin sits this far in front of the pad's back: 4 cm at 5′9″, in step with the goalie, so a small goalie's knee
// (the thigh's 0.055 H round) stays inside the pad's front (which is 0.09 H − back in front of the shin).
const PAD_BACK = 0.023;
function padBoxes(d: Dims, knee: Vec, ankle: Vec): PadBox[] {
  const box = (from: Vec, dir: Vec, l: number, width: number, depth: number): PadBox => {
    const n = norm(sub(FWD, mul(dir, dot(FWD, dir))));
    return { center: add(add(from, mul(dir, l / 2)), mul(n, depth / 2 - PAD_BACK * d.H)), u: dir, n, len: l, width, depth };
  };
  const u = norm(sub(knee, ankle));                        // up the shin
  const bottom = bootEnd(d, knee, ankle);
  const shin = box(bottom, u, len(sub(knee, bottom)) + KNEE_ROLL, d.padWidth, d.padDepth);
  const rise = box(knee, u, d.padTop - d.kneeRef, d.padWidth, 0.6 * d.padDepth);   // full width, thinner
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
  /** dir: up the shaft; across: square to it in the stick's plane, toward the toe; toeDir: along the blade to its toe,
   *  flat on the ice; face: out of the stick's front face. */
  grip: Vec; heel: Vec; dir: Vec; across: Vec; knob: Vec; toeDir: Vec; face: Vec;
  onIce: boolean; lift: number;
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
  /** How far Flare or Feet width has dropped the hips below the Stance's usual pose; hand targets are measured from there. */
  sink: number;
}

/**
 * A skate standing on the ice: the toe points where the pad faces, flat on the ice, and the skate leans sideways with the
 * shin (onto its inside edge on a splayed leg) while staying level front to back, as the ankle bends forward.
 */
export function skateAxes(l: { shinDir: Vec; pads: PadBox[] }): { fwd: Vec; up: Vec } {
  const n = l.pads[0].n, fwd = Math.hypot(n.x, n.z) > 1e-3 ? norm(V(n.x, 0, n.z)) : FWD, s = mul(l.shinDir, -1);
  return { fwd, up: norm(sub(s, mul(fwd, dot(s, fwd)))) };
}

const PAD_MEET = 0.008;
/**
 * A leg hung from the pelvis at y=0, square to the hips. close: bring the pads in to meet at the centreline too, not
 * only keep them from passing through each other (Butterfly and Stand-up, whose pads seal the five-hole together).
 */
function hangLeg(d: Dims, side: Side, def: JointLeg, close = false): Leg {
  const hip = V(side * d.hipHalf, 0, 0), mirror = (v: Vec) => V(side * v.x, v.y, v.z);
  // How far the pads stay out from the centreline. The real thigh rise thins to its front face at the top (see
  // gearShapes), so only the rise's front face counts.
  const innerOf = ([shin, rise]: PadBox[]) => Math.min(
    ...boxCorners(shin).map(c => c.x * side),
    ...boxCorners(rise).filter(c => dot(sub(c, rise.center), rise.n) > 0).map(c => c.x * side));
  const build = (jl: JointLeg) => {
    const j = jointDirs(jl), shinDir = mirror(j.shin), knee = add(hip, mul(mirror(j.thigh), d.thigh));
    const ankle = add(knee, mul(shinDir, d.shank)), pads = padBoxes(d, knee, ankle);
    return { shinDir, knee, ankle, pads, inner: innerOf(pads) };
  };
  // Pads can't pass through each other: spread the knee until the pads stop at the centreline. On a kneeling leg more
  // hip abduction alone would tip the shin (a butterfly pad would lift off the ice), so at each step the knee bends to
  // keep the shin's tilt. Closing works the same way the other way round, stopping before they cross. Whatever the
  // hip leaves over (its range, or part of a degree), the lower leg is pushed the rest of the way.
  // A standing leg is only pushed, so it keeps its angles: changing the hip would also swing the shin, in this joint
  // order, and the gap or overlap it has to take up is a few centimetres.
  const standing = jointDirs(def).shin.y < -0.5;
  let leg = build(def);
  if (!standing) for (let abd = def.abd + 1; leg.inner < 0 && abd <= LEG_RANGE.abd[1]; abd++) leg = build(kneeForTilt({ ...def, abd }, def));
  // Closing, the box corners go PAD_MEET past the centreline: the real pad's corners are rounded off, so it then just meets.
  if (close && !standing) for (let abd = def.abd - 1; leg.inner > -PAD_MEET && abd >= LEG_RANGE.abd[0]; abd--) {
    const next = build(kneeForTilt({ ...def, abd }, def));
    if (next.inner < -PAD_MEET) break;
    leg = next;
  }
  const { shinDir, knee, ankle, pads } = leg;
  const push = V((close ? -PAD_MEET - leg.inner : Math.max(0, -leg.inner)) * side, 0, 0);
  return { side, hip, knee: add(knee, push), ankle: add(ankle, push), shinDir,
    pads: pads.map(b => ({ ...b, center: add(b.center, push) })) };
}

export function solvePose(setup: PoseSetup, clamps: Clamps = DEFAULT_CLAMPS): Pose {
  const H = setup.heightM, d = goalieDims(H), st = STANCES[setup.stance];
  const gs: Side = setup.catchSide === 'left' ? 1 : -1;      // glove side sign (+x = goalie's left)

  // Legs hang from the pelvis at y=0, then the whole body is lifted until its lowest point touches the ice.
  // Planted legs (skate on the ice) are solved after, by IK from the grounded hip.
  // Legs are built square to the hips, then turned with them (hipTurn) round the pelvis.
  type Hung = Leg | { side: Side; hip: Vec; plant: PlantedLeg['plant'] };
  const hipYaw = -(st.post ?? 0) * (st.hipTurn ?? 0) * RAD, twist = (v: Vec) => ry(v, hipYaw);
  const hung: Hung[] = ([1, -1] as Side[]).map(side => {
    const def = legDefFor(setup, d, side);
    if ('plant' in def) return { side, hip: twist(V(side * d.hipHalf, 0, 0)), plant: def.plant };
    const l = hangLeg(d, side, def, !st.post);
    return { side, hip: twist(l.hip), knee: twist(l.knee), ankle: twist(l.ankle), shinDir: twist(l.shinDir),
      pads: l.pads.map(b => ({ ...b, center: twist(b.center), u: twist(b.u), n: twist(b.n) })) };
  });
  let low = Infinity;
  for (const l of hung) {
    if ('plant' in l) continue;
    // A leg standing on its skate (the same test as frontReach) touches the ice with the steel, at the skate's own lean:
    // the posing pad box reaches a little lower than the real boot, which sits over the skate. Otherwise the pad does.
    if (l.shinDir.y < -0.5) low = Math.min(low, l.ankle.y - d.ankleH * skateAxes(l).up.y);
    else for (const b of l.pads) for (const c of boxCorners(b)) low = Math.min(low, c.y);
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
        leg = { side, hip, knee, ankle, shinDir, pads: padBoxes(d, knee, ankle) };
        footY -= Math.min(0, ...leg.pads.flatMap(b => boxCorners(b).map(c => c.y)));
      }
      return leg;
    }
    return { ...l, hip, knee: add(l.knee, lift), ankle: add(l.ankle, lift), pads: l.pads.map(b => ({ ...b, center: add(b.center, lift) })) };
  });
  const pelvis = lift;
  // Flare and Feet width drop the hips; the hands come down with the torso. Hand targets stay measured as in the
  // Stance's usual pose, so a hand keeps its place on the body as the hips move.
  const sink = setup.flare || setup.feetWidthIn
    ? solvePose({ ...setup, flare: 0, feetWidthIn: undefined }, clamps).pelvis.y - pelvis.y : 0;
  // RVH: the end of the post-leg pad's boot is what goes against the post. (Anchoring the ankle instead left the
  // boot, which reaches a skate's height past the ankle, sticking out past the post.)
  const postLeg = st.farLeg ? legs.find(l => l.side === st.post)! : null;
  const boot = postLeg ? bootEnd(d, postLeg.knee, postLeg.ankle) : null;
  const postAnchor = boot ? V(boot.x, 0, boot.z) : null;

  const lean = (setup.stance === 'standup' ? standupLean(H) : st.lean) * RAD, sl = (st.sideLean || 0) * RAD;
  // The torso leans from the hips, so its lean goes by the hips' frame (with RVH's square hips: along the goal line).
  const torsoDir = norm(twist(V((st.post || 0) * Math.sin(sl), Math.cos(lean), Math.sin(lean))));
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
    let wrist = V(side * placed.out * H, placed.up * H - sink, placed.fwd * H);
    // A hand settled at arm's reach and stored to a thousandth of height can land a hair past it, so allow 2 mm
    // (still inside the full arm length) before calling it held back.
    if (len(sub(wrist, shoulder)) > reach + 0.002) { wrist = add(shoulder, mul(norm(sub(wrist, shoulder)), reach)); flags.push('out of arm reach'); }
    // Stand-up keeps the stick flat on the ice (in the middle of the five-hole, as the makers fit it) and leaning back
    // at least MIN_STICK_LEAN_DEG: a blocker hand higher than that comes down to it, drawn in toward the shoulder if
    // that would put it out of reach.
    const top = which === 'blocker' && setup.stance === 'standup' ? stickTop(d, setup.gripAboveIn, MIN_STICK_LEAN_DEG) : Infinity;
    if (wrist.y > top + 1e-6) {
      const r = Math.sqrt(Math.max(0, reach * reach - (top - shoulder.y) ** 2)), hx = wrist.x - shoulder.x, hz = wrist.z - shoulder.z;
      const k = Math.min(1, r / (Math.hypot(hx, hz) || 1));
      wrist = V(shoulder.x + hx * k, top, shoulder.z + hz * k);
      flags.push('too high to keep the blade down');
    }
    const elbow = ikElbow(shoulder, wrist, d.upperArm, d.forearm, V(side * 0.8, -1, -0.4));
    const rot = { yaw: placed.yaw, pitch: placed.pitch, roll: placed.roll };
    return { side, requested: V(side * t.out * H, t.up * H - sink, t.fwd * H), wrist, elbow, shoulder, flags, rot,
      face: wristRotate(FWD, side, rot), up: wristRotate(UP, side, rot), out: wristRotate(V(side, 0, 0), side, rot),
      placedFrac: { out: wrist.x * side / H, up: (wrist.y + sink) / H, fwd: wrist.z / H, ...rot } };
  };
  const glove = hand('glove'), blocker = hand('blocker');

  // Stick: a flat, rigid piece. The blade lies on the ice with its toe toward the glove side, and the shaft leaves it
  // at the stick's lie (STICK_LIE_DEG, between the shaft and the blade line behind the heel), so from the front the
  // stick runs from the blade up and out to the blocker, and on past it away from the body. The blocker wrist's yaw
  // turns the whole stick about the vertical (face turned out = toe swung forward). The hand's height sets how far the
  // stick leans back toward the goalie: a low hand lays it down, and a hand too high for the lie lifts the blade.
  const grip = blocker.wrist, gripDist = d.paddle.l + setup.gripAboveIn * IN, lie = STICK_LIE_DEG * RAD;
  const yaw = (v: Vec) => ry(v, blocker.side * blocker.rot.yaw * RAD);
  const toe = yaw(V(gs, 0, 0)), back = yaw(V(0, 0, -1));
  // The shaft runs half a paddle width in from the heel, so the grip is gripDist up the shaft from a point that far
  // across the paddle: reach is how far up the stick, measured along the shaft, the hand is from the ice.
  const reach = gripDist + 0.5 * d.paddle.w / Math.tan(lie);
  const tilt = Math.acos(clamp(grip.y / (reach * Math.sin(lie)), 0, 1));
  const shaftDir = add(mul(toe, -Math.cos(lie)), mul(add(mul(UP, Math.cos(tilt)), mul(back, Math.sin(tilt))), Math.sin(lie)));
  const across = norm(add(toe, mul(shaftDir, Math.cos(lie))));      // in the stick's plane, square to the shaft, toward the toe
  const heel = sub(sub(grip, mul(shaftDir, gripDist)), mul(across, 0.5 * d.paddle.w));
  const face = norm(cross(toe, shaftDir)), faceOut = dot(face, back) > 0 ? mul(face, -1) : face;
  const stick: Stick = { grip, heel, dir: shaftDir, across, toeDir: toe, face: faceOut,
    knob: add(heel, add(mul(across, 0.5 * d.paddle.w), mul(shaftDir, d.stickLen))), onIce: heel.y < 1e-3, lift: Math.max(0, heel.y) };

  return { dims: d, pelvis, torsoDir, shoulderMid, shoulders, head, legs, glove, blocker, stick, postAnchor, sink };
}
