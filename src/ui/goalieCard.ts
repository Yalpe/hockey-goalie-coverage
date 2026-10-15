import { IN } from '../dims';
import {
  DEPTH_MAX_IN, DEPTH_MIN_IN, DEPTH_SPOTS, depthText, heightText, HEIGHT_MAX_IN, HEIGHT_MIN_IN,
  type DepthSpot, type GoalieSetup,
} from '../goalie';
import { STANCE_KEYS, STANCES, type CatchSide, type StanceKey } from '../posing/posing';
import { wheelNotches } from './wheel';

export interface GoalieCardActions {
  stance(k: StanceKey): void;
  catchSide(c: CatchSide): void;
  heightIn(inches: number): void;
  depthSpot(k: DepthSpot): void;
  post(): void;
  depthIn(inches: number): void;
  follow(on: boolean): void;
}

/** The goalie's controls in the bottom-left card: Stance, Catch Side, Height and Depth. */
export function goalieCard(el: HTMLElement, act: GoalieCardActions) {
  el.innerHTML = `
    <b class="title">Goalie</b>
    <div class="hint">Drag the body to move it: it snaps to the top of the crease, and in RVH to its post.
      Drag the dark knob on the ring round its feet to turn it.</div>
    <div class="row"><label>Stance</label><span class="btns">
      ${STANCE_KEYS.map(k => `<button type="button" data-stance="${k}">${STANCES[k].label}</button>`).join('')}
    </span></div>
    <div class="row"><label>Catches</label><span class="btns">
      <button type="button" data-catch="left">Left</button><button type="button" data-catch="right">Right</button>
    </span></div>
    <div class="row"><label for="heightIn">Height</label>
      <button type="button" class="step" data-height="-1" title="1 inch shorter">−</button>
      <input id="heightIn" type="range" min="${HEIGHT_MIN_IN}" max="${HEIGHT_MAX_IN}" step="1">
      <button type="button" class="step" data-height="1" title="1 inch taller">+</button>
      <span class="val" data-height-val></span>
    </div>
    <div class="row"><label>Depth</label><span class="btns">
      <button type="button" data-spot="top">Top</button><button type="button" data-spot="mid">Mid</button>
      <button type="button" data-spot="deep">Deep</button><button type="button" data-post>Post</button>
    </span></div>
    <div class="row"><label></label>
      <button type="button" class="step" data-depth="-1" title="1 inch deeper">−</button>
      <input id="depthIn" type="range" min="${DEPTH_MIN_IN}" max="${DEPTH_MAX_IN}" step="1" aria-label="Depth">
      <button type="button" class="step" data-depth="1" title="1 inch further out">+</button>
      <span class="val" data-depth-val></span>
    </div>
    <div class="hint">Depth is how far the toes are out from the middle of the goal line.
      − / + and the mouse wheel (over a slider, or anywhere while the goalie is selected) move 1 inch.</div>
    <div class="row"><label></label>
      <label class="check"><input type="checkbox" data-follow> Follow the Puck (square to it and on its angle)</label>
    </div>`;
  const height = el.querySelector<HTMLInputElement>('#heightIn')!, depth = el.querySelector<HTMLInputElement>('#depthIn')!;
  const follow = el.querySelector<HTMLInputElement>('[data-follow]')!;
  follow.addEventListener('change', () => act.follow(follow.checked));
  let current: { g: GoalieSetup; depthM: number } | null = null;
  const heightNow = () => Math.round(current!.g.heightM / IN), depthNowIn = () => Math.round(current!.depthM / IN);

  el.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b || !current) return;
    const d = b.dataset;
    if (d.stance) act.stance(d.stance as StanceKey);
    else if (d.catch) act.catchSide(d.catch as CatchSide);
    else if (d.height) act.heightIn(heightNow() + Number(d.height));
    else if (d.spot) act.depthSpot(d.spot as DepthSpot);
    else if ('post' in d) act.post();
    else if (d.depth && current.g.lock !== 'post') act.depthIn(depthNowIn() + Number(d.depth));
  });
  height.addEventListener('input', () => act.heightIn(Number(height.value)));
  depth.addEventListener('input', () => act.depthIn(Number(depth.value)));
  // The wheel over a slider steps it 1 inch; wheel up = more. One listener on the document, as in the prototype.
  document.addEventListener('wheel', e => {
    const input = (e.target as HTMLElement).closest('input');
    if (input !== height && input !== depth) return;
    e.preventDefault();
    const n = wheelNotches(e);
    if (!n || !current || input.disabled) return;
    if (input === height) act.heightIn(heightNow() - n);
    else act.depthIn(depthNowIn() - n);
  }, { passive: false });

  return {
    render(g: GoalieSetup, depthM: number) {
      current = { g, depthM };
      const post = STANCES[g.stance].post;
      el.querySelectorAll<HTMLElement>('[data-stance]').forEach(b => b.classList.toggle('on', b.dataset.stance === g.stance));
      el.querySelectorAll<HTMLElement>('[data-catch]').forEach(b => b.classList.toggle('on', b.dataset.catch === g.catchSide));
      el.querySelectorAll<HTMLElement>('[data-spot]').forEach(b =>
        b.classList.toggle('on', g.lock === 'arc' && Math.abs(g.arcR - DEPTH_SPOTS[b.dataset.spot as DepthSpot]) < 1e-6));
      const postBtn = el.querySelector<HTMLButtonElement>('[data-post]')!;
      postBtn.classList.toggle('on', g.lock === 'post');
      postBtn.disabled = !post;
      postBtn.title = post ? 'Back to its post' : 'RVH only';
      if (document.activeElement !== height) height.value = String(heightNow());
      el.querySelector('[data-height-val]')!.textContent = heightText(g.heightM);
      depth.disabled = g.lock === 'post';
      el.querySelectorAll<HTMLButtonElement>('[data-depth]').forEach(b => b.disabled = g.lock === 'post');
      if (document.activeElement !== depth) depth.value = String(depthNowIn());
      el.querySelector('[data-depth-val]')!.textContent = g.lock === 'post' ? 'at the post' : depthText(depthM);
      follow.checked = g.follow && g.lock !== 'post';
      follow.disabled = g.lock === 'post';
    },
  };
}
