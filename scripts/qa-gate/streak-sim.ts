// The pacing director's check (STUDIO-BAR "non-boring and high retention"): a naive player's 30 battles by the game's own
// rules (the web build, where nothing is sold), counting losses in a row. The player taps the first affordable troop like
// the audit bot, uses no skills, and does only what a data-primary action leads to: Continue after a win; after a defeat
// either Retry only (CAMP=0), or (CAMP=counsel) the Regroup primary: the lit Camp place's act, tapped until the lamp goes
// out (litCounsel), or Move camp when that is what the coins can do.
// Run: node --experimental-strip-types scripts/qa-gate/streak-sim.ts [seeds=20] [CAMP=0|counsel] [battles=30]
import { Game } from '../../src/game/simulation.ts';
import { counselAction, litCounsel } from '../../src/game/counsel.ts';
import { ERAS } from '../../src/game/data.ts';
import type { UnitKind } from '../../src/game/types.ts';

const SEEDS = Number(process.argv[2] ?? 20), CAMP = process.argv[3] ?? '0', BATTLES = Number(process.argv[4] ?? 30);
function seeded(s: number) { let seed = s >>> 0 || 1; return () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function fight(game: Game, rnd: () => number): boolean {
  if (!game.dispatch({ type: 'start' }) && game.state.phase !== 'running') return false;
  let next = 1;
  for (let t = 0; game.state.phase === 'running' && t < 300; t += 0.1) {
    if (t >= next) { for (const kind of [0, 1, 2] as UnitKind[]) if (game.profile.unlocked[kind] && game.dispatch({ type: 'spawn', kind })) break; next += 1.15 * (0.95 + rnd() * 0.8); }
    game.step(0.1); game.drainEvents();
  }
  if (game.state.phase === 'running') game.dispatch({ type: 'retreat' });
  return game.state.phase === 'won';
}
let worst = 0; const streaks: number[] = [], chapters: number[] = [], losses: number[] = [];
for (let s = 1; s <= SEEDS; s++) {
  const rnd = seeded(s); Math.random = seeded(1000 + s);
  const game = new Game(); let streak = 0, max = 0, lost = 0;
  for (let b = 0; b < BATTLES; b++) {
    if (CAMP === 'counsel') for (let lit = litCounsel(game.profile), n = 0; lit && n < 60 && game.dispatch(counselAction(lit)); lit = litCounsel(game.profile), n++);
    if (fight(game, rnd)) { streak = 0; if (!game.dispatch({ type: 'next' })) game.dispatch({ type: 'retry' }); }
    else {
      streak++; lost++; max = Math.max(max, streak); const p = game.profile;
      if (CAMP === 'counsel' && !litCounsel(p) && p.age < ERAS.length - 1 && p.age <= p.enemyAge && p.coins >= ERAS[p.age].evolveCost) game.dispatch({ type: 'evolve' });
      else game.dispatch({ type: 'retry' });
    }
  }
  worst = Math.max(worst, max); streaks.push(max); chapters.push(game.profile.enemyAge); losses.push(lost);
}
console.log(JSON.stringify({ camp: CAMP, seeds: SEEDS, battles: BATTLES, worstLossStreak: worst, maxStreakPerPlayer: streaks.join(''), lossesPerPlayer: losses.join(','), chapterReached: chapters.join('') }));
