import type { BattleState, Unit } from './types.ts';

/** The company champion: a free, sturdy melee hero who joins from the camp and returns some time after falling. */
export const CHAMPION_FIRST = 6, CHAMPION_RETURN = 25, CHAMPION_HEALTH = 4, CHAMPION_DAMAGE = 2;
const readyAt = (state: Readonly<BattleState>) => state.heroAt ?? CHAMPION_FIRST;
export function championOut(state: Readonly<BattleState>): boolean { return state.units.some(unit => unit.hero && unit.hp > 0); }
/** Seconds until the champion may join; 0 when ready, null while the champion is on the field. */
export function championWait(state: Readonly<BattleState>): number | null {
  return championOut(state) || readyAt(state) === Infinity ? null : Math.max(0, readyAt(state) - state.time);
}
export function canSummonChampion(state: Readonly<BattleState>): boolean {
  return state.phase === 'running' && !state.paused && championWait(state) === 0;
}
export function summonChampion(state: BattleState, spawn: () => Unit | undefined): boolean {
  if (!canSummonChampion(state)) return false;
  const hero = spawn();
  if (!hero) return false;
  hero.hero = true;
  hero.maxHp = hero.hp = Math.round(hero.maxHp * CHAMPION_HEALTH);
  state.heroAt = Infinity;
  return true;
}
/** After the champion falls, the return countdown starts. */
export function championTick(state: BattleState): void {
  if (state.heroAt === Infinity && !championOut(state)) state.heroAt = state.time + CHAMPION_RETURN;
}
export function heroDamage(unit: Pick<Unit, 'hero'>): number { return unit.hero ? CHAMPION_DAMAGE : 1; }
