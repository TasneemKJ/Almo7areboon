// The audit bot's battle 2 by the game's own rules: it taps the first affordable troop card every 0.7-1.5 s plus a tap's
// latency, uses no skills, and between tries either presses Retry only (CAMP=0) or follows the Regroup primary action
// (CAMP=counsel: the lit Camp place, bought until the lamp goes out). Reports the share of players who have won chapter 2
// by each try. Run: node --experimental-strip-types scripts/qa-gate/bot-sim.ts [gap-scale=1] [seeds=40] [CAMP=0|counsel]
import { Game } from '../../src/game/simulation.ts';
import { followCounsel } from '../../src/game/counsel.ts';
import type { UnitKind } from '../../src/game/types.ts';

const SCALE = Number(process.argv[2] ?? 1), SEEDS = Number(process.argv[3] ?? 40), CAMP = process.argv[4] ?? '0', TRIES = 6;
function seeded(s: number) { let seed = s >>> 0 || 1; return () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function fight(game: Game, rnd: () => number): boolean {
  if (!game.dispatch({ type: 'start' }) && game.state.phase !== 'running') return false;
  let next = 1;
  for (let t = 0; game.state.phase === 'running' && t < 300; t += 0.1) {
    if (t >= next) {
      for (const kind of [0, 1, 2] as UnitKind[]) if (game.profile.unlocked[kind] && game.dispatch({ type: 'spawn', kind })) break;
      next += SCALE * (0.25 + 0.7 + rnd() * 0.8);
    }
    game.step(0.1); game.drainEvents();
  }
  if (game.state.phase === 'running') game.dispatch({ type: 'retreat' });
  return game.state.phase === 'won';
}
const byTry = new Array(TRIES).fill(0);
for (let s = 1; s <= SEEDS; s++) {
  const rnd = seeded(s); Math.random = seeded(1000 + s);
  const game = new Game();
  for (let k = 0; k < 10; k++) { if (fight(game, rnd)) break; game.dispatch({ type: 'retry' }); }
  game.dispatch({ type: 'next' });
  if (game.profile.enemyAge !== 1) { console.error('seed', s, 'did not reach chapter 2'); continue; }
  let won = -1;
  for (let k = 0; k < TRIES; k++) {
    if (CAMP === 'counsel' && k > 0) followCounsel(game);
    if (CAMP === 'food' && k > 0) while (game.dispatch({ type: 'upgrade', stat: 'food' }));
    if (fight(game, rnd)) { won = k; break; }
    game.dispatch({ type: 'retry' });
  }
  if (won >= 0) for (let k = won; k < TRIES; k++) byTry[k]++;
}
console.log(JSON.stringify({ scale: SCALE, camp: CAMP, seeds: SEEDS, ch2WonByTry: byTry.map(n => +(n / SEEDS).toFixed(2)) }));
