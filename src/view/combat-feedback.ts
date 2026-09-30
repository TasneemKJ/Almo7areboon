import type { CombatTrait } from '../game/role-traits.ts';
import type { GameEvent, Profile } from '../game/types.ts';

export function reducedMotion(preference: Profile['motion'], system: boolean): boolean {
  return preference === 'reduced' || system;
}

/** Use the resolved combat hit, not a second nearest-target search after a kill. */
export function projectileForHit(event: GameEvent) {
  if (event.trait === 'sweep') return null;
  if (event.type !== 'hit' || !event.source || event.x === undefined) return null;
  const source=event.source;
  const ranged=source.kind===1 || (source.kind===2 && source.age>=3) || (source.kind===0 && source.age===4);
  if (!ranged) return null;
  return { source, targetX: event.x, targetLane: event.lane ?? source.lane, base: event.target === 'base' };
}


/** Resolved unit damage is the sole source of specialty presentation. */
export function traitCueForHit(event: GameEvent): {trait:CombatTrait;x:number;lane:number} | null {
  if(event.type!=='hit'||event.target!=='unit'||!Number.isFinite(event.amount)||(event.amount??0)<=0||!Number.isFinite(event.x)||!Number.isFinite(event.lane))return null;
  if(event.trait!=='guard'&&event.trait!=='pierce'&&event.trait!=='sweep')return null;
  return {trait:event.trait,x:event.x!,lane:event.lane!};
}
