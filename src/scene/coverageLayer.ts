import * as THREE from 'three';
import { SCORE_RECT, type Coverage, type Shape2 } from '../coverage/coverage';

/**
 * What the coverage looks like on the goal plane: the Coverage Shadow (dark slate) and the Open Net (green), drawn
 * from the same polygons the % comes from, plus the dashed Puck-size margin (the 69" × 47" scoring rectangle).
 * Each layer sits a few millimetres in front of the goal line so they stack cleanly.
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

  const R = SCORE_RECT;
  const margin = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(R.x0, R.y0, 0), new THREE.Vector3(R.x1, R.y0, 0),
      new THREE.Vector3(R.x1, R.y1, 0), new THREE.Vector3(R.x0, R.y1, 0),
    ]),
    new THREE.LineDashedMaterial({ color: 0x334155, dashSize: 0.04, gapSize: 0.03, transparent: true, opacity: 0.9 }));
  margin.computeLineDistances();
  margin.position.z = 0.006; margin.renderOrder = 3;
  group.add(margin);

  const setShapes = (mesh: THREE.Mesh, shapes: Shape2[]) => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.ShapeGeometry(shapes.map(s => {
      const sh = new THREE.Shape(s.outer.map(p => new THREE.Vector2(p.x, p.y)));
      sh.holes = s.holes.map(h => new THREE.Path(h.map(p => new THREE.Vector2(p.x, p.y))));
      return sh;
    }));
  };

  return {
    group,
    update(cov: Coverage, showMargin: boolean) {
      setShapes(shadow, cov.shadow);
      setShapes(open, cov.open);
      shadow.visible = open.visible = !cov.noShot;
      margin.visible = showMargin;
    },
  };
}
