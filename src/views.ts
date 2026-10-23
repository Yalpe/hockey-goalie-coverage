import * as THREE from 'three';
import { CREASE_RADIUS, MOUTH_H, NET_BASE_DEPTH, NET_BASE_HALF_W, PUCK_HALF_T } from './dims';
import { POST_H, POST_X } from './scene/net';
import type { PuckSpot } from './scene/puck';
import { shooterSpot, type Shooter } from './shooter';

export type ViewKey = 'puck' | 'shooter' | 'top' | 'behind' | 'orbit';

export const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'puck', label: "Puck's view" },
  { key: 'shooter', label: "Shooter's view" },
  { key: 'top', label: 'Top-down' },
  { key: 'behind', label: 'Behind net' },
  { key: 'orbit', label: 'Free orbit' },
];

export interface ViewPose { pos: THREE.Vector3; target: THREE.Vector3; fov: number }

const DEG = 180 / Math.PI;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Half the vertical field of view, in degrees, that a camera at pos looking at target needs to fit each point times
 * its margin. */
function halfFov(pos: THREE.Vector3, target: THREE.Vector3, aspect: number, pts: [THREE.Vector3, number][]): number {
  const look = target.clone().sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(look, v(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, look);
  return Math.max(...pts.map(([p, margin]) => {
    const r = p.clone().sub(pos), z = Math.max(r.dot(look), 0.05);
    return Math.max(Math.atan(Math.abs(r.dot(up)) / z), Math.atan(Math.abs(r.dot(right)) / z / aspect)) * DEG * margin;
  }));
}
const netCorners = (margin: number) =>
  [[-POST_X, POST_H], [POST_X, POST_H], [-POST_X, 0], [POST_X, 0]].map(([x, y]): [THREE.Vector3, number] => [v(x, y, 0), margin]);

/** Where the camera sits for a view preset. Every preset follows the Puck except Free orbit. */
export function viewPose(k: ViewKey, puck: PuckSpot, aspect: number, shooter: Shooter): ViewPose {
  const d = Math.hypot(puck.x, puck.z) || 1, ux = puck.x / d, uz = puck.z / d;
  switch (k) {
    case 'puck': {
      // 1.4 m behind and 25 cm above the Puck, on its line to the net, zoomed so the Puck sits at the bottom of the
      // picture with the whole net above it.
      const pos = v(puck.x + ux * 1.4, PUCK_HALF_T + 0.25, puck.z + uz * 1.4), target = v(0, MOUTH_H / 2, 0);
      const need = halfFov(pos, target, aspect, [[v(puck.x, 0, puck.z), 1.35], ...netCorners(1.15)]);
      return { pos, target, fov: clamp(2 * need, 20, 100) };
    }
    case 'shooter': {
      // The shooter's own eyes, looking at the net, crouched over the shot at 0.74 of the shooter's height (1.3 m for a
      // 5'9" player). The Puck is below the picture, as it is for a shooter looking up at the net. A natural field of
      // view, widened only when the net would not fit.
      const eyes = shooterSpot(puck, shooter.shoots, shooter.offsetM);
      const pos = v(eyes.x, 0.74 * shooter.heightM, eyes.z), target = v(0, MOUTH_H / 2, 0);
      return { pos, target, fov: clamp(2 * halfFov(pos, target, aspect, netCorners(1.3)), 50, 100) };
    }
    case 'top': {
      // Straight down, high enough to fit the whole net, the crease (where the goalie is) and the Puck with a margin.
      // The net sits at the top of the picture and the Puck below it.
      const x0 = Math.min(-NET_BASE_HALF_W, puck.x) - 0.6, x1 = Math.max(NET_BASE_HALF_W, puck.x) + 0.6;
      const z0 = Math.min(-NET_BASE_DEPTH, puck.z) - 0.6, z1 = Math.max(CREASE_RADIUS, puck.z) + 0.6;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, t = Math.tan(20 / DEG);
      const h = Math.max(4.5, (z1 - z0) / 2 / t, (x1 - x0) / 2 / t / aspect) * 1.12;   // a little extra for the buttons
      return { pos: v(cx, h, cz + 0.001), target: v(cx, 0, cz), fov: 40 };
    }
    case 'behind':
      return { pos: v(0, 1.7, -3.2), target: v(puck.x * 0.3, 0.5, 1 + Math.max(0, puck.z) * 0.2), fov: 40 };
    case 'orbit':
      // Opens on the whole zone, from above the blue line.
      return { pos: v(0, 21, 39), target: v(0, 0, 9.5), fov: 40 };
  }
}
