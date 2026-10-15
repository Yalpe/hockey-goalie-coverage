import * as THREE from 'three';
import type { Part, PartMat } from '../coverage/parts';
import type { Vec } from '../posing/vec';

/**
 * The primitive goalie: one mesh per part, each named after its part id (thighL, shinR, padL0, chest, head,
 * gloveForearm, glove, blocker, paddle, shaft, blade…). The parts are built on the pose's named joints, so this module
 * is the only thing to replace with a rigged model later; nothing else draws the goalie.
 */
export interface GoalieMesh {
  /** Lives in the goalie's own frame: put it under a group placed and turned like the goalie. */
  group: THREE.Group;
  update(parts: Part[]): void;
}

const MATS: Record<PartMat, THREE.Material> = {
  body: new THREE.MeshStandardMaterial({ color: 0x1f3a5f, roughness: 0.7 }),
  jersey: new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.7 }),
  pad: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.7 }),
  glove: new THREE.MeshStandardMaterial({ color: 0xe8b04a, roughness: 0.7 }),
  blocker: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
  stick: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 }),
  blade: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 }),
};

const tv = (p: Vec) => new THREE.Vector3(p.x, p.y, p.z);
const basisQ = (x: Vec, y: Vec, z: Vec) =>
  new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tv(x), tv(y), tv(z)));
const crossV = (a: Vec, b: Vec): Vec => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

function partMesh(p: Part): THREE.Mesh {
  let mesh: THREE.Mesh;
  if (p.kind === 'capsule') {
    const a = tv(p.a), b = tv(p.b), L = a.distanceTo(b);
    mesh = new THREE.Mesh(L < 1e-6 ? new THREE.SphereGeometry(p.r, 14, 10) : new THREE.CapsuleGeometry(p.r, L, 4, 12), MATS[p.mat]);
    if (L >= 1e-6) mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    mesh.position.copy(a.add(b).multiplyScalar(0.5));
  } else if (p.kind === 'box') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.l, p.d), MATS[p.mat]);
    mesh.quaternion.copy(basisQ(crossV(p.u, p.n), p.u, p.n));
    mesh.position.copy(tv(p.center));
  } else {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), MATS[p.mat]);
    mesh.quaternion.copy(basisQ(p.ax, crossV(p.ay, p.ax), p.ay));
    mesh.scale.set(p.rx, p.t, p.ry);
    mesh.position.copy(tv(p.center));
  }
  mesh.name = p.id;
  return mesh;
}

// A part's mesh is rebuilt only when the part itself changed (to 0.01 mm), so moving one hand leaves the rest alone.
const sig = (p: Part) => JSON.stringify(p, (k, v) => k === 'mat' ? undefined : typeof v === 'number' ? Math.round(v * 1e5) : v);

export function createGoalieMesh(): GoalieMesh {
  const group = new THREE.Group();
  group.name = 'goalie';
  const built = new Map<string, { sig: string; mesh: THREE.Mesh }>();
  return {
    group,
    update(parts) {
      const seen = new Set<string>();
      for (const p of parts) {
        seen.add(p.id);
        const s = sig(p), old = built.get(p.id);
        if (old?.sig === s) continue;
        if (old) { group.remove(old.mesh); old.mesh.geometry.dispose(); }
        const mesh = partMesh(p);
        group.add(mesh);
        built.set(p.id, { sig: s, mesh });
      }
      for (const [id, { mesh }] of built) if (!seen.has(id)) { group.remove(mesh); mesh.geometry.dispose(); built.delete(id); }
    },
  };
}
