import type { Unit, UnitKind } from './types.ts';
export type CombatTrait = 'guard' | 'pierce' | 'sweep';
export interface TraitHit { readonly damage: number; readonly trait?: CombatTrait; }
export const ROLE_TRAITS: Readonly<{ guardReduction: number; pierceBonus: number; sweepFraction: number; sweepRadius: number }> = Object.freeze({guardReduction:0.25,pierceBonus:0.35,sweepFraction:0.40,sweepRadius:32});
export function resolveRoleHit(attacker: UnitKind, defender: UnitKind, damage: number, secondary = false): TraitHit {
  if(!Number.isFinite(damage) || damage<=0) return {damage:0};
  if(secondary) return attacker===2 ? {damage:damage*ROLE_TRAITS.sweepFraction,trait:'sweep'} : {damage};
  if(attacker===1 && defender===0) return {damage:damage*(1-ROLE_TRAITS.guardReduction),trait:'guard'};
  if(attacker===1 && defender===2) return {damage:damage*(1+ROLE_TRAITS.pierceBonus),trait:'pierce'};
  return {damage};
}
export function sweepTarget(source: Unit, primary: Unit, candidates: readonly Unit[]): Unit | null {
  const distance=(unit:Unit) => Math.hypot(unit.x-primary.x,(unit.lane-primary.lane)*10);
  return candidates.filter(unit=>unit.id!==source.id && unit.id!==primary.id && unit.side!==source.side && unit.hp>0 && distance(unit)<=ROLE_TRAITS.sweepRadius).sort((a,b)=>distance(a)-distance(b)||a.id-b.id)[0] ?? null;
}
