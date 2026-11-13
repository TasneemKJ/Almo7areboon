// Writes a mid-game profile (age 1 Farm army, chapter 3 open, coins for evolution) for screen captures.
// node --experimental-strip-types scripts/qa-gate/make-profile.ts <out.json>
import { Game } from '../../src/game/simulation.ts';
import { QUESTS, ERAS } from '../../src/game/data.ts';
import { writeFileSync } from 'node:fs';
const game = new Game(); const p = game.profile;
for (let n = 0; n < 60 && !(p.age === 1 && p.enemyAge >= 2); n++) {
  for (const q of QUESTS) game.dispatch({ type: 'claim', id: q.id });
  for (let i = 0; i < 200; i++) if (!(game.dispatch({ type: 'unlock', kind: 1 }) || game.dispatch({ type: 'unlock', kind: 2 }) || game.dispatch({ type: 'upgrade', stat: p.foodLevel <= p.baseLevel ? 'food' : 'base' }))) break;
  if (p.age === 0 && p.enemyAge >= 1) game.dispatch({ type: 'evolve' });
  game.dispatch({ type: 'start' });
  for (let t = 0; game.state.phase === 'running' && t < 240; t += 0.1) { game.dispatch({ type: 'spawn', kind: [0, 1, 2][Math.floor(Math.random() * 3)] as 0 | 1 | 2 }) || game.dispatch({ type: 'spawn', kind: 0 }); game.step(0.1); game.drainEvents(); }
  if (game.state.phase === 'won') game.dispatch({ type: 'next' }); else game.dispatch({ type: 'retry' });
}
p.coins = Math.max(p.coins, ERAS[1].evolveCost + 5000); p.gems = Math.max(p.gems, 400);
delete (p as any).introPending; (p as any).played = true;
writeFileSync(process.argv[2], JSON.stringify(p));
console.log({ age: p.age, enemyAge: p.enemyAge, coins: p.coins, gems: p.gems, wins: p.wins, pending: !!p.pendingVictory });
