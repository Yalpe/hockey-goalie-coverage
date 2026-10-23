import * as THREE from 'three';
import type { Shoots } from '../shooter';

/**
 * A quick, low-quality stand-in for the shooter: just enough of a figure to see where the shot comes from. Built one
 * metre tall in its own frame (feet on y = 0, facing +z, local +x is the shooter's left), so main.ts scales it to the
 * shooter's height and turns it to face the net. The stick switches sides with the shot. This is a placeholder; swap it
 * for a real model later the way goalieMesh is the only thing that draws the goalie.
 */
export interface ShooterMesh {
  /** Lives in the shooter's frame: put it under a group placed at the eyes, scaled by height, turned to face the net. */
  group: THREE.Group;
  /**
   * Lays the stick to the Puck. blade: where the Puck sits, in this frame (so the blade is on it). shoots sets the grip:
   * a left shot has the Puck on the shooter's left, the right hand on top of the stick (and the reverse for a right
   * shot). The shaft crosses the body from the top (knob) hand down to the blade — a 10-/2-o'clock line to the player.
   */
  update(shoots: Shoots, blade: THREE.Vector3): void;
}

const JERSEY = new THREE.MeshStandardMaterial({ color: 0x3b4654, roughness: 0.75 });
const PANTS = new THREE.MeshStandardMaterial({ color: 0x20262e, roughness: 0.8 });
const SKIN = new THREE.MeshStandardMaterial({ color: 0xd7a07a, roughness: 0.6 });
const STICK = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.6 });

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** The eyes, in this frame (unit height): at the front of the head. Shooter's view sits the camera here. */
export const SHOOTER_EYE = v(0, 0.88, 0.16);

/** A capsule between two points, radius r. */
function bone(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material): THREE.Mesh {
  const L = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, L, 4, 10), mat);
  m.quaternion.setFromUnitVectors(v(0, 1, 0), b.clone().sub(a).normalize());
  m.position.copy(a.clone().add(b).multiplyScalar(0.5));
  return m;
}

export function createShooterMesh(): ShooterMesh {
  const group = new THREE.Group();
  group.name = 'shooter';

  // Legs, slightly apart and bent forward into a shooting crouch.
  group.add(bone(v(0.09, 0.07, 0.03), v(0.07, 0.48, 0.02), 0.055, PANTS));
  group.add(bone(v(-0.09, 0.07, 0.03), v(-0.07, 0.48, 0.02), 0.055, PANTS));
  // Skates.
  for (const s of [1, -1]) {
    const sk = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.22), PANTS);
    sk.position.set(0.09 * s, 0.03, 0.06);
    group.add(sk);
  }
  // Torso, leaning forward over the shot.
  group.add(bone(v(0, 0.47, 0.02), v(0, 0.80, 0.08), 0.12, JERSEY));
  // Head.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), SKIN);
  head.position.set(0, 0.90, 0.10);
  group.add(head);

  // Arms and stick live in a subgroup so the shot side can flip them without rebuilding the body.
  const arms = new THREE.Group();
  group.add(arms);

  return {
    group,
    update(shoots, blade) {
      arms.clear();
      const bladeSide = shoots === 'left' ? 1 : -1;   // the Puck is on the shooter's left for a left shot (+x is the left)
      const knobSide = -bladeSide;                    // the top (knob) hand is the far hand: left shot = right hand on top
      const puckAt = blade.clone().setY(Math.max(blade.y, 0.02));   // keep the blade on the ice even if the Puck dips below
      // The blade lies flat along the shot (+z, toward the net), centred on the Puck: the heel sits behind it and the
      // toe in front, so the shaft meets the ice behind the Puck rather than clipping it on the heel.
      const heel = puckAt.clone().add(v(0, 0, -0.07));
      const toe = puckAt.clone().add(v(0, 0, 0.09));
      const knob = v(knobSide * 0.06, 0.56, 0.12);               // top of the stick, held in near the belly
      const low = knob.clone().lerp(heel, 0.5);                  // lower hand halfway down the shaft
      // Arms reach from each shoulder to its hand; the shaft runs knob → heel across the body, the blade heel → toe.
      arms.add(bone(v(knobSide * 0.14, 0.78, 0.07), knob, 0.04, JERSEY));
      arms.add(bone(v(bladeSide * 0.14, 0.78, 0.07), low, 0.04, JERSEY));
      arms.add(bone(knob, heel, 0.013, STICK));
      arms.add(bone(heel, toe, 0.016, STICK));
    },
  };
}
