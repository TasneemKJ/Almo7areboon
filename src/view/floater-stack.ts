export interface FloaterMark { readonly x: number; readonly startY: number; readonly life: number; readonly max: number; readonly banner: boolean; }

/** Numbers born at the same spot while an earlier one is still fresh stack upward (at most three steps) instead of printing over each other. */
export function stackedY(existing: readonly FloaterMark[], x: number, y: number): number {
  const crowd = existing.filter(f => !f.banner && Math.abs(f.x - x) < 30 && Math.abs(f.startY - y) < 14 && f.life > f.max * 0.5).length;
  return y - Math.min(3, crowd) * 12;
}
