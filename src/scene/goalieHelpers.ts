import * as THREE from 'three';
import type { HandKey, Pose } from '../posing/posing';

const DEG = 180 / Math.PI;

/**
 * Things to grab on the goalie, in its own frame: a ball on each hand (yellow = glove, blue = blocker), drawn over
 * everything so it can always be clicked, and the turn ring round its feet with a knob straight ahead.
 */
export function createGoalieHelpers() {
  const group = new THREE.Group();
  group.name = 'goalieHelpers';
  const ball = (color: number) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12),
      new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.85 }));
    m.renderOrder = 10;
    group.add(m);
    return m;
  };
  const hands: Record<HandKey, THREE.Mesh> = { glove: ball(0xf59e0b), blocker: ball(0x2563eb) };

  const turnRing = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 0.97, 64),
    new THREE.MeshBasicMaterial({ color: 0x1f3a5f, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x1f3a5f, depthTest: false, transparent: true, opacity: 0.9 }));
  knob.position.set(0, 0.08, 0.945);
  knob.renderOrder = 10;
  turnRing.add(ring, knob);
  turnRing.visible = false;
  group.add(turnRing);

  return {
    group, hands, turnRing, knob,
    /** Puts each ball on its wrist, turned like the wrist. keepHands: leave them be (the rotate gizmo is turning one). */
    update(pose: Pose, keepHands = false) {
      if (keepHands) return;
      for (const w of ['glove', 'blocker'] as const) {
        const h = pose[w], s = h.side;
        hands[w].position.set(h.wrist.x, h.wrist.y, h.wrist.z);
        // The posing module's wrist turn, as a three.js Euler: Euler(-pitch, side*yaw, -side*roll, 'YXZ').
        hands[w].quaternion.setFromEuler(new THREE.Euler(-h.rot.pitch / DEG, s * h.rot.yaw / DEG, -s * h.rot.roll / DEG, 'YXZ'));
      }
    },
  };
}
