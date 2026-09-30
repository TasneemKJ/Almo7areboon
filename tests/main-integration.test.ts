import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay } from '../src/game/data.ts';
import { battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel } from '../src/ui/battle-hud.ts';
import { chapterPresentation } from '../src/ui/chapter-presentation.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';

// Execute the app's actual functions with a clock and minimal DOM boundary; no browser/debug hooks.
const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = new Set(['playable', 'guardAction', 'action', 'update', 'showResult', 'acquireSession']);
const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name && names.has(node.name.text));
assert.equal(functions.length, names.size);
const code = ts.transpile(functions.map(node => node.getText(ast)).join('\n'), { target: ts.ScriptTarget.ES2022 });
function harness(motion = 'full') {
  let now = 100, foreign = false;
  const dialogs: string[] = [];
  const node = () => ({ dataset: {}, style: {}, hidden: false, classList: { toggle() {} }, setAttribute() {}, toggleAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; } });
  const root = node(), elements = new Map<string, ReturnType<typeof node>>();
  const context: any = {
    Game, game: new Game(defaultProfile()), sessionReady: true, pagePresent: true, lifetime: { disposed: false },
    acquiring: null, acquisitionVersion: 0, hasPlayed: true, manualPaused: false, savedWarning: false, pendingImport: null,
    lastUpdate: 0, lastSave: 100, lastPhase: 'ready', resultDue: 0, resultShown: '', activeTab: 'battle', root,
    performance: { now: () => now }, document: { documentElement: { dataset: { motion } } },
    $: (id: string) => { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); },
    ERAS, QUESTS, foodRate, unlockCost, dailyReward, localDay, battleGuidance, baseHealthDisplay, compactNumber, waveLabel, waveAccessibleLabel, chapterPresentation, resultsHtml,
    storybookArt: () => false, money: String, coin: String, textIfChanged() {}, htmlIfChanged() {}, unlockAudio() {}, syncPause() {}, rebuildArmy() {}, syncMotion() {}, renderScreen() {}, toast() {},
    closeModal() {}, showModal: (id: string) => dialogs.push(id),
    session: {
      status: 'active', check: () => !foreign,
      save: () => { if (foreign) { context.session.status = 'conflict'; context.sessionReady = false; dialogs.push('session'); return { ok: false }; } return { ok: true }; },
      acquire: async () => ({ status: 'active', profile: defaultProfile(), loadStatus: 'loaded' }),
    },
  };
  context.persist = () => context.session.save(context.game.profile).ok;
  context.switchTab = () => context.update(true);
  runInNewContext(`${code}\nthis.api = { update, action, acquireSession }; this.update = update;`, context);
  return { context, dialogs, clock: (value: number) => { now = value; }, foreign: () => { foreign = true; } };
}
for (const [motion, delay] of [['full', 1300], ['reduced', 350]] as const) test(`${motion} result delay yields to save recovery before opening`, () => {
  const h = harness(motion), c = h.context;
  c.game.dispatch({ type: 'start' }); c.api.update(true);
  c.game.state.enemyHp = 0; c.game.step(1 / 60); c.api.update(true);
  h.clock(100 + delay - 1); c.api.update(true); assert.deepEqual(h.dialogs, []);
  h.foreign(); h.clock(100 + delay); c.api.update(true);
  assert.deepEqual(h.dialogs, ['session'], 'persist detects conflict and recovery keeps its dialog');
  h.clock(100 + delay + 100); c.api.update(true); assert.deepEqual(h.dialogs, ['session']);
});
test('newly finished battles delay the result, but reacquired saved victories open immediately', async () => {
  const h = harness(), c = h.context;
  c.game.dispatch({ type: 'start' }); c.api.update(true);
  c.game.state.enemyHp = 0; c.game.step(1 / 60); c.api.update(true);
  h.clock(1400); c.api.update(true); assert.deepEqual(h.dialogs, ['result']);
  const saved = defaultProfile(); saved.pendingVictory = { settlement: 'legacy', timeline: 1, battle: 0, earned: 10, seconds: 3, playerHp: 100 };
  c.lastPhase = 'running'; c.resultDue = 99999; c.sessionReady = false;
  c.session.acquire = async () => ({ status: 'active', profile: saved, loadStatus: 'loaded' });
  await c.api.acquireSession();
  assert.equal(c.lastPhase, 'won'); assert.equal(c.resultDue, 0); assert.deepEqual(h.dialogs, ['result', 'result']);
});
test('daily claims use the app action guard before mutating progress', () => {
  const h = harness(), c = h.context;
  const before = JSON.stringify(c.game.profile); h.foreign();
  assert.equal(c.api.action({ type: 'daily', day: 20000 }), false);
  assert.equal(JSON.stringify(c.game.profile), before);
  const active = harness().context;
  assert.equal(active.api.action({ type: 'daily', day: 20000 }), true);
  assert.equal(active.game.profile.gems, 130); assert.equal(active.game.profile.dailyDay, 20000);
});
