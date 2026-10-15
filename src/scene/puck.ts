import * as THREE from 'three';
import { PUCK_HALF_T, PUCK_R } from '../dims';
import { RINK, rinkHalfW } from './rink';

export interface PuckSpot { x: number; z: number }

/** The default Puck: in the slot, 6 m straight out from the middle of the goal line. */
export const DEFAULT_PUCK: PuckSpot = { x: 0, z: 6 };

/** The Puck stays on the ice: inside the boards (corners included), and no further out than just past the blue line. */
export function clampPuck(x: number, z: number): PuckSpot {
  const cz = Math.min(RINK.blueZ + 2, Math.max(RINK.endZ + 0.1, z)), hw = rinkHalfW(cz) - 0.1;
  return { x: Math.min(hw, Math.max(-hw, x)), z: cz };
}

export interface PuckMesh {
  group: THREE.Group;
  /** The orange ring to grab it by. Hidden in Puck's view, where it would fill the screen. */
  ring: THREE.Mesh;
  /** An invisible disc a little bigger than the ring, for clicking. */
  hit: THREE.Mesh;
}

export function buildPuck(): PuckMesh {
  const group = new THREE.Group();
  group.name = 'puck';
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(PUCK_R, PUCK_R, 2 * PUCK_HALF_T, 24),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }));
  disk.position.y = PUCK_HALF_T;
  group.add(disk);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 40),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  group.add(ring);
  const hit = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ visible: false }));
  hit.rotation.x = -Math.PI / 2;
  hit.position.y = 0.003;
  group.add(hit);
  return { group, ring, hit };
}
