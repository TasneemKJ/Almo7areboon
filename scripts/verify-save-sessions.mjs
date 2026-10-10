/** Actual built app, shared localStorage and real Web Locks; no game debug hooks. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { decodeSave } from '../src/game/save.ts';
import { syncWeekly, weekId } from '../src/game/weekly.ts';
import { localDay } from '../src/game/data.ts';

const output = 'artifacts/save-session-review', origin = 'http://127.0.0.1:4175';
const primary = 'almo7areboon.save.v1', backup = `${primary}.backup`;
mkdirSync(output, { recursive: true });
const diagnostics = { revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), origin, cases: [], pageErrors: [], status: 'failed' };
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'pipe' });
let log = '', browser;
server.stdout.on('data', chunk => { log += chunk; });
server.stderr.on('data', chunk => { log += chunk; });
const fixture = (overrides = {}) => {
  const decoded = decodeSave(JSON.stringify({ version: 2, timeline: 1, age: 0, enemyAge: 0, furthestBattle: 0, coins: 500, gems: 100, foodLevel: 0, baseLevel: 0, unlocked: [true, false, false], cards: Array(30).fill(0), summonCount: 0, summonSeed: 1831565813, pendingVictory: null, played: true, kills: 0, wins: 0, deployed: 0, claimed: [], sound: false, speed: 1, motion: 'reduced', ...overrides }));
  assert.equal(decoded.problem, null);
  syncWeekly(decoded.profile, weekId(localDay()));
  return decoded.profile;
};
function watch(page) { page.on('pageerror', error => diagnostics.pageErrors.push({ url: page.url(), message: error.message })); return page; }
async function open(context) { const page = watch(await context.newPage()); await page.goto(origin, { waitUntil: 'networkidle' }); return page; }
async function setup(context, profile = fixture(), backupProfile = profile) {
  const page = watch(await context.newPage());
  await page.route(`${origin}/__save-session-setup`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Save fixture setup</title>' }));
  await page.goto(`${origin}/__save-session-setup`);
  await page.evaluate(({ primary, backup, profile, backupProfile }) => { localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(backupProfile)); }, { primary, backup, profile, backupProfile });
  return page;
}
async function bytes(page) { return page.evaluate(({ primary, backup }) => [localStorage.getItem(primary), localStorage.getItem(backup)], { primary, backup }); }
async function active(page) { await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active' && !document.querySelector('#modal-layer .session-dialog') && ['#entry-screen', '#camp-view', '#battle-view'].some(selector => { const node = document.querySelector(selector); return node && !node.inert && node.getClientRects().length; })); }
async function blocked(page, title = 'Game open in another tab') {
  const heading = page.getByRole('heading', { name: title, exact: true });
  await heading.waitFor();
  // Session presentation can replace the modal after the role locator resolves.
  // Reacquire both current elements and their styles in one synchronous task.
  const measurement = await page.waitForFunction(title => {
    const node = document.querySelector('#modal-layer .session-dialog #dialog-title');
    if (!node?.isConnected || node.textContent.trim() !== title || !node.getClientRects().length) return false;
    const dialog = node.closest('.dialog');
    if (!dialog?.isConnected) return false;
    const luminance = color => {
      const rgb = color.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/[,\s]+/).map(Number);
      if (!rgb || (rgb.length !== 3 && !(rgb.length === 4 && rgb[3] === 1)) || rgb.slice(0, 3).some(value => !Number.isFinite(value) || value < 0 || value > 255)) return null;
      const channels = rgb.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const foreground = getComputedStyle(node).color;
    const background = getComputedStyle(dialog).backgroundColor;
    const a = luminance(foreground), b = luminance(background);
    if (a === null || b === null) return { error: 'Expected opaque computed RGB colors', foreground, background };
    return { foreground, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  }, title);
  let contrast;
  try { contrast = await measurement.jsonValue(); } finally { await measurement.dispose(); }
  assert.ok(!contrast.error, `Invalid recovery contrast measurement for ${title}: ${JSON.stringify(contrast)}`);
  assert.ok(contrast.ratio >= 4.5, `${title} must be readable on its paper dialog: ${JSON.stringify(contrast)}`);
}
function progress(profile) {
  // Autosave stamps wall-clock presence on the stored copy; every gameplay,
  // reward, receipt and preference field must otherwise remain identical.
  const { lastSeen, ...persistent } = profile;
  return persistent;
}
// Home/Camp navigation must not dispatch start or settle a held receipt.
async function camp(page) {
  const before = progress(JSON.parse((await bytes(page))[0]));
  await page.locator('#entry-secondary[data-command="home-camp"]').click();
  await page.locator('[data-camp-station="journal"]').waitFor();
  assert.equal(await page.locator('#world').getAttribute('data-phase'), 'ready');
  assert.deepEqual(progress(JSON.parse((await bytes(page))[0])), before, 'Camp entry preserves stored progression');
}
async function cards(page) {
  await camp(page);
  await page.locator('[data-camp-station="journal"]').click();
  await page.locator('[data-command="camp-journal"]').click();
  await page.locator('[data-journey-tab="cards"]').click();
}
async function home(page) {
  if (await page.getByRole('heading', { name: '1 card summoned', exact: true }).isVisible()) await page.getByRole('button', { name: 'BACK TO COLLECTION', exact: true }).click();
  if (await page.locator('[data-command="camp-return"]').isVisible()) await page.locator('[data-command="camp-return"]').click();
  if (await page.locator('[data-command="camp-home"]').isVisible()) await page.locator('[data-command="camp-home"]').click();
  await page.locator('#entry-settings').waitFor();
}
async function settings(page) {
  await home(page);
  await page.locator('#entry-settings').click();
  await page.getByRole('heading', { name: 'Preferences', exact: true }).waitFor();
}
async function recovery(page) { await page.locator('[data-command="save-recovery"]').click(); }
async function exported(page) {
  const fromPreferences = await page.getByRole('heading', { name: 'Preferences', exact: true }).isVisible();
  if (fromPreferences) await recovery(page);
  const download = page.waitForEvent('download');
  await page.locator('[data-command="export"]').click();
  const result = await download;
  const profile = JSON.parse(readFileSync(await result.path(), 'utf8')).profile;
  if (fromPreferences) await page.getByRole('button', { name: 'Back', exact: true }).click();
  return profile;
}
async function summon(page) {
  await cards(page);
  await page.getByRole('button', { name: 'Summon 1 card for 100 gems', exact: true }).click();
  await page.getByRole('heading', { name: '1 card summoned', exact: true }).waitFor();
}
async function result(page) {
  const before = progress(JSON.parse((await bytes(page))[0]));
  await page.locator('#entry-play').click(); await page.locator('.result-dialog').waitFor();
  assert.deepEqual(progress(JSON.parse((await bytes(page))[0])), before, 'Continue displays the receipt without re-awarding or settling it');
}
async function scenario(name, callback, options = {}) {
  console.log(`Save-session case: ${name}`);
  const context = await browser.newContext({ viewport: options.viewport ?? { width: 320, height: 640 }, reducedMotion: 'reduce', acceptDownloads: true });
  context.setDefaultTimeout(12000);
  try { if (options.noLocks) await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined })); await callback(context); diagnostics.cases.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); diagnostics.cases.push({ name, status: 'failed', error: error.stack }); for (const [index, page] of context.pages().entries()) await page.screenshot({ path: `${output}/${name}-failure-${index}.png` }).catch(() => {}); }
  finally { await context.close(); }
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview exited ${server.exitCode}: ${log}`);
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, `Preview did not start: ${log}`);
  browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), headless: true, timeout: 30000 });
  await scenario('two-tab-takeover', async context => {
    const source = await setup(context), a = await open(context); await active(a); await summon(a);
    const b = await open(context); await blocked(b);
    const blockedPhase = await b.locator('#world').getAttribute('data-phase');
    await b.keyboard.press('Escape'); await b.keyboard.press('Space'); await b.keyboard.press('1'); await blocked(b);
    assert.equal(await b.locator('[data-command="session-temporary"]').count(), 0);
    assert.equal(await b.locator('.close-button').count(), 0);
    await b.keyboard.press('Tab'); assert.equal(await b.evaluate(() => !!document.activeElement?.closest('#modal-layer')), true);
    const bounds = await b.locator('.session-dialog').evaluate(node => { const rect = node.getBoundingClientRect(); return { left: rect.left, right: rect.right, bottom: rect.bottom, width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth }; });
    assert.ok(bounds.left >= 0 && bounds.right <= bounds.width && bounds.bottom <= bounds.height && bounds.scroll <= bounds.width, JSON.stringify(bounds));
    await b.screenshot({ path: `${output}/blocked-320.png` });
    // Let the owner save its post-summon backup; the peer must stay inert past autosave.
    await source.waitForFunction(key => JSON.parse(localStorage.getItem(key)).cards.reduce((sum, n) => sum + n, 0) === 1, backup);
    const protectedBytes = await bytes(source); await b.waitForTimeout(5500); assert.deepEqual(await bytes(source), protectedBytes);
    // Blocked Home never paints the hidden field; verify the actual input owner
    // and unchanged presentation rather than expecting a fabricated ready HUD.
    assert.equal(await b.locator('#entry-screen').evaluate(node => node.inert), true);
    assert.equal(await b.locator('#entry-play').isDisabled(), true);
    assert.equal(await b.locator('#battle-view').evaluate(node => node.inert), true);
    assert.equal(await b.locator('#world').getAttribute('data-phase'), blockedPhase);
    assert.equal(await b.locator('#food-count').textContent(), '6');
    await b.close(); assert.deepEqual(await bytes(source), protectedBytes);
    const peer = await open(context); await blocked(peer); await peer.locator('[data-command="session-continue"]').click(); await blocked(peer);
    await peer.waitForFunction(() => document.activeElement?.getAttribute('data-command') === 'session-continue');
    await a.close(); await peer.locator('[data-command="session-continue"]').click(); await active(peer);
    await cards(peer); assert.equal(await peer.locator('#gems').textContent(), '0');
    assert.match(await peer.locator('.collection-summary').textContent(), /^1 \/ 30 discovered/);
    await settings(peer); await peer.locator('#preference-speed').selectOption('2');
    assert.equal(JSON.parse((await bytes(source))[0]).speed, 2);
    await peer.reload({ waitUntil: 'networkidle' }); await active(peer); await settings(peer); assert.equal(await peer.locator('#preference-speed').inputValue(), '2'); assert.equal((await exported(peer)).gems, 0);
  });
  await scenario('simultaneous-startup', async context => {
    await setup(context); const a = watch(await context.newPage()), b = watch(await context.newPage());
    await Promise.all([a.goto(origin, { waitUntil: 'networkidle' }), b.goto(origin, { waitUntil: 'networkidle' })]);
    const states = await Promise.all([a,b].map(page => page.locator('#app').getAttribute('data-save-session')));
    assert.deepEqual(states.sort(), ['active', 'blocked']);
  });
  for (const target of ['primary', 'future-backup']) await scenario(`foreign-${target}`, async context => {
    const source = await setup(context), a = await open(context); await active(a); await summon(a);
    const previous = JSON.parse((await bytes(source))[0]);
    await source.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: target === 'primary' ? primary : backup, value: JSON.stringify(target === 'primary' ? fixture({ gems: 321, coins: 999 }) : { version: 99 }) });
    await blocked(a, 'Your save changed in another tab'); const changed = await bytes(source);
    const rescued = await exported(a); assert.equal(rescued.gems, previous.gems); assert.deepEqual(rescued.cards, previous.cards);
    await a.keyboard.press('Escape'); await a.keyboard.press('Space'); await a.keyboard.press('q'); await a.waitForTimeout(5500); assert.deepEqual(await bytes(source), changed);
    await a.screenshot({ path: `${output}/${target}-conflict-320.png` });
    await a.locator('[data-command="session-continue"]').click();
    if (target === 'primary') { await active(a); assert.equal(await a.locator('#gems').textContent(), '321'); }
    else { await blocked(a, 'This save needs a newer game version'); assert.deepEqual(await bytes(source), changed); }
  });
  for (const trigger of ['preference', 'focus']) await scenario(`baseline-before-${trigger}`, async context => {
    const source = await setup(context), a = await open(context); await active(a); await settings(a);
    // Inject unannounced foreign bytes and trigger the real handler in one task.
    // A write in this document emits no storage event here. Keeping the trigger
    // synchronous prevents autosave from replacing Settings before its click.
    // Cross-tab storage notifications are covered by the foreign-* scenarios.
    const foreign = await a.evaluate(({ primary, backup, profile, trigger }) => {
      const button = document.querySelector('#preference-speed');
      if (trigger === 'preference' && !button) throw new Error('Settings speed control missing before fault injection');
      localStorage.setItem(primary, JSON.stringify(profile));
      const expected = [localStorage.getItem(primary), localStorage.getItem(backup)];
      if (trigger === 'preference') { button.value = '2'; button.dispatchEvent(new Event('change', { bubbles: true })); }
      else dispatchEvent(new Event('focus'));
      return expected;
    }, { primary, backup, profile: fixture({ gems: 543 }), trigger });
    await blocked(a, 'Your save changed in another tab'); assert.deepEqual(await bytes(source), foreign);
    const rescue = await exported(a); assert.equal(rescue.speed, 1); assert.equal(rescue.gems, 100);
  });
  await scenario('pending-victory-takeover', async context => {
    const profile = fixture({ coins: 777, gems: 234, wins: 4, pendingVictory: { timeline: 1, battle: 0, earned: 77, seconds: 12, playerHp: 100, stats: {} } });
    const source = await setup(context, profile), a = await open(context); await result(a);
    const b = await open(context); await blocked(b);
    await source.evaluate(({ key, profile }) => localStorage.setItem(key, JSON.stringify(profile)), { key: backup, profile: fixture({ coins: 999 }) });
    await blocked(a, 'Your save changed in another tab'); assert.equal(await a.locator('.result-dialog').count(), 0);
    assert.equal((await exported(a)).wins, 4);
    await a.close(); await b.locator('[data-command="session-continue"]').click(); await result(b);
    const saved = JSON.parse((await bytes(source))[0]); assert.equal(saved.coins, 777); assert.equal(saved.gems, 234); assert.equal(saved.wins, 4); assert.deepEqual(saved.pendingVictory, JSON.parse((await bytes(source))[1]).pendingVictory);
    await b.reload({ waitUntil: 'networkidle' }); await result(b); const reloaded = JSON.parse((await bytes(source))[0]); assert.equal(reloaded.wins, 4); assert.equal(reloaded.gems, 234); assert.equal(reloaded.coins, 777);
  });
  await scenario('guarded-import', async context => {
    const source = await setup(context), a = await open(context); await active(a);
    await settings(a); await recovery(a);
    await a.locator('#import-save').setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture({ gems: 450, coins: 900 }))) });
    await a.locator('[data-command="confirm-import"]').click(); assert.deepEqual([JSON.parse((await bytes(source))[0]).gems, JSON.parse((await bytes(source))[0]).coins], [450, 900]);
    await settings(a); await a.locator('#preference-speed').selectOption('2'); assert.equal(JSON.parse((await bytes(source))[0]).speed, 2);
    await recovery(a);
    await a.locator('#import-save').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') });
    await a.getByText('Invalid JSON backup. Your current game was not changed.', { exact: true }).waitFor(); assert.equal(await a.locator('[data-command="confirm-import"]').count(), 0);
    // A primary quota rejection must reject replacement, keep the old Game/export and old bytes.
    const old = await bytes(source);
    await a.evaluate(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(name, value) { if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, name, value); }; }, primary);
    await a.locator('#import-save').setInputFiles({ name: 'rejected.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture({ gems: 987, coins: 123 }))) });
    await a.locator('[data-command="confirm-import"]').click(); await a.getByText('The save could not be written. Your current game was not replaced.', { exact: true }).waitFor();
    assert.deepEqual(await bytes(source), old); await a.locator('#modal-layer [data-command="close"]').click(); assert.equal((await exported(a)).gems, 450);
  });
  await scenario('guarded-start-over', async context => {
    const profile = fixture({ timeline: 3, age: 2, enemyAge: 2, furthestBattle: 2, coins: 9000, gems: 777, speed: 2, dailyDay: 20000, dailyStreak: 5, kills: 90, cards: Array(30).fill(4) });
    const source = await setup(context, profile), a = await open(context); await active(a);
    await settings(a); await a.locator('[data-command="reset"]').click();
    await a.getByRole('heading', { name: 'Start over?', exact: true }).waitFor();
    const before = await bytes(source); assert.equal((await exported(a)).gems, 777);
    await a.getByRole('button', { name: 'KEEP MY PROGRESS', exact: true }).click(); assert.deepEqual(await bytes(source), before);
    await a.locator('[data-command="reset"]').click();
    await a.locator('[data-command="confirm-reset"]').click(); await active(a);
    assert.equal(await a.locator('#coins').textContent(), '0'); assert.equal(await a.locator('#gems').textContent(), '100');
    const fresh = JSON.parse((await bytes(source))[0]);
    assert.deepEqual([fresh.timeline, fresh.age, fresh.coins, fresh.gems, fresh.kills, fresh.cards.reduce((sum, n) => sum + n, 0)], [1, 0, 0, 100, 0, 0]);
    assert.deepEqual([fresh.sound, fresh.speed, fresh.motion, fresh.dailyDay, fresh.dailyStreak], [false, 2, 'reduced', 20000, 5]);
    await settings(a); await a.locator('#preference-speed').selectOption('1');
    assert.equal(JSON.parse((await bytes(source))[0]).speed, 1, 'later guarded saves accept the replacement baseline');
    const old = await bytes(source), current = await exported(a);
    await a.evaluate(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(name, value) { if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, name, value); }; }, primary);
    await a.locator('[data-command="reset"]').click(); await a.locator('[data-command="confirm-reset"]').click();
    await a.getByText('The new game could not be saved. Your current progress was not deleted.', { exact: true }).waitFor();
    await a.getByRole('heading', { name: 'Start over?', exact: true }).waitFor();
    assert.deepEqual(await bytes(source), old); assert.deepEqual(await exported(a), current);
  });
  await scenario('pageshow-reloads-owner', async context => {
    const source = await setup(context), a = await open(context); await active(a); await summon(a);
    // Synthetic lifecycle events cover BFCache event handling without pretending to prove actual BFCache eligibility.
    await a.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    const b = await open(context); await active(b); await settings(b); await b.locator('#preference-speed').selectOption('2'); await b.close();
    await a.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await active(a);
    assert.equal(await a.locator('#speed').textContent(), '2×'); assert.equal(await a.locator('#gems').textContent(), '0'); assert.equal(JSON.parse((await bytes(source))[0]).cards.reduce((sum, n) => sum + n, 0), 1);
  });
  await scenario('explicit-temporary-no-writes', async context => {
    const source = await setup(context), initial = await bytes(source), a = await open(context);
    await blocked(a, 'Saving is unavailable'); await a.screenshot({ path: `${output}/unavailable-320.png` }); await a.locator('[data-command="session-temporary"]').click(); await a.getByText('Temporary play — progress is not saved.', { exact: true }).waitFor();
    await summon(a); await a.locator('[data-command="close"]').last().click();
    await settings(a); assert.equal(await a.locator('[data-command="reset"]').isDisabled(), true); await recovery(a); assert.equal(await a.locator('[data-command="import"]').isDisabled(), true); await a.getByRole('button', { name: 'Back', exact: true }).click();
    await a.locator('#preference-speed').selectOption('2'); await a.locator('#preference-sound').check(); await a.locator('#preference-motion').selectOption('system'); const rescue = await exported(a); assert.equal(rescue.gems, 0); assert.equal(rescue.speed, 2); assert.equal(rescue.motion, 'system');
    await a.evaluate(() => { dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    assert.equal(await a.locator('#app').getAttribute('data-save-session'), 'temporary'); await a.waitForTimeout(5500); assert.deepEqual(await bytes(source), initial); await a.close(); assert.deepEqual(await bytes(source), initial);
  }, { noLocks: true });
  await scenario('future-save-temporary', async context => {
    const source = await setup(context, { version: 99 }, fixture()), initial = await bytes(source), a = await open(context);
    await blocked(a, 'This save needs a newer game version'); await a.screenshot({ path: `${output}/unsupported-320.png` }); await a.locator('[data-command="session-temporary"]').click();
    // A future save cannot seed temporary progress. Follow the real fresh route;
    // no troops deployed, rewards claimed or save bytes replaced.
    await a.locator('#entry-play').click(); await a.getByRole('button', { name: 'Pause', exact: true }).click();
    await a.locator('#modal-layer [data-command="home"]').click();
    await a.locator('#entry-secondary[data-command="leave-battle"]').click();
    await a.locator('[data-command="confirm-leave-battle"]').click();
    await a.locator('[data-command="camp-home"]').click();
    await settings(a); const fresh = await exported(a);
    assert.deepEqual([fresh.coins, fresh.gems, fresh.wins, fresh.kills, fresh.deployed, fresh.pendingVictory], [0, 100, 0, 0, 0, null]);
    await a.getByRole('button', { name: 'Done', exact: true }).click(); await summon(a);
    assert.deepEqual(await bytes(source), initial); await a.locator('[data-command="close"]').last().click();
    await settings(a);
    assert.equal((await exported(a)).gems, 0);
    await a.close(); assert.deepEqual(await bytes(source), initial);
  });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) for (const quota of [false, true]) {
    await scenario(`evolution-${quota ? 'quota' : 'saved'}-${viewport.width}`, async context => {
      const source = await setup(context, fixture({ coins: 2500 })), a = await open(context); await active(a);
      await camp(a); await a.locator('[data-camp-station="company"]').click(); await a.locator('[data-command="camp-evolution"]').click();
      await a.locator('[data-command="evolve"]').click();
      await a.locator('[data-command="confirm-evolve"]').waitFor();
      // Settled baseline before a real primary-write failure; no invented victory.
      await source.waitForFunction(({ primary, backup }) => { const p = localStorage.getItem(primary); return p && p === localStorage.getItem(backup); }, { primary, backup });
      const old = await bytes(source);
      if (quota) await a.evaluate(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(name, value) { if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, name, value); }; }, primary);
      await a.locator('[data-command="confirm-evolve"]').click();
      await a.waitForFunction(() => document.querySelector('#age-title')?.textContent === 'Olive Terraces');
      const expected = quota ? 'Progress could not be saved. Export a backup from Settings before closing this tab.' : 'Entering Olive Terraces.';
      await a.waitForFunction(expected => { const node = document.querySelector('#toast'); return node?.textContent === expected && Number(getComputedStyle(node).opacity) >= .95; }, expected);
      const bounds = await a.locator('#toast').evaluate(node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight, overflow: node.scrollWidth > node.clientWidth + 1 }; });
      assert.ok(bounds.left >= 0 && bounds.right <= bounds.width && bounds.top >= 0 && bounds.bottom <= bounds.height && !bounds.overflow, JSON.stringify(bounds));
      await a.screenshot({ path: `${output}/evolution-${quota ? 'quota' : 'saved'}-${viewport.width}.png` });
      if (quota) assert.deepEqual(await bytes(source), old, 'quota failure preserves both stored profiles');
      else { const saved = JSON.parse((await bytes(source))[0]); assert.equal(saved.age, 1); assert.equal(saved.coins, 0); }
      await settings(a); const memory = await exported(a); assert.equal(memory.age, 1); assert.equal(memory.coins, 0);
      if (quota) assert.deepEqual(await bytes(source), old, 'export does not turn quota failure into a save');
    }, { viewport });
  }
  assert.deepEqual(diagnostics.pageErrors, [], 'no application page errors');
  assert.ok(diagnostics.cases.length === 16 && diagnostics.cases.every(result => result.status === 'passed'), JSON.stringify(diagnostics.cases.filter(result => result.status !== 'passed'), null, 2));
  diagnostics.status = 'passed'; console.log(`Save-session review passed: ${diagnostics.cases.length} cases`);
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally { diagnostics.serverLog = log; writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2)); try { await browser?.close(); } finally { server.kill(); } }
