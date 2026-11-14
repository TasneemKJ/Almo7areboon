import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createArmyUpdater } from '../src/ui/army-screen.ts';
import { defaultProfile } from '../src/game/save.ts';
import { setLang } from '../src/game/locale.ts';

// iPhone 375x812 and 390x844 (measured in WebKit-size Chromium, scratchpad badge.mjs): "Pathkeeper" ended in an
// ellipsis on its token, and the "+20% strike" / "−25% damage" plates hung over the lanes where the company waits.
const css = readFileSync(new URL('../src/ui/field-board.css', import.meta.url), 'utf8');

test('a one-word troop name of ten letters or more takes the smaller face on phones from 360px, not an ellipsis', () => {
  setLang('en');
  const target = { innerHTML: '' }, update = createArmyUpdater({ units: target, skills: { innerHTML: '' }, stages: { innerHTML: '' } }, () => '');
  update(defaultProfile());
  assert.match(target.innerHTML, /<span class="unit-name long-name">Pathkeeper<\/span>/);
  assert.match(target.innerHTML, /<span class="unit-name">Lizard Rider<\/span>/, 'two words wrap onto the second line as before');
  assert.match(css, /@media \(min-width:360px\)\{html\[lang="en"\][^}]*\.unit-name\.long-name\{font-size:10px;letter-spacing:-\.4px\}\}/);
});

test('on a portrait phone the banner plates hang below its foot, and rise above it only while a finger carries it', () => {
  assert.match(css, /@media \(orientation:portrait\)\{\.field-banner:not\(\.dragging\) \.banner-plate\{bottom:auto;top:calc\(100% \+ 4px\)\}\}/);
  assert.match(css, /\.banner-plate\{position:absolute;bottom:calc\(100% \+ 6px\)/, 'the carried banner keeps them above, clear of the finger');
});
