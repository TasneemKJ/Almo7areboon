/**
 * The player's language: English or Arabic, one per screen.
 *
 * Every player-facing string is written as an inline pair, `tr('Battle time', 'وقت المعركة')`, at the place it
 * is shown, so a screen carries its own translation and can never mix languages. The language is chosen once at
 * boot (`app/language-boot.ts`, imported first by `main.ts`) and changed only by saving a new choice and reloading,
 * so call `tr()` while rendering, never at module top level (a top-level constant would freeze the boot language).
 */
export type Lang = 'en' | 'ar';

/** Its own key, outside the save, so a language choice survives Start over and an imported save. Under the app's storage prefix. */
export const LANGUAGE_KEY = 'almo7areboon.lang.v1';

let current: Lang = 'en';

export function lang(): Lang { return current; }
export function isArabic(): boolean { return current === 'ar'; }
export function setLang(next: Lang): void { current = next === 'ar' ? 'ar' : 'en'; }

/** The English or the Arabic of one string, by the current language. */
export function tr(en: string, ar: string): string { return current === 'ar' ? ar : en; }

/** `dir` for the current language. */
export function dir(): 'ltr' | 'rtl' { return current === 'ar' ? 'rtl' : 'ltr'; }

/**
 * The language to start in: a saved choice wins; otherwise the device's first preferred language (Arabic for any
 * `ar`, `ar-JO`, …); otherwise English.
 */
export function pickLanguage(stored: string | null | undefined, preferred: readonly string[] | undefined): Lang {
  if (stored === 'ar' || stored === 'en') return stored;
  const first = preferred?.find(tag => typeof tag === 'string' && tag.length > 0);
  return first && /^ar(?:-|$)/i.test(first) ? 'ar' : 'en';
}

/** Arabic plural forms for a count (zero, one, two, few 3-10, many 11-99, other); English picks one/other. */
export function plural(count: number, en: [one: string, other: string], ar: [one: string, two: string, few: string, many: string]): string {
  if (current !== 'ar') return count === 1 ? en[0] : en[1];
  const n = Math.abs(Math.floor(count)) % 100;
  if (count === 1) return ar[0];
  if (count === 2) return ar[1];
  if (n >= 3 && n <= 10) return ar[2];
  return ar[3];
}
