// Dev only: draws the goalie's parts (the same ones the app draws and covers with) in four fixed orthographic views.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { goalieParts } from '../src/coverage/parts';
import { defaultHands, solvePose, type StanceKey } from '../src/posing/posing';
import { createGoalieMesh } from '../src/scene/goalieMesh';

const q = new URLSearchParams(location.search);
const stance = (q.get('stance') ?? 'standup') as StanceKey, heightM = +(q.get('h') ?? 1.75);
const catchSide = q.get('catch') === 'right' ? 'right' : 'left';
const body = { stance, heightM, catchSide, gripAboveIn: 1 }, pose = solvePose({ ...body, ...defaultHands(body) });

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x99aabb, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(2, 4, 3);
scene.add(sun);
const ice = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0xf4f8fb }));
ice.rotation.x = -Math.PI / 2;
scene.add(ice);
const mesh = createGoalieMesh(), parts = goalieParts(pose);
mesh.update(parts, pose);
scene.add(mesh.group);
// hulls=1 draws the stick's coverage hulls over its model, as wire: the model should sit just inside them.
if (q.get('hulls') === '1')
  for (const p of parts) if (p.kind === 'hull' && p.id.startsWith('stick'))
    scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(new ConvexGeometry(p.pts.map(v => new THREE.Vector3(v.x, v.y, v.z)))),
      new THREE.LineBasicMaterial({ color: 0xff2a6d })));

// focus=legs frames the legs and pads only, focus=stick the stick's heel and blade; otherwise the whole goalie.
const focus = q.get('focus'), legs = focus === 'legs', heel = pose.stick.heel;
const [cx, cy, cz, half] = focus === 'stick' ? [heel.x + 0.12, 0.2, heel.z, 0.32] : [0, legs ? 0.45 : 0.65, 0, legs ? 0.55 : 0.9];
const views: [string, THREE.Vector3][] = [
  ['front', new THREE.Vector3(cx, cy, cz + 5)], ['left side', new THREE.Vector3(cx + 5, cy, cz)],
  focus === 'stick' ? ['from above', new THREE.Vector3(cx, cy + 5, cz)] : ['back', new THREE.Vector3(cx, cy, cz - 5)], ['3/4 front-left', new THREE.Vector3(cx + 3.5, cy + 1.5, cz + 3.5)],
];
const grid = document.getElementById('grid')!;
for (const [label, pos] of views) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.innerHTML = `<span>${label} — ${stance}, ${heightM} m</span>`;
  grid.append(cell);
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  cell.prepend(r.domElement);
  const w = cell.clientWidth, h = cell.clientHeight, a = w / h;
  r.setSize(w, h);
  r.setClearColor(0xdfe6ec);
  const cam = new THREE.OrthographicCamera(-half * a, half * a, half, -half, 0.1, 20);
  cam.position.copy(pos);
  if (label === 'from above') cam.up.set(0, 0, -1);   // the net at the top
  cam.lookAt(cx, cy, cz);
  r.render(scene, cam);
}
document.body.dataset.ready = '1';
