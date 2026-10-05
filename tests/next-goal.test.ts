import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nextGoalLabel } from '../src/ui/next-goal.ts';
import { defaultProfile } from '../src/game/save.ts';
import { QUESTS } from '../src/game/data.ts';

test('daily reward is the first return reason and reads no state it changes', () => {
  const p = defaultProfile(), before = JSON.stringify(p);
  const goal = nextGoalLabel(p, 20000);
  assert.match(goal.text, /^Daily reward · 30 gems$/);
  assert.match(goal.label, /^Your journey\./);
  assert.equal(JSON.stringify(p), before);
});
test('claimable milestone outranks progress and names the real reward', () => {
  const p = defaultProfile(); p.dailyDay = 20000; p.wins = 3;
  assert.equal(nextGoalLabel(p, 20000).text, 'Claim 100 gems');
});
test('nearest unfinished milestone shows exact remaining count with correct plural', () => {
  const p = defaultProfile(); p.dailyDay = 20000; p.wins = 2;
  p.claimed = QUESTS.filter(q => q.stat !== 'wins' || q.id !== 'conqueror').map(q => q.id);
  const quest = QUESTS.find(q => q.id === 'conqueror')!;
  assert.equal(nextGoalLabel(p, 20000).text, `${quest.target - 2} ${quest.target - 2 === 1 ? 'win' : 'wins'} to ${quest.reward} gems`);
  p.wins = quest.target - 1; p.claimed.push('x');
  assert.match(nextGoalLabel(p, 20000).text, /^1 win to/);
});
test('finished veteran falls back to the plain journey label and the chip is wired', () => {
  const p = defaultProfile(); p.dailyDay = 20000; p.wins = p.kills = p.deployed = 1e9; p.claimed = QUESTS.map(q => q.id);
  assert.equal(nextGoalLabel(p, 20000).text, 'Your journey');
  const main = readFileSync('src/main.ts', 'utf8');
  assert.match(main, /id="journey-open"/); assert.match(main, /nextGoalLabel\(p,localDay\(\)\)/);
});
test('programmatically focused dialog titles show no boxed outline unless keyboard-focused', () => {
  assert.match(readFileSync('src/ui/readability.css', 'utf8'), /#dialog-title:focus:not\(:focus-visible\)\s*\{\s*outline:\s*none/);
});
test('baseline docs and automation exist and version is semantic', () => {
  for (const f of ['CREDITS.md', 'CHANGELOG.md', '.github/dependabot.yml', 'docs/performance-budgets.md']) assert.ok(readFileSync(f, 'utf8').length > 100, f);
  assert.match(JSON.parse(readFileSync('package.json', 'utf8')).version, /^\d+\.\d+\.\d+$/);
  assert.match(readFileSync('src/main.ts', 'utf8'), /About and privacy/);
});
