import type { PuckSpot } from './scene/puck';

/** Which side the shooter carries the Puck on: a left shot has it on the left, so the eyes are to its right. */
export type Shoots = 'left' | 'right';

/** The shooter: the hand, and the height (taken from the goalie, a player of the same age). */
export interface Shooter { shoots: Shoots; heightM: number }

/**
 * Where the shooter's eyes are, over the ice. The Puck is released close to the feet on the stick side, so the eyes
 * sit about 30 cm behind it and 30 cm to the other side. (uz, -ux) is the shooter's right, facing the net.
 */
export function shooterSpot(puck: PuckSpot, shoots: Shoots): { x: number; z: number } {
  const d = Math.hypot(puck.x, puck.z) || 1, ux = puck.x / d, uz = puck.z / d;
  const side = (shoots === 'left' ? 1 : -1) * 0.3;
  return { x: puck.x + ux * 0.3 + uz * side, z: puck.z + uz * 0.3 - ux * side };
}
