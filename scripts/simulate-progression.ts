// Long-run progression probe: a bounded scripted policy, not a proof of optimal play.
// Run: node --experimental-strip-types scripts/simulate-progression.ts [targetTimeline=12] [summon=1] [maxAttempts=1200]
import { Game } from '../src/game/simulation.ts';
import assert from 'node:assert/strict';
import { QUESTS } from '../src/game/data.ts';
import type { UnitKind } from '../src/game/types.ts';

const target = Number(process.argv[2] ?? 12), summon = process.argv[3] !== '0', maxAttempts = Number(process.argv[4] ?? 1200);
assert.ok(Number.isInteger(target) && target >= 1 && target <= 1000, 'targetTimeline must be an integer from 1 to 1000');
assert.ok(Number.isInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 100000, 'maxAttempts must be an integer from 1 to 100000');
const game = new Game();
let attempts = 0, wins = 0, losses = 0, streak = 0, maxStreak = 0;
let timedOut: { timeline: number; chapter: number; army: number; seconds: number } | null = null;
const attemptsByBattle: Record<string, number> = {};

while (attempts < maxAttempts && game.profile.timeline < target) {
  const p = game.profile;
  for (const quest of QUESTS) game.dispatch({ type: 'claim', id: quest.id });
  if (summon) for (const count of [50, 10, 1] as const) while (game.dispatch({ type: 'summon', count }));
  // Coins: unlock troops, keep food production near the base level, then thicken the base.
  for (let step = 0; step < 300; step++) {
    if (game.dispatch({ type: 'unlock', kind: 2 }) || game.dispatch({ type: 'unlock', kind: 1 })) continue;
    if (p.foodLevel <= p.baseLevel + 2 && game.dispatch({ type: 'upgrade', stat: 'food' })) continue;
    if (game.dispatch({ type: 'upgrade', stat: 'base' }) || game.dispatch({ type: 'upgrade', stat: 'food' })) continue;
    break;
  }
  if (p.age < 5 && p.age <= p.enemyAge) game.dispatch({ type: 'evolve' });
  const key = `age${p.age}-vs${p.enemyAge}`;
  attemptsByBattle[key] = (attemptsByBattle[key] ?? 0) + 1;
  assert.equal(game.dispatch({ type: 'start' }), true, 'every counted attempt must start a new battle');
  attempts++;
  for (let t = 0; game.state.phase === 'running' && t < 400; t += 0.1) {
    const mine = game.state.units.filter(u => u.side === 'player' && u.hp > 0);
    const foes = game.state.units.filter(u => u.side === 'enemy' && u.hp > 0).length;
    const front = mine.filter(u => u.kind !== 1).length, back = mine.length - front;
    const bulwark = game.waveStatus().preview?.intent === 'bulwark';
    const want: UnitKind = back < front || bulwark ? 1 : front % 3 === 2 ? 2 : 0;
    if (!game.dispatch({ type: 'spawn', kind: want })) game.dispatch({ type: 'spawn', kind: 0 });
    if (foes >= 3) game.dispatch({ type: 'skill', skill: 'freeze' });
    if (foes >= 4) game.dispatch({ type: 'skill', skill: 'meteor' });
    if (game.state.food < 4) game.dispatch({ type: 'skill', skill: 'food' });
    game.step(0.1);
    game.drainEvents();
  }
  if (game.state.phase === 'won') {
    wins++; streak = 0;
    assert.equal(game.dispatch(p.enemyAge===5?{type:'prestige',expectedTimeline:p.timeline,legacy:'hearth'}:{type:'next'}), true, 'a recorded win must advance successfully');
  } else if (game.state.phase === 'lost') {
    losses++; streak++; maxStreak = Math.max(maxStreak, streak);
    assert.equal(game.dispatch({ type: 'retry' }), true, 'a recorded loss must retry successfully');
  } else {
    assert.equal(game.state.phase, 'running', 'the probe must end with a real result or explicit timeout');
    timedOut = { timeline: p.timeline, chapter: p.enemyAge, army: p.age, seconds: game.state.time };
    break;
  }
}
const worst = Object.entries(attemptsByBattle).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k}:${v}`).join(' ');
assert.equal(attempts, wins + losses + (timedOut ? 1 : 0));
console.log(JSON.stringify({ stopReason: timedOut ? 'battle-timeout' : game.profile.timeline >= target ? 'target-reached' : 'attempt-limit', reachedTimeline: game.profile.timeline, attempts, completedAttempts: wins + losses, wins, losses, timedOut, longestLosingStreak: maxStreak, cards: game.profile.cards.reduce((a, b) => a + b, 0), gemsLeft: game.profile.gems, mostAttempted: worst }));
