import { CREASE_RADIUS, FT } from '../dims';
import { POST_X } from '../scene/net';
import type { PuckSpot } from '../scene/puck';
import { BOARDS, DOTS, HASHES, RINK, rinkHalfW } from '../scene/rink';

type XZ = { x: number; z: number };

export interface MapState {
  puck: PuckSpot;
  goalie: XZ & { facingDeg: number };
  noShot: boolean;
}

export interface MapActions {
  /** Something on the map was grabbed: the Puck, the goalie, or the goalie's turn knob. */
  grab(k: 'puck' | 'goalie' | 'turn'): void;
  puck(x: number, z: number): void;
  /** Move the goalie's root to p. */
  goalie(p: XZ): void;
  /** Turn the goalie to face p; pivot is where it stood when the turn began. */
  turn(p: XZ, pivot: XZ): void;
}

/**
 * The whole zone from above, in a corner of the screen. It's how the coach moves the Puck in Puck's view, where the
 * camera sits just behind it, and the goalie can be dragged and turned on it too. SVG user units are metres:
 * x across, y = the world's z (out from the net, downward).
 */
export function cornerMap(svg: SVGSVGElement, act: MapActions) {
  let drag: { k: 'puck' } | { k: 'goalie'; off: XZ } | { k: 'turn'; pivot: XZ } | null = null, last: MapState | null = null;
  const pt = (e: PointerEvent): XZ => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: q.x, z: q.y };
  };
  svg.addEventListener('pointerdown', e => {
    const k = (e.target as Element).closest<SVGElement>('[data-drag]')?.dataset.drag;
    if (!k || !last) return;
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    act.grab(k as 'puck' | 'goalie' | 'turn');
    const p = pt(e), g = last.goalie;
    drag = k === 'puck' ? { k } : k === 'goalie' ? { k, off: { x: g.x - p.x, z: g.z - p.z } } : { k: 'turn', pivot: { x: g.x, z: g.z } };
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = pt(e);
    if (drag.k === 'puck') act.puck(p.x, p.z);
    else if (drag.k === 'goalie') act.goalie({ x: p.x + drag.off.x, z: p.z + drag.off.z });
    else act.turn(p, drag.pivot);
  });
  const drop = () => { drag = null; };
  svg.addEventListener('pointerup', drop);
  svg.addEventListener('pointercancel', drop);

  function render(s: MapState = last!) {
    last = s;
    if (!s || svg.clientWidth === 0) return;
    // The whole zone, boards to just past the blue line. The Puck and goalie keep a grabbable size on screen.
    const w = svg.clientWidth, h = svg.clientHeight;
    const x0 = -RINK.halfW - 0.4, x1 = RINK.halfW + 0.4, z0 = RINK.endZ - 0.4, z1 = RINK.blueZ + 2.5;
    const k = Math.max((x1 - x0) / w, (z1 - z0) / h), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    svg.setAttribute('viewBox', [cx - k * w / 2, cz - k * h / 2, k * w, k * h].map(v => v.toFixed(3)).join(' '));
    const { puck, goalie: g } = s, CR = CREASE_RADIUS, nss = 'vector-effect="non-scaling-stroke"', px = (n: number) => (n * k).toFixed(3);
    const gr = Math.max(0.45, 9 * k), knob = Math.max(0.9, 20 * k);
    svg.innerHTML = `
      <path d="M${BOARDS.map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`).join('L')}" fill="#f4f8fb" stroke="#334155" stroke-width="2" ${nss}/>
      <rect x="${-RINK.halfW}" y="${RINK.blueZ}" width="${2 * RINK.halfW}" height="${RINK.blueW}" fill="#1d4ed8"/>
      <path d="M${-CR},0 A${CR},${CR} 0 0 0 ${CR},0 Z" fill="#9fc6ea" stroke="#c8102e" stroke-width="1" ${nss}/>
      <line x1="${-rinkHalfW(0)}" y1="0" x2="${rinkHalfW(0)}" y2="0" stroke="#c8102e" stroke-width="1.5" ${nss}/>
      ${DOTS.map(([x, z]) => `<circle cx="${x}" cy="${z}" r="${RINK.circleR}" fill="none" stroke="#c8102e" stroke-width="1" ${nss}/><circle cx="${x}" cy="${z}" r="${FT}" fill="#c8102e"/>`).join('')}
      ${HASHES.map(([[a, b], [c, d]]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#c8102e" stroke-width="1" ${nss}/>`).join('')}
      ${[RINK.dotX, -RINK.dotX].map(x => `<circle cx="${x}" cy="${RINK.nzDotZ}" r="${FT}" fill="#c8102e"/>`).join('')}
      <path d="M${-POST_X},0 L-1.1176,-0.66 L0,-1.1176 L1.1176,-0.66 L${POST_X},0" fill="#e2e8f0" stroke="#c8102e" stroke-width="2" ${nss}/>
      ${s.noShot ? '' : `<path d="M${puck.x},${puck.z} L${-POST_X},0 L${POST_X},0 Z" fill="#22c55e" fill-opacity=".2" stroke="#15803d" stroke-opacity=".6" stroke-width="1" ${nss}/>`}
      <g transform="translate(${g.x} ${g.z}) rotate(${-g.facingDeg})">
        <line x1="0" y1="0" x2="0" y2="${knob}" stroke="#1f3a5f" stroke-width="2" ${nss}/>
        <ellipse rx="${gr}" ry="${gr / 2}" fill="#1f3a5f" data-drag="goalie" style="cursor:move"/>
        <circle cy="${knob}" r="${px(5)}" fill="#fff" stroke="#1f3a5f" stroke-width="2" ${nss} data-drag="turn" style="cursor:grab"/>
      </g>
      <g data-drag="puck" style="cursor:move">
        <circle cx="${puck.x}" cy="${puck.z}" r="${px(10)}" fill="#f97316" fill-opacity=".3" stroke="#f97316" stroke-width="2" ${nss}/>
        <circle cx="${puck.x}" cy="${puck.z}" r="${px(3.5)}" fill="#111"/>
      </g>`;
  }
  return { render };
}
