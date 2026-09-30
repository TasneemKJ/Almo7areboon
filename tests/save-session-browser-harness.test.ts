import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

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

for (const trigger of ['preference', 'focus']) test(`${trigger} fault reaches its guard before an intervening autosave`, async () => {
  const primary = 'save', backup = 'backup', profile = { gems: 100, speed: 1 };
  const storage = new Map([[primary, JSON.stringify(profile)], [backup, JSON.stringify(profile)]]);
  let settings = false, conflict = false, detectedBy = '';
  const check = (origin: string) => {
    if (!conflict && storage.get(primary) !== JSON.stringify(profile)) { conflict = true; settings = false; detectedBy = origin; }
    return !conflict;
  };
  const button = { click() { if (check('preference')) profile.speed = 2; } };
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
    trigger, primary, backup, assert, setup: async () => page, open: async () => page, active: async () => {},
    fixture: (overrides: object) => ({ ...profile, ...overrides }),
    bytes: async () => [storage.get(primary), storage.get(backup)],
    blocked: async () => assert.equal(conflict, true), exported: async () => ({ ...profile }),
  };
  await runInNewContext(`(${callback})(null)`, context);
  assert.equal(detectedBy, trigger, 'the requested guard must observe foreign bytes before autosave can');
  assert.deepEqual(profile, { gems: 100, speed: 1 });
});
