import type { Side, Unit, UnitKind } from './types.ts';

/** A melee-reach heavy troop's blow (riders and beasts, not cannons) worth at least this share of the target's maximum health throws a surviving target back along the lane. */
export const KNOCKBACK_SHARE = 1 / 3;
export const KNOCKBACK_DISTANCE = 14;

/** Pushes a surviving target away from its attacker, never behind its own spawn line. Returns whether it moved. */
export function knockback(target: Unit, attacker: Side, actual: number, attackerKind: UnitKind = 2): boolean {
  if (attackerKind !== 2 || target.hp <= 0 || target.side === attacker || !(actual >= target.maxHp * KNOCKBACK_SHARE)) return false;
  const x = target.side === 'enemy' ? Math.min(Math.max(target.x, 880), target.x + KNOCKBACK_DISTANCE) : Math.max(Math.min(target.x, 120), target.x - KNOCKBACK_DISTANCE);
  if (x === target.x) return false;
  target.x = x;
  return true;
}
