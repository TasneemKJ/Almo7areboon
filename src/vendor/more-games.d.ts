// Types for the vendored "More from Tas" helper (more-games.js, tas-engine ffcf5bc), a classic script that defines
// globalThis.TasMoreGames. The .js beside this file is a byte-for-byte copy and is never edited here.
export {};

declare global {
  // eslint-disable-next-line no-var
  var TasMoreGames: {
    /** The games to show from `self`: live ones only, never the game itself, in catalogue order. */
    moreGames<T extends { live?: unknown; key?: unknown }>(catalog: { games?: readonly T[] } | null | undefined, self: string): T[];
    /** Apple's in-app store sheet in the app ('sheet'), the App Store page on the web ('page'), or false. */
    openMoreGame(bridge: { inApp: boolean; openStoreProduct(id: string, campaign: string): boolean } | null, game: { appStoreId: string } | null | undefined, self: string, opener?: (url: string) => void): 'sheet' | 'page' | false;
  };
}
