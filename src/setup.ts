// The Setup link: everything the coach set up, as #v1.<lz-string compressToEncodedURIComponent(JSON)>.
// See issues/goalie-coverage-mvp/07-setup-contents.md. Short keys and integer values; a value equal to its frozen v1
// default is left out. The defaults below are frozen with v1: they are the decoder's own copy, so a missing value
// always means the same thing, even if the app's defaults change later. Never edit them; add a v2 instead.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { IN } from './dims';
import type { Follow, GoalieSetup } from './goalie';
import type { CatchSide, HandKey, HandTarget, StanceKey } from './posing/posing';
import type { PuckSpot } from './scene/puck';
import type { Shoots } from './shooter';
import type { ViewKey } from './views';

export interface Setup {
  name: string;
  goalie: GoalieSetup;
  puck: PuckSpot;
  view: ViewKey;
  /** The shooter's hand, for Shooter's view. */
  shoots: Shoots;
  /** How far the Puck sits to the side of the shooter, in metres. */
  offsetM: number;
  show: { cone: boolean };
}

/** The longest Setup name. */
export const NAME_MAX = 60;

// ---------------- frozen v1 ----------------
// Codes and defaults may be added for something new (Overlap came after v1 shipped), as no older link holds them.
const STANCE_CODES: Record<StanceKey, string> = {
  standup: 'su', butterfly: 'bf', rvhL: 'rl', rvhR: 'rr', overlapL: 'ol', overlapR: 'or',
};
const VIEW_CODES: Record<ViewKey, string> = { puck: 'p', shooter: 's', top: 't', behind: 'b', orbit: 'o' };
const FOLLOW_CODES: Follow[] = ['off', 'puck', 'shooter'];   // 'fo': its index
const RVH_POST: Partial<Record<StanceKey, 1 | -1>> = { rvhL: 1, rvhR: -1 };
// gripAboveIn: the blocker hand's grip, up the shaft from the paddle's top. The fist sits right on the shoulder, the
// index finger along the paddle (a grip photo), so its middle is about an inch up. Not stored in links.
const V1 = {
  stance: 'butterfly' as StanceKey, heightIn: 69, catchSide: 'left' as CatchSide,
  depthIn: 72, facingDeg: 0, puckCm: { x: 0, z: 600 }, view: 'puck' as ViewKey, cone: true, shoots: 'left' as Shoots,
  gripAboveIn: 1, rvhTurnDeg: 30, overlapTurnDeg: 60, offsetCm: 45,
};
/** Which way each post Stance faces at its post, by default. */
const POST_FACING: Partial<Record<StanceKey, number>> = {
  rvhL: V1.rvhTurnDeg, rvhR: -V1.rvhTurnDeg, overlapL: V1.overlapTurnDeg, overlapR: -V1.overlapTurnDeg,
};
type HandFrac = Record<HandKey, HandTarget>;
const NO_ROT = { yaw: 0, pitch: 0, roll: 0 };
const V1_HANDS: Record<'standup' | 'butterfly', HandFrac> = {
  standup:   { glove: { out: 0.24, up: 0.47, fwd: 0.34, ...NO_ROT, pitch: -20 }, blocker: { out: 0.16, up: 0.38, fwd: 0.32, ...NO_ROT } },
  butterfly: { glove: { out: 0.24, up: 0.36, fwd: 0.26, ...NO_ROT, pitch: -20 }, blocker: { out: 0.16, up: 0.29, fwd: 0.25, ...NO_ROT } },
};
const V1_RVH_POST_HAND = { out: 0.14, up: 0.22, fwd: 0.10 };
const V1_RVH_FAR_GLOVE = { out: 0.12, up: 0.42, fwd: 0.16 }, V1_RVH_FAR_BLOCKER = { out: 0.10, up: 0.34, fwd: 0.14 };
function v1Hands(stance: StanceKey, catchSide: CatchSide): HandFrac {
  const post = RVH_POST[stance];
  if (!post) return structuredClone(V1_HANDS[stance === 'butterfly' ? 'butterfly' : 'standup']);
  const gloveAtPost = (catchSide === 'left' ? 1 : -1) === post;
  return {
    glove: { ...(gloveAtPost ? V1_RVH_POST_HAND : V1_RVH_FAR_GLOVE), ...NO_ROT, pitch: -20 },
    blocker: { ...(gloveAtPost ? V1_RVH_FAR_BLOCKER : V1_RVH_POST_HAND), ...NO_ROT },
  };
}
// Hand fields: positions in thousandths of height, wrist angles in whole degrees.
const HAND_KEYS: [keyof HandTarget, string, number][] = [
  ['out', 'o', 1000], ['up', 'u', 1000], ['fwd', 'w', 1000], ['yaw', 'y', 1], ['pitch', 'p', 1], ['roll', 'r', 1],
];

// ---------------- encode ----------------
/** The hash for a Setup, without the leading '#'. */
export function encodeSetup(s: Setup): string {
  const g = s.goalie, o: Record<string, unknown> = {};
  const put = (k: string, v: unknown, def: unknown) => { if (v !== def) o[k] = v; };
  put('n', s.name, '');
  put('s', STANCE_CODES[g.stance], STANCE_CODES[V1.stance]);
  put('h', Math.round(g.heightM / IN), V1.heightIn);
  put('c', g.catchSide === 'left' ? 'l' : 'r', 'l');
  if (g.lock === 'post') { o.pl = 'p'; put('f', Math.round(g.facingDeg), POST_FACING[g.stance]); }
  else {
    if (g.lock === 'free') { o.pl = 'f'; o.x = Math.round(g.pos.x * 100); o.z = Math.round(g.pos.z * 100); }
    else put('d', Math.round(g.arcR / IN), V1.depthIn);
    put('f', Math.round(g.facingDeg), V1.facingDeg);
  }
  put('fo', FOLLOW_CODES.indexOf(g.follow), 0);
  put('fl', Math.round((g.flare ?? 0) * 100), 0);   // Flare, in whole percent
  if (g.feetWidthIn) o.fw = g.feetWidthIn;           // stand-up Feet width in inches; left out for the usual stance
  const def = v1Hands(g.stance, g.catchSide);
  for (const [w, key] of [['glove', 'g'], ['blocker', 'b']] as const) {
    const diff: Record<string, number> = {};
    for (const [k, short, scale] of HAND_KEYS) {
      const v = Math.round(g[w][k] * scale);
      if (v !== Math.round(def[w][k] * scale)) diff[short] = v;
    }
    if (Object.keys(diff).length) o[key] = diff;
  }
  put('px', Math.round(s.puck.x * 100), V1.puckCm.x);
  put('pz', Math.round(s.puck.z * 100), V1.puckCm.z);
  put('v', VIEW_CODES[s.view], VIEW_CODES[V1.view]);
  put('sh', s.shoots === 'left' ? 'l' : 'r', 'l');
  put('so', Math.round(s.offsetM * 100), V1.offsetCm);
  put('tc', s.show.cone ? 1 : 0, 1);
  return 'v1.' + compressToEncodedURIComponent(JSON.stringify(o));
}

// ---------------- decode ----------------
/** Thrown for a link that can't be read: an unknown version, or a broken or tampered payload. */
export class BadLink extends Error {}

/** The default Setup: what opens with no hash. */
export function defaultSetup(): Setup {
  return decodeV1({});
}

/** Reads a hash (with or without the leading '#'). Throws BadLink if it can't. */
export function decodeSetup(hash: string): Setup {
  const h = hash.replace(/^#/, '');
  const dot = h.indexOf('.');
  if (dot < 0 || h.slice(0, dot) !== 'v1') throw new BadLink('unknown version');
  let o: unknown;
  try { o = JSON.parse(decompressFromEncodedURIComponent(h.slice(dot + 1)) ?? ''); }
  catch { throw new BadLink('not readable'); }
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new BadLink('not an object');
  return decodeV1(o as Record<string, unknown>);
}

function decodeV1(o: Record<string, unknown>): Setup {
  const int = (k: string, def: number, lo: number, hi: number) => {
    const v = o[k];
    if (v === undefined) return def;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < lo || v > hi) throw new BadLink(`bad ${k}`);
    return v;
  };
  const code = <T extends string>(k: string, codes: Record<T, string>, def: T): T => {
    const v = o[k];
    if (v === undefined) return def;
    const hit = (Object.keys(codes) as T[]).find(t => codes[t] === v);
    if (!hit) throw new BadLink(`bad ${k}`);
    return hit;
  };
  const name = o.n === undefined ? '' : o.n;
  if (typeof name !== 'string' || name.length > NAME_MAX) throw new BadLink('bad name');
  const stance = code('s', STANCE_CODES, V1.stance);
  const catchSide: CatchSide = code('c', { left: 'l', right: 'r' }, V1.catchSide);
  const heightM = int('h', V1.heightIn, 43, 79) * IN;

  const pl = o.pl === undefined ? 'a' : o.pl, postFacing = POST_FACING[stance];
  if (pl !== 'a' && pl !== 'p' && pl !== 'f') throw new BadLink('bad pl');
  const lock = pl === 'p' && postFacing !== undefined ? 'post' : pl === 'f' ? 'free' : 'arc';
  const facingDeg = int('f', lock === 'post' ? postFacing! : V1.facingDeg, -90, 90);
  const arcR = int('d', V1.depthIn, 24, 157) * IN;
  const pos = lock === 'free' ? { x: int('x', 0, -400, 400) / 100, z: int('z', 0, -30, 500) / 100 } : { x: 0, z: 0 };

  const hands = v1Hands(stance, catchSide);
  for (const [w, key] of [['glove', 'g'], ['blocker', 'b']] as const) {
    const d = o[key];
    if (d === undefined) continue;
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new BadLink(`bad ${key}`);
    for (const [k, short, scale] of HAND_KEYS) {
      const v = (d as Record<string, unknown>)[short];
      if (v === undefined) continue;
      if (typeof v !== 'number' || !Number.isInteger(v) || Math.abs(v) > 2000) throw new BadLink(`bad ${key}.${short}`);
      hands[w][k] = v / scale;
    }
  }

  return {
    name,
    goalie: {
      stance, catchSide, heightM, gripAboveIn: V1.gripAboveIn, ...hands,
      facingDeg, lock, arcR, pos, follow: FOLLOW_CODES[int('fo', 0, 0, FOLLOW_CODES.length - 1)],
      flare: int('fl', 0, 0, 100) / 100, feetWidthIn: o.fw === undefined ? undefined : int('fw', 0, 8, 60),
    },
    puck: { x: int('px', V1.puckCm.x, -2000, 2000) / 100, z: int('pz', V1.puckCm.z, -500, 3000) / 100 },
    view: code('v', VIEW_CODES, V1.view),
    shoots: code('sh', { left: 'l', right: 'r' }, V1.shoots),
    offsetM: int('so', V1.offsetCm, 10, 150) / 100,
    show: { cone: int('tc', 1, 0, 1) === 1 },   // older links may hold 'tm', the retired Puck-size margin toggle
  };
}
