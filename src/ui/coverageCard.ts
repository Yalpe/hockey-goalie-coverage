import type { Coverage } from '../coverage/coverage';
import type { NamedHole } from '../coverage/holes';
import { IN } from '../dims';

/** e.g. 85%, 7.3%: one decimal below 10%, where a point matters. */
export const pctText = (v: number) => `${v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)}%`;
/** "Glove side high 6%": a hole's name and its share of the net. */
export const holeText = (h: NamedHole) => `${h.name} ${pctText(h.share)}`;

/**
 * The "% covered" card, top-right: a big %, a covered/open bar, the Open Net's share and size, and the named holes,
 * biggest first.
 */
export function coverageCard(el: HTMLElement) {
  el.innerHTML = `
    <div class="big"><span data-pct>–</span><small>covered</small></div>
    <div class="bar" role="presentation"><div data-bar></div></div>
    <div class="sub" data-sub></div>
    <ol data-holes></ol>`;
  const pct = el.querySelector<HTMLElement>('[data-pct]')!, bar = el.querySelector<HTMLElement>('[data-bar]')!;
  const sub = el.querySelector<HTMLElement>('[data-sub]')!, list = el.querySelector<HTMLElement>('[data-holes]')!;
  return {
    render(cov: Coverage, holes: NamedHole[]) {
      el.classList.toggle('no-shot', cov.noShot);
      pct.textContent = cov.noShot ? '–' : pctText(cov.pctCovered);
      bar.style.width = `${cov.noShot ? 0 : cov.pctCovered}%`;
      sub.textContent = cov.noShot
        ? 'No shot from on or behind the goal line'
        : `Open Net ${pctText(cov.pctOpen)} · ${Math.round(cov.rectArea * cov.pctOpen / 100 / IN / IN)} sq in`;
      list.replaceChildren(...holes.map(h => {
        const li = document.createElement('li');
        li.textContent = holeText(h);
        return li;
      }));
      list.hidden = !holes.length;
    },
  };
}
