// Dev only: draws the goalie's parts (the same ones the app draws and covers with) in four fixed orthographic views.
import * as THREE from 'three';
import { goalieParts } from '../src/coverage/parts';
import { defaultHands, solvePose, type StanceKey } from '../src/posing/posing';
import { createGoalieMesh } from '../src/scene/goalieMesh';

const q = new URLSearchParams(location.search);
const stance = (q.get('stance') ?? 'standup') as StanceKey, heightM = +(q.get('h') ?? 1.75);
const catchSide = q.get('catch') === 'right' ? 'right' : 'left';
const body = { stance, heightM, catchSide, gripAboveIn: 3 }, pose = solvePose({ ...body, ...defaultHands(body) });

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x99aabb, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(2, 4, 3);
scene.add(sun);
const ice = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ color: 0xf4f8fb }));
ice.rotation.x = -Math.PI / 2;
scene.add(ice);
const mesh = createGoalieMesh();
mesh.update(goalieParts(pose));
scene.add(mesh.group);

// focus=legs frames the legs and pads only; otherwise the whole goalie.
const legs = q.get('focus') === 'legs';
const cy = legs ? 0.45 : 0.65, half = legs ? 0.55 : 0.9;
const views: [string, THREE.Vector3][] = [
  ['front', new THREE.Vector3(0, cy, 5)], ['left side', new THREE.Vector3(5, cy, 0)],
  ['back', new THREE.Vector3(0, cy, -5)], ['3/4 front-left', new THREE.Vector3(3.5, cy + 1.5, 3.5)],
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
  cam.lookAt(0, cy, 0);
  r.render(scene, cam);
}
document.body.dataset.ready = '1';
