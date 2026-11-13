// Chapter 2 (Olive Terraces) for a cold, slow tapper, by the game's own rules (Game.dispatch/step).
// The tapper sends a troop every 1/TAPS seconds, cycling through the troops it owns (an unaffordable tap is wasted, like
// the cold bot's), and uses no skills. CAMP=1 lets it spend coins between battles (unlock, food, gate) as the cold bot
// does when it wanders into Camp. Reports, over SEEDS players, the share who have won chapter 2 by each try.
// Run: node --experimental-strip-types scripts/qa-gate/chapter2-sim.ts [taps/s=0.75] [seeds=40] [CAMP=0|1|counsel|g|food|food0|gate|fb|unlock|f1..f9]
// 0 = presses Retry only; counsel = follows the lit Camp station (src/game/counsel.ts) before every try.
import { Game } from '../../src/game/simulation.ts';
import { followCounsel } from '../../src/game/counsel.ts';
import type { UnitKind } from '../../src/game/types.ts';

const TAPS = Number(process.argv[2] ?? 0.75), SEEDS = Number(process.argv[3] ?? 40), CAMP = process.argv[4] ?? '0', TRIES = 6;
function seeded(s: number) { let seed = s >>> 0 || 1; return () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function fight(game: Game, rnd: () => number): boolean {
  if (!game.dispatch({ type: 'start' }) && game.state.phase !== 'running') return false;
  const gap = 1 / TAPS; let next = rnd() * gap, n = 0;
  for (let t = 0; game.state.phase === 'running' && t < 300; t += 0.1) {
    if (t >= next) {
      // A tap goes to the next owned troop the player can afford (the tray dims the others); with nothing affordable the
      // tap waits. The free food order is used once when food runs dry.
      const kinds = ([0, 1, 2] as UnitKind[]).filter(k => game.profile.unlocked[k]);
      for (let j = 0; j < kinds.length; j++) if (game.dispatch({ type: 'spawn', kind: kinds[(n + j) % kinds.length] })) { n += j + 1; break; }
      if (game.state.food < 3) game.dispatch({ type: 'skill', skill: 'food' });
      next += gap * (0.8 + rnd() * 0.4);
    }
    game.step(0.1); game.drainEvents();
  }
  if (game.state.phase === 'running') game.dispatch({ type: 'retreat' });
  return game.state.phase === 'won';
}
// GUIDE ('g'): one purchase per defeat, the one the defeat card names (unlock ranged, unlock heavy, food, gate).
function guided(game: Game) {
  game.dispatch({ type: 'unlock', kind: 1 }) || game.dispatch({ type: 'unlock', kind: 2 }) || game.dispatch({ type: 'upgrade', stat: 'food' }) || game.dispatch({ type: 'upgrade', stat: 'base' });
}
function spendOn(game: Game, stat: 'food' | 'base') { for (let i = 0; i < 50 && game.dispatch({ type: 'upgrade', stat }); i++); }
function camp(game: Game) {
  for (let i = 0; i < 50; i++) {
    if (game.dispatch({ type: 'unlock', kind: 1 }) || game.dispatch({ type: 'unlock', kind: 2 })) continue;
    if (game.profile.foodLevel <= game.profile.baseLevel && game.dispatch({ type: 'upgrade', stat: 'food' })) continue;
    if (game.dispatch({ type: 'upgrade', stat: 'base' })) continue;
    break;
  }
}
const byTry = new Array(TRIES).fill(0); let ch1Tries = 0;
for (let s = 1; s <= SEEDS; s++) {
  const rnd = seeded(s); Math.random = seeded(1000 + s);
  const game = new Game();
  for (let k = 0; k < 10; k++) { ch1Tries++; if (fight(game, rnd)) break; game.dispatch({ type: 'retry' }); }
  game.dispatch({ type: 'next' });
  if (game.profile.enemyAge !== 1) { console.error('seed', s, 'did not reach chapter 2'); continue; }
  let won = -1;
  for (let k = 0; k < TRIES; k++) {
    if (CAMP === 'counsel') followCounsel(game); else if (CAMP === 'counsel-after' && k > 0) followCounsel(game); else if (CAMP === '1') camp(game); else if (CAMP === 'g' && k > 0) guided(game);
    else if (CAMP === 'food' && k > 0) spendOn(game, 'food'); else if (CAMP === 'food0') spendOn(game, 'food'); else if (/^f[0-9]$/.test(CAMP) && k > 0) { for (let i = 0; i < Number(CAMP[1]); i++) game.dispatch({ type: 'upgrade', stat: 'food' }); } else if (CAMP === 'gate' && k > 0) spendOn(game, 'base');
    else if (CAMP === 'fb' && k > 0) { for (let i = 0; i < 50; i++) if (!(game.profile.foodLevel <= game.profile.baseLevel ? game.dispatch({ type: 'upgrade', stat: 'food' }) : game.dispatch({ type: 'upgrade', stat: 'base' }))) break; }
    else if (CAMP === 'unlock' && k > 0) { game.dispatch({ type: 'unlock', kind: 1 }); game.dispatch({ type: 'unlock', kind: 2 }); }
    if (fight(game, rnd)) { won = k; break; }
    game.dispatch({ type: 'retry' });
  }
  if (won >= 0) for (let k = won; k < TRIES; k++) byTry[k]++;
}
console.log(JSON.stringify({ taps: TAPS, camp: CAMP, seeds: SEEDS, ch1TriesAvg: +(ch1Tries / SEEDS).toFixed(2), ch2WonByTry: byTry.map(n => +(n / SEEDS).toFixed(2)) }));
