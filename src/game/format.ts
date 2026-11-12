import { isArabic } from './locale.ts';

/** Presentation-neutral number formatting shared by the view and ui layers. Arabic says the tier as a word (ألف، مليون). */
export function compactNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safe >= 1e15) return safe.toExponential(1).replace('e+', 'e');
  const tiers = [[1e12, 't', 'تريليون'], [1e9, 'b', 'مليار'], [1e6, 'm', 'مليون'], [1e3, 'k', 'ألف']] as const;
  const suffix = (index: number) => isArabic() ? ` ${tiers[index][2]}` : tiers[index][1];
  for (let index = 0; index < tiers.length; index++) {
    const [limit] = tiers[index];
    if (safe < limit) continue;
    const rounded = Number((safe / limit).toFixed(1));
    // 999,950 rounds to 1000.0k: show it as 1m instead of 1000k.
    if (rounded >= 1000) return index === 0 ? '1e15' : `1${suffix(index - 1)}`;
    return `${String(rounded)}${suffix(index)}`;
  }
  const whole = Math.ceil(safe);
  return whole >= 1000 ? `1${suffix(3)}` : whole.toString();
}
