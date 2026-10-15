import * as THREE from 'three';
import { MOUTH_H, MOUTH_HALF_W, NET_BASE_CORNER_R, NET_BASE_DEPTH, NET_BASE_HALF_W, NET_TOP_DEPTH, POST_R } from '../dims';

/** Centre of each post's tube, and the height of the crossbar's centre. */
export const POST_X = MOUTH_HALF_W + POST_R;
export const POST_H = MOUTH_H + POST_R;

type P = THREE.Vector3;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * The Hockey Canada net: 2 in red posts and crossbar on the goal line, a base frame 44 in deep and 88 in wide with
 * 18 in corner radii, a top frame 18 in deep (cosmetic), and white netting. Only the Goal Mouth matters for coverage;
 * the frame behind it is for looks.
 */
export function buildNet(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'net';
  const red = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });

  // Posts and crossbar. The posts reach the top of the bar so the corners close.
  for (const x of [-POST_X, POST_X]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(POST_R, POST_R, POST_H, 20), red);
    post.position.set(x, POST_H / 2, 0);
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(POST_R, POST_R, 2 * POST_X, 20), red);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, POST_H, 0);
  g.add(bar);
  for (const x of [-POST_X, POST_X]) {
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(POST_R, 16, 12), red);
    knuckle.position.set(x, POST_H, 0);
    g.add(knuckle);
  }

  const { left: baseL, back: baseBack, right: baseR, elbow } = baseOutline();
  const tube = (pts: P[], r: number, m: THREE.Material) =>
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 2), r, 10), m));
  tube([...baseL, ...baseBack.slice(1), ...baseR.slice(1)], 0.9 * POST_R, white);

  // Top frame: back from each post top, across the back, and an elbow down to each back corner of the base.
  const topL = [v(-POST_X, POST_H, 0), v(-POST_X, POST_H, -NET_TOP_DEPTH)];
  const topR = [v(POST_X, POST_H, -NET_TOP_DEPTH), v(POST_X, POST_H, 0)];
  const topBack = [topL[1], topR[0]];
  for (const pts of [topL, topBack, topR, [topL[1], elbow.left], [topR[0], elbow.right]]) {
    const a = pts[0], b = pts[pts.length - 1];
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * POST_R, 0.8 * POST_R, a.distanceTo(b), 12), red);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.add(m);
  }

  // Netting: lofted from the base outline up to the top frame, side to side and back to back, plus the roof.
  const netMat = new THREE.MeshBasicMaterial({ map: meshTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  g.add(new THREE.Mesh(loft([baseL, baseBack, baseR], [topL, topBack, topR]), netMat));
  g.add(new THREE.Mesh(loft([[v(-POST_X, POST_H, 0), v(POST_X, POST_H, 0)]], [topBack]), netMat));
  return g;
}

/** The base frame's centreline from the left post round the back to the right post, in three runs. */
function baseOutline() {
  const W = NET_BASE_HALF_W - POST_R, D = NET_BASE_DEPTH - POST_R, r = NET_BASE_CORNER_R - POST_R;
  // Right half, from the foot of the post: flare out to the widest point, run straight back, round the corner.
  const side: P[] = [];
  const flare = new THREE.CubicBezierCurve3(v(POST_X, 0, 0), v(POST_X, 0, -0.2), v(W, 0, -0.2), v(W, 0, -0.42));
  side.push(...flare.getPoints(10));
  side.push(v(W, 0, -(D - r)));
  const arc: P[] = [];
  for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 * i / 8; arc.push(v(W - r + r * Math.cos(a), 0, -(D - r) - r * Math.sin(a))); }
  const corner = v(W - r + r * Math.SQRT1_2, 0, -(D - r) - r * Math.SQRT1_2);
  const right = [...side, ...arc].reverse();   // from the back of the corner to the right post
  const mirror = (p: P) => v(-p.x, p.y, p.z);
  const left = right.map(mirror).reverse();    // from the left post to the back of the left corner
  const back = [left[left.length - 1], right[0]];
  return { left, back, right, elbow: { left: mirror(corner), right: corner } };
}

/** Points at n + 1 even steps along a polyline. */
function resample(pts: P[], n: number): P[] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = cum[cum.length - 1], out: P[] = [];
  for (let k = 0, i = 1; k <= n; k++) {
    const s = total * k / n;
    while (i < pts.length - 1 && cum[i] < s) i++;
    const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
    out.push(pts[i - 1].clone().lerp(pts[i], Math.min(1, Math.max(0, t))));
  }
  return out;
}

/** A surface between matching runs of two curves. UVs are in metres so the mesh texture keeps its size. */
function loft(bottom: P[][], top: P[][]): THREE.BufferGeometry {
  const ROWS = 8, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let base = 0, u0 = 0;
  bottom.forEach((run, k) => {
    const n = 16, B = resample(run, n), T = resample(top[k], n);
    for (let i = 0; i <= n; i++) {
      const du = i ? B[i].distanceTo(B[i - 1]) : 0;
      u0 += du;
      const h = B[i].distanceTo(T[i]);
      for (let j = 0; j <= ROWS; j++) {
        const p = B[i].clone().lerp(T[i], j / ROWS);
        pos.push(p.x, p.y, p.z);
        uv.push(u0, h * j / ROWS);
      }
      if (i) for (let j = 0; j < ROWS; j++) {
        const a = base + (i - 1) * (ROWS + 1) + j, b = a + ROWS + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    base += (n + 1) * (ROWS + 1);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/** Square netting, one cell per 10 cm (real netting is 2.5 in; finer just shimmers on screen). Light grey so it
 *  still shows against the white ice. */
function meshTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 0, 32, 32);
  ctx.strokeStyle = 'rgba(148,163,184,0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
