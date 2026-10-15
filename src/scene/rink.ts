import * as THREE from 'three';
import { CREASE_RADIUS, FT, IN, LINE_W } from '../dims';

// The whole defending zone on a standard 200 × 85 ft sheet. The research gives the goal line 11 ft from the end boards
// and the corners a 28 ft radius; the other markings are standard and cosmetic: blue line 64 ft out from the goal line,
// end-zone dots 20 ft out and 22 ft either side with 15 ft circles and hash marks, neutral-zone dots 5 ft past the
// blue line.
export const RINK = {
  halfW: 42.5 * FT,
  endZ: -11 * FT,
  cornerR: 28 * FT,
  blueZ: 64 * FT,
  blueW: 12 * IN,
  farZ: 84 * FT,
  dotX: 22 * FT,
  dotZ: 20 * FT,
  dotR: 1 * FT,
  circleR: 15 * FT,
  hashGap: 67 * IN,
  hashLen: 2 * FT,
  nzDotZ: 69 * FT,
  boardH: 42 * IN,
};

export type XZ = [number, number];

export const DOTS: XZ[] = [[RINK.dotX, RINK.dotZ], [-RINK.dotX, RINK.dotZ]];

/** Half-width of the ice at z: narrower in the corners. */
export function rinkHalfW(z: number): number {
  const cz = RINK.endZ + RINK.cornerR;
  if (z >= cz) return RINK.halfW;
  const dz = cz - z;
  return RINK.halfW - RINK.cornerR + Math.sqrt(Math.max(0, RINK.cornerR ** 2 - dz * dz));
}

/** Inside face of the boards: down the right side, round both corners and the end, back up the left side. */
export const BOARDS: XZ[] = (() => {
  const R = RINK.cornerR, cx = RINK.halfW - R, cz = RINK.endZ + R;
  const pts: XZ[] = [[RINK.halfW, RINK.farZ]];
  for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 * i / 24; pts.push([cx + R * Math.cos(a), cz - R * Math.sin(a)]); }
  for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 * i / 24; pts.push([-cx - R * Math.sin(a), cz - R * Math.cos(a)]); }
  pts.push([-RINK.halfW, RINK.farZ]);
  return pts;
})();

/** Hash marks: two each side of each end-zone circle, running out toward the boards and the slot. */
export const HASHES: [XZ, XZ][] = DOTS.flatMap(([x, z]) => [-1, 1].flatMap(sx => [-1, 1].map(sz => {
  const hz = z + sz * RINK.hashGap / 2, x0 = x + sx * Math.sqrt(RINK.circleR ** 2 - (RINK.hashGap / 2) ** 2);
  return [[x0, hz], [x0 + sx * RINK.hashLen, hz]] as [XZ, XZ];
})));

const COLORS = { ice: 0xf4f8fb, red: 0xc8102e, blue: 0x1d4ed8, crease: 0x9fc6ea, kick: 0xf5c518, board: 0xf8fafc, cap: 0xd7262e };

// Ice paint goes on in layers. A polygon offset per layer keeps each one cleanly on top of the one under it at any
// distance, without lifting it off the ice (which flickers from far away and floats when seen up close).
const ICE = 0, CREASE_FILL = 1, LINES = 2, DOTS_ON_TOP = 3;
const paints = new Map<string, THREE.Material>();
function paint(color: number, layer: number): THREE.Material {
  const key = `${color}/${layer}`;
  let m = paints.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color, roughness: 0.7, polygonOffset: layer > 0, polygonOffsetFactor: -layer, polygonOffsetUnits: -4 * layer,
    });
    paints.set(key, m);
  }
  return m;
}

export function buildRink(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'rink';

  const flat = (geo: THREE.BufferGeometry, color: number, layer: number, x = 0, z = 0) => {
    const m = new THREE.Mesh(geo, paint(color, layer));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0, z);
    g.add(m);
    return m;
  };
  // A painted line of width w from (x0, z0) to (x1, z1).
  const strip = (x0: number, z0: number, x1: number, z1: number, w: number, color: number) => {
    const m = flat(new THREE.PlaneGeometry(Math.hypot(x1 - x0, z1 - z0), w), color, LINES, (x0 + x1) / 2, (z0 + z1) / 2);
    m.rotation.set(-Math.PI / 2, 0, Math.atan2(-(z1 - z0), x1 - x0));   // turn in the ice plane, then lay flat
  };
  // Shapes are drawn in (x, -z) because laying a shape flat maps its +y onto -z.
  const iceShape = new THREE.Shape(BOARDS.map(([x, z]) => new THREE.Vector2(x, -z)));
  flat(new THREE.ShapeGeometry(iceShape), COLORS.ice, ICE);

  strip(-rinkHalfW(0), -LINE_W / 2, rinkHalfW(0), -LINE_W / 2, LINE_W, COLORS.red);                                  // goal line
  strip(-RINK.halfW, RINK.blueZ + RINK.blueW / 2, RINK.halfW, RINK.blueZ + RINK.blueW / 2, RINK.blueW, COLORS.blue); // blue line
  for (const [x, z] of DOTS) {
    flat(new THREE.RingGeometry(RINK.circleR - LINE_W, RINK.circleR, 96), COLORS.red, LINES, x, z);
    flat(new THREE.CircleGeometry(RINK.dotR, 32), COLORS.red, DOTS_ON_TOP, x, z);
  }
  for (const [[x0, z0], [x1, z1]] of HASHES) strip(x0, z0, x1, z1, LINE_W, COLORS.red);
  for (const x of [RINK.dotX, -RINK.dotX]) flat(new THREE.CircleGeometry(RINK.dotR, 32), COLORS.red, DOTS_ON_TOP, x, RINK.nzDotZ);

  // Crease: a 6 ft semicircle, light blue inside a red line.
  flat(new THREE.CircleGeometry(CREASE_RADIUS, 48, Math.PI, Math.PI), COLORS.crease, CREASE_FILL);
  flat(new THREE.RingGeometry(CREASE_RADIUS - LINE_W, CREASE_RADIUS, 64, 1, Math.PI, Math.PI), COLORS.red, DOTS_ON_TOP);

  g.add(buildBoards());
  return g;
}

/** Boards, open at the far end, painted like real ones: yellow kickplate, white boards, red cap rail on top. */
function buildBoards(): THREE.Group {
  const g = new THREE.Group();
  const band = (y0: number, y1: number, color: number) => {
    const pos: number[] = [], idx: number[] = [];
    BOARDS.forEach(([x, z], i) => {
      pos.push(x, y0, z, x, y1, z);
      if (i) { const a = 2 * i - 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide })));
  };
  const KICK = 9 * IN, CAP = 4 * IN;
  band(0, KICK, COLORS.kick);
  band(KICK, RINK.boardH - CAP, COLORS.board);
  band(RINK.boardH - CAP, RINK.boardH, COLORS.cap);

  // The cap rail has a top too, so it reads as a rail from above: the board line offset 3 in outward.
  const top = new THREE.Shape(), out = 3 * IN;
  BOARDS.forEach(([x, z], i) => {
    const [px, pz] = BOARDS[Math.max(0, i - 1)], [nx, nz] = BOARDS[Math.min(BOARDS.length - 1, i + 1)];
    let ox = nz - pz, oz = -(nx - px);
    const l = Math.hypot(ox, oz) || 1; ox /= l; oz /= l;
    if (ox * x + oz * (z - 5) < 0) { ox = -ox; oz = -oz; }   // point away from the middle of the zone
    const X = x + ox * out, Z = z + oz * out;
    if (i) top.lineTo(X, -Z); else top.moveTo(X, -Z);
  });
  for (let i = BOARDS.length - 1; i >= 0; i--) top.lineTo(BOARDS[i][0], -BOARDS[i][1]);
  const rail = new THREE.Mesh(new THREE.ShapeGeometry(top), new THREE.MeshStandardMaterial({ color: COLORS.cap, roughness: 0.6, side: THREE.DoubleSide }));
  rail.rotation.x = -Math.PI / 2;
  rail.position.y = RINK.boardH;
  g.add(rail);
  return g;
}
