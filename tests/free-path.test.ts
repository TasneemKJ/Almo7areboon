import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// scripts/qa-gate/free-path-sim.ts, the free path (DESIGN.md #60): a player who never buys, by the game's own rules.
const run = (...args: string[]) => execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/qa-gate/free-path-sim.ts', ...args], { encoding: 'utf8' }).trim().split('\n').map(line => JSON.parse(line));

test('a free player who follows the lamp and sends its troops in turn reaches the chapter 6 win with no wall', () => {
  const [summary, ...chapters] = run('2', 'counsel', '40', 'keep', 'mix');
  assert.equal(summary.finished, 2);
  assert.ok(summary.worstStreak <= 2, `worst run of defeats ${summary.worstStreak}`);
  assert.deepEqual(summary.walls, []);
  assert.deepEqual(chapters.slice(2).map((c: { rallyWins: number }) => c.rallyWins), [0, 0, 0, 0], 'chapters 3-6 are won without the pacing director');
});

test('the smith changes identity, not who gets through: reforging everything still reaches chapter 6 with no wall', () => {
  const [summary] = run('2', 'counsel', '40', 'all', 'mix');
  assert.equal(summary.finished, 2); assert.ok(summary.worstStreak <= 2); assert.deepEqual(summary.walls, []);
});

test('1.3: in the app without Full Journey a free player walks the whole free road, chapters 1 to 3, with no wall', () => {
  const [summary, ...chapters] = run('3', 'counsel', '40', 'keep', 'first', 'app');
  assert.equal(summary.store, 'app'); assert.equal(summary.freeChapters, 3);
  assert.equal(summary.finished, 3, 'every player wins chapter 3 without moving camp into a paid army');
  assert.deepEqual(summary.walls, []); assert.ok(summary.worstStreak <= 2);
  assert.ok(String(summary.freeEndAtBattle).split(',').every((b: string) => Number(b) > 0 && Number(b) <= 10), summary.freeEndAtBattle);
  assert.deepEqual(chapters.slice(0, 3).map((c: { won: number }) => c.won), [3, 3, 3]);
  assert.deepEqual(chapters.slice(3).map((c: { reached: number }) => c.reached), [0, 0, 0], 'no paid chapter is fought');
});
