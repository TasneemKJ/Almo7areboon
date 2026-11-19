/**
 * The smith's things, drawn in code in the camp's own ink and brass (camp-illustrations.ts campLampIllustration: ink
 * #243e4a, brass #c7a773, lamp glass #ffdc92): a broken blade for the field, a whole weapon for a hook or the wall, and
 * the forge (anvil on a stump, a brazier of embers). Each troop kind's weapon has its own outline: a sword for the
 * front line, a javelin for the throwers, a lance for the heavies.
 */
const INK = '#243e4a', BRASS = '#c7a773', STEEL = '#cfd6d2', STEEL_DARK = '#8f9c9b', GRIP = '#6b4a2c';
const svg = (cls: string, box: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="${box}" aria-hidden="true" focusable="false">${body}</svg>`;

/** A whole weapon, point up, in a 24x64 box (sword, javelin or lance by troop kind). */
function weapon(kind: number): string {
  if (kind === 1) return `<path d="M12 2L15 13 12 15 9 13Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3"/><path d="M12 15V61" stroke="${GRIP}" stroke-width="2.6" stroke-linecap="round"/><path d="M10 52H14M10 56H14" stroke="${BRASS}" stroke-width="1.4"/>`;
  if (kind === 2) return `<path d="M12 2L14.5 20H9.5Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3"/><path d="M7 22H17L15 26H9Z" fill="${BRASS}" stroke="${INK}" stroke-width="1.2"/><path d="M12 26V62" stroke="${GRIP}" stroke-width="3" stroke-linecap="round"/><path d="M14 24C20 26 21 31 16 33" fill="#a3473a" stroke="${INK}" stroke-width=".9"/>`;
  return `<path d="M12 2L15 8V44H9V8Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3"/><path d="M12 6V42" stroke="${STEEL_DARK}" stroke-width="1"/><path d="M4 44H20" stroke="${BRASS}" stroke-width="3.2" stroke-linecap="round"/><path d="M12 46V57" stroke="${GRIP}" stroke-width="3.4"/><circle cx="12" cy="59.5" r="2.6" fill="${BRASS}" stroke="${INK}" stroke-width="1"/>`;
}
/**
 * A reforged weapon for a hook or the wall. `glint` adds the fresh edge's light. On the wall rack it stands point up on
 * the plank; on a hook (`hanging`) it is turned over so the grip end sits on the peg and the point hangs down, as a
 * weapon on a hook does, rather than balancing on its tip.
 */
export function weaponIllustration(kind: number, glint = false, hanging = false): string {
  if (kind === 0) return `<img class="smithy-weapon smithy-weapon-0${glint ? ' glint' : ''}${hanging ? ' hanging' : ''}" src="/art/storybook/props/smithy-sword.webp" alt="" width="60" height="256" aria-hidden="true"/>`;
  const body = `${glint ? `<path d="M12 4V20" stroke="#fff6dc" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>` : ''}${weapon(kind)}`;
  return svg(`smithy-weapon smithy-weapon-${kind}`, '0 0 24 64', hanging ? `<g transform="rotate(180 12 32)">${body}</g>` : body);
}
/** A broken blade lying on the ground, in two pieces a little apart, with a warm glint so the eye finds it (64x32). */
export function brokenBladeIllustration(kind: number): string {
  const hilt = kind === 1
    ? `<path d="M5 16H33" stroke="${GRIP}" stroke-width="3" stroke-linecap="round"/><path d="M33 14.5L36 16 33.5 17.8" stroke="${GRIP}" stroke-width="1.6" fill="none"/><path d="M8 14.8V17.2M11 14.8V17.2" stroke="${BRASS}" stroke-width="1.3"/>`
    : kind === 2
      ? `<path d="M4 16H33" stroke="${GRIP}" stroke-width="4" stroke-linecap="round"/><path d="M33 13.8L36.5 16 33.5 18.4" stroke="${GRIP}" stroke-width="2" fill="none"/><path d="M14 14C10 8 16 6 18 10Z" fill="#a3473a" stroke="${INK}" stroke-width=".9"/>`
      : `<circle cx="5" cy="16" r="2.6" fill="${BRASS}" stroke="${INK}" stroke-width="1"/><path d="M7.5 16H14" stroke="${GRIP}" stroke-width="3.6"/><path d="M15 9.5V22.5" stroke="${BRASS}" stroke-width="3.2" stroke-linecap="round"/><path d="M16.5 13.4H33L35 15 33.6 16.4 35.5 18.6H16.5Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><path d="M17 16H32" stroke="${STEEL_DARK}" stroke-width=".9"/>`;
  const point = kind === 1
    ? `<path d="M41 16H48" stroke="${GRIP}" stroke-width="3" stroke-linecap="round"/><path d="M47 12.6L59 16 47 19.4 49 16Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`
    : kind === 2
      ? `<path d="M40 16H46" stroke="${GRIP}" stroke-width="4" stroke-linecap="round"/><path d="M45 12.5H48.5V19.5H45Z" fill="${BRASS}" stroke="${INK}" stroke-width="1.1"/><path d="M48.5 13.4L60 16 48.5 18.6Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`
      : `<path d="M41 13.4L43 15 41.4 16.4 43.4 18.6H52L59 16 52 13.4Z" fill="${STEEL}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><path d="M43 16H54" stroke="${STEEL_DARK}" stroke-width=".9"/>`;
  return svg(`broken-blade broken-blade-${kind}`, '0 0 64 32', `<ellipse cx="32" cy="18" rx="30" ry="12" fill="#ffd18a" opacity=".22"/><ellipse cx="32" cy="22" rx="27" ry="4" fill="#102a29" opacity=".45"/><g transform="rotate(-9 32 16)">${hilt}</g><g transform="rotate(7 50 16) translate(1 1)">${point}</g><path class="broken-blade-glint" d="M20 13.2L28 12.4" stroke="#fff6dc" stroke-width="1.6" stroke-linecap="round"/>`);
}
/** The forge: an anvil on a stump and a brazier whose embers glow while there is something to reforge. */
export function forgeIllustration(lit: boolean): string {
  return `<span class="smithy-forge${lit ? ' lit' : ''}" aria-hidden="true"><img class="smithy-forge-img" src="/art/storybook/props/smithy-forge.webp" alt="" width="256" height="199"/></span>`;
}
