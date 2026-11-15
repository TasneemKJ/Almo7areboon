/* More from Tas: the shared half of the shelf each game draws in its own style.
 * catalog: more-games/catalog.json (generated from App Store Connect). Pure, no DOM. */
(function (root) {
  'use strict';
  /** The games to show from `self`: live ones only, never the game itself, in catalogue order. */
  function moreGames(catalog, self) {
    const list = (catalog && Array.isArray(catalog.games)) ? catalog.games : [];
    return list.filter((g) => g && g.live === true && g.key !== self);
  }
  /** Opens one game: Apple's in-app store sheet inside the app (the campaign names where it came from),
   *  or the App Store page on the web. Returns 'sheet', 'page' or false. */
  function openMoreGame(bridge, game, self, opener) {
    if (!game || !/^\d+$/.test(String(game.appStoreId))) return false;
    const campaign = ('from-' + String(self || '')).replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
    if (bridge && bridge.inApp && bridge.openStoreProduct(game.appStoreId, campaign)) return 'sheet';
    const open = opener || ((u) => root.open && root.open(u, '_blank', 'noopener'));
    open('https://apps.apple.com/app/id' + game.appStoreId + '?ct=' + encodeURIComponent(campaign));
    return 'page';
  }
  root.TasMoreGames = { moreGames, openMoreGame };
})(typeof window !== 'undefined' ? window : globalThis);
