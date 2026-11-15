// More from Tas (owner brief, 2026-11-15): a quiet row in Preferences opens a small sheet of the studio's other live
// games. In the app a row opens Apple's in-app store sheet through the bridge; on the web, the App Store page. Never
// during a battle, never a pop-up. The shared files are tas-engine's at ffcf5bc, byte for byte; the catalogue is
// bundled, never fetched. The flow through the shell (open, tap, the way back, the field pause) is tested in
// tests/main-integration.test.ts; the one-language rule in tests/locale.test.ts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { MORE_GAMES_SELF, moreGameLabel, moreGames, moreGamesHtml, moreGamesRowHtml, openMoreGame, type MoreGame } from '../src/ui/more-games-screen.ts';
import { createAppBridge } from '../src/ui/app-bridge.ts';
import { setLang } from '../src/game/locale.ts';

const ROOT = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, ROOT));
const text = (path: string) => read(path).toString('utf8');
const PIN = 'ffcf5bc';
const ALMO_ID = '6834161789';
const catalog = JSON.parse(text('src/vendor/more-games/catalog.json')) as { games: (MoreGame & { url: string })[] };

/** Each copy, the engine file it copies at ffcf5bc, and that file's SHA-256 (so the check holds without tas-engine). */
const COPIES: [copy: string, engine: string, sha256: string][] = [
  ['src/vendor/more-games.js', 'web/more-games.js', '3a413618cc9cffbce7e886a98829db86e893ef3e227c3fc47b847201d65c3c12'],
  ['src/vendor/more-games/catalog.json', 'web/more-games/catalog.json', '04f9895068e199e5a163e769edf605e59c0ac795c4fba6f74c5cd46cabf6d786'],
  ['src/vendor/tas-bridge.js', 'web/tas-bridge.js', 'a93498777f1a553466a496b7b7c3a4e33a7657f412f264b896f2c62041cdb466'],
  ['public/more-games/almo.png', 'web/more-games/almo.png', '10aa266ea414dbd4bcb9eb8ba213ef5f404b378772418bab48a6653d1c96ffe4'],
  ['public/more-games/bait.png', 'web/more-games/bait.png', 'd0a19a867cc677a40dd88dad8c2d1f7ef9511ae2e7f8abe2b406cb7c168847e4'],
  ['public/more-games/bayyara.png', 'web/more-games/bayyara.png', 'eaad9b17256987df742236f50f4ddb93add956c461d6ca818e2e7352d56bcedc'],
  ['public/more-games/ejar.png', 'web/more-games/ejar.png', '1a0a93a4b2264240a649efc51975988653afe79711e5954605da555daa8c85cf'],
  ['public/more-games/ghurza.png', 'web/more-games/ghurza.png', '7745fb36cb794277f7d2266f60feebcb0839b143b52045d56808187260b97bc2'],
  ['public/more-games/nafitha.png', 'web/more-games/nafitha.png', '4dba523e577d94d8d0ec25a971d13a4cf085cef941c603e9edee288bca312383'],
  ['public/more-games/souq.png', 'web/more-games/souq.png', 'ecdf316885963e4864c2427395c3ecbb1d96ed7dc2eeadc3369532686a347f2e'],
];
const engine = new URL('../tas-engine/', ROOT).pathname;
const atPin = (path: string) => execFileSync('git', ['-C', engine, 'show', `${PIN}:${path}`], { maxBuffer: 1 << 24 });
const hasEngine = (() => { try { atPin('web/more-games.js'); return true; } catch { return false; } })();

test('the copies are tas-engine\'s files at ffcf5bc, byte for byte (pinned by hash)', () => {
  for (const [copy, , sha256] of COPIES) assert.equal(createHash('sha256').update(read(copy)).digest('hex'), sha256, `${copy} changed; copy it again from tas-engine ${PIN}`);
  assert.deepEqual(readdirSync(new URL('public/more-games/', ROOT)).sort(), ['almo.png', 'bait.png', 'bayyara.png', 'ejar.png', 'ghurza.png', 'nafitha.png', 'souq.png']);
  assert.deepEqual(readdirSync(new URL('src/vendor/more-games/', ROOT)), ['catalog.json']);
});

test('the copies equal tas-engine ffcf5bc itself, byte for byte', { skip: !hasEngine && 'tas-engine is not checked out beside this repo' }, () => {
  for (const [copy, original] of COPIES) assert.ok(read(copy).equals(atPin(original)), `${copy} = ${PIN}:${original}`);
});

test('the bridge has openStoreProduct, and the vendored helper keeps its own .d.ts beside it', () => {
  assert.match(text('src/vendor/tas-bridge.js'), /openStoreProduct\(id, campaign\) \{ return this\.post\('openStoreProduct', \{ id: String\(id\), campaign: String\(campaign \|\| ''\) \}\); \}/);
  assert.match(text('src/vendor/more-games.d.ts'), /var TasMoreGames/);
  const { win, posted } = (() => { const posted: unknown[] = []; return { posted, win: { webkit: { messageHandlers: { almo7areboon: { postMessage: (m: unknown) => posted.push(m) } } } } }; })();
  assert.equal(createAppBridge(win).openStoreProduct('6832737533', 'from-almo'), true);
  assert.deepEqual(posted, [{ type: 'openStoreProduct', data: { id: '6832737533', campaign: 'from-almo' } }]);
});

test('the catalogue is bundled with the game, never fetched, and every icon ships where it says', () => {
  const screen = text('src/ui/more-games-screen.ts');
  assert.match(screen, /^import bundledCatalog from '\.\.\/vendor\/more-games\/catalog\.json' with \{ type: 'json' \};$/m);
  assert.match(screen, /^import '\.\.\/vendor\/more-games\.js';$/m);
  assert.doesNotMatch(screen, /fetch\(|XMLHttpRequest/);
  for (const game of catalog.games) assert.ok(existsSync(new URL(`public/${game.icon}`, ROOT)), game.icon);
});

test('the list is the live games, in catalogue order, minus Almo7areboon', () => {
  assert.equal(MORE_GAMES_SELF, 'almo');
  const keys = moreGames().map(game => game.key);
  assert.deepEqual(keys, catalog.games.filter(game => game.live === true && game.key !== 'almo').map(game => game.key));
  assert.ok(keys.length >= 1 && !keys.includes('almo'));
  for (const game of catalog.games.filter(entry => !entry.live)) assert.ok(!keys.includes(game.key), `${game.key} is not live yet`);
  assert.equal(moreGamesRowHtml([]), '', 'nothing live, no row');
});

test('a tap calls TasMoreGames.openMoreGame with \'almo\': Apple\'s sheet in the app, with the from-almo campaign', () => {
  const api = globalThis.TasMoreGames, calls: unknown[][] = [];
  const real = api.openMoreGame;
  api.openMoreGame = (...args) => { calls.push(args); return real(...args); };
  try {
    const asked: [string, string][] = [];
    const bridge = { inApp: true, openStoreProduct: (id: string, campaign: string) => { asked.push([id, campaign]); return true; } };
    const [first] = moreGames();
    assert.equal(openMoreGame(first.key, bridge), 'sheet');
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], bridge); assert.equal((calls[0][1] as MoreGame).key, first.key); assert.equal(calls[0][2], 'almo');
    assert.deepEqual(asked, [[first.appStoreId, 'from-almo']]);
    assert.equal(openMoreGame('almo', bridge), false, 'never this game');
    assert.equal(openMoreGame('bait', bridge), false, 'never a game that is not live');
    assert.equal(openMoreGame(undefined, bridge), false);
    assert.equal(calls.length, 1);
  } finally { api.openMoreGame = real; }
});

test('on the web a tap opens the App Store page with the from-almo campaign', () => {
  const opened: unknown[][] = [];
  const g = globalThis as unknown as { open?: unknown };
  const before = g.open;
  g.open = (...args: unknown[]) => { opened.push(args); return null; };
  try {
    const [first] = moreGames();
    assert.equal(openMoreGame(first.key, { inApp: false, openStoreProduct: () => false }), 'page');
    assert.deepEqual(opened, [[`https://apps.apple.com/app/id${first.appStoreId}?ct=from-almo`, '_blank', 'noopener']]);
  } finally { g.open = before; }
});

test('the sheet is one native button per game, with icon, name, hook and age, labelled for VoiceOver in both languages', () => {
  try {
    for (const lang of ['en', 'ar'] as const) {
      setLang(lang);
      const games = moreGames(), html = moreGamesHtml(games);
      assert.equal((html.match(/<button class="more-game" data-more-game="/g) ?? []).length, games.length);
      for (const game of games) {
        assert.ok(html.includes(`<img class="more-game-icon" src="${game.icon}" alt=""`), game.icon);
        assert.ok(html.includes(`<strong>${game.name[lang]}</strong>`) && html.includes(`<span>${game.hook[lang]}</span>`), game.key);
        assert.ok(html.includes(`<bdi dir="ltr">${game.age}</bdi>`), 'the age reads left to right inside Arabic');
        const label = moreGameLabel(game);
        assert.ok(label.startsWith(lang === 'ar' ? `${game.name.ar}، ${game.hook.ar}، للأعمار ` : `${game.name.en}, ${game.hook.en}, Rated `), label);
        assert.ok(html.includes(`aria-label="${label}"`));
      }
      assert.match(html, lang === 'ar' ? /<h2 id="dialog-title">ألعاب أخرى من Tas<\/h2>/ : /<h2 id="dialog-title">More from Tas<\/h2>/);
      assert.match(html, /<button class="big-button secondary more-games-back" data-command="close">/);
      assert.match(moreGamesRowHtml(), lang === 'ar' ? /data-command="more-games">ألعاب أخرى من Tas</ : /data-command="more-games">More from Tas</);
    }
  } finally { setLang('en'); }
});

test('the copy is plain: no exclamation, no ل-م-س, no sale words, and the studio in Latin letters', () => {
  const screen = text('src/ui/more-games-screen.ts');
  const strings = [...screen.matchAll(/tr\(\s*'([^']*)',\s*'([^']*)'\)/g)];
  assert.ok(strings.length >= 3);
  for (const [, en, ar] of strings) {
    assert.ok(en && ar, 'both languages');
    assert.doesNotMatch(en + ar, /!/);
    assert.doesNotMatch(ar, /ل[\u064B-\u0652]*م[\u064B-\u0652]*س|تاس/, 'no form of ل-م-س; Tas in Latin letters');
    assert.doesNotMatch(en + ar, /\bfree\b|\bsale\b|download|\bnew\b|مجان|جديد|حمّل|اشترِ/i);
  }
  assert.ok(strings.some(([, en, ar]) => en === 'More from Tas' && ar === 'ألعاب أخرى من Tas'));
  assert.match(screen, /انقر على إحداها/, 'a tap is «انقر»');
});

test('rows are at least 44px, the row and Back too, and the sheet follows the page direction', () => {
  const css = text('src/ui/preferences.css');
  const minHeight = (selector: string) => Number(css.match(new RegExp(`${selector.replace('.', '\\.')}\\{[^}]*min-height:(\\d+)px`))?.[1] ?? 0);
  for (const selector of ['.more-game', '.preferences-more-games', '.more-games-back']) assert.ok(minHeight(selector) >= 44, selector);
  assert.match(css, /\.more-game\{[^}]*text-align:start/);
  assert.match(css, /\.more-games-list\{[^}]*text-align:start/);
});

test('the iPhone app allows exactly the other games\' IDs (Almo7areboonConfig.swift moreGames)', () => {
  const swift = text('ios/Almo7areboon/Almo7areboonConfig.swift');
  const block = swift.match(/moreGames:\s*\[([^\]]*)\]/);
  assert.ok(block, 'moreGames is passed');
  const ids = [...block[1].matchAll(/"(\d+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, catalog.games.map(game => game.appStoreId).filter(id => id !== ALMO_ID));
  assert.equal(catalog.games.find(game => game.key === 'almo')?.appStoreId, ALMO_ID);
  // TasGameConfig.init (tas-engine ffcf5bc) takes moreGames after debugJSDefaultsKey and syncInterval, both before it.
  assert.ok(swift.indexOf('debugJSDefaultsKey:') < swift.indexOf('moreGames:'));
  assert.doesNotMatch(swift, /storeProviderToken:/);
});
