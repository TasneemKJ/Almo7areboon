/**
 * Upgrade text acceptance on the built app. Food and gate upgrades live in Camp: the Storehouse and the Home gate each open
 * a focused dialog with the current value, the next value and one purchase button. At enlarged root font sizes (emulated,
 * not a persisted browser preference) every word stays whole and inside the dialog, the purchase button stays a 44px
 * target that is reachable and actually painted, the page never scrolls sideways, and a keyboard purchase (Enter on the
 * Storehouse, Space at the gate) charges exactly what the simulation charges while keeping focus on the button.
 * Run: npm run build && npm run review:upgrade-text   (CHROMIUM_PATH reuses an installed Chromium; REVIEW_PORT pins the port)
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import {enterCamp, freePort, launchChromium} from './lib/browser.mjs';
import { defaultProfile, decodeSave, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { Game } from '../src/game/simulation.ts';

const output = 'artifacts/browser-review/upgrade-text', port = await freePort(), origin = `http://127.0.0.1:${port}`;
rmSync(output, {recursive: true, force: true}); mkdirSync(output, {recursive: true});
const diagnostics = {revision: spawnSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).stdout.trim(), status: 'failed', mechanism: 'root-size-emulation', deviceScaleFactor: 2, cases: [], pageErrors: [], assetFailures: [], screenshots: []};
let server, browser, serverLog = '';
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const STATIONS = [{station: 'storehouse', stat: 'food', key: 'Enter'}, {station: 'gate', stat: 'base', key: 'Space'}];

async function tabTo(page, selector) {
  for (let n = 0; n < 40; n++) { if (await page.locator(selector).evaluate(node => node === document.activeElement)) return; await page.keyboard.press('Tab'); }
  throw Error(`Keyboard could not reach ${selector}`);
}
async function capture(page, name) { await page.screenshot({path: `${output}/${name}.png`}); diagnostics.screenshots.push(`${name}.png`); }

/** Geometry of the open Camp focus dialog: whole words inside it, a painted 44px purchase target, no sideways scroll. */
async function measure(page, name, rootPx, max) {
  const action = page.locator('#modal-layer [data-camp-action]');
  await action.scrollIntoViewIfNeeded();
  const layout = await page.evaluate(() => {
    const box = node => { const r = node.getBoundingClientRect(); return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height}; };
    const dialog = document.querySelector('#modal-layer .camp-dialog'), button = dialog.querySelector('[data-camp-action]');
    const words = [];
    for (const node of dialog.querySelectorAll('h2, .camp-values, .camp-wallet, .camp-shortfall, [data-camp-action]')) {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); let text;
      while ((text = walker.nextNode())) for (const match of text.textContent.matchAll(/\S+/g)) {
        const range = document.createRange(); range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length);
        words.push({word: match[0], fragments: [...range.getClientRects()].map(r => ({left: r.left, right: r.right}))});
      }
    }
    const r = button.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize), dialog: box(dialog), button: box(button), painted: hit === button || button.contains(hit),
      disabled: button.disabled, label: button.textContent.trim(), words, pageWidth: document.documentElement.scrollWidth, viewport: {width: innerWidth, height: innerHeight}};
  });
  assert.equal(layout.rootPx, rootPx, `${name}: root size applied`);
  assert.ok(layout.pageWidth <= layout.viewport.width, `${name}: no horizontal page scroll`);
  assert.ok(layout.dialog.left >= -1 && layout.dialog.right <= layout.viewport.width + 1, `${name}: dialog fits the width`);
  assert.ok(layout.button.width >= 44 && layout.button.height >= 44, `${name}: purchase is a 44px target (${layout.button.width}x${layout.button.height})`);
  assert.equal(layout.painted, true, `${name}: purchase button is painted where it is tapped`);
  for (const word of layout.words) {
    assert.equal(word.fragments.length, 1, `${name}: "${word.word}" stays whole`);
    for (const fragment of word.fragments) assert.ok(fragment.left >= layout.dialog.left - 1 && fragment.right <= layout.dialog.right + 1, `${name}: "${word.word}" stays inside the dialog`);
  }
  if (max) { assert.equal(layout.disabled, true, `${name}: a fully improved station cannot charge`); assert.equal(layout.label, 'Fully improved'); }
  else assert.equal(layout.disabled, false, `${name}: affordable upgrade is enabled`);
  diagnostics.cases.push({name, status: 'passed', rootPx, viewport: layout.viewport, dialog: layout.dialog, button: layout.button});
}

async function session(viewport, rootPx, {max = false} = {}) {
  const context = await browser.newContext({viewport, deviceScaleFactor: 2, reducedMotion: 'reduce', hasTouch: viewport.width < 700});
  context.setDefaultTimeout(30000);
  const page = await context.newPage();
  page.on('pageerror', e => diagnostics.pageErrors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(origin) && !r.ok()) diagnostics.assetFailures.push(`${r.status()} ${r.url()}`); });
  const name = `${viewport.width}x${viewport.height}-root${rootPx}${max ? '-max' : ''}`;
  try {
    const profile = Object.assign(defaultProfile(), {age: 0, enemyAge: 0, furthestBattle: 0, foodLevel: max ? 100 : 23, baseLevel: max ? 100 : 23, coins: 10000000, unlocked: [true, true, true], sound: false, played: true});
    assert.deepEqual(decodeSave(JSON.stringify(profile)).profile, profile);
    await page.route(`${origin}/__upgrade-setup`, r => r.fulfill({contentType: 'text/html', body: '<!doctype html><title>Seed</title>'}));
    await page.goto(`${origin}/__upgrade-setup`);
    await page.evaluate(({profile, primary, backup}) => { localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile)); }, {profile, primary: SAVE_KEY, backup: BACKUP_KEY});
    await page.goto(origin);
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active');
    await enterCamp(page);
    await page.evaluate(async px => { document.documentElement.style.fontSize = `${px}px`; await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, rootPx);
    const model = new Game(profile);
    for (const {station, stat, key} of STATIONS) {
      await page.locator(`[data-camp-station="${station}"]`).click();
      await page.locator('#modal-layer .camp-dialog').waitFor();
      await measure(page, `${name}-${station}`, rootPx, max); await capture(page, `${name}-${station}`);
      if (!max) {
        const before = await saved(page), cost = model.upgradeStatus(stat).cost;
        await tabTo(page, '#modal-layer [data-camp-action]'); await page.keyboard.press(key);
        assert.equal(model.dispatch({type: 'upgrade', stat}), true);
        await page.waitForFunction(({key, level, field}) => JSON.parse(localStorage.getItem(key))[field] === level, {key: SAVE_KEY, level: before[`${stat}Level`] + 1, field: `${stat}Level`});
        const after = await saved(page);
        assert.equal(after.coins, before.coins - cost, `${name}: ${station} charges the simulation's price`);
        // The dialog re-renders and restores focus on the next frame.
        assert.equal(await page.waitForFunction(() => document.activeElement?.matches('#modal-layer [data-camp-action]'), null, {timeout: 3000}).then(() => true, () => false), true, `${name}: focus stays on the purchase after it re-renders`);
        await measure(page, `${name}-${station}-after`, rootPx, false);
      }
      await page.locator('#modal-layer [data-command="camp-back"]').click();
      await page.locator('#modal-layer').waitFor({state: 'hidden'});
    }
  } catch (error) { await capture(page, `${name}-failure`).catch(() => {}); throw error; }
  finally { await context.close(); }
}

try {
  assert.ok(existsSync('dist/index.html'), 'run npm run build first');
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {stdio: 'pipe'});
  server.stdout.on('data', c => serverLog += c); server.stderr.on('data', c => serverLog += c);
  let started = false;
  for (let n = 0; n < 80 && !started; n++) {
    if (server.exitCode !== null) throw Error(serverLog);
    try { started = (await fetch(origin, {signal: AbortSignal.timeout(2000)})).ok; } catch {}
    if (!started) await new Promise(r => setTimeout(r, 250));
  }
  assert.ok(started, `Preview did not start: ${serverLog}`);
  browser = await launchChromium();
  diagnostics.browser = {name: 'chromium', version: browser.version()};
  for (const viewport of [{width: 320, height: 568}, {width: 390, height: 844}]) for (const root of [16, 20, 24, 32]) await session(viewport, root);
  for (const root of [16, 32]) await session({width: 320, height: 568}, root, {max: true});
  await session({width: 640, height: 320}, 32);
  assert.deepEqual(diagnostics.pageErrors, []); assert.deepEqual(diagnostics.assetFailures, []);
  diagnostics.status = 'passed';
  console.log(`Upgrade text review passed: ${diagnostics.cases.length} measurements; root-size emulation, not a persisted font preference.`);
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  diagnostics.serverLog = serverLog;
  writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2));
  try { await browser?.close(); } finally { server?.kill('SIGTERM'); }
}
