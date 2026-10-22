import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { BACK_PLATE, CAGE_BAR_R, cageBars, HEAD, SHELL_T, shellGrid, type MaskFrame } from '../coverage/helmetShape';
import { cross, dot, mul, norm, sub, type Vec } from '../posing/vec';

/**
 * The goalie's mask, drawn from the same shape the coverage covers with (helmetShape.ts): a white fibreglass shell with
 * its thickness showing at the edges, a black cat-eye cage and a back plate. Built once in the mask frame; the head's
 * turn only moves it. The throat guard is drawn from its coverage hull, like the gear.
 */
export interface HelmetMesh { group: THREE.Group; update(look: MaskFrame): void }

const SHELL_MAT = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.3 });
const CAGE_MAT = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.35, metalness: 0.5 });
const PLATE_MAT = new THREE.MeshStandardMaterial({ color: 0xf5f5f2, roughness: 0.3, side: THREE.DoubleSide });
const HEAD_MAT = new THREE.MeshStandardMaterial({ color: 0x1f3a5f, roughness: 0.7 });   // the body's colour

/** The shell: both sides' outsides, an inside SHELL_T in from them, and rims joining the two round the open edges. */
function shellGeometry(): THREE.BufferGeometry {
  const { rows, open } = shellGrid(), R = rows.length, C = rows[0].length;
  const at = (i: number, j: number) => rows[Math.min(R - 1, Math.max(0, i))][Math.min(C - 1, Math.max(0, j))];
  // Outward: down the rows × round the row (the grid runs from the centreline round to the back).
  const inner = rows.map((row, i) => row.map((p, j) =>
    sub(p, mul(norm(cross(sub(at(i + 1, j), at(i - 1, j)), sub(at(i, j + 1), at(i, j - 1)))), SHELL_T))));
  const surf: number[] = [], rim: number[] = [];
  const tri = (out: number[], a: Vec, b: Vec, c: Vec) => out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < C - 1; j++) {
    const o = [rows[i][j], rows[i][j + 1], rows[i + 1][j], rows[i + 1][j + 1]], n = [inner[i][j], inner[i][j + 1], inner[i + 1][j], inner[i + 1][j + 1]];
    tri(surf, o[0], o[2], o[1]); tri(surf, o[1], o[2], o[3]);
    tri(surf, n[0], n[1], n[2]); tri(surf, n[1], n[3], n[2]);
  }
  // A rim quad from outside edge a–b to the inside, facing away from the shell (from inward toward the edge).
  const rimQuad = (a: Vec, b: Vec, a2: Vec, b2: Vec, away: Vec) => {
    if (dot(cross(sub(b, a), sub(a2, a)), away) >= 0) { tri(rim, a, b, a2); tri(rim, b, b2, a2); }
    else { tri(rim, a, a2, b); tri(rim, b, a2, b2); }
  };
  for (let j = 0; j < C - 1; j++) rimQuad(rows[R - 1][j], rows[R - 1][j + 1], inner[R - 1][j], inner[R - 1][j + 1], sub(rows[R - 1][j], rows[R - 2][j]));
  for (let i = 0; i < R - 1; i++) {
    rimQuad(rows[i][C - 1], rows[i + 1][C - 1], inner[i][C - 1], inner[i + 1][C - 1], sub(rows[i][C - 1], rows[i][C - 2]));
    if (open[i] || open[i + 1]) rimQuad(rows[i][0], rows[i + 1][0], inner[i][0], inner[i + 1][0], sub(rows[i][0], rows[i][1]));
  }
  // The other side: mirrored, its triangles turned round.
  const both = (a: number[]) => {
    const m: number[] = [];
    for (let k = 0; k < a.length; k += 9)
      for (const v of [0, 2, 1]) m.push(-a[k + 3 * v], a[k + 3 * v + 1], a[k + 3 * v + 2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...m], 3));
    return g;
  };
  // The surfaces are welded so they shade smooth over the centreline; the rims stay sharp.
  const s = mergeVertices(both(surf), 1e-6);
  s.computeVertexNormals();
  const r = both(rim);
  r.computeVertexNormals();
  return mergeGeometries([s.toNonIndexed(), r]);
}

function cageGeometry(): THREE.BufferGeometry {
  const { lines, closed } = cageBars(), v = (p: Vec) => new THREE.Vector3(p.x, p.y, p.z);
  return mergeGeometries(lines.map((line, i) => {
    const curve = new THREE.CatmullRomCurve3(line.map(v), closed[i], 'centripetal');
    return new THREE.TubeGeometry(curve, closed[i] ? 160 : 4 * line.length, CAGE_BAR_R, 8, closed[i]);
  }));
}

function headGeometry(): THREE.BufferGeometry {
  const { c, r } = HEAD;
  return new THREE.SphereGeometry(1, 24, 16).scale(r.x, r.y, r.z).translate(c.x, c.y, c.z);
}

function plateGeometry(): THREE.BufferGeometry {
  const { c, r } = BACK_PLATE;
  return new THREE.SphereGeometry(1, 32, 16, Math.PI, Math.PI, 0.12 * Math.PI, 0.73 * Math.PI).scale(r.x, r.y, r.z).translate(c.x, c.y, c.z);
}

export function createHelmetMesh(): HelmetMesh {
  const group = new THREE.Group();
  group.name = 'mask';
  group.matrixAutoUpdate = false;
  for (const [geo, mat] of [[shellGeometry(), SHELL_MAT], [cageGeometry(), CAGE_MAT], [plateGeometry(), PLATE_MAT],
    [headGeometry(), HEAD_MAT]] as const) {
    const m = new THREE.Mesh(geo, mat);
    m.name = 'mask';
    group.add(m);
  }
  const m = new THREE.Matrix4(), tv = (p: Vec) => new THREE.Vector3(p.x, p.y, p.z);
  return {
    group,
    update(f) {
      group.matrix.copy(m.makeBasis(tv(mul(f.x, f.s)), tv(mul(f.y, f.s)), tv(mul(f.z, f.s))).setPosition(tv(f.o)));
      group.matrixWorldNeedsUpdate = true;
    },
  };
}
