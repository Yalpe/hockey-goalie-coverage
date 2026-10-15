// Naming the holes in the Open Net in coach words. Thresholds are the coverage prototype's (see
// issues/goalie-coverage-mvp/05-coverage-prototype.md).
import type { CatchSide } from '../posing/posing';
import type { Vec } from '../posing/vec';
import type { Coverage, Shape2 } from './coverage';

/** A hole must be bigger than this share of the net to get a lane and a name. */
export const HOLE_MIN_SHARE = 0.002;
/** At most this many holes are named, biggest first. */
export const MAX_NAMED = 6;

export interface NamedHole { shape: Shape2; share: number; name: string }

/** The holes worth showing (bigger than 0.2% of the net), biggest first. */
export function holesOf(cov: Coverage): Shape2[] {
  return cov.open.filter(s => s.area / cov.rectArea > HOLE_MIN_SHARE).sort((a, b) => b.area - a.area);
}

/**
 * Names each hole relative to the goalie as seen from the Puck, e.g. "Glove side high", "Blocker side low",
 * "Five-hole". P: the Puck centre; pelvis: the goalie's pelvis in world space.
 */
export function nameHoles(cov: Coverage, P: Vec, pelvis: Vec, catchSide: CatchSide): NamedHole[] {
  // Where the goalie's centre line lands on the goal plane, seen from the Puck.
  const t = P.z / Math.max(1e-3, P.z - pelvis.z), gx = P.x + (pelvis.x - P.x) * t;
  const gloveSign = catchSide === 'left' ? 1 : -1;   // +x is the goalie's left
  const name = (c: { x: number; y: number }) => {
    if (Math.abs(c.x - gx) < 0.14 && c.y < 0.45) return 'Five-hole';
    const side = (c.x - gx) * gloveSign > 0 ? 'Glove side' : 'Blocker side';
    return `${side} ${c.y > 0.78 ? 'high' : c.y > 0.32 ? 'mid' : 'low'}`;
  };
  return holesOf(cov).slice(0, MAX_NAMED).map(s => ({ shape: s, share: 100 * s.area / cov.rectArea, name: name(s.centroid) }));
}
