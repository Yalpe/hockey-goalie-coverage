import * as THREE from 'three';
import { PUCK_HALF_T, PUCK_R } from '../dims';

export interface PuckSpot { x: number; z: number }

/** The default Puck: in the slot, 6 m straight out from the middle of the goal line. */
export const DEFAULT_PUCK: PuckSpot = { x: 0, z: 6 };

export interface PuckMesh {
  group: THREE.Group;
  /** The orange ring to grab it by. Hidden in Puck's view, where it would fill the screen. */
  ring: THREE.Mesh;
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
  return { group, ring };
}
