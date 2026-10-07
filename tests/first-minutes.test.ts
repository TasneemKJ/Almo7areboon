import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = mainSource();
const css = readFileSync(new URL('../src/ui/skill-cues.css', import.meta.url), 'utf8');
const audio = readFileSync(new URL('../src/view/audio.ts', import.meta.url), 'utf8');

test('the first-battle teaching ring is limited to the first card of a first, undeployed battle', () => {
  assert.match(main, /classList\.toggle\('teach',kind===0&&!button\.disabled&&\(\(p\.wins===0&&s\.phase==='running'&&!s\.paused&&s\.stats\.deployed===0\)\|\|foodIsPiling\(p,s\)\)\)/);
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
  const field = battlefieldSource();
  assert.match(field, /e\.type==='death'&&e\.kind===2/);
  assert.match(field, /if\(!this\.reduce\)this\.cameras\.main\.shake\(70,\.0016\)/);
});

test('piling food: the hint and ring chase a first-timer who banks food after the first deployment', async () => {
  const { battleGuidance, foodIsPiling } = await import('../src/ui/battle-hud.ts');
  const { Game } = await import('../src/game/simulation.ts');
  const g = new Game(); g.state.phase = 'running'; g.state.stats.deployed = 1; g.state.food = 26; g.state.time = 30;
  const mine = () => ({ ...(g.state.units[0] ?? {}), side: 'player', hp: 10 } as any);
  const foe = () => ({ ...(g.state.units[0] ?? {}), side: 'enemy', hp: 10 } as any);
  g.state.units = [mine(), foe(), foe(), foe()];
  assert.equal(foodIsPiling(g.profile, g.state), true);
  assert.match(battleGuidance(g.profile, g.state), /^Food is piling up \(26\)\. Tap the waiting defender again/, 'outranks the Freeze cue');
  g.state.units = [mine(), mine(), mine(), foe()];
  assert.equal(foodIsPiling(g.profile, g.state), false, 'three fighters is enough');
  g.state.units = [mine()]; g.state.food = 8;
  assert.equal(foodIsPiling(g.profile, g.state), false, 'not enough food banked');
  g.state.food = 26; g.profile.wins = 3;
  assert.equal(foodIsPiling(g.profile, g.state), false, 'only for the first wins');
  g.profile.wins = 0; g.state.stats.deployed = 0;
  assert.equal(foodIsPiling(g.profile, g.state), false, 'the opening ring covers the very first deploy');
  g.state.stats.deployed = 2; g.state.paused = true;
  assert.equal(foodIsPiling(g.profile, g.state), false);
});
test('incoming first-deployment teaching also follows the physical waiting defender',()=>{
 const controller=readFileSync(new URL('../src/ui/field-controller.ts',import.meta.url),'utf8');
 assert.match(controller,/classList\.toggle\('teach',kind===0&&status\.allowed&&\(\(p\.wins===0&&running&&!s\.paused&&s\.stats\.deployed===0\)\|\|foodIsPiling\(p,s\)\)\)/);
 const fieldCSS=readFileSync(new URL('../src/ui/world-play.css',import.meta.url),'utf8');
 assert.match(fieldCSS,/\.recruit-hit\.teach\.recruit-ready::after\{border-width:2px/);
 assert.match(fieldCSS,/:root\[data-motion="full"\] \.recruit-hit\.teach\.recruit-ready::after\{animation:field-teach-ring/);
});
