export interface FloaterMark { readonly x: number; readonly startY: number; readonly life: number; readonly max: number; readonly banner: boolean; }

/**
 * Text born at the same spot while an earlier one of its kind is still clearly visible stacks upward instead of printing over it:
 * damage and coin numbers step 12px (at most three steps), large skill banners step 26px (at most two).
 */
export function stackedY(existing: readonly FloaterMark[], x: number, y: number, banner = false): number {
  const reach = banner ? 30 : 14;
  const crowd = existing.filter(f => f.banner === banner && Math.abs(f.x - x) < 30 && Math.abs(f.startY - y) < reach && f.life > f.max * (banner ? 0.25 : 0.5)).length;
  return y - Math.min(banner ? 2 : 3, crowd) * (banner ? 26 : 12);
}
