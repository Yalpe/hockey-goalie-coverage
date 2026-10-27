import type { PuckSpot } from './scene/puck';

/** Which side the shooter carries the Puck on: a left shot has it on the left, so the eyes are to its right. */
export type Shoots = 'left' | 'right';

/** The shooter: the hand, the height (taken from the goalie, a player of the same age), and how far the Puck reaches
 * out in front along the stick. */
export interface Shooter { shoots: Shoots; heightM: number; offsetM: number }

/** How far out in front the Puck reaches, by default, in metres. */
export const DEFAULT_OFFSET_M = 0.45;

const DEG = 180 / Math.PI;
type Eyes = { x: number; z: number };

/**
 * Where the shooter's eyes are, over the ice. The shooter stands offsetM straight back from the Puck along the shot
 * line and faces it, so the stick runs out from the eyes to the Puck. (ux, uz) is the line from the middle of the
 * goal line out to the Puck.
 */
export function shooterSpot(puck: PuckSpot, offsetM: number): Eyes {
  const d = Math.hypot(puck.x, puck.z) || 1, ux = puck.x / d, uz = puck.z / d;
  return { x: puck.x + ux * offsetM, z: puck.z + uz * offsetM };
}

/**
 * The Puck's bearing round the shooter's eyes, like a clock face the shooter reads with the net at 12: 0° points at
 * the middle of the goal line (the shot line, midnight); + is the shooter's right (3 o'clock), − its left (9 o'clock).
 * Shooter's right is (−mz, mx) of m, the direction from the eyes to the goal-line middle.
 */
export function puckBearing(eyes: Eyes, puck: PuckSpot): number {
  const d = Math.hypot(eyes.x, eyes.z) || 1, mx = -eyes.x / d, mz = -eyes.z / d;
  const wx = puck.x - eyes.x, wz = puck.z - eyes.z;
  return Math.atan2(wx * -mz + wz * mx, wx * mx + wz * mz) * DEG;
}

/** The Puck at reach ρ metres and bearing β° round the shooter's eyes (see {@link puckBearing}). */
export function puckFromEyes(eyes: Eyes, reachM: number, bearingDeg: number): PuckSpot {
  const b = bearingDeg / DEG, c = Math.cos(b), s = Math.sin(b);
  const d = Math.hypot(eyes.x, eyes.z) || 1, mx = -eyes.x / d, mz = -eyes.z / d;
  return { x: eyes.x + reachM * (c * mx + s * -mz), z: eyes.z + reachM * (c * mz + s * mx) };
}

/** Swings the Puck round the shooter's eyes to a bearing, keeping its reach (the stick length, its orbit radius). */
export function orbitPuck(eyes: Eyes, puck: PuckSpot, bearingDeg: number): PuckSpot {
  const reach = Math.hypot(puck.x - eyes.x, puck.z - eyes.z) || 0.3;
  return puckFromEyes(eyes, reach, bearingDeg);
}
