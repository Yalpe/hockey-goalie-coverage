import { IN } from './dims';
import {
  defaultHands, placeAtCreaseTop, placeAtPost, RVH_TURN_DEG, STANCES,
  type CatchSide, type Pose, type PoseSetup, type StanceKey,
} from './posing/posing';

/** Everything about the goalie the coach can change. */
export interface GoalieSetup extends PoseSetup {
  /** Which way the goalie faces: 0 = straight out from the net, + = turned toward its left. */
  facingDeg: number;
}

/** Height moves in whole inches between these (3′7″ to 6′7″). */
export const HEIGHT_MIN_IN = 43, HEIGHT_MAX_IN = 79;
/** The stick is gripped this far above the top of the paddle. A constant, not a coach setting. */
const GRIP_ABOVE_IN = 3;

export function defaultGoalie(): GoalieSetup {
  const stance: StanceKey = 'butterfly', catchSide: CatchSide = 'left';
  return { stance, catchSide, heightM: 69 * IN, gripAboveIn: GRIP_ABOVE_IN, facingDeg: 0, ...defaultHands(stance, catchSide) };
}

/** A new Stance puts the hands back at its defaults. RVH turns toward its own post; leaving RVH faces straight out. */
export function setStance(g: GoalieSetup, stance: StanceKey) {
  const wasRvh = !!STANCES[g.stance].post, post = STANCES[stance].post;
  g.stance = stance;
  Object.assign(g, defaultHands(stance, g.catchSide));
  if (post) g.facingDeg = post * RVH_TURN_DEG;
  else if (wasRvh) g.facingDeg = 0;
}

export function setHeightIn(g: GoalieSetup, inches: number) {
  g.heightM = Math.min(HEIGHT_MAX_IN, Math.max(HEIGHT_MIN_IN, Math.round(inches))) * IN;
}

/** Where the goalie stands on the ice: RVH locks to its own post; otherwise toes on the top of the crease. */
export function placeGoalie(g: GoalieSetup, pose: Pose): { x: number; z: number; facingDeg: number } {
  const p = STANCES[g.stance].post ? placeAtPost(pose, g.stance, g.facingDeg) : placeAtCreaseTop(pose, g.facingDeg);
  return { ...p, facingDeg: g.facingDeg };
}

/** e.g. 5′9″ (1.75 m) */
export function heightText(m: number): string {
  const inch = Math.round(m / IN);
  return `${Math.floor(inch / 12)}′${inch % 12}″ (${m.toFixed(2)} m)`;
}
