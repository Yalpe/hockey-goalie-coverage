import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { PUCK_HALF_T } from '../dims';
import type { HandKey } from '../posing/posing';
import type { PuckSpot } from './puck';

export type GizmoMode = 'translate' | 'rotate';

export interface HandGizmoDeps {
  camera: THREE.Camera;
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  /** The balls on the hands, in the goalie's frame. */
  hands: Record<HandKey, THREE.Object3D>;
  puck: PuckSpot;
  /** The hand was dragged to this world position. */
  onMove(w: HandKey, world: THREE.Vector3): void;
  /** The hand's ball was turned (its own position and quaternion, in the goalie's frame). */
  onTurn(w: HandKey, ball: THREE.Object3D): void;
  /** A drag started or ended. */
  onDragging(dragging: boolean, w: HandKey): void;
}

/**
 * Moving and turning a selected hand. The move arrows follow the shot, not the rink: one runs along the line from the
 * Puck through the hand (depth along the shot), one across it on the level, and one up and down in the picture. They
 * sit on a proxy in world space whose frame is rebuilt between drags. The rotate rings sit on the hand's own axes.
 */
export function createHandGizmo(d: HandGizmoDeps) {
  const tc = new TransformControls(d.camera, d.canvas);
  tc.setSize(0.7);
  tc.setSpace('local');
  d.scene.add(tc.getHelper());
  const proxy = new THREE.Object3D();
  d.scene.add(proxy);
  let hand: HandKey | null = null, mode: GizmoMode = 'translate', dragging = false;

  const handWorld = (w: HandKey) => d.hands[w].getWorldPosition(new THREE.Vector3());
  /** From the hand toward the Puck. */
  const shotDir = (w: HandKey) => {
    const v = new THREE.Vector3(d.puck.x, PUCK_HALF_T, d.puck.z).sub(handWorld(w));
    return v.lengthSq() < 1e-6 ? new THREE.Vector3(0, 0, 1) : v.normalize();
  };
  function alignProxy(w: HandKey) {
    const z = shotDir(w), up = new THREE.Vector3(0, 1, 0);
    const x = new THREE.Vector3().crossVectors(up, z);
    if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
    x.normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    proxy.position.copy(handWorld(w));
    proxy.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    proxy.updateMatrixWorld();
  }

  tc.addEventListener('dragging-changed', e => {
    dragging = !!e.value;
    if (hand) d.onDragging(dragging, hand);
  });
  tc.addEventListener('objectChange', () => {
    if (!hand) return;
    if (tc.object === proxy) d.onMove(hand, proxy.position.clone());
    else d.onTurn(hand, d.hands[hand]);
  });

  /** Shows the gizmo on hand w (or hides it), in the current mode. */
  function show(w: HandKey | null) {
    hand = w;
    if (!w) { tc.detach(); return; }
    tc.setMode(mode);
    if (mode === 'translate') { if (!dragging) alignProxy(w); if (tc.object !== proxy) tc.attach(proxy); }
    else if (tc.object !== d.hands[w]) tc.attach(d.hands[w]);
  }

  return {
    show,
    get mode() { return mode; },
    setMode(m: GizmoMode) { mode = m; show(hand); },
    /** Re-lines the arrows up with the shot after the hand, the goalie or the Puck moved (not mid-drag). */
    realign() { if (hand && mode === 'translate' && !dragging) alignProxy(hand); },
    /** The pointer is over one of the gizmo's handles, or dragging one: clicks belong to the gizmo. */
    get busy() { return dragging || tc.axis !== null; },
    handWorld, shotDir,
  };
}
