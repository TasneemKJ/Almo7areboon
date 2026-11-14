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
  assert.ok(chapters.slice(2).every((c: { rallyWins: number }) => c.rallyWins <= 1), 'chapters 3-6 are not won only by the pacing director');
});

test('the smith changes identity, not who gets through: reforging everything still reaches chapter 6 with no wall', () => {
  const [summary] = run('2', 'counsel', '40', 'all', 'mix');
  assert.equal(summary.finished, 2); assert.ok(summary.worstStreak <= 2); assert.deepEqual(summary.walls, []);
});
