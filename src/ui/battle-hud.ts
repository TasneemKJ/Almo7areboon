import { ERAS, foodRate, foodUpgradeCost, unlockCost } from '../game/data.ts';
import type { BattleState, Profile } from '../game/types.ts';

/** What most improves the next attempt, judged from what the player can afford right now. */
export function defeatAdvice(profile: Profile): string {
  // Heavy troops give the most strength per food in every chapter, so they come before ranged support.
  if (!profile.unlocked[2] && profile.coins >= unlockCost(2, profile)) return 'Unlock your heavy troop: it hits hardest, lasts longest and holds the front line. Then retry.';
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return 'Unlock your ranged troop so it can strike from behind your front line, then retry.';
  if (profile.foodLevel < 100 && profile.coins >= foodUpgradeCost(profile)) return 'Upgrade food production to deploy faster, then retry.';
  return 'Deploy earlier and mix melee with ranged troops, then retry.';
}

/** A single contextual instruction, not an onboarding panel over the battlefield. */
export function battleGuidance(profile: Profile, state: BattleState): string {
  if (state.phase === 'ready') return 'Tap Battle, then spend food to deploy warriors.';
  if (state.phase === 'won') return 'Victory! Continue to the next battle when you are ready.';
  if (state.phase === 'lost') return `Your coins are safe. ${defeatAdvice(profile)}`;
  if (state.paused) return 'Battle paused. Resume to deploy your army.';
  if (state.playerHp / state.playerMaxHp <= 0.3) return 'Your base is in danger. Deploy reinforcements or use a skill.';
  if (state.stats.deployed === 0 && state.food >= ERAS[profile.age].units[0].cost) return 'Tap a troop to deploy your first warrior.';
  if (state.wave === state.totalWaves && !state.units.some(unit => unit.side === 'enemy' && unit.hp > 0)) return 'Enemy army cleared. Keep deploying to destroy their base.';
  if (profile.wins < 3 && state.stats.skillsCast === 0 && state.time >= 25) return 'Try a skill: Freeze, Meteor or Food Drop. Each works once per battle.';
  const wait = Math.ceil((ERAS[profile.age].units[0].cost - state.food) / foodRate(profile));
  if (wait > 0) return `More food in ${wait}s. Your warriors fight automatically.`;
  if (!profile.unlocked[2] && profile.coins >= unlockCost(2, profile)) return 'Heavy troops are affordable. They hit hardest and hold the front line.';
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return 'Ranged troops are affordable. Unlock them behind your front line.';
  if (state.food >= 90) return 'Food storage is nearly full. Deploy a stronger army now.';
  return profile.unlocked[1] ? 'Protect ranged troops with a front line of melee warriors.' : 'Save food and deploy together to overwhelm the enemy.';
}

export function compactNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safe >= 1e15) return safe.toExponential(1).replace('e+', 'e');
  for (const [limit, suffix] of [[1e12, 't'], [1e9, 'b'], [1e6, 'm'], [1e3, 'k']] as const) {
    if (safe >= limit) return `${(safe / limit).toFixed(1).replace(/\.0$/, '')}${suffix}`;
  }
  return Math.ceil(safe).toString();
}

export function baseHealthDisplay(hp: number, maximum: number): { ratio: number; label: string; danger: boolean } {
  const max = Number.isFinite(maximum) && maximum > 0 ? maximum : 1;
  const current = Math.max(0, Math.min(max, Number.isFinite(hp) ? hp : 0));
  const ratio = current / max;
  return { ratio, label: `${compactNumber(current)} / ${compactNumber(max)}`, danger: ratio <= 0.3 };
}
