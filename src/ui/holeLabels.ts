import * as THREE from 'three';
import type { NamedHole } from '../coverage/holes';
import { holeText } from './coverageCard';

/** Labels at the centre of each named hole, floating over the 3D view. */
export function holeLabels(el: HTMLElement) {
  let labels: { div: HTMLElement; at: THREE.Vector3 }[] = [];
  const p = new THREE.Vector3();
  return {
    set(holes: NamedHole[]) {
      el.replaceChildren();
      labels = holes.map(h => {
        const div = document.createElement('div');
        div.className = 'lbl';
        div.textContent = holeText(h);
        el.appendChild(div);
        return { div, at: new THREE.Vector3(h.shape.centroid.x, h.shape.centroid.y, 0.01) };
      });
    },
    /** Call after rendering, so the labels use the same camera as the picture. */
    place(camera: THREE.Camera, width: number, height: number) {
      for (const l of labels) {
        p.copy(l.at).project(camera);
        const vis = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
        l.div.style.display = vis ? 'block' : 'none';
        if (vis) l.div.style.transform = `translate(${((p.x + 1) / 2 * width).toFixed(1)}px, ${((1 - p.y) / 2 * height).toFixed(1)}px) translate(-50%, -50%)`;
      }
    },
  };
}
