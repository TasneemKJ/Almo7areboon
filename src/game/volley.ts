import { cardBonus } from './data.ts';
import type { BattleState, GameEvent, Profile, Unit } from './types.ts';

/** Watchtower Volley: a gate volley that charges over battle time and may be fired again and again. */
export const VOLLEY_SECONDS = 18, VOLLEY_REACH = 450, VOLLEY_PUSH = 40;
export interface VolleyHost { hurt(unit: Unit, damage: number): number; emit(event: GameEvent): void; }

export function chargeVolley(state: BattleState, dt: number): void {
  if (state.phase === 'running' && Number.isFinite(dt) && dt > 0) state.volley = Math.min(1, (state.volley ?? 0) + dt / VOLLEY_SECONDS);
}
/** Living enemies within reach of the watchtower (the near half of the field). */
export function volleyTargets(state: Readonly<BattleState>): Unit[] {
  return state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0 && unit.x <= VOLLEY_REACH);
}
export function volleyCharge(state: Readonly<BattleState>): number { return Math.max(0, Math.min(1, state.volley ?? 0)); }
export function canFireVolley(state: Readonly<BattleState>): boolean {
  return state.phase === 'running' && !state.paused && volleyCharge(state) >= 1 && volleyTargets(state).length > 0;
}
/** Strikes every enemy in reach and throws survivors back; the charge starts again from empty. */
export function fireVolley(profile: Readonly<Profile>, state: BattleState, host: VolleyHost): boolean {
  if (!canFireVolley(state)) return false;
  const targets = volleyTargets(state), damage = 18 * 1.65 ** profile.age * cardBonus(profile as Profile).damage;
  state.volley = 0;
  for (const unit of targets) {
    host.hurt(unit, damage);
    if (unit.hp > 0) unit.x = Math.min(Math.max(unit.x, 880), unit.x + VOLLEY_PUSH);
  }
  state.units = state.units.filter(unit => unit.hp > 0);
  host.emit({ type: 'volley', amount: targets.length, x: VOLLEY_REACH });
  return true;
}
