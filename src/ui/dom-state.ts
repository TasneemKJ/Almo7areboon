/** Preserve live DOM nodes and focus; do not rewrite unchanged frame data. */
export function textIfChanged(target: { textContent: string | null }, value: string): void {
  if (target.textContent !== value) target.textContent = value;
}
const markup = new WeakMap<object,string>();
export function htmlIfChanged(target: { innerHTML: string }, value: string): void {
  if (markup.get(target) !== value) { target.innerHTML = value; markup.set(target, value); }
}
