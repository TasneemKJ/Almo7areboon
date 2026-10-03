export type BattlefieldRendererMode = 'auto' | 'canvas';

/**
 * WebKit's transparent WebGL presentation can stop compositing while its
 * context and draw loop remain healthy. Use the advertised engine signature
 * as a best-effort boundary: AppleWebKit routes to Canvas, while desktop
 * Blink-family signatures retain Phaser's normal AUTO selection.
 */
export function battlefieldRendererMode(userAgent: string): BattlefieldRendererMode {
  const agent = typeof userAgent === 'string' ? userAgent : '';
  const appleWebKit = /AppleWebKit\//i.test(agent);
  const desktopBlink = /(?:Chrome|Chromium|Edg|OPR)\//i.test(agent);
  return appleWebKit && !desktopBlink ? 'canvas' : 'auto';
}
