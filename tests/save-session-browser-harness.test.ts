import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { decodeSave } from '../src/game/save.ts';
import { syncWeekly, weekId } from '../src/game/weekly.ts';
import { localDay } from '../src/game/data.ts';

// Execute the browser scenario's actual orchestration. A deterministic scheduler
// runs an autosave check after every browser task, including the foreign write.
const source = readFileSync(new URL('../scripts/verify-save-sessions.mjs', import.meta.url), 'utf8');
const ast = ts.createSourceFile('verify-save-sessions.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let callback = '';
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'scenario' && node.arguments[0]?.getText(ast).startsWith('`baseline-before-')) callback = node.arguments[1].getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(callback, 'unannounced-write scenario must exist');

const blockedFunction = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'blocked');
assert.ok(blockedFunction, 'recovery contrast helper must exist');
function contrastPage(foreground: string, background = 'rgb(255, 255, 255)') {
  const title = 'Game open in another tab';
  const dialog = { isConnected: true };
  const current = { isConnected: true, textContent: title, closest: () => dialog, getClientRects: () => [{}] };
  const stale = { ...current, isConnected: false };
  let polls = 0;
  const globals = {
    getComputedStyle: (node: { isConnected: boolean }) => ({ color: node.isConnected ? foreground : '', backgroundColor: node.isConnected ? background : '' }),
    document: { querySelector: () => ++polls === 1 ? null : current },
  };
  const page = {
    getByRole: () => ({ waitFor: async () => {}, evaluate: async (fn: Function) => runInNewContext(`(${fn.toString()})(node)`, { ...globals, node: stale }) }),
    async waitForFunction(fn: Function, arg: unknown) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = runInNewContext(`(${fn.toString()})(arg)`, { ...globals, arg });
        if (result) return { jsonValue: async () => structuredClone(result), dispose: async () => {} };
      }
      throw new Error('Current recovery heading never became measurable');
    },
  };
  return { page, polls: () => polls };
}
test('recovery contrast measures the current dialog after a detached locator snapshot', async () => {
  const harness = contrastPage('rgb(0, 0, 0)');
  await runInNewContext(`(${blockedFunction.getText(ast)})(page)`, { page: harness.page, assert });
  assert.ok(harness.polls() >= 2, 'wait through a missing current heading instead of accepting a stale one');
});
test('current recovery heading below 4.5 contrast still fails', async () => {
  const harness = contrastPage('rgb(240, 240, 240)');
  await assert.rejects(runInNewContext(`(${blockedFunction.getText(ast)})(page)`, { page: harness.page, assert }), /must be readable on its paper dialog/);
});
test('invalid computed recovery colors fail with an explicit measurement diagnostic', async () => {
  const harness = contrastPage('');
  await assert.rejects(runInNewContext(`(${blockedFunction.getText(ast)})(page)`, { page: harness.page, assert }), /Invalid recovery contrast measurement/);
});

for (const trigger of ['preference', 'focus']) test(`${trigger} fault reaches its guard before an intervening autosave`, async () => {
  const primary = 'save', backup = 'backup', profile = { gems: 100, speed: 1 };
  const storage = new Map([[primary, JSON.stringify(profile)], [backup, JSON.stringify(profile)]]);
  let settings = false, conflict = false, detectedBy = '';
  const check = (origin: string) => {
    if (!conflict && storage.get(primary) !== JSON.stringify(profile)) { conflict = true; settings = false; detectedBy = origin; }
    return !conflict;
  };
  const button = { value: '1', dispatchEvent(event: { type: string }) { assert.equal(event.type, 'change'); assert.equal(this.value, '2'); if (check('preference')) profile.speed = Number(this.value); } };
  const browser = {
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    document: { querySelector: () => settings ? button : null },
    addEventListener() {}, Event: class { type: string; constructor(type: string) { this.type = type; } },
    dispatchEvent(event: { type: string }) { if (event.type === 'focus') check('focus'); },
  };
  const page = {
    async evaluate(fn: Function, arg?: unknown) {
      const result = runInNewContext(`(${fn.toString()})(arg)`, { ...browser, arg });
      check('autosave');
      return structuredClone(result);
    },
    locator(selector: string) {
      return {
        async click() { assert.match(selector, /settings/); settings = true; },
        async evaluate(fn: Function) {
          assert.ok(settings, 'Settings speed button was replaced by recovery before the trigger');
          const result = fn(button); check('autosave'); return result;
        },
      };
    },
  };
  const context = {
    trigger, primary, backup, assert, settings: async () => { settings = true; }, setup: async () => page, open: async () => page, active: async () => {},
    fixture: (overrides: object) => ({ ...profile, ...overrides }),
    bytes: async () => [storage.get(primary), storage.get(backup)],
    blocked: async () => assert.equal(conflict, true), exported: async () => ({ ...profile }),
  };
  await runInNewContext(`(${callback})(null)`, context);
  assert.equal(detectedBy, trigger, 'the requested guard must observe foreign bytes before autosave can');
  assert.deepEqual(profile, { gems: 100, speed: 1 });
});

const campFunction = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'camp');
const progressFunction = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'progress');
assert.ok(campFunction && progressFunction, 'ready Camp entry must check its progression baseline');
for (const corrupt of [false, true]) test(`Camp navigation ${corrupt ? 'rejects an accidental progression mutation' : 'keeps the ready save intact'}`, async () => {
  const stored = { coins: 500, gems: 100, wins: 0, pendingVictory: null, played: true };
  const clicked: string[] = [];
  const page = { locator: (selector: string) => ({
    async click() { clicked.push(selector); if (corrupt) stored.coins += 1; },
    async waitFor() {}, async getAttribute() { return 'ready'; },
  }) };
  const run = runInNewContext(`${progressFunction.getText(ast)}; (${campFunction.getText(ast)})(page)`, {
    page, assert, bytes: async () => [JSON.stringify(stored)],
  });
  if (corrupt) await assert.rejects(run, /Camp entry preserves stored progression/);
  else await run;
  assert.deepEqual(clicked, ['#entry-secondary[data-command="home-camp"]'], 'read-only Camp route never clicks Play');
});

const fixtureStatement = ast.statements.find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(ast) === 'fixture'));
assert.ok(fixtureStatement, 'canonical save fixture must exist');
for (const pendingVictory of [null, { timeline: 1, battle: 0, earned: 77, seconds: 12, playerHp: 100, stats: {} }]) test(`returning ${pendingVictory ? 'receipt' : 'ready'} fixture is canonical before Home entry`, () => {
  const profile = runInNewContext(`${fixtureStatement.getText(ast)}; fixture(overrides)`, { decodeSave, syncWeekly, weekId, localDay, assert, overrides: { pendingVictory } });
  assert.equal(profile.version, 5, 'Home is read-only; fixture cannot wait for it to persist a schema migration');
  const decoded = decodeSave(JSON.stringify(profile));
  assert.ok(decoded.profile, 'canonical fixture decodes to a supported profile');
  assert.deepEqual(profile, decoded.profile, 'no deferred normalization can be mistaken for a navigation mutation');
  assert.deepEqual([profile.coins, profile.gems, profile.wins, profile.kills, profile.deployed, profile.played], [500, 100, 0, 0, 0, true]);
  assert.equal(syncWeekly(profile, weekId(localDay())), false, 'legitimate load-time weekly baseline is already settled');
  assert.equal(profile.pendingVictory?.earned ?? null, pendingVictory?.earned ?? null);
});
