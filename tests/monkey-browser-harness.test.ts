import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { decodeSave } from '../src/game/save.ts';
import { chapterPresentation } from '../src/ui/chapter-presentation.ts';

// Execute the probe's real evolution scenario against real Game actions and a DOM boundary.
const source = readFileSync(new URL('../scripts/monkey-test.mjs', import.meta.url), 'utf8');
const ast = ts.createSourceFile('monkey-test.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const scenario = ast.statements.find(node => ts.isBlock(node) && node.getText(ast).includes('const flow = await browser.newPage'));
assert.ok(scenario);
for (const loseSelection of [false, true]) test(`optional evolution probe ${loseSelection ? 'rejects lost selection' : 'accepts retained selected chapter'}`, async () => {
  let game: Game, fixture = '', modal = '', evolutionOpen = false;
  const failures: string[] = [];
  const flow = {
    on() {}, async addInitScript(_callback: unknown, args: [string, string]) { fixture = args[1]; },
    async goto() { game = new Game(decodeSave(fixture).profile!); }, async waitForSelector() {}, async waitForTimeout() {}, async close() {},
    async waitForFunction() {},
    async click(selector: string) {
      assert.ok(evolutionOpen, 'Evolution is reached through Camp first');
      if (selector === '[data-command=evolve]') { modal = 'evolve'; return; }
      assert.equal(selector, '[data-command=confirm-evolve]'); assert.equal(modal, 'evolve');
      assert.equal(game.dispatch({ type: 'evolve' }), true);
      if (loseSelection) game.profile.enemyAge = 0;
    },
    async evaluate(callback: Function) {
      const document = {
        getElementById(id: string) { return { textContent: id === 'age-title' ? chapterPresentation(game.profile.age).title : id === 'timeline' ? `TIMELINE ${game.profile.timeline} · BATTLE ${game.profile.enemyAge + 1}` : String(game.profile.coins) }; },
        querySelectorAll() { return game.profile.unlocked.map(unlocked => ({ classList: { contains: () => !unlocked } })); },
      };
      return runInNewContext(`(${callback.toString()})()`, { document });
    },
  };
  await runInNewContext(`(async () => ${scenario.getText(ast)})()`, { browser: { newPage: async () => flow }, SAVE: 'isolated-save', url: 'http://fixture.test', failures, console: { log() {} }, openEvolution: async () => { evolutionOpen = true; }, stored: async () => structuredClone(game.profile) });
  assert.deepEqual(failures, loseSelection ? ['evolution flow'] : []);
  assert.equal(game!.profile.age, 5); assert.equal(game!.profile.coins, 0); assert.deepEqual(game!.profile.unlocked, [true, false, false]);
});
