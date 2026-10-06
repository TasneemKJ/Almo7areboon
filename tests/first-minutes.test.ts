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

test('death events carry the fallen unit role so a heavy can fall louder', async () => {
  const { Game } = await import('../src/game/simulation.ts');
  const { defaultProfile } = await import('../src/game/save.ts');
  const g = new Game(defaultProfile());
  g.dispatch({ type: 'start' });
  const seen = new Set<number>();
  for (let i = 0; i < 4000 && g.state.phase === 'running' && seen.size < 1; i++) {
    if (i % 10 === 0) { g.state.food = 99; g.dispatch({ type: 'spawn', kind: 0 }); }
    g.step(0.1);
    for (const e of g.drainEvents()) if (e.type === 'death' && e.kind !== undefined) seen.add(e.kind);
  }
  assert.ok(seen.size >= 1, "a death event carries a role");
  const field = readFileSync(new URL('../src/view/battlefield.ts', import.meta.url), 'utf8');
  assert.match(field, /e\.type==='death'&&e\.kind===2/);
  assert.match(field, /if\(!this\.reduce\)this\.cameras\.main\.shake\(70,\.0016\)/);
});

test('incoming first-deployment teaching also follows the physical waiting defender',()=>{
 const controller=readFileSync(new URL('../src/ui/field-controller.ts',import.meta.url),'utf8');
 assert.match(controller,/classList\.toggle\('teach',kind===0&&p\.wins===0&&running&&!s\.paused&&s\.stats\.deployed===0&&status\.allowed\)/);
 const fieldCSS=readFileSync(new URL('../src/ui/world-play.css',import.meta.url),'utf8');
 assert.match(fieldCSS,/\.recruit-hit\.teach\.recruit-ready::after\{border-width:2px/);
 assert.match(fieldCSS,/:root\[data-motion="full"\] \.recruit-hit\.teach\.recruit-ready::after\{animation:field-teach-ring/);
});
