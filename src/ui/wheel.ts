// One step per mouse-wheel notch. Many mice send a notch as two or more events in quick succession, so a step is
// taken only when the direction changes or 80 ms have passed since the last step.
let lastT = 0, lastDir = 0;

/** +1 = wheel down, -1 = wheel up, 0 = ignore this event. */
export function wheelNotches(e: WheelEvent): number {
  const now = performance.now(), dir = Math.sign(e.deltaY);
  if (!dir || (dir === lastDir && now - lastT < 80)) return 0;
  lastT = now; lastDir = dir;
  return dir;
}
