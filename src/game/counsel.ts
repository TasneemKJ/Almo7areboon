import { ERAS, baseUpgradeCost, foodUpgradeCost, unlockCost } from './data.ts';
import type { Game } from './simulation.ts';
import type { Profile } from './types.ts';

/**
 * The one place in Camp worth a visit now, or null when nothing is affordable. Read-only; Camp lights that place and the
 * defeat card names it. Food comes first because it decides how many warriors reach the field: in the rules simulation
 * (scripts/qa-gate/chapter2-sim.ts) a slow tapper who spends on food wins chapter 2 on the first or second try, while
 * one who spends the same coins on troop unlocks or the gate never does. So: four
 * levels of bread, two of gate, then a waiting troop joins (an early fragile archer does not win chapter 2 by itself; a
 * fuller storehouse does), then food up to three levels ahead of the gate, then whatever is affordable.
 */
export type CampCounsel = { readonly station: 'storehouse' } | { readonly station: 'company'; readonly kind: 1 | 2 } | { readonly station: 'gate' };
const FIRST_BREAD = 4, FIRST_BRACE = 2, FOOD_LEAD = 3, MAX_LEVEL = 100;

export function campCounsel(p: Readonly<Profile>): CampCounsel | null {
  // Evolution resets coins, upgrades and unlocks: when it is affordable, no lantern should send coins into what it wipes.
  if (p.age < ERAS.length - 1 && p.age <= p.enemyAge && p.coins >= ERAS[p.age].evolveCost) return null;
  const food = p.foodLevel < MAX_LEVEL && p.coins >= foodUpgradeCost(p as Profile);
  const gate = p.baseLevel < MAX_LEVEL && p.coins >= baseUpgradeCost(p as Profile);
  if (food && p.foodLevel < FIRST_BREAD) return { station: 'storehouse' };
  if (gate && p.baseLevel < FIRST_BRACE) return { station: 'gate' };
  for (const kind of [1, 2] as const) if (!p.unlocked[kind] && p.coins >= unlockCost(kind, p)) return { station: 'company', kind };
  if (food && p.foodLevel <= p.baseLevel + FOOD_LEAD) return { station: 'storehouse' };
  return gate ? { station: 'gate' } : food ? { station: 'storehouse' } : null;
}

/** Spends as the counsel says until nothing is affordable (the QA bot's and the tests' model of a guided player). */
export function followCounsel(game: Game, limit = 60): number {
  let bought = 0;
  for (let counsel = campCounsel(game.profile); counsel && bought < limit; counsel = campCounsel(game.profile)) {
    const ok = counsel.station === 'storehouse' ? game.dispatch({ type: 'upgrade', stat: 'food' })
      : counsel.station === 'gate' ? game.dispatch({ type: 'upgrade', stat: 'base' })
      : game.dispatch({ type: 'unlock', kind: counsel.kind });
    if (!ok) break;
    bought++;
  }
  return bought;
}
