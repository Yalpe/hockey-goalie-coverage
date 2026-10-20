import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { stickFrame, stickShape, type StickShape } from '../coverage/stickShape';
import { STICK_LIE_DEG, type Pose } from '../posing/posing';

/**
 * The goalie stick, drawn from the same shape the coverage covers with (stickShape.ts): its outline extruded with
 * rounded edges, then given its thickness and the blade's curve, in black carbon with a checked weave. One rigid
 * mesh: a pose only moves it; a new height (new gear) rebuilds it.
 */
export interface StickMesh { mesh: THREE.Mesh; update(pose: Pose): void }

const EDGE = 0.004;      // the round on its edges, across the face
const EDGE_T = 0.2;      // and front to back, as a share of the unit extrusion
const WEAVE = 0.04;      // the weave repeats every 4 cm: two checks

function stickGeometry(shape: StickShape): THREE.BufferGeometry {
  const lie = STICK_LIE_DEG * Math.PI / 180, S = Math.sin(lie), Co = Math.cos(lie);
  const flat = new THREE.ExtrudeGeometry(new THREE.Shape(shape.outline.map(([x, y]) => new THREE.Vector2(x, y))), {
    depth: 1, bevelEnabled: true, bevelThickness: EDGE_T, bevelSize: EDGE, bevelOffset: -EDGE, bevelSegments: 3, curveSegments: 1,
  });
  // Weld it (so it shades smooth over the rounded edges), then take each point from the unit extrusion to the stick's
  // thickness there, on the blade's curve. The weave runs along the shaft, as on the real thing.
  flat.deleteAttribute('uv');
  flat.deleteAttribute('normal');
  const g = mergeVertices(flat);
  flat.dispose();
  const pos = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), u = (pos.getZ(i) - 0.5) / (1 + 2 * EDGE_T);
    pos.setZ(i, shape.bend(x) + u * shape.thick([x, y]));
    uv[2 * i] = (x * S + y * Co) / WEAVE;
    uv[2 * i + 1] = (y * S - x * Co) / WEAVE;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** One repeat of the weave: two by two checks, the tows across in one, along in the next. Colour and roughness. */
function weaveTextures(): { map: THREE.Texture; rough: THREE.Texture } {
  const n = 256, h = n / 2;
  const make = (paint: (c: CanvasRenderingContext2D, lit: boolean, x: number, y: number) => void) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = n;
    const c = cv.getContext('2d')!;
    for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) paint(c, (i + j) % 2 === 1, i * h, j * h);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  const tows = (c: CanvasRenderingContext2D, lit: boolean, x: number, y: number, a: string, b: string) => {
    for (let k = 0; k < h; k += 4) {
      c.fillStyle = (k / 4) % 2 ? a : b;
      if (lit) c.fillRect(x + k, y, 4, h); else c.fillRect(x, y + k, h, 4);
    }
  };
  const map = make((c, lit, x, y) => tows(c, lit, x, y, lit ? '#2a2a2c' : '#141415', lit ? '#252527' : '#18181a'));
  map.colorSpace = THREE.SRGBColorSpace;
  const rough = make((c, lit, x, y) => tows(c, lit, x, y, lit ? '#5a5a5a' : '#9a9a9a', lit ? '#666666' : '#8c8c8c'));
  return { map, rough };
}

let textures: ReturnType<typeof weaveTextures> | null = null;

export function createStickMesh(): StickMesh {
  textures ??= weaveTextures();
  const mat = new THREE.MeshPhysicalMaterial({
    map: textures.map, roughnessMap: textures.rough, roughness: 1, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3,
  });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.name = 'stick';
  mesh.matrixAutoUpdate = false;
  let builtFor = '';
  const m = new THREE.Matrix4(), v = (p: { x: number; y: number; z: number }) => new THREE.Vector3(p.x, p.y, p.z);
  return {
    mesh,
    update(pose) {
      const d = pose.dims, key = [d.paddle.l, d.paddle.w, d.blade.l, d.blade.h, d.stickLen].join();
      if (key !== builtFor) {
        mesh.geometry.dispose();
        mesh.geometry = stickGeometry(stickShape(d));
        builtFor = key;
      }
      // The frame is left-handed for one catch side: the matrix mirrors the stick, and three.js flips its faces.
      const f = stickFrame(pose.stick);
      mesh.matrix.copy(m.makeBasis(v(f.x), v(f.y), v(f.z)).setPosition(v(f.o)));
      mesh.matrixWorldNeedsUpdate = true;
    },
  };
}
