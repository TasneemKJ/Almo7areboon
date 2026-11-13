import { LANGUAGE_KEY, isArabic, type Lang } from '../game/locale.ts';

export { dir, isArabic, lang, plural, tr } from '../game/locale.ts';

/**
 * A number (or "3 / 10", "1.2K", "2×", a time) inside text: isolated left-to-right so it reads correctly inside
 * Arabic. Use in HTML text only; attributes (aria-label, title) take the plain value.
 */
export function n(value: string | number): string {
  return `<bdi dir="ltr">${value}</bdi>`;
}

/** `lang` and `dir` attributes for an element whose text is in the current language. */
export function langAttrs(): string {
  return isArabic() ? 'lang="ar" dir="rtl"' : 'lang="en" dir="ltr"';
}

/** Stores the player's language choice (read at the next boot by app/language-boot.ts); false when storage refuses. */
export function saveLanguage(next: Lang, storage?: Pick<Storage, 'setItem'>): boolean {
  try { const target = storage ?? globalThis.localStorage; if (!target) return false; target.setItem(LANGUAGE_KEY, next === 'ar' ? 'ar' : 'en'); return true; } catch { return false; }
}

/** A clock time ("2:57 PM" / "2:57 م") in the page language, Western digits as on Levantine phones. */
export function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(isArabic() ? 'ar-u-nu-latn' : 'en-US', { hour: 'numeric', minute: '2-digit' });
}
