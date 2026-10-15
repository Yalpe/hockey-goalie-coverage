import { IN } from '../dims';
import { heightText, HEIGHT_MAX_IN, HEIGHT_MIN_IN, type GoalieSetup } from '../goalie';
import { STANCE_KEYS, STANCES, type CatchSide, type StanceKey } from '../posing/posing';

export interface GoalieCardActions {
  stance(k: StanceKey): void;
  catchSide(c: CatchSide): void;
  heightIn(inches: number): void;
}

/** The goalie card, bottom-left: Stance, Catch Side and Height. */
export function goalieCard(el: HTMLElement, act: GoalieCardActions) {
  el.innerHTML = `
    <b class="title">Goalie</b>
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
      <span class="val" id="heightVal"></span>
    </div>`;
  const slider = el.querySelector<HTMLInputElement>('#heightIn')!;
  let current: GoalieSetup | null = null;

  el.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b || !current) return;
    if (b.dataset.stance) act.stance(b.dataset.stance as StanceKey);
    else if (b.dataset.catch) act.catchSide(b.dataset.catch as CatchSide);
    else if (b.dataset.height) act.heightIn(Math.round(current.heightM / IN) + Number(b.dataset.height));
  });
  slider.addEventListener('input', () => act.heightIn(Number(slider.value)));

  return {
    render(g: GoalieSetup) {
      current = g;
      el.querySelectorAll<HTMLElement>('[data-stance]').forEach(b => b.classList.toggle('on', b.dataset.stance === g.stance));
      el.querySelectorAll<HTMLElement>('[data-catch]').forEach(b => b.classList.toggle('on', b.dataset.catch === g.catchSide));
      const inch = Math.round(g.heightM / IN);
      if (slider.value !== String(inch)) slider.value = String(inch);
      el.querySelector('#heightVal')!.textContent = heightText(g.heightM);
    },
  };
}
