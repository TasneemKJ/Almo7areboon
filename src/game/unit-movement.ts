import { activeBattleOrder, ORDER_EFFECTS } from './battle-orders.ts';
import { chronicleMovementLimit } from './chronicle-combat.ts';
import type { BattleState, Unit } from './types.ts';

/** Walks a unit toward the enemy base: advance order speed-up, rally limit, and never closer than 22 to the friend ahead in its lane. */
export function advanceUnit(state: BattleState, unit: Unit, speed: number, dt: number): void {
  const direction = unit.side === 'player' ? 1 : -1;
let nextX = unit.x + speed * direction * dt * (unit.side === 'player' && activeBattleOrder(state,state.time) === 'advance' ? ORDER_EFFECTS.advance.movement : 1);
const rallyLimit=chronicleMovementLimit(state,unit);
if(rallyLimit!==null)nextX=Math.min(nextX,rallyLimit);
for (const friend of state.units) {
  if (friend.id === unit.id || friend.side !== unit.side || friend.lane !== unit.lane || friend.hp <= 0) continue;
  if ((friend.x - unit.x) * direction > 0) nextX = direction === 1 ? Math.min(nextX, friend.x - 22) : Math.max(nextX, friend.x + 22);
}
// Never retreat because two bodies were added at an identical position.
unit.x = direction === 1 ? Math.max(unit.x, Math.min(910, nextX)) : Math.min(unit.x, Math.max(90, nextX));
}
