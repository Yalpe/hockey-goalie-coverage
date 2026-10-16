// COVERAGE MODULE: pure apart from three.js ConvexHull/Vector3 and clipper2-ts; metres. Ported from the controls
// prototype; see issues/goalie-coverage-mvp/02-coverage-computation.md and docs/research/02-coverage-computation.md.
// World frame: goal plane z = 0 (the goal line), ice y = 0, +x = the goalie's left (the shooter's right), shooter at +z.
// The goalie is a list of convex parts in its own local frame (posing frame). Each part is dilated by the Puck in 3D
// (Minkowski sum with the Puck cylinder) and its hull is cached in the goalie frame: the Puck is symmetric about the
// vertical, so moving or turning the goalie and dragging the Puck never invalidate a hull.
import * as C2 from 'clipper2-ts';
import { Vector3 } from 'three';
import { ConvexHull, type VertexNode } from 'three/addons/math/ConvexHull.js';
import { MOUTH_H, MOUTH_HALF_W, PUCK_HALF_T, PUCK_R } from '../dims';
import { add, cross, mul, V, type Vec } from '../posing/vec';
import { partSig, type Part } from './parts';

/** Where the Puck's centre must cross the goal plane to score: the Goal Mouth shrunk by the Puck's half-sizes. */
export const SCORE_RECT = { x0: -MOUTH_HALF_W + PUCK_R, x1: MOUTH_HALF_W - PUCK_R, y0: PUCK_HALF_T, y1: MOUTH_H - PUCK_HALF_T };
const RIM_N = 16, SPHERE_N = 32, SPHERE_K = 1.08, CLIP_SCALE = 1e5; // clipper integer units per metre
const PUCK_PTS: Vec[] = [];
for (let i = 0; i < RIM_N; i++) {
  const a = 2 * Math.PI * i / RIM_N, r = PUCK_R / Math.cos(Math.PI / RIM_N);   // circumscribed: never under-covers
  for (const s of [-1, 1]) PUCK_PTS.push(V(r * Math.cos(a), s * PUCK_HALF_T, r * Math.sin(a)));
}
const SPHERE_DIRS = Array.from({ length: SPHERE_N }, (_, i) => {
  const y = 1 - 2 * (i + 0.5) / SPHERE_N, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
  return V(r * Math.cos(a) * SPHERE_K, y * SPHERE_K, r * Math.sin(a) * SPHERE_K);
});

function partPoints(p: Part): Vec[] {
  if (p.kind === 'hull') return p.pts;
  if (p.kind === 'capsule') return [p.a, p.b].flatMap(e => SPHERE_DIRS.map(s => add(e, mul(s, p.r))));
  const w = cross(p.u, p.n), out: Vec[] = [];   // box
  for (const a of [-1, 1]) for (const c of [-1, 1]) for (const e of [-1, 1])
    out.push(add(p.center, add(mul(p.u, a * p.l / 2), add(mul(p.n, c * p.d / 2), mul(w, e * p.w / 2)))));
  return out;
}

/** A convex hull as its vertices and edges (pairs of vertex indices). */
export interface Hull { verts: Vec[]; edges: [number, number][] }

/** The part dilated by the Puck, as a 3D convex hull in the goalie frame. */
export function dilatedHull(part: Part): Hull {
  const pts: Vector3[] = [];
  for (const b of partPoints(part)) for (const k of PUCK_PTS) pts.push(new Vector3(b.x + k.x, b.y + k.y, b.z + k.z));
  const hull = new ConvexHull().setFromPoints(pts);
  const index = new Map<VertexNode, number>(), verts: Vec[] = [], edges: [number, number][] = [];
  const idx = (vn: VertexNode) => {
    let i = index.get(vn);
    if (i === undefined) { i = verts.length; index.set(vn, i); verts.push(V(vn.point.x, vn.point.y, vn.point.z)); }
    return i;
  };
  for (const f of hull.faces) {
    let e = f.edge;
    do { const a = idx(e.tail()), b = idx(e.head()); if (a < b) edges.push([a, b]); e = e.next; } while (e !== f.edge);
  }
  return { verts, edges };
}

/** Where the goalie stands: root (x, z) on the ice, turned by f radians about +y. */
export interface Root { x: number; z: number; f: number }

/** Goalie frame -> world: turned by facing f about +y, then moved to root (x, z). */
export function hullToWorld(h: Hull, root: Root): Hull {
  const c = Math.cos(root.f), s = Math.sin(root.f);
  return { verts: h.verts.map(v => V(v.x * c + v.z * s + root.x, v.y, -v.x * s + v.z * c + root.z)), edges: h.edges };
}

/**
 * Dilated hulls for a goalie's parts. A part's hull is rebuilt only when its own geometry changes, so dragging a hand
 * rebuilds only that arm, the hand and the stick.
 */
export class HullCache {
  private cache = new Map<string, { sig: string; hull: Hull }>();
  /** How many hulls the last call rebuilt, and how long it took. */
  lastRebuild = { n: 0, ms: 0 };

  hulls(parts: Part[]): Hull[] {
    const t0 = performance.now();
    let n = 0;
    const out = parts.map(p => {
      const s = partSig(p), c = this.cache.get(p.id);
      if (c && c.sig === s) return c.hull;
      n++;
      const hull = dilatedHull(p);
      this.cache.set(p.id, { sig: s, hull });
      return hull;
    });
    this.lastRebuild = { n, ms: performance.now() - t0 };
    return out;
  }
}

// Points whose convex hull is the hull cut to the slab 0 <= z <= zMax (only that part sits between the Puck and the goal plane).
function clipSlab(h: Hull, zMax: number): Vec[] {
  const out: Vec[] = [], { verts, edges } = h;
  for (const v of verts) if (v.z >= 0 && v.z <= zMax) out.push(v);
  for (const [i, j] of edges) {
    const a = verts[i], b = verts[j];
    for (const z0 of [0, zMax]) if ((a.z - z0) * (b.z - z0) < 0) { const t = (z0 - a.z) / (b.z - a.z); out.push(V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, z0)); }
  }
  return out;
}

interface P2 { x: number; y: number }

function hull2d(pts: P2[]): P2[] {                 // Andrew's monotone chain, counter-clockwise
  if (pts.length < 3) return pts;
  pts = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const crs = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: P2[] = [], hi: P2[] = [];
  for (const p of pts) { while (lo.length >= 2 && crs(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && crs(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

const ringArea = (r: P2[]) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.y - q.x * p.y; } return a / 2; };
function ringCentroid(r: P2[]): P2 {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length], w = p.x * q.y - q.x * p.y; a += w; cx += (p.x + q.x) * w; cy += (p.y + q.y) * w; }
  return a ? { x: cx / (3 * a), y: cy / (3 * a) } : r[0];
}

/** A region on the goal plane (x across, y up, metres): an outer ring with holes. */
export interface Shape2 { outer: P2[]; holes: P2[][]; area: number; centroid: P2 }

// Polytree -> shapes in metres on the goal plane.
function treeToShapes(tree: C2.PolyPath64): Shape2[] {
  const toM = (path: C2.Path64) => path.map(p => ({ x: p.x / CLIP_SCALE, y: p.y / CLIP_SCALE })), shapes: Shape2[] = [];
  const walk = (node: C2.PolyPath64) => {
    for (let i = 0; i < node.count; i++) {
      const o = node.child(i), outer = toM(o.polygon!), holes: P2[][] = [];
      for (let j = 0; j < o.count; j++) { holes.push(toM(o.child(j).polygon!)); walk(o.child(j)); }
      shapes.push({ outer, holes, area: Math.abs(ringArea(outer)) - holes.reduce((s, h) => s + Math.abs(ringArea(h)), 0), centroid: ringCentroid(outer) });
    }
  };
  walk(tree);
  return shapes;
}

export interface Coverage {
  /** The Puck is on or behind the goal line: there is no shot. */
  noShot: boolean;
  shadow: Shape2[];
  open: Shape2[];
  rectArea: number;
  pctCovered: number;
  pctOpen: number;
  ms: number;
}

/**
 * worldHulls: dilated hulls in world space. P: the Puck centre. Returns the Coverage Shadow and Open Net as shapes
 * on the goal plane (inside SCORE_RECT), and the % covered. One source of truth for the number and the drawing.
 */
export function computeCoverage(worldHulls: Hull[], P: Vec): Coverage {
  const t0 = performance.now(), R = SCORE_RECT, rectArea = (R.x1 - R.x0) * (R.y1 - R.y0);
  if (P.z <= 0.01) return { noShot: true, shadow: [], open: [], rectArea, pctCovered: 0, pctOpen: 0, ms: 0 };
  const zMax = P.z - 0.005, polys: C2.Paths64 = [];
  for (const h of worldHulls) {
    const pts = clipSlab(h, zMax);
    if (pts.length < 3) continue;
    const proj = pts.map(v => { const t = P.z / (P.z - v.z); return { x: P.x + (v.x - P.x) * t, y: P.y + (v.y - P.y) * t }; });
    const ring = hull2d(proj);
    if (ring.length >= 3) polys.push(ring.map(p => ({ x: Math.round(p.x * CLIP_SCALE), y: Math.round(p.y * CLIP_SCALE) })));
  }
  const S = CLIP_SCALE, rect = [[{ x: R.x0 * S, y: R.y0 * S }, { x: R.x1 * S, y: R.y0 * S }, { x: R.x1 * S, y: R.y1 * S }, { x: R.x0 * S, y: R.y1 * S }]];
  const union = polys.length ? C2.union(polys, C2.FillRule.NonZero) : [];
  const shadowTree = new C2.PolyTree64(), openTree = new C2.PolyTree64();
  C2.booleanOpWithPolyTree(C2.ClipType.Intersection, union, rect, shadowTree, C2.FillRule.NonZero);
  C2.booleanOpWithPolyTree(C2.ClipType.Difference, rect, union, openTree, C2.FillRule.NonZero);
  const shadow = treeToShapes(shadowTree), open = treeToShapes(openTree);
  const covered = shadow.reduce((s, x) => s + x.area, 0);
  return { noShot: false, shadow, open, rectArea, pctCovered: 100 * covered / rectArea, pctOpen: 100 - 100 * covered / rectArea,
    ms: performance.now() - t0 };
}
