// Chooses the language before any screen module runs: main.ts imports this file first, so the
// document's lang/dir are right for the first paint and every tr() call already knows the language.
// It is the one shell module besides runtime.ts and dom-port.ts that reads browser globals, because
// it must run before the runtime exists (see tests/architecture.test.ts).
import { LANGUAGE_KEY, dir, lang, pickLanguage, setLang } from '../game/locale.ts';

let stored: string | null = null;
try { stored = window.localStorage.getItem(LANGUAGE_KEY); } catch { /* Storage can be unavailable; the device language decides. */ }
setLang(pickLanguage(stored, typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []));
document.documentElement.lang = lang();
document.documentElement.dir = dir();
