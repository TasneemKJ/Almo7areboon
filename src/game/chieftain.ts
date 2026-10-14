import type { BattleState, Unit } from './types.ts';

/** The enemy chieftain marches out once, the first time the enemy gate falls to half health. */
export const CHIEF_HEALTH = 2, CHIEF_BOUNTY = 5;
export function chiefDue(state: Readonly<BattleState>): boolean {
  return state.phase === 'running' && !state.chief && state.enemyHp > 0 && state.enemyHp <= state.enemyMaxHp / 2;
}
/** Spawns the chieftain through the ordinary enemy spawn (a melee champion with extra health). Returns whether one marched out. */
export function summonChief(state: BattleState, spawnEnemy: (kind: 0) => Unit | undefined): boolean {
  if (!chiefDue(state)) return false;
  state.chief = true;
  const chief = spawnEnemy(0);
  if (!chief) return false;
  chief.chief = true;
  chief.maxHp = chief.hp = Math.round(chief.maxHp * CHIEF_HEALTH);
  return true;
}
export function bountyFactor(unit: Pick<Unit, 'chief'>): number { return unit.chief ? CHIEF_BOUNTY : 1; }
