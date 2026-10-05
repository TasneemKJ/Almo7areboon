/** Presentation only: the result's earnings count up once. The authoritative number is already in the DOM text and aria-label. */
export const COUNT_UP_MS = 800;

/** Ease-out value shown `elapsed` ms into the count; always an integer between 0 and `final`. */
export function countUpValue(final: number, elapsed: number, duration = COUNT_UP_MS): number {
  if (!(final > 0)) return 0;
  if (!(elapsed > 0)) return 0;
  if (elapsed >= duration) return Math.floor(final);
  const t = elapsed / duration;
  return Math.min(Math.floor(final), Math.floor(final * (1 - (1 - t) * (1 - t) * (1 - t))));
}

/** Counts every `[data-count-to]` inside `root` up from 0. Static when reduced motion is on. A new call finishes the previous count first. */
let cancelCurrent: () => void = () => {};
export function startCountUp(root: ParentNode, format: (value: number) => string, reduced: boolean): void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-count-to]'));
  cancelCurrent();
  cancelCurrent = () => {};
  if (reduced || !targets.length) return;
  const finals = targets.map(el => Number(el.dataset.countTo));
  let frame = 0, start = 0, done = false;
  const step = (now: number) => {
    if (done) return;
    start ||= now;
    const elapsed = now - start;
    targets.forEach((el, i) => { if (el.isConnected) el.textContent = format(countUpValue(finals[i], elapsed)); });
    if (elapsed < COUNT_UP_MS) frame = requestAnimationFrame(step);
    else targets.forEach((el, i) => { if (el.isConnected) el.textContent = format(finals[i]); });
  };
  targets.forEach(el => { el.textContent = format(0); });
  frame = requestAnimationFrame(step);
  cancelCurrent = () => { done = true; cancelAnimationFrame(frame); targets.forEach((el, i) => { if (el.isConnected) el.textContent = format(finals[i]); }); };
}
