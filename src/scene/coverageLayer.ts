import * as THREE from 'three';
import { SCORE_RECT, type Coverage, type Shape2 } from '../coverage/coverage';
import { holesOf } from '../coverage/holes';
import { MOUTH_H, MOUTH_HALF_W } from '../dims';
import type { Vec } from '../posing/vec';

/**
 * What the coverage looks like on the goal plane: the Coverage Shadow (dark slate) and the Open Net (green), drawn
 * from the same polygons the % comes from, plus the Puck-size margin: the strip outside the 69" × 47" scoring
 * rectangle, shaded like the shadow. Each layer sits a few millimetres in front of the goal line so they stack cleanly.
 */
export function createCoverageLayer() {
  const group = new THREE.Group();
  group.name = 'coverage';
  const flatMat = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
  const shadowMat = flatMat(0x0f172a, 0.8), openMat = flatMat(0x22c55e, 0.7);
  const shadow = new THREE.Mesh(new THREE.BufferGeometry(), shadowMat);
  const open = new THREE.Mesh(new THREE.BufferGeometry(), openMat);
  shadow.position.z = 0.003; shadow.renderOrder = 2;
  open.position.z = 0.002; open.renderOrder = 2;
  group.add(shadow, open);

  // The Puck-size margin: the strip between the scoring rectangle and the posts, crossbar and ice. It's too tight for
  // the Puck, so no shot gets through it; shaded like the Coverage Shadow so the Goal Mouth is coloured to the posts.
  const R = SCORE_RECT;
  const mouth = new THREE.Shape([
    new THREE.Vector2(-MOUTH_HALF_W, 0), new THREE.Vector2(MOUTH_HALF_W, 0),
    new THREE.Vector2(MOUTH_HALF_W, MOUTH_H), new THREE.Vector2(-MOUTH_HALF_W, MOUTH_H),
  ]);
  mouth.holes = [new THREE.Path([
    new THREE.Vector2(R.x0, R.y0), new THREE.Vector2(R.x1, R.y0), new THREE.Vector2(R.x1, R.y1), new THREE.Vector2(R.x0, R.y1),
  ])];
  const tooTight = new THREE.Mesh(new THREE.ShapeGeometry(mouth), shadowMat);
  tooTight.position.z = 0.002; tooTight.renderOrder = 2;
  group.add(tooTight);

  const setShapes = (mesh: THREE.Mesh, shapes: Shape2[]) => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.ShapeGeometry(shapes.map(s => {
      const sh = new THREE.Shape(s.outer.map(p => new THREE.Vector2(p.x, p.y)));
      sh.holes = s.holes.map(h => new THREE.Path(h.map(p => new THREE.Vector2(p.x, p.y))));
      return sh;
    }));
  };

  // Scoring lanes: a translucent green fan from the Puck into each hole (~18%), with the hole outlined.
  const lanes = new THREE.Group();
  const laneMat = flatMat(0x22c55e, 0.18), laneLine = new THREE.LineBasicMaterial({ color: 0x15803d });
  group.add(lanes);
  function buildLanes(cov: Coverage, P: Vec) {
    for (const o of lanes.children) (o as THREE.Mesh).geometry.dispose();
    lanes.clear();
    if (cov.noShot) return;
    for (const s of holesOf(cov)) {
      const ring = s.outer, pos: number[] = [];
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        pos.push(P.x, P.y, P.z, a.x, a.y, 0, b.x, b.y, 0);
      }
      const fan = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)), laneMat);
      fan.renderOrder = 1;
      const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ring.map(p => new THREE.Vector3(p.x, p.y, 0.004))), laneLine);
      outline.renderOrder = 3;
      lanes.add(fan, outline);
    }
  }

  return {
    group,
    update(cov: Coverage, P: Vec) {
      setShapes(shadow, cov.shadow);
      setShapes(open, cov.open);
      shadow.visible = open.visible = tooTight.visible = !cov.noShot;
      buildLanes(cov, P);
    },
    /** Lanes are switched by the Shot Cone toggle, and hidden in Puck's view, where they would fill the screen. */
    set lanesVisible(v: boolean) { lanes.visible = v; },
  };
}
