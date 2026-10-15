import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeCoverage, HullCache, hullToWorld, type Hull } from './coverage/coverage';
import { goalieParts } from './coverage/parts';
import { PUCK_HALF_T } from './dims';
import { defaultGoalie, placeGoalie, setHeightIn, setStance } from './goalie';
import { solvePose } from './posing/posing';
import { createCoverageLayer } from './scene/coverageLayer';
import { createGoalieMesh } from './scene/goalieMesh';
import { buildNet } from './scene/net';
import { buildPuck, DEFAULT_PUCK, type PuckSpot } from './scene/puck';
import { buildRink } from './scene/rink';
import { coverageCard } from './ui/coverageCard';
import { goalieCard } from './ui/goalieCard';
import { VIEWS, viewPose, type ViewKey } from './views';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const view = $('#view');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));   // beyond 2× costs frame rate for no visible gain
view.prepend(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe8ef);
scene.add(new THREE.HemisphereLight(0xffffff, 0x99aabb, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(3, 6, 5);
scene.add(sun);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
const orbit = new OrbitControls(camera, canvas);

scene.add(buildRink(), buildNet());
const puckMesh = buildPuck();
scene.add(puckMesh.group);

const puck: PuckSpot = { ...DEFAULT_PUCK };
puckMesh.group.position.set(puck.x, 0, puck.z);

// ---------------- goalie ----------------
const goalie = defaultGoalie();
const goalieRoot = new THREE.Group();   // placed and turned like the goalie; the mesh lives in the goalie's own frame
const goalieMesh = createGoalieMesh();
goalieRoot.add(goalieMesh.group);
scene.add(goalieRoot);

const card = goalieCard($('#goalieCard'), {
  stance: k => { setStance(goalie, k); updateGoalie(); },
  catchSide: c => { goalie.catchSide = c; updateGoalie(); },
  heightIn: n => { setHeightIn(goalie, n); updateGoalie(); },
});

// ---------------- coverage ----------------
const hullCache = new HullCache();
let hulls: Hull[] = [];
const coverageLayer = createCoverageLayer();
scene.add(coverageLayer.group);
const covCard = coverageCard($('#coverageCard'));
const show = { margin: true };

function updateGoalie() {
  const pose = solvePose(goalie);
  const parts = goalieParts(pose);
  goalieMesh.update(parts);
  hulls = hullCache.hulls(parts);
  const at = placeGoalie(goalie, pose);
  goalieRoot.position.set(at.x, 0, at.z);
  goalieRoot.rotation.y = at.facingDeg * Math.PI / 180;
  card.render(goalie);
  updateCoverage();
}

/** Recomputes the Coverage Shadow and Open Net from the Puck through the goalie's cached hulls. */
function updateCoverage() {
  const root = { x: goalieRoot.position.x, z: goalieRoot.position.z, f: goalieRoot.rotation.y };
  const cov = computeCoverage(hulls.map(h => hullToWorld(h, root)), { x: puck.x, y: PUCK_HALF_T, z: puck.z });
  coverageLayer.update(cov, show.margin);
  covCard.render(cov);
  $('#noShot').style.display = cov.noShot ? 'block' : 'none';
}
updateGoalie();

// ---------------- views ----------------
let currentView: ViewKey = 'puck';

const viewbar = $('#viewbar');
viewbar.innerHTML = VIEWS.map(({ key, label }) => `<button type="button" data-view="${key}">${label}</button>`).join('');
viewbar.addEventListener('click', e => {
  const k = (e.target as HTMLElement).closest<HTMLElement>('[data-view]')?.dataset.view as ViewKey | undefined;
  if (k) setView(k);
});

function setView(k: ViewKey) {
  currentView = k;
  const v = viewPose(k, puck, camera.aspect);
  camera.position.copy(v.pos);
  orbit.target.copy(v.target);
  camera.fov = v.fov;
  camera.updateProjectionMatrix();
  orbit.update();
  renderViewState();
}

/** Puts a following view back on the Puck, e.g. after the window changes shape. Free orbit stays where it is. */
function refollowView() { if (currentView !== 'orbit') setView(currentView); }

function renderViewState() {
  viewbar.querySelectorAll<HTMLElement>('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === currentView));
  puckMesh.ring.visible = currentView !== 'puck';   // up close in Puck's view the ring would fill the screen
  $('#youArePuck').style.display = currentView === 'puck' ? 'block' : 'none';
}

// Orbiting by hand leaves the preset, so it becomes Free orbit and the camera stays where the coach put it.
let userOrbiting = false;
orbit.addEventListener('start', () => { userOrbiting = true; });
orbit.addEventListener('end', () => { userOrbiting = false; });
orbit.addEventListener('change', () => {
  if (!userOrbiting || currentView === 'orbit') return;
  const left = VIEWS.find(v => v.key === currentView)!.label;
  currentView = 'orbit';
  if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }
  renderViewState();
  flash(`Free orbit: press ${left} to go back`);
});

// ---------------- notices ----------------
let flashTimer: number | undefined;
function flash(msg: string) {
  const el = $('#flash');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => el.classList.remove('show'), 1600);
}

// ---------------- size + render loop ----------------
function resize() {
  const r = view.getBoundingClientRect();
  renderer.setSize(r.width, r.height);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  refollowView();   // Puck's view fits the net to the window's shape
}
addEventListener('resize', resize);

const puckTag = $('#puckTag');
const tagAt = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
  // The "Puck" tag floats just above it whenever it's on screen. Placed after rendering, so it uses the same camera
  // matrices as the picture; before, it trailed the Puck by a frame while orbiting and flickered.
  tagAt.set(puck.x, 2 * PUCK_HALF_T, puck.z).project(camera);
  const tagVis = tagAt.z < 1 && Math.abs(tagAt.x) < 1 && Math.abs(tagAt.y) < 1;
  puckTag.style.display = tagVis ? 'block' : 'none';
  if (tagVis) {
    const x = (tagAt.x + 1) / 2 * canvas.clientWidth, y = (1 - tagAt.y) / 2 * canvas.clientHeight - 14;
    puckTag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }
});

resize();
setView('puck');
