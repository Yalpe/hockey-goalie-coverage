import { CREASE_RADIUS, IN } from './dims';
import {
  defaultHands, frontReach, placeAtPost, RVH_TURN_DEG, STANCES,
  type HandTarget, type Pose, type PoseSetup, type StanceKey,
} from './posing/posing';

/**
 * How the goalie is placed:
 *  - arc: toes on a circle of radius arcR round the middle of the goal line (its depth); turning slides it round;
 *  - post: RVH locked to its own post;
 *  - free: wherever the coach put it.
 */
export type Lock = 'arc' | 'post' | 'free';

/** Everything about the goalie the coach can change. */
export interface GoalieSetup extends PoseSetup {
  /** Which way the goalie faces: 0 = straight out from the net, + = turned toward its left. */
  facingDeg: number;
  lock: Lock;
  /** Depth when on the arc: how far out the toes are from the middle of the goal line, in metres. */
  arcR: number;
  /** Where the goalie's root is on the ice. Kept up to date by placeGoalie; it is the setting when lock is free. */
  pos: { x: number; z: number };
  /** Follow the Puck: square to it and on its angle. Read from links already; the feature comes in a later slice. */
  follow: boolean;
}

// Settings move in the steps the Setup link stores them in (whole inches, whole degrees, centimetres, thousandths of
// height), so a link always brings back exactly what was on screen.

/** Height moves in whole inches between these (3′7″ to 6′7″). */
export const HEIGHT_MIN_IN = 43, HEIGHT_MAX_IN = 79;
/** Depth moves in whole inches between these. */
export const DEPTH_MIN_IN = 24, DEPTH_MAX_IN = 157;
/** The Top / Mid / Deep buttons, in whole inches: top of the crease (6 ft), about 1.35 m, about 0.95 m. */
export const DEPTH_SPOTS = { top: CREASE_RADIUS, mid: 53 * IN, deep: 37 * IN } as const;
export type DepthSpot = keyof typeof DEPTH_SPOTS;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const DEG = 180 / Math.PI;
const cm = (m: number) => Math.round(m * 100) / 100;

/** A hand target in the link's steps: positions to a thousandth of height, wrist angles to the degree. */
export function quantHand(t: HandTarget): HandTarget {
  const k = (v: number) => Math.round(v * 1000) / 1000, d = (v: number) => Math.round(v) || 0;
  return { out: k(t.out), up: k(t.up), fwd: k(t.fwd), yaw: d(t.yaw), pitch: d(t.pitch), roll: d(t.roll) };
}

/** A new Stance puts the hands back at its defaults. RVH locks to its own post; leaving RVH goes to the top of the crease. */
export function setStance(g: GoalieSetup, stance: StanceKey) {
  const post = STANCES[stance].post;
  g.stance = stance;
  Object.assign(g, defaultHands(stance, g.catchSide));
  if (post) { g.lock = 'post'; g.facingDeg = post * RVH_TURN_DEG; }
  else if (g.lock === 'post') { g.lock = 'arc'; g.arcR = CREASE_RADIUS; g.facingDeg = 0; }
}

export function setHeightIn(g: GoalieSetup, inches: number) {
  g.heightM = clamp(Math.round(inches), HEIGHT_MIN_IN, HEIGHT_MAX_IN) * IN;
}

/** Where the goalie stands on the ice, by its lock. Updates g.pos. */
export function placeGoalie(g: GoalieSetup, pose: Pose): { x: number; z: number; facingDeg: number } {
  if (g.lock === 'post' && !STANCES[g.stance].post) g.lock = 'arc';
  const f = g.facingDeg / DEG;
  let p = g.pos;
  if (g.lock === 'post') p = placeAtPost(pose, g.stance, g.facingDeg);
  else if (g.lock === 'arc') { const d = g.arcR - frontReach(pose); p = { x: d * Math.sin(f), z: d * Math.cos(f) }; }
  g.pos = { x: p.x, z: p.z };
  return { ...g.pos, facingDeg: g.facingDeg };
}

/**
 * Follow the Puck: square to the Puck and on its angle. On the arc that's just facing it (the arc does the rest);
 * placed freely, the goalie keeps its distance and slides round onto the Puck's angle. RVH at the post stays put.
 */
export function applyFollow(g: GoalieSetup, puck: { x: number; z: number }) {
  if (!g.follow || g.lock === 'post') return;
  g.facingDeg = Math.round(clamp(Math.atan2(puck.x, Math.max(puck.z, 0.05)) * DEG, -80, 80));
  if (g.lock === 'free') {
    const r = Math.hypot(g.pos.x, g.pos.z), f = g.facingDeg / DEG;
    g.pos = { x: cm(r * Math.sin(f)), z: cm(r * Math.cos(f)) };
  }
}

/** Depth: how far out the toes are from the middle of the goal line. */
export function depthNow(g: GoalieSetup, pose: Pose): number {
  return g.lock === 'arc' ? g.arcR : Math.hypot(g.pos.x, g.pos.z) + frontReach(pose);
}

/** Setting the depth puts the goalie on the arc, keeping its angle. */
export function setDepth(g: GoalieSetup, r: number) {
  g.lock = 'arc';
  g.arcR = clamp(Math.round(r / IN), DEPTH_MIN_IN, DEPTH_MAX_IN) * IN;
}

/** RVH only: back to its own post. */
export function lockToPost(g: GoalieSetup) {
  const post = STANCES[g.stance].post;
  if (post) { g.lock = 'post'; g.facingDeg = post * RVH_TURN_DEG; }
}

export function setFacing(g: GoalieSetup, deg: number) {
  g.facingDeg = Math.round(clamp(deg, -90, 90));
}

/**
 * Moving the goalie by hand to root position p: in RVH it snaps to its own post, and anywhere it snaps to the top
 * of the crease; elsewhere it stays where it's put. Returns a note for the coach when it snaps.
 */
export function moveGoalieTo(g: GoalieSetup, pose: Pose, p: { x: number; z: number }): string | null {
  const post = STANCES[g.stance].post;
  if (post) {
    const f = post * RVH_TURN_DEG, q = placeAtPost(pose, g.stance, f);
    if (Math.hypot(p.x - q.x, p.z - q.z) < 0.35) {
      const note = g.lock !== 'post' ? 'Locked to the post' : null;
      g.lock = 'post'; g.facingDeg = f;
      return note;
    }
  }
  const top = CREASE_RADIUS - frontReach(pose), r = Math.hypot(p.x, p.z);
  if (p.z > 0.2 && Math.abs(r - top) < 0.12) {
    const note = g.lock === 'arc' && g.arcR === CREASE_RADIUS ? null : 'Snapped to the top of the crease';
    g.lock = 'arc'; g.arcR = CREASE_RADIUS; g.facingDeg = Math.round(clamp(Math.atan2(p.x, p.z) * DEG, -80, 80));
    return note;
  }
  g.lock = 'free';
  g.pos = { x: cm(clamp(p.x, -4, 4)), z: cm(clamp(p.z, -0.3, 5)) };
  return null;
}

const ftIn = (m: number) => { const inch = Math.round(m / IN); return `${Math.floor(inch / 12)}′${inch % 12}″`; };
/** e.g. 5′9″ (1.75 m) */
export const heightText = (m: number) => `${ftIn(m)} (${m.toFixed(2)} m)`;
/** e.g. 1.83 m (6′0″) */
export const depthText = (m: number) => `${m.toFixed(2)} m (${ftIn(m)})`;
