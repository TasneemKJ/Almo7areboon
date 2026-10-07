/** Presentation-neutral number formatting shared by the view and ui layers. */
export function compactNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safe >= 1e15) return safe.toExponential(1).replace('e+', 'e');
  const tiers = [[1e12, 't'], [1e9, 'b'], [1e6, 'm'], [1e3, 'k']] as const;
  for (let index = 0; index < tiers.length; index++) {
    const [limit, suffix] = tiers[index];
    if (safe < limit) continue;
    const rounded = Number((safe / limit).toFixed(1));
    // 999,950 rounds to 1000.0k: show it as 1m instead of 1000k.
    if (rounded >= 1000) return index === 0 ? '1e15' : `1${tiers[index - 1][1]}`;
    return `${String(rounded)}${suffix}`;
  }
  const whole = Math.ceil(safe);
  return whole >= 1000 ? '1k' : whole.toString();
}
