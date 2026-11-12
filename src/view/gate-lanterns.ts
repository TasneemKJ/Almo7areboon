/**
 * The Lamplighter's lanterns (the app's subscription, see src/ui/lamplighter-screen.ts): a row of hanging lanterns on
 * the player's side of the field, drawn in the same lantern motif as the Levantine scenery (levantine-scenery.ts
 * `lantern`: ink hanger, brass body #c7a773, warm glass #ffdc92, a soft lamp halo). Pure light: the lanterns stand
 * behind the gate, have no hitbox, and the simulation never knows they exist.
 *
 * They are lit one by one in the first seconds of a battle (the lamplighter's round), then breathe gently. Reduced
 * motion shows them already lit and still.
 */
export interface GateLantern { x: number; y: number; scale: number; lit: number; glow: number }

/** Positions in world units (the field is 450 wide, the player's gate near x 39-110). */
const POSTS = [{ x: 18, lift: 58, scale: .9 }, { x: 64, lift: 74, scale: 1 }, { x: 128, lift: 62, scale: .85 }];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function gateLanternPlan(groundY: number, time: number, reduced: boolean): GateLantern[] {
  const t = Number.isFinite(time) ? Math.max(0, time) : 0;
  const ground = Number.isFinite(groundY) ? groundY : 0;
  return POSTS.map((post, index) => {
    const lit = reduced ? 1 : clamp((t - .4 - index * .7) / .5, 0, 1);
    const breathe = reduced ? 1 : .86 + .14 * Math.sin(t * 2.1 + index * 1.7);
    return { x: post.x, y: ground - post.lift, scale: post.scale, lit, glow: lit * breathe };
  });
}

/** The narrow slice of Phaser.GameObjects.Graphics the painter uses (kept small so tests can record calls). */
export interface LanternGraphics {
  clear(): unknown;
  fillStyle(color: number, alpha?: number): unknown;
  lineStyle(width: number, color: number, alpha?: number): unknown;
  fillCircle(x: number, y: number, r: number): unknown;
  fillRect(x: number, y: number, w: number, h: number): unknown;
  fillTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): unknown;
  lineBetween(x1: number, y1: number, x2: number, y2: number): unknown;
}

const INK = 0x2f3a36, BRASS = 0xc7a773, GLASS_DARK = 0x5b5a48, GLASS = 0xffdc92, HALO = 0xffd18a;

/** Paints the lanterns into `body` (normal blend) and their halos into `glow` (additive). */
export function paintGateLanterns(body: LanternGraphics, glow: LanternGraphics, plan: readonly GateLantern[]): void {
  body.clear(); glow.clear();
  for (const l of plan) {
    const s = l.scale;
    for (const [radius, alpha] of [[34, .10], [22, .16], [12, .24]] as const) {
      glow.fillStyle(HALO, alpha * l.glow); glow.fillCircle(l.x, l.y, radius * s);
    }
    body.lineStyle(2 * s, INK, .9); body.lineBetween(l.x, l.y - 22 * s, l.x, l.y - 13 * s);
    body.fillStyle(BRASS, 1);
    body.fillTriangle(l.x - 6 * s, l.y - 9 * s, l.x, l.y - 15 * s, l.x + 6 * s, l.y - 9 * s);
    body.fillRect(l.x - 6 * s, l.y - 9 * s, 12 * s, 18 * s);
    body.fillStyle(GLASS_DARK, 1); body.fillRect(l.x - 3 * s, l.y - 7 * s, 6 * s, 13 * s);
    body.fillStyle(GLASS, l.lit); body.fillRect(l.x - 3 * s, l.y - 7 * s, 6 * s, 13 * s);
    body.lineStyle(1.4 * s, INK, .8); body.lineBetween(l.x - 6 * s, l.y - 8 * s, l.x + 6 * s, l.y - 8 * s); body.lineBetween(l.x - 5 * s, l.y + 8 * s, l.x + 5 * s, l.y + 8 * s);
  }
}
