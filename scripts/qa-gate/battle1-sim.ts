// Battle 1 for a brand-new player by the game's own rules: taps the first affordable troop every 0.95-1.75 s like the
// audit bot, uses no skills or orders. Reports the share of SEEDS players who win on the first try.
// Run: node --experimental-strip-types scripts/qa-gate/battle1-sim.ts [seeds=200]
import { Game } from '../../src/game/simulation.ts';
import type { UnitKind } from '../../src/game/types.ts';
const SEEDS = Number(process.argv[2] ?? 200);
function seeded(s: number) { let seed = s >>> 0 || 1; return () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let wins = 0, seconds = 0;
for (let s = 1; s <= SEEDS; s++) {
  const rnd = seeded(s); Math.random = seeded(1000 + s);
  const game = new Game(); game.dispatch({ type: 'start' }); let next = 1;
  for (let t = 0; game.state.phase === 'running' && t < 300; t += 0.1) {
    if (t >= next) { for (const kind of [0, 1, 2] as UnitKind[]) if (game.profile.unlocked[kind] && game.dispatch({ type: 'spawn', kind })) break; next += 0.95 + rnd() * 0.8; }
    game.step(0.1); game.drainEvents();
  }
  if (game.state.phase === 'won') { wins++; seconds += game.state.time; }
}
console.log(JSON.stringify({ seeds: SEEDS, battle1FirstTryWinRate: +(wins / SEEDS).toFixed(3), meanWinSeconds: +(seconds / Math.max(1, wins)).toFixed(1) }));
