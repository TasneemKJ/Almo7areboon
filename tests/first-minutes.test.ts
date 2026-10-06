import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/skill-cues.css', import.meta.url), 'utf8');
const audio = readFileSync(new URL('../src/view/audio.ts', import.meta.url), 'utf8');

test('the first-battle teaching ring is limited to the first card of a first, undeployed battle', () => {
  assert.match(main, /classList\.toggle\('teach',kind===0&&p\.wins===0&&s\.phase==='running'&&!s\.paused&&s\.stats\.deployed===0&&!button\.disabled\)/);
});
test('the ring is static unless motion is full', () => {
  assert.match(css, /\.unit-card\.teach\.affordable \{ box-shadow/);
  assert.match(css, /:root\[data-motion="full"\] #app #unit-cards \.unit-card\.teach\.affordable \{ animation:teach-ring/);
  const staticRule = css.split('\n').find(l => l.startsWith('#app #unit-cards .unit-card.teach.affordable'))!;
  assert.doesNotMatch(staticRule, /animation/);
});
test('result motifs differ: victory rises, defeat falls', () => {
  const notes = (id: string) => {
    const line = audio.split('\n').find(l => l.startsWith(` ${id}:{wave:'sine'`))!;
    const freq = line.slice(line.indexOf('frequency:'), line.indexOf('envelope:'));
    return [...freq.matchAll(/,(\d+)\]/g)].map(m => Number(m[1]));
  };
  const win = notes('win'), lose = notes('lose');
  assert.ok(win.length >= 3 && lose.length >= 3);
  assert.ok(win.every((f, i) => i === 0 || f > win[i - 1]), 'victory rises');
  assert.ok(lose.every((f, i) => i === 0 || f < lose[i - 1]), 'defeat falls');
});

test('Settings shows when the game last saved, from memory only (no save-format change)', () => {
  assert.match(main, /lastSavedAt=Date\.now\(\)/);
  assert.match(main, /Last saved \$\{new Date\(lastSavedAt\)\.toLocaleTimeString/);
  assert.doesNotMatch(main, /localStorage\.setItem\([^)]*lastSavedAt/);
});
