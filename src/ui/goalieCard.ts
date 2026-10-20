import { IN } from '../dims';
import {
  DEPTH_MAX_IN, DEPTH_MIN_IN, DEPTH_SPOTS, depthText, heightText, HEIGHT_MAX_IN, HEIGHT_MIN_IN,
  type DepthSpot, type Follow, type GoalieSetup,
} from '../goalie';
import { feetWidthRangeIn, STANCE_KEYS, STANCES, type CatchSide, type StanceKey } from '../posing/posing';
import { wheelNotches } from './wheel';

export interface GoalieCardActions {
  stance(k: StanceKey): void;
  catchSide(c: CatchSide): void;
  heightIn(inches: number): void;
  depthSpot(k: DepthSpot): void;
  post(): void;
  depthIn(inches: number): void;
  follow(f: Follow): void;
  flarePct(pct: number): void;
  feetWidthIn(inches: number): void;
}

/** The goalie's controls in the bottom-left card: Stance, Catch Side, Height, Flare or Feet width, and Depth. */
export function goalieCard(el: HTMLElement, act: GoalieCardActions) {
  el.innerHTML = `
    <b class="title">Goalie</b>
    <div class="hint">Drag the body to move it: it snaps to the top of the crease, and in RVH or Overlap to its post.
      Drag the dark knob on the ring round its feet to turn it.</div>
    <div class="row"><label>Stance</label><span class="btns">
      ${STANCE_KEYS.map(k => `<button type="button" data-stance="${k}">${STANCES[k].label}</button>`).join('')}
    </span></div>
    <div class="row"><label>Catches</label><span class="btns">
      <button type="button" data-catch="left">Left</button><button type="button" data-catch="right">Right</button>
    </span></div>
    <div class="row"><label for="heightIn">Height<small title="Skates add about 4 in on the ice">barefoot</small></label>
      <button type="button" class="step" data-height="-1" title="1 inch shorter">−</button>
      <input id="heightIn" type="range" min="${HEIGHT_MIN_IN}" max="${HEIGHT_MAX_IN}" step="1">
      <button type="button" class="step" data-height="1" title="1 inch taller">+</button>
      <span class="val" data-height-val></span>
    </div>
    <div class="row" data-flare-row><label for="flarePct">Flare<small>butt drop</small></label>
      <button type="button" class="step" data-flare="-5" title="Less flare">−</button>
      <input id="flarePct" type="range" min="0" max="100" step="5">
      <button type="button" class="step" data-flare="5" title="More flare">+</button>
      <span class="val" data-flare-val></span>
    </div>
    <div class="row" data-feet-row><label for="feetIn">Feet width<small>ankle to ankle</small></label>
      <button type="button" class="step" data-feet="-1" title="1 inch narrower">−</button>
      <input id="feetIn" type="range" step="1">
      <button type="button" class="step" data-feet="1" title="1 inch wider">+</button>
      <span class="val" data-feet-val></span>
    </div>
    <div class="row"><label>Depth</label><span class="btns">
      <button type="button" data-spot="out">Out</button><button type="button" data-spot="top">Top</button><button type="button" data-spot="mid">Mid</button>
      <button type="button" data-spot="deep">Deep</button><button type="button" data-post>Post</button>
    </span></div>
    <div class="row"><label></label>
      <button type="button" class="step" data-depth="-1" title="1 inch deeper">−</button>
      <input id="depthIn" type="range" min="${DEPTH_MIN_IN}" max="${DEPTH_MAX_IN}" step="1" aria-label="Depth">
      <button type="button" class="step" data-depth="1" title="1 inch further out">+</button>
      <span class="val" data-depth-val></span>
    </div>
    <div class="hint">Depth is how far the toes are out from the middle of the goal line.
      − / + <span class="mouse">and the mouse wheel (over a slider, or anywhere while the goalie is selected) </span>move 1 inch.</div>
    <div class="row"><label>Follow</label><span class="btns">
      <button type="button" data-follow="off">Off</button><button type="button" data-follow="puck">Puck</button>
      <button type="button" data-follow="shooter">Shooter</button>
    </span></div>
    <div class="hint">Follow keeps the goalie square and on the angle as the Puck moves: to the Puck, or to the
      shooter's eyes.</div>`;
  const height = el.querySelector<HTMLInputElement>('#heightIn')!, depth = el.querySelector<HTMLInputElement>('#depthIn')!;
  const flare = el.querySelector<HTMLInputElement>('#flarePct')!, feet = el.querySelector<HTMLInputElement>('#feetIn')!;
  flare.addEventListener('input', () => act.flarePct(Number(flare.value)));
  feet.addEventListener('input', () => act.feetWidthIn(Number(feet.value)));
  let current: { g: GoalieSetup; depthM: number; feetM: number } | null = null;
  const heightNow = () => Math.round(current!.g.heightM / IN), depthNowIn = () => Math.round(current!.depthM / IN);
  const flarePctNow = () => Math.round((current!.g.flare ?? 0) * 100);
  const feetNowIn = () => current!.g.feetWidthIn ?? Math.round(current!.feetM / IN);

  el.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b || !current) return;
    const d = b.dataset;
    if (d.follow) act.follow(d.follow as Follow);
    else if (d.stance) act.stance(d.stance as StanceKey);
    else if (d.catch) act.catchSide(d.catch as CatchSide);
    else if (d.height) act.heightIn(heightNow() + Number(d.height));
    else if (d.flare) act.flarePct(flarePctNow() + Number(d.flare));
    else if (d.feet) act.feetWidthIn(feetNowIn() + Number(d.feet));
    else if (d.spot) act.depthSpot(d.spot as DepthSpot);
    else if ('post' in d) act.post();
    else if (d.depth && current.g.lock !== 'post') act.depthIn(depthNowIn() + Number(d.depth));
  });
  height.addEventListener('input', () => act.heightIn(Number(height.value)));
  depth.addEventListener('input', () => act.depthIn(Number(depth.value)));
  // The wheel over a slider steps it 1 inch; wheel up = more. One listener on the document, as in the prototype.
  document.addEventListener('wheel', e => {
    const input = (e.target as HTMLElement).closest('input');
    if (input !== height && input !== depth && input !== flare && input !== feet) return;
    e.preventDefault();
    const n = wheelNotches(e);
    if (!n || !current || input.disabled) return;
    if (input === height) act.heightIn(heightNow() - n);
    else if (input === flare) act.flarePct(flarePctNow() - 5 * n);
    else if (input === feet) act.feetWidthIn(feetNowIn() - n);
    else act.depthIn(depthNowIn() - n);
  }, { passive: false });

  return {
    /** feetM: how far apart the ankles are now, for the usual stance's Feet width. */
    render(g: GoalieSetup, depthM: number, feetM: number) {
      current = { g, depthM, feetM };
      const post = STANCES[g.stance].post;
      el.querySelectorAll<HTMLElement>('[data-stance]').forEach(b => b.classList.toggle('on', b.dataset.stance === g.stance));
      el.querySelectorAll<HTMLElement>('[data-catch]').forEach(b => b.classList.toggle('on', b.dataset.catch === g.catchSide));
      el.querySelectorAll<HTMLElement>('[data-spot]').forEach(b =>
        b.classList.toggle('on', g.lock === 'arc' && Math.abs(g.arcR - DEPTH_SPOTS[b.dataset.spot as DepthSpot]) < 1e-6));
      const postBtn = el.querySelector<HTMLButtonElement>('[data-post]')!;
      postBtn.classList.toggle('on', g.lock === 'post');
      postBtn.disabled = !post;
      postBtn.title = post ? 'Back to its post' : 'RVH and Overlap only';
      if (document.activeElement !== height) height.value = String(heightNow());
      el.querySelector('[data-height-val]')!.textContent = heightText(g.heightM);
      depth.disabled = g.lock === 'post';
      el.querySelectorAll<HTMLButtonElement>('[data-depth]').forEach(b => b.disabled = g.lock === 'post');
      if (document.activeElement !== depth) depth.value = String(depthNowIn());
      el.querySelector('[data-depth-val]')!.textContent = g.lock === 'post' ? 'at the post' : depthText(depthM);
      el.querySelector<HTMLElement>('[data-flare-row]')!.hidden = g.stance !== 'butterfly';
      if (document.activeElement !== flare) flare.value = String(flarePctNow());
      el.querySelector('[data-flare-val]')!.textContent = `${flarePctNow()}%`;
      el.querySelector<HTMLElement>('[data-feet-row]')!.hidden = g.stance !== 'standup';
      [feet.min, feet.max] = feetWidthRangeIn(g.heightM).map(String);
      if (document.activeElement !== feet) feet.value = String(feetNowIn());
      // What the pose holds, which can be half an inch off what was asked once the pads push the knees apart.
      el.querySelector('[data-feet-val]')!.textContent = `${Math.round(feetM / IN)}″ (${feetM.toFixed(2)} m)`;
      el.querySelectorAll<HTMLButtonElement>('[data-follow]').forEach(b => {
        b.classList.toggle('on', g.lock !== 'post' && b.dataset.follow === g.follow);
        b.disabled = g.lock === 'post';
      });
    },
  };
}
