import '../vendor/more-games.js';
import bundledCatalog from '../vendor/more-games/catalog.json' with { type: 'json' };
import { almoApp, type TasBridge } from './app-bridge.ts';
import { lang, n, tr } from './i18n.ts';

/**
 * More from Tas: the studio's other games, on a small sheet reached only from Preferences, never during a battle and
 * never as a pop-up. The rule and the catalogue are tas-engine's (ffcf5bc), copied byte for byte into src/vendor/:
 * more-games.js defines the one global read here (TasMoreGames) and more-games/catalog.json is bundled with the
 * game, never fetched. The icons ship as public/more-games/*.png, the paths the catalogue names. In the app a row
 * opens Apple's in-app store sheet (TasKit openStoreProduct, allowed for the IDs in Almo7areboonConfig.swift
 * `moreGames`); on the web, the game's App Store page.
 */
export const MORE_GAMES_SELF = 'almo';

export interface MoreGame {
  readonly key: string;
  readonly appStoreId: string;
  readonly name: { readonly en: string; readonly ar: string };
  readonly hook: { readonly en: string; readonly ar: string };
  readonly age: string;
  readonly live: boolean;
  readonly icon: string;
}
export interface MoreGamesCatalog { readonly games: readonly MoreGame[] }

const CATALOG: MoreGamesCatalog = bundledCatalog;
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

/** The live games to show, in catalogue order, never Almo7areboon itself. */
export function moreGames(catalog: MoreGamesCatalog = CATALOG): MoreGame[] {
  return globalThis.TasMoreGames?.moreGames(catalog, MORE_GAMES_SELF) ?? [];
}

/** One row's spoken label: the name, the one-line hook and the age rating, in the current language. */
export function moreGameLabel(game: MoreGame): string {
  const ar = lang() === 'ar';
  return [game.name[lang()], game.hook[lang()], tr(`Rated ${game.age}`, `للأعمار ${game.age}`)].join(ar ? '، ' : ', ');
}

/** The quiet Preferences row; empty when nothing is live. */
export function moreGamesRowHtml(games: readonly MoreGame[] = moreGames()): string {
  return games.length ? `<button class="preferences-more-games" data-command="more-games">${tr('More from Tas', 'ألعاب أخرى من Tas')}</button>` : '';
}

/** The sheet: one native button per game, with its icon, name, hook and age rating, and the way back. */
export function moreGamesHtml(games: readonly MoreGame[] = moreGames()): string {
  const rows = games.map(game => `<li><button class="more-game" data-more-game="${escape(game.key)}" aria-label="${escape(moreGameLabel(game))}"><img class="more-game-icon" src="${escape(game.icon)}" alt="" width="56" height="56"><span class="more-game-text" aria-hidden="true"><strong>${escape(game.name[lang()])}</strong><span>${escape(game.hook[lang()])}</span></span><span class="more-game-age" aria-hidden="true">${n(escape(game.age))}</span></button></li>`).join('');
  return `<h2 id="dialog-title">${tr('More from Tas', 'ألعاب أخرى من Tas')}</h2>
 <p class="more-games-lead">${tr('Other games from the studio that made this one. Tap one to open its store page.', 'ألعاب أخرى من الاستوديو الذي صنع هذه اللعبة. انقر على إحداها لتفتح صفحتها في المتجر.')}</p>
 <ul class="more-games-list">${rows}</ul>
 <button class="big-button secondary more-games-back" data-command="close">${tr('Back', 'رجوع')}</button>`;
}

/** A tap on one row: Apple's store sheet in the app, the App Store page on the web. False for anything not listed. */
export function openMoreGame(key: string | undefined, bridge: Pick<TasBridge, 'inApp' | 'openStoreProduct'> = almoApp, games: readonly MoreGame[] = moreGames()): 'sheet' | 'page' | false {
  const game = games.find(entry => entry.key === key);
  if (!game || !globalThis.TasMoreGames) return false;
  return globalThis.TasMoreGames.openMoreGame(bridge, game, MORE_GAMES_SELF);
}
