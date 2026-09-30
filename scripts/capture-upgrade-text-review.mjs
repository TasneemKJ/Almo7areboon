/** Minimal RED checkpoint: real built-app fonts at 320px / 200% root-size emulation.
 * Run through approved CI; local Chromium is not an authorized execution route.
 * CSS and the remaining acceptance matrix follow only after this failure is reviewed.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { defaultProfile, decodeSave, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';

const output = 'artifacts/browser-review/upgrade-text';
const origin = 'http://127.0.0.1:4177';
const viewport = { width: 320, height: 568 };
mkdirSync(output, { recursive: true });
const diagnostics = {
  revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  checkpoint: 'minimal-font-regression', status: 'failed', mechanism: 'root-size-emulation',
  viewport, deviceScaleFactor: 2, requestedRootPx: 32, rootPx: null,
  labelPx: null, pricePx: null, worldHeight: null, rowHeights: [], checks: [],
  nativeStatus: {
    status: 'unverified', mechanism: null,
    reason: 'The approved headless-shell route has not established an actual default-font preference. CDP Page.setFontSizes is not a verified persisted user preference; this CSS root-size case is emulation only.',
  },
  pageErrors: [], assetFailures: [], screenshots: [],
};
let server, browser, context, page, serverError, serverLog = '';

try {
  const profile = Object.assign(defaultProfile(), {
    age: 0, enemyAge: 0, furthestBattle: 0,
    foodLevel: 23, baseLevel: 23, coins: 10_000_000,
    unlocked: [true, true, true], sound: false,
  });
  const encoded = JSON.stringify(profile), decoded = decodeSave(encoded);
  assert.equal(decoded.problem, null, 'canonical long-price fixture decodes normally');
  assert.deepEqual(decoded.profile, profile, 'canonical fixture needs no normalization');
  diagnostics.fixture = profile;
  assert.ok(existsSync('dist/index.html'), 'build the production app before browser review');

  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4177', '--strictPort'], { stdio: 'pipe' });
  server.stdout.on('data', chunk => { serverLog += chunk; });
  server.stderr.on('data', chunk => { serverLog += chunk; });
  server.on('error', error => { serverError = error; });
  let started = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error(`Preview exited ${server.exitCode}: ${serverLog}`);
    try { started = (await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok && serverLog.includes(origin); } catch {}
    if (started) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(started, `Preview did not start: ${serverLog}`);
  browser = await chromium.launch({ headless: true, timeout: 30000 });
  diagnostics.browser = { name: 'chromium', version: browser.version(), launch: 'headless: true' };
  context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  context.setDefaultTimeout(12000);
  page = await context.newPage();
  page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(origin) && !response.ok()) diagnostics.assetFailures.push(`${response.status()} ${response.url()}`);
  });

  // Seed both keys once on a routed setup page, before the app acquires ownership.
  // Never re-seed on reload or mutate storage after normal app startup.
  await page.route(`${origin}/__upgrade-text-setup`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Upgrade text save setup</title>' }));
  await page.goto(`${origin}/__upgrade-text-setup`);
  await page.evaluate(({ encoded, primary, backup }) => {
    localStorage.setItem(primary, encoded); localStorage.setItem(backup, encoded);
  }, { encoded, primary: SAVE_KEY, backup: BACKUP_KEY });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active'
    && !document.querySelector('.world-loader') && document.querySelector('#world')?.dataset.phase === 'ready'
    && document.querySelector('#modal-layer')?.hidden && document.querySelector('#secondary-screen')?.hidden
    && document.querySelector('#battle-view')?.inert === false);
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY), profile, 'the app owns the exact normal fixture');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  const measured = await page.evaluate(() => {
    const rect = node => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const rows = [...document.querySelectorAll('.upgrades > .upgrade-row')].map(row => {
      const label = row.querySelector('.upgrade-label > div'), button = row.querySelector('.buy-button');
      const price = button.querySelector(':scope > span');
      assertRendered(label); assertRendered(button); assertRendered(price);
      return {
        id: button.id, label: [...label.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim(),
        price: price.textContent.trim(), enabled: !button.disabled,
        labelPx: parseFloat(getComputedStyle(label).fontSize), pricePx: parseFloat(getComputedStyle(price).fontSize),
        row: rect(row), labelRegion: rect(label), purchase: rect(button), priceRegion: rect(price),
      };
    });
    function assertRendered(node) {
      if (!node || !node.checkVisibility() || !node.getClientRects().length) throw new Error('Expected visible non-MAX upgrade text and purchase button');
    }
    return { rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize), rows,
      worldHeight: document.querySelector('#world').getBoundingClientRect().height,
      shell: rect(document.querySelector('.game-shell')), pageWidth: document.documentElement.scrollWidth };
  });
  diagnostics.rootPx = measured.rootPx;
  diagnostics.labelPx = Object.fromEntries(measured.rows.map(row => [row.id, row.labelPx]));
  diagnostics.pricePx = Object.fromEntries(measured.rows.map(row => [row.id, row.pricePx]));
  diagnostics.worldHeight = measured.worldHeight;
  diagnostics.rowHeights = measured.rows.map(row => row.row.height);
  diagnostics.layout = measured;
  const screenshot = '320x568-root32-ready.png';
  await page.screenshot({ path: `${output}/${screenshot}`, fullPage: true });
  diagnostics.screenshots.push(screenshot);

  // Record all fonts before failing so the initial RED proves the pixel-font gap.
  assert.equal(measured.rows.length, 2, 'exactly the two real upgrade cells');
  assert.equal(measured.rootPx, 32, 'root-size emulation applied in the real browser');
  assert.deepEqual(measured.rows.map(row => [row.id, row.label, row.price, row.enabled]), [
    ['food-upgrade', 'Food Production', '159.1k', true],
    ['base-upgrade', 'Base Health', '205.8k', true],
  ], 'the canonical long-price save is visibly rendered');
  assert.deepEqual(diagnostics.pageErrors, [], 'no application page errors');
  assert.deepEqual(diagnostics.assetFailures, [], 'production assets load');
  for (const row of measured.rows) {
    for (const [kind, actual, expected] of [['label', row.labelPx, 20], ['price', row.pricePx, 24]]) {
      diagnostics.checks.push({ name: `${row.id}-${kind}-font`, actual, expected, passed: Math.abs(actual - expected) < 0.01 });
    }
  }
  const failed = diagnostics.checks.filter(check => !check.passed);
  if (failed.length) diagnostics.failureKind = 'font-size-regression';
  assert.deepEqual(failed, [], `Upgrade text must follow the 32px root: ${JSON.stringify(failed)}`);
  diagnostics.status = 'passed';
  console.log('Minimal upgrade text font checkpoint passed (root-size emulation only)');
} catch (error) {
  diagnostics.failureKind ??= 'harness-or-fixture-failure';
  diagnostics.error = error.stack;
  process.exitCode = 1;
  console.error(error);
  if (page && !diagnostics.screenshots.length) {
    const screenshot = 'checkpoint-failure.png';
    try { await page.screenshot({ path: `${output}/${screenshot}`, fullPage: true }); diagnostics.screenshots.push(screenshot); } catch {}
  }
} finally {
  diagnostics.serverLog = serverLog;
  writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2));
  try { await context?.close(); } finally {
    try { await browser?.close(); } finally { server?.kill('SIGTERM'); }
  }
}
