import type { BattleState } from './types.ts';
export type BattleOrder = 'advance' | 'hold';
export interface BattleOrders { charge: number; active: BattleOrder | null; until: number; }
export const ORDER_COST = 60, ORDER_DURATION = 10;
export const ORDER_EFFECTS = { advance: { damage: 1.2, movement: 1.15 }, hold: { received: .75 } } as const;
export function createBattleOrders(): BattleOrders { return { charge: 0, active: null, until: 0 }; }
export function earnMomentum(state: BattleState, amount: number): void {
  if (!state.orders || state.phase !== 'running' || !Number.isFinite(amount) || amount <= 0) return;
  state.orders.charge = Math.min(100, state.orders.charge + Math.floor(amount));
}
export function activeBattleOrder(state: Readonly<BattleState>, time: number): BattleOrder | null {
  return state.phase === 'running' && state.orders && time < state.orders.until - 1e-9 ? state.orders.active : null;
}
export function canIssueOrder(state: Readonly<BattleState>, order: unknown): order is BattleOrder {
  return (order === 'advance' || order === 'hold') && state.phase === 'running' && !state.paused &&
    !!state.orders && state.orders.charge >= ORDER_COST && activeBattleOrder(state, state.time) === null;
}
export function issueBattleOrder(state: BattleState, order: unknown): boolean {
  if (!canIssueOrder(state, order)) return false;
  state.orders!.charge -= ORDER_COST;
  state.orders!.active = order;
  state.orders!.until = state.time + ORDER_DURATION;
  state.stats.ordersCast = (state.stats.ordersCast ?? 0) + 1;
  return true;
}
