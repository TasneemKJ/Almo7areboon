import type { GameEvent, Profile } from '../game/types.ts';

export function reducedMotion(preference: Profile['motion'], system: boolean): boolean {
  return preference === 'reduced' || system;
}

/** Use the resolved combat hit, not a second nearest-target search after a kill. */
export function projectileForHit(event: GameEvent) {
  if (event.type !== 'hit' || !event.source || event.x === undefined) return null;
  const source=event.source;
  const ranged=source.kind===1 || (source.kind===2 && source.age>=3) || (source.kind===0 && source.age===4);
  if (!ranged) return null;
  return { source, targetX: event.x, targetLane: event.lane ?? source.lane, base: event.target === 'base' };
}
