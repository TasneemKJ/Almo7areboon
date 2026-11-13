import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { preferencesHtml } from '../src/ui/preferences-screen.ts';
import { defaultProfile } from '../src/game/save.ts';

test('Arabic letters stay joined: no letter-spacing anywhere on an Arabic page (eyebrows, kickers, buttons)', () => {
  const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  assert.match(main, /import '\.\/ui\/arabic-type\.css';/);
  const css = readFileSync(new URL('../src/ui/arabic-type.css', import.meta.url), 'utf8');
  assert.match(css, /:root\[lang="ar"\][^{]*\*[^{]*\{[^}]*letter-spacing:\s*0\s*!important/);
});

test('the bilingual Language label is one line, not three stacked pieces', () => {
  const html = preferencesHtml(defaultProfile(), true, { effects: 80, atmosphere: 60 }, true, '');
  assert.match(html, /<span class="preference-language-name"><span lang="en" dir="ltr">Language<\/span> · <span lang="ar" dir="rtl">اللغة<\/span><\/span>/);
});

test('a clock time is in the page language with Western digits (no AM/PM letters on an Arabic page)', async () => {
  const { clockTime } = await import('../src/ui/i18n.ts');
  const { setLang } = await import('../src/game/locale.ts');
  const at = new Date(2026, 10, 13, 14, 57).getTime();
  assert.match(clockTime(at), /^2:57\sPM$/);
  setLang('ar');
  try { const ar = clockTime(at); assert.doesNotMatch(ar, /[A-Za-z]/); assert.match(ar, /2:57/); } finally { setLang('en'); }
});

// Owner play-test: hints and labels fell back to a system Arial-like face. The game bundles one Arabic text face.
test('Arabic pages use the bundled Noto Sans Arabic for all text, shipped with the game (offline)', () => {
  const css = readFileSync(new URL('../src/ui/arabic-type.css', import.meta.url), 'utf8');
  assert.match(css, /@font-face\{font-family:"Almo Arabic";src:url\("\.\/fonts\/noto-sans-arabic\.woff2"\) format\("woff2"\)/);
  assert.match(css, /:root\[lang="ar"\] body,:root\[lang="ar"\] button,:root\[lang="ar"\] input,:root\[lang="ar"\] select,:root\[lang="ar"\] textarea\{font-family:"Almo Arabic"/);
  assert.match(css, /:root\[lang="ar"\] h1,:root\[lang="ar"\] h2,:root\[lang="ar"\] h3[^{]*\{font-family:"Almo Arabic"/);
  assert.ok(readFileSync(new URL('../src/ui/fonts/noto-sans-arabic.woff2', import.meta.url)).length > 50000);
  assert.match(readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8'), /Noto Sans Arabic[^\n]*SIL Open Font License/);
});

test('the iPhone app does not show desktop keyboard help in Settings', () => {
  const html = preferencesHtml(defaultProfile(), true, { effects: 80, atmosphere: 60 }, true, '', { inApp: true });
  assert.doesNotMatch(html, /<kbd/);
  assert.match(preferencesHtml(defaultProfile(), true, { effects: 80, atmosphere: 60 }, true, ''), /<kbd/, 'the web keeps it');
});
