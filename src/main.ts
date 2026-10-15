import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeCoverage, HullCache, hullToWorld, type Coverage, type Hull } from './coverage/coverage';
import { nameHoles } from './coverage/holes';
import { goalieParts } from './coverage/parts';
import { IN, PUCK_HALF_T } from './dims';
import {
  defaultGoalie, depthNow, DEPTH_SPOTS, lockToPost, moveGoalieTo, placeGoalie, setDepth, setFacing, setHeightIn, setStance,
} from './goalie';
import { defaultHands, solvePose, type HandKey, type Pose } from './posing/posing';
import { createCoverageLayer } from './scene/coverageLayer';
import { createGoalieHelpers } from './scene/goalieHelpers';
import { createGoalieMesh } from './scene/goalieMesh';
import { createHandGizmo, type GizmoMode } from './scene/handGizmo';
import { buildNet } from './scene/net';
import { buildPuck, clampPuck, DEFAULT_PUCK, type PuckSpot } from './scene/puck';
import { buildRink } from './scene/rink';
import { cornerMap } from './ui/cornerMap';
import { holeLabels } from './ui/holeLabels';
import { coverageCard } from './ui/coverageCard';
import { goalieCard } from './ui/goalieCard';
import { wheelNotches } from './ui/wheel';
import { VIEWS, viewPose, type ViewKey } from './views';

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const DEG = 180 / Math.PI;

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
// Our pointer handler is registered first (in the capture phase), so grabbing something disables orbiting before
// OrbitControls sees the press.
view.addEventListener('pointerdown', onPointerDown, { capture: true });
const orbit = new OrbitControls(camera, canvas);

scene.add(buildRink(), buildNet());

// ---------------- state ----------------
const puck: PuckSpot = { ...DEFAULT_PUCK };
const goalie = defaultGoalie();
const show = { cone: true, margin: true };
type Selection = 'puck' | 'goalie' | HandKey | null;
let sel: Selection = null;
let currentView: ViewKey = 'puck';
let pose: Pose;
let hulls: Hull[] = [];
let cov: Coverage;

// ---------------- scene objects ----------------
const puckMesh = buildPuck();
puckMesh.group.position.set(puck.x, 0, puck.z);
scene.add(puckMesh.group);
const goalieRoot = new THREE.Group();   // placed and turned like the goalie; the mesh lives in the goalie's own frame
const goalieMesh = createGoalieMesh();
const helpers = createGoalieHelpers();
goalieRoot.add(goalieMesh.group, helpers.group);
scene.add(goalieRoot);
const hullCache = new HullCache();
const coverageLayer = createCoverageLayer();
scene.add(coverageLayer.group);

// ---------------- hands ----------------
/** +1 when hand w is on the goalie's left. */
const handSide = (w: HandKey) => (w === 'glove') === (goalie.catchSide === 'left') ? 1 : -1;
/** Asks for hand w at world position p; the posing module clamps it to the Stance's limits and arm reach. */
function moveHandToWorld(w: HandKey, p: THREE.Vector3) {
  const l = goalieRoot.worldToLocal(p.clone()), s = handSide(w), H = goalie.heightM;
  goalie[w] = { ...goalie[w], out: l.x * s / H, up: l.y / H, fwd: l.z / H };
  updatePose();
}
/** Takes where a held-back hand actually ended up as its new setting. */
const settleHand = (w: HandKey) => { goalie[w] = { ...pose[w].placedFrac }; };

const gizmo = createHandGizmo({
  camera, canvas, scene, hands: helpers.hands, puck,
  onMove: moveHandToWorld,
  onTurn: (w, ball) => {
    const p = ball.position, s = handSide(w), H = goalie.heightM;
    const e = new THREE.Euler().setFromQuaternion(ball.quaternion, 'YXZ');
    goalie[w] = { out: p.x * s / H, up: p.y / H, fwd: p.z / H, yaw: s * e.y * DEG, pitch: -e.x * DEG, roll: -s * e.z * DEG };
    updatePose(true);
  },
  onDragging: (on, w) => {
    orbit.enabled = !on;
    if (!on) { settleHand(w); updatePose(); gizmo.show(w); }
  },
});

function renderWarn() {
  const msgs = (['glove', 'blocker'] as const).filter(w => pose[w].flags.length)
    .map(w => `${w === 'glove' ? 'Glove' : 'Blocker'} held back: ${pose[w].flags.join(', ')}`);
  const el = $('#warn');
  el.hidden = !msgs.length;
  el.textContent = msgs.join(' · ');
}

// ---------------- cards ----------------
const covCard = coverageCard($('#coverageCard'));
const labels = holeLabels($('#labels'));
const gCard = goalieCard($('#goaliePanel'), {
  stance: k => { setStance(goalie, k); updatePose(); },
  catchSide: c => { goalie.catchSide = c; updatePose(); },
  heightIn: n => { setHeightIn(goalie, n); updatePose(); },
  depthSpot: k => { setDepth(goalie, DEPTH_SPOTS[k]); updatePlacement(); },
  post: () => { lockToPost(goalie); updatePlacement(); },
  depthIn: n => { if (goalie.lock !== 'post') { setDepth(goalie, n * IN); updatePlacement(); } },
});
$('[data-reset-hand]').addEventListener('click', () => {
  if (sel !== 'glove' && sel !== 'blocker') return;
  goalie[sel] = defaultHands(goalie.stance, goalie.catchSide)[sel];
  updatePose();
});
const map = cornerMap($<SVGSVGElement>('#cornerMap'), (x, z) => setPuck(x, z, true), () => {});

function renderCard() {
  const panel = sel === 'glove' || sel === 'blocker' ? 'hand' : sel ?? 'none';
  document.querySelectorAll<HTMLElement>('#card [data-panel]').forEach(d => d.hidden = d.dataset.panel !== panel);
  if (sel === 'goalie') gCard.render(goalie, depthNow(goalie, pose));
  $('[data-hand-title]').textContent = sel === 'glove' ? 'Glove Hand' : 'Blocker Hand (and stick)';
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === gizmo.mode));
}

const isHand = (k: Selection): k is HandKey => k === 'glove' || k === 'blocker';

function select(k: Selection) {
  sel = k;
  helpers.turnRing.visible = sel === 'goalie';
  gizmo.show(isHand(sel) ? sel : null);
  // The wheel sets a selected goalie's depth, or moves a selected hand along the shot, instead of zooming.
  orbit.enableZoom = sel === null || sel === 'puck';
  renderCard();
}

function setGizmoMode(m: GizmoMode) { gizmo.setMode(m); renderCard(); }
document.querySelectorAll<HTMLElement>('[data-mode]').forEach(b => b.addEventListener('click', () => setGizmoMode(b.dataset.mode as GizmoMode)));

// ---------------- updates ----------------
/**
 * The goalie's pose changed (Stance, height, Catch Side, hands): re-solve, rebuild only the parts that changed, then
 * place it. keepHands: the rotate gizmo is turning a hand's ball, so leave the balls be.
 */
function updatePose(keepHands = false) {
  pose = solvePose(goalie);
  const parts = goalieParts(pose);
  goalieMesh.update(parts);
  hulls = hullCache.hulls(parts);
  helpers.update(pose, keepHands);
  renderWarn();
  updatePlacement();
}

/** The goalie moved or turned on the ice. Its pose and hulls stay as they are. */
function updatePlacement() {
  const at = placeGoalie(goalie, pose);
  goalieRoot.position.set(at.x, 0, at.z);
  goalieRoot.rotation.y = at.facingDeg / DEG;
  renderCard();
  updateCoverage();
}

/** Recomputes the Coverage Shadow and Open Net from the Puck through the goalie's cached hulls. */
function updateCoverage() {
  const root = { x: goalieRoot.position.x, z: goalieRoot.position.z, f: goalieRoot.rotation.y };
  const P = { x: puck.x, y: PUCK_HALF_T, z: puck.z };
  cov = computeCoverage(hulls.map(h => hullToWorld(h, root)), P);
  const pelvis = goalieRoot.localToWorld(new THREE.Vector3(pose.pelvis.x, pose.pelvis.y, pose.pelvis.z));
  const named = cov.noShot ? [] : nameHoles(cov, P, pelvis, goalie.catchSide);
  coverageLayer.update(cov, P, show.margin);
  covCard.render(cov, named);
  labels.set(named);
  $('#noShot').style.display = cov.noShot ? 'block' : 'none';
  renderMap();
  gizmo.realign();   // the shot runs from the Puck through the hand, so the arrows follow both
}

/** Moves the Puck, kept on the ice. refollow: bring a following view along now (not while dragging it in 3D). */
function setPuck(x: number, z: number, refollow: boolean) {
  Object.assign(puck, clampPuck(x, z));
  puckMesh.group.position.set(puck.x, 0, puck.z);
  updateCoverage();
  if (refollow) refollowView();
}

function renderMap() {
  if (currentView === 'puck') map.render({ puck, goalie: { ...goalie.pos, facingDeg: goalie.facingDeg }, noShot: cov.noShot });
}

// ---------------- views ----------------
const viewbar = $('#viewbar');
viewbar.innerHTML = VIEWS.map(({ key, label }) => `<button type="button" data-view="${key}">${label}</button>`).join('') + `
  <span class="toggles">
    <label><input type="checkbox" data-show="cone"> Shot Cone</label>
    <label><input type="checkbox" data-show="margin"> Puck-size margin</label>
  </span>`;
viewbar.addEventListener('click', e => {
  const k = (e.target as HTMLElement).closest<HTMLElement>('[data-view]')?.dataset.view as ViewKey | undefined;
  if (k) setView(k);
});
viewbar.addEventListener('change', e => {
  const i = e.target as HTMLInputElement;
  if (!i.dataset.show) return;
  show[i.dataset.show as keyof typeof show] = i.checked;
  renderViewState();
  updateCoverage();
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

/** Puts a following view back on the Puck, e.g. after it moved. Free orbit stays where it is. */
function refollowView() { if (currentView !== 'orbit') setView(currentView); }

function renderViewState() {
  viewbar.querySelectorAll<HTMLElement>('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === currentView));
  const puckView = currentView === 'puck';
  puckMesh.ring.visible = !puckView;   // up close in Puck's view the ring would fill the screen; the map moves the Puck there
  $('#youArePuck').style.display = puckView ? 'block' : 'none';
  $('#cornerMap').style.display = $('#mapCap').style.display = puckView ? '' : 'none';
  coverageLayer.lanesVisible = show.cone && !puckView;   // from behind the Puck, the lanes would fill the screen
  viewbar.querySelectorAll<HTMLInputElement>('[data-show]').forEach(i => i.checked = show[i.dataset.show as keyof typeof show]);
  if (cov) renderMap();
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

// ---------------- pointer, wheel and keys on the 3D view ----------------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), icePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function setRay(e: PointerEvent) {
  const r = canvas.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function icePoint(): { x: number; z: number } | null {
  const p = new THREE.Vector3();
  return ray.ray.intersectPlane(icePlane, p) ? { x: p.x, z: p.z } : null;
}
// Which hand a part of the goalie belongs to (the stick goes with the blocker), or null for the body.
const handOf = (id: string): HandKey | null =>
  id.startsWith('glove') ? 'glove' : id.startsWith('blocker') || ['paddle', 'shaft', 'blade'].includes(id) ? 'blocker' : null;

type Drag = { k: 'puck' } | { k: 'goalie'; off: { x: number; z: number } } | { k: 'turn'; pivot: { x: number; z: number } };
let drag: Drag | null = null, downAt: { x: number; y: number } | null = null;

function grab(e: PointerEvent, d: Drag) {
  drag = d;
  orbit.enabled = false;
  canvas.setPointerCapture(e.pointerId);
}

function onPointerDown(e: PointerEvent) {
  downAt = null;
  if (e.target !== canvas || e.button !== 0) return;
  if (gizmo.busy) { orbit.enabled = false; return; }   // the hand gizmo takes this press
  setRay(e);
  const hand = ray.intersectObjects([helpers.hands.glove, helpers.hands.blocker])[0];
  if (hand) return select(hand.object === helpers.hands.glove ? 'glove' : 'blocker');
  if (sel === 'goalie' && ray.intersectObject(helpers.knob)[0]) return grab(e, { k: 'turn', pivot: { ...goalie.pos } });
  if (puckMesh.ring.visible && ray.intersectObject(puckMesh.hit)[0]) { select('puck'); return grab(e, { k: 'puck' }); }
  if (ray.intersectObject(puckMesh.group)[0]) return select('puck');   // in Puck's view it moves on the map
  const part = ray.intersectObjects(goalieMesh.group.children)[0];
  if (part) {
    const w = handOf(part.object.name);
    if (w) return select(w);
    select('goalie');
    const p = icePoint() ?? goalie.pos;
    return grab(e, { k: 'goalie', off: { x: goalie.pos.x - p.x, z: goalie.pos.z - p.z } });
  }
  downAt = { x: e.clientX, y: e.clientY };
}

canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  setRay(e);
  const p = icePoint();
  if (!p) return;
  if (drag.k === 'puck') setPuck(p.x, p.z, false);   // the camera follows on release
  else if (drag.k === 'goalie') {
    const note = moveGoalieTo(goalie, pose, { x: p.x + drag.off.x, z: p.z + drag.off.z });
    if (note) flash(note);
    updatePlacement();
  } else {
    // On the arc the goalie slides round as it turns, and its knob stays on a circle round the middle of the goal
    // line, so the angle is taken from there; that keeps the knob under the cursor. Elsewhere it turns on the spot.
    const c = goalie.lock === 'arc' ? { x: 0, z: 0 } : drag.pivot;
    setFacing(goalie, Math.atan2(p.x - c.x, p.z - c.z) * DEG);
    updatePlacement();
  }
});
canvas.addEventListener('pointerup', e => {
  if (drag) {
    const k = drag.k;
    drag = null;
    orbit.enabled = true;
    if (k === 'puck') refollowView();
  } else if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 4) select(null);   // a click on empty space
  downAt = null;
  orbit.enabled = true;
});
canvas.addEventListener('wheel', e => {
  // A selected hand: the wheel moves it along the shot, 2 cm per notch (wheel up = toward the Puck). Handy in Puck's
  // view, where that arrow points at the camera.
  if (isHand(sel)) {
    e.preventDefault();
    const n = wheelNotches(e);
    if (!n) return;
    moveHandToWorld(sel, gizmo.handWorld(sel).add(gizmo.shotDir(sel).multiplyScalar(-0.02 * n)));
    settleHand(sel);
    updatePose();
    return;
  }
  // A selected goalie: the wheel sets its depth, 1 inch per notch (wheel up = further out). Otherwise it zooms.
  if (sel !== 'goalie' || goalie.lock === 'post') return;
  e.preventDefault();
  const n = wheelNotches(e);
  if (n) { setDepth(goalie, (Math.round(depthNow(goalie, pose) / IN) - n) * IN); updatePlacement(); }
}, { passive: false });
addEventListener('keydown', e => {
  if ((e.target as HTMLElement).closest('input, textarea')) return;
  if (e.key === 'Escape') select(null);
  else if (isHand(sel) && (e.key === 'w' || e.key === 'W')) setGizmoMode('translate');
  else if (isHand(sel) && (e.key === 'e' || e.key === 'E')) setGizmoMode('rotate');
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
  labels.place(camera, canvas.clientWidth, canvas.clientHeight);
});

updatePose();
select(null);
resize();
setView('puck');
