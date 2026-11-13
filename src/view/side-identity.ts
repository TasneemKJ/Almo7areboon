import type { Side } from '../game/types.ts';

/**
 * Which company a troop belongs to, readable at a glance even when both sides field the same painted troop (chapter 1
 * against chapter 1). Your company keeps its painted colours and stands on a lamp-blue ring; the rival company wears a
 * warm rust cast and stands on an ember ring. The two colours are the base health bars' own (battlefield-overlays.ts),
 * so a troop, its ring and its gate's bar always agree. Facing already differs (yours face right, theirs left).
 */
export const SIDE_COLOURS = { player: 0x68c9ee, enemy: 0xf19d75 } as const;
const FROST = 0x9feef2;

/** Multiply tint for a painted troop; null keeps the painting untouched. */
export function sideTint(side: Side): number | null { return side === 'enemy' ? 0xf2a68c : null; }

/** The ground ring under a troop (an ellipse outline in world units). */
export function sideRing(side: Side, scale: number, frozen: boolean): { color: number; alpha: number; rx: number; ry: number; width: number } {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return { color: frozen ? FROST : SIDE_COLOURS[side], alpha: .72, rx: 17 * s, ry: 5 * s, width: 1.6 * s };
}
