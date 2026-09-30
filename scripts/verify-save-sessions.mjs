/** Actual built app, shared localStorage and real Web Locks; no game debug hooks. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const output = 'artifacts/save-session-review', origin = 'http://127.0.0.1:4175';
const primary = 'almo7areboon.save.v1', backup = `${primary}.backup`;
mkdirSync(output, { recursive: true });
const diagnostics = { revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), origin, cases: [], pageErrors: [], status: 'failed' };
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'pipe' });
let log = '', browser;
server.stdout.on('data', chunk => { log += chunk; });
server.stderr.on('data', chunk => { log += chunk; });
const fixture = (overrides = {}) => ({ version: 2, timeline: 1, age: 0, enemyAge: 0, furthestBattle: 0, coins: 500, gems: 100, foodLevel: 0, baseLevel: 0, unlocked: [true, false, false], cards: Array(30).fill(0), summonCount: 0, summonSeed: 1831565813, pendingVictory: null, kills: 0, wins: 0, deployed: 0, claimed: [], sound: false, speed: 1, motion: 'reduced', ...overrides });
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
async function active(page) { await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active' && !document.querySelector('#modal-layer .session-dialog') && document.querySelector('#battle-view')?.inert === false); }
async function blocked(page, title = 'Game open in another tab') {
  const heading = page.getByRole('heading', { name: title, exact: true });
  await heading.waitFor();
  const contrast = await heading.evaluate(node => {
    const luminance = color => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        const channel = value / 255;
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const foreground = getComputedStyle(node).color;
    const background = getComputedStyle(node.closest('.dialog')).backgroundColor;
    const a = luminance(foreground), b = luminance(background);
    return { foreground, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  });
  assert.ok(contrast.ratio >= 4.5, `${title} must be readable on its paper dialog: ${JSON.stringify(contrast)}`);
}
async function exported(page) { const download = page.waitForEvent('download'); await page.locator('[data-command="export"]').click(); const result = await download; return JSON.parse(readFileSync(await result.path(), 'utf8')).profile; }
async function summon(page) { await page.getByRole('button', { name: 'Cards', exact: true }).click(); await page.getByRole('button', { name: 'Summon 1 card for 100 gems', exact: true }).click(); await page.getByRole('heading', { name: '1 card summoned', exact: true }).waitFor(); }
async function scenario(name, callback, options = {}) {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce', acceptDownloads: true });
  context.setDefaultTimeout(12000);
  try { if (options.noLocks) await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined })); await callback(context); diagnostics.cases.push({ name, status: 'passed' }); }
  catch (error) { diagnostics.cases.push({ name, status: 'failed', error: error.stack }); for (const [index, page] of context.pages().entries()) await page.screenshot({ path: `${output}/${name}-failure-${index}.png` }).catch(() => {}); }
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
  browser = await chromium.launch({ headless: true, timeout: 30000 });
  await scenario('two-tab-takeover', async context => {
    const source = await setup(context), a = await open(context); await active(a); await summon(a);
    const b = await open(context); await blocked(b);
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
    assert.equal(await b.locator('#world').getAttribute('data-phase'), 'ready'); assert.equal(await b.locator('#food-count').textContent(), '6');
    await b.close(); assert.deepEqual(await bytes(source), protectedBytes);
    const peer = await open(context); await blocked(peer); await peer.locator('[data-command="session-continue"]').click(); await blocked(peer);
    await peer.waitForFunction(() => document.activeElement?.getAttribute('data-command') === 'session-continue');
    await a.close(); await peer.locator('[data-command="session-continue"]').click(); await active(peer);
    assert.equal(await peer.locator('#gems').textContent(), '0');
    await peer.getByRole('button', { name: 'Cards', exact: true }).click(); assert.match(await peer.locator('.collection-summary').textContent(), /^1 \/ 30 discovered/);
    await peer.getByRole('button', { name: 'Battle', exact: true }).click(); await peer.locator('[data-command="settings"]').click(); await peer.locator('#modal-layer [data-command="speed"]').click();
    assert.equal(JSON.parse((await bytes(source))[0]).speed, 2);
    await peer.reload({ waitUntil: 'networkidle' }); await active(peer); assert.equal(await peer.locator('#speed').textContent(), '2×'); assert.equal(await peer.locator('#gems').textContent(), '0');
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
    const source = await setup(context), a = await open(context); await active(a); await a.locator('[data-command="settings"]').click();
    // Suppress notification at the browser boundary: action/resume must independently check real bytes.
    await a.evaluate(() => addEventListener('storage', event => event.stopImmediatePropagation(), { capture: true }));
    await source.evaluate(({ key, profile }) => localStorage.setItem(key, JSON.stringify(profile)), { key: primary, profile: fixture({ gems: 543 }) });
    const foreign = await bytes(source);
    if (trigger === 'preference') await a.locator('#modal-layer [data-command="speed"]').evaluate(button => button.click());
    else await a.evaluate(() => dispatchEvent(new Event('focus')));
    await blocked(a, 'Your save changed in another tab'); assert.deepEqual(await bytes(source), foreign);
    const rescue = await exported(a); assert.equal(rescue.speed, 1); assert.equal(rescue.gems, 100);
  });
  await scenario('pending-victory-takeover', async context => {
    const profile = fixture({ coins: 777, gems: 234, wins: 4, pendingVictory: { timeline: 1, battle: 0, earned: 77, seconds: 12, playerHp: 100, stats: {} } });
    const source = await setup(context, profile), a = await open(context); await a.locator('.result-dialog').waitFor();
    const b = await open(context); await blocked(b);
    await source.evaluate(({ key, profile }) => localStorage.setItem(key, JSON.stringify(profile)), { key: backup, profile: fixture({ coins: 999 }) });
    await blocked(a, 'Your save changed in another tab'); assert.equal(await a.locator('.result-dialog').count(), 0);
    assert.equal((await exported(a)).wins, 4);
    await a.close(); await b.locator('[data-command="session-continue"]').click(); await b.locator('.result-dialog').waitFor();
    const saved = JSON.parse((await bytes(source))[0]); assert.equal(saved.coins, 777); assert.equal(saved.gems, 234); assert.equal(saved.wins, 4); assert.deepEqual(saved.pendingVictory, JSON.parse((await bytes(source))[1]).pendingVictory);
    await b.reload({ waitUntil: 'networkidle' }); await b.locator('.result-dialog').waitFor(); const reloaded = JSON.parse((await bytes(source))[0]); assert.equal(reloaded.wins, 4); assert.equal(reloaded.gems, 234); assert.equal(reloaded.coins, 777);
  });
  await scenario('guarded-import', async context => {
    const source = await setup(context), a = await open(context); await active(a);
    await a.locator('[data-command="settings"]').click();
    await a.locator('#import-save').setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture({ gems: 450, coins: 900 }))) });
    await a.locator('[data-command="confirm-import"]').click(); assert.equal(await a.locator('#gems').textContent(), '450'); assert.equal(JSON.parse((await bytes(source))[0]).coins, 900);
    await a.locator('[data-command="settings"]').click(); await a.locator('#modal-layer [data-command="speed"]').click(); assert.equal(JSON.parse((await bytes(source))[0]).speed, 2);
    await a.locator('#import-save').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') });
    await a.getByText('Invalid JSON backup. Your current game was not changed.', { exact: true }).waitFor(); assert.equal(await a.locator('[data-command="confirm-import"]').count(), 0);
    // A primary quota rejection must reject replacement, keep the old Game/export and old bytes.
    const old = await bytes(source);
    await a.evaluate(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(name, value) { if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError'); return original.call(this, name, value); }; }, primary);
    await a.locator('#import-save').setInputFiles({ name: 'rejected.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture({ gems: 987, coins: 123 }))) });
    await a.locator('[data-command="confirm-import"]').click(); await a.getByText('The save could not be written. Your current game was not replaced.', { exact: true }).waitFor();
    assert.deepEqual(await bytes(source), old); await a.locator('[data-command="close"]').last().click(); await a.locator('[data-command="settings"]').click(); assert.equal((await exported(a)).gems, 450);
  });
  await scenario('pageshow-reloads-owner', async context => {
    const source = await setup(context), a = await open(context); await active(a); await summon(a);
    // Synthetic lifecycle events cover BFCache event handling without pretending to prove actual BFCache eligibility.
    await a.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    const b = await open(context); await active(b); await b.locator('[data-command="settings"]').click(); await b.locator('#modal-layer [data-command="speed"]').click(); await b.close();
    await a.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await active(a);
    assert.equal(await a.locator('#speed').textContent(), '2×'); assert.equal(await a.locator('#gems').textContent(), '0'); assert.equal(JSON.parse((await bytes(source))[0]).cards.reduce((sum, n) => sum + n, 0), 1);
  });
  await scenario('explicit-temporary-no-writes', async context => {
    const source = await setup(context), initial = await bytes(source), a = await open(context);
    await blocked(a, 'Saving is unavailable'); await a.screenshot({ path: `${output}/unavailable-320.png` }); await a.locator('[data-command="session-temporary"]').click(); await a.getByText('Temporary play — progress is not saved.', { exact: true }).waitFor();
    await summon(a); await a.locator('[data-command="close"]').last().click();
    await a.getByRole('button', { name: 'Battle', exact: true }).click(); await a.locator('[data-command="settings"]').click(); assert.equal(await a.locator('[data-command="import"]').isDisabled(), true);
    await a.locator('#modal-layer [data-command="speed"]').click(); await a.locator('[data-command="sound"]').click(); await a.locator('[data-command="motion"]').click(); const rescue = await exported(a); assert.equal(rescue.gems, 0); assert.equal(rescue.speed, 2); assert.equal(rescue.motion, 'system');
    await a.evaluate(() => { dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    assert.equal(await a.locator('#app').getAttribute('data-save-session'), 'temporary'); await a.waitForTimeout(5500); assert.deepEqual(await bytes(source), initial); await a.close(); assert.deepEqual(await bytes(source), initial);
  }, { noLocks: true });
  await scenario('future-save-temporary', async context => {
    const source = await setup(context, { version: 99 }, fixture()), initial = await bytes(source), a = await open(context);
    await blocked(a, 'This save needs a newer game version'); await a.screenshot({ path: `${output}/unsupported-320.png` }); await a.locator('[data-command="session-temporary"]').click(); await summon(a);
    assert.deepEqual(await bytes(source), initial); await a.locator('[data-command="close"]').last().click();
    await a.getByRole('button', { name: 'Battle', exact: true }).click(); await a.locator('[data-command="settings"]').click();
    assert.equal((await exported(a)).gems, 0);
    await a.close(); assert.deepEqual(await bytes(source), initial);
  });
  assert.deepEqual(diagnostics.pageErrors, [], 'no application page errors');
  assert.ok(diagnostics.cases.length === 11 && diagnostics.cases.every(result => result.status === 'passed'), JSON.stringify(diagnostics.cases.filter(result => result.status !== 'passed'), null, 2));
  diagnostics.status = 'passed'; console.log(`Save-session review passed: ${diagnostics.cases.length} cases`);
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally { diagnostics.serverLog = log; writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2)); try { await browser?.close(); } finally { server.kill(); } }
