export type BattlefieldRendererMode = 'auto' | 'canvas';

/**
 * WebKit's transparent WebGL presentation can stop compositing while its
 * context and draw loop remain healthy. Safari and every iOS browser share
 * that engine; other engines retain Phaser's normal AUTO selection.
 */
export function battlefieldRendererMode(userAgent: string): BattlefieldRendererMode {
  const agent = typeof userAgent === 'string' ? userAgent : '';
  const appleMobile = /\b(?:iPhone|iPad|iPod)\b/i.test(agent);
  const iosBrowser = /(?:CriOS|FxiOS|EdgiOS|OPiOS)\//i.test(agent);
  const safari = /AppleWebKit/i.test(agent)
    && /Safari/i.test(agent)
    && !/(?:Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|FxiOS)/i.test(agent);
  return appleMobile || iosBrowser || safari ? 'canvas' : 'auto';
}
