/** Fresh production-build checks. Fixtures never change production code or require game debug hooks. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, firefox, webkit } from 'playwright';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { importBackup } from '../src/game/backup.ts';

const output = 'artifacts/reliability', root = resolve('dist');
mkdirSync(output, { recursive: true });
const diagnostics = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), status: 'failed', cases: [], pageErrors: [], browsers: {} };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
let marker = 'first', navigationStatus = 200;
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  response.setHeader('Cache-Control', 'no-store');
  if (path === '/__setup') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Fixture setup</title>'); return; }
  if (path === '/__network-probe.txt') { response.end('network reachable'); return; }
  if (/^\/assets\/older-\d+\.js$/.test(path)) { response.setHeader('Content-Type', 'text/javascript'); response.end('export {};'); return; }
  if ((path === '/' || path === '/index.html') && navigationStatus !== 200) { response.writeHead(navigationStatus); response.end('Temporary outage'); return; }
  const file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
  if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403); response.end(); return; }
  try {
    let body = readFileSync(file);
    if (extname(file) === '.html') body = Buffer.from(body.toString().replace('</head>', `<meta name="reliability-build" content="${marker}"></head>`));
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise((yes, no) => { server.once('error', no); server.listen(0, '127.0.0.1', yes); });
const origin = `http://127.0.0.1:${server.address().port}`;
const browsers = [];

function watch(page, name) { page.on('pageerror', error => diagnostics.pageErrors.push({ name, message: error.message })); return page; }
async function active(page) {
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active');
  await page.waitForFunction(() => { const canvas = document.querySelector('#world canvas'); return canvas && canvas.width > 0 && canvas.height > 0; });
}
async function seed(context, profile = defaultProfile(), otherCache = false) {
  const page = await context.newPage();
  await page.goto(`${origin}/__setup`);
  await page.evaluate(async ({ profile, primary, backup, otherCache }) => {
    localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile));
    if (otherCache) await (await caches.open('other-app-v1')).put('/other-app', new Response('must survive'));
  }, { profile: { ...profile, sound: false, motion: 'reduced' }, primary: SAVE_KEY, backup: BACKUP_KEY, otherCache });
  await page.close();
}
async function run(name, browser, options, body) {
  const { profile, otherCache, ...browserOptions } = options;
  const context = await browser.newContext({ reducedMotion: 'reduce', ...browserOptions });
  context.setDefaultTimeout(20000);
  let page;
  try {
    await seed(context, profile, otherCache);
    page = watch(await context.newPage(), name);
    await body(page, context);
    diagnostics.cases.push({ name, status: 'passed' });
    console.log(`PASS ${name}`);
  } catch (error) {
    diagnostics.cases.push({ name, status: 'failed', error: error.stack });
    await page?.screenshot({ path: `${output}/${name}-failure.png`, fullPage: true }).catch(() => {});
    console.error(`FAIL ${name}: ${error.stack}`);
  } finally { navigationStatus = 200; await context.close(); }
}
async function deployAndPause(page) {
  await page.locator('[data-command="start"]').click();
  await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
  const food = Number(await page.locator('#food-count').innerText());
  await page.locator('[data-unit="0"]').click();
  await page.waitForFunction(before => Number(document.querySelector('#food-count')?.textContent) < before, food);
  await page.locator('[data-command="pause"]').click();
  await page.waitForFunction(() => document.querySelector('#pause')?.getAttribute('aria-pressed') === 'true');
}
async function save(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY); }

try {
  for (const [engine, driver, viewports] of [
    ['chromium', chromium, [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]],
    ['firefox', firefox, [{ width: 390, height: 844 }]],
    ['webkit', webkit, [{ width: 390, height: 844 }]],
  ]) {
    const browser = await driver.launch({ headless: true }); browsers.push(browser); diagnostics.browsers[engine] = browser.version();
    for (const viewport of viewports) {
      const name = `${engine}-${viewport.width}`;
      await run(name, browser, { viewport, hasTouch: viewport.width < 500 }, async page => {
        await page.goto(origin, { waitUntil: 'networkidle' }); await active(page);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
        await page.screenshot({ path: `${output}/${name}-ready.png`, fullPage: true });
        await deployAndPause(page);
        await page.screenshot({ path: `${output}/${name}-battle.png`, fullPage: true });
        await page.locator('[data-command="settings"]').click();
        await page.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
        await page.screenshot({ path: `${output}/${name}-settings.png`, fullPage: true });
        const downloadEvent = page.waitForEvent('download');
        await page.locator('[data-command="export"]').click();
        const download = await downloadEvent, backup = `${output}/${name}-save.json`;
        assert.equal(download.suggestedFilename(), 'almo7areboon-save.json');
        await download.saveAs(backup);
        assert.equal(importBackup(readFileSync(backup, 'utf8')).ok, true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#pause').getAttribute('aria-pressed'), 'true', 'closing settings preserves manual pause');
        const before = await save(page);
        await page.reload({ waitUntil: 'networkidle' }); await active(page);
        assert.equal(await page.locator('#world').getAttribute('data-phase'), 'ready');
        const after = await save(page);
        for (const key of ['coins', 'gems', 'wins', 'deployed']) assert.equal(after[key], before[key], `reload preserves ${key}`);
      });
    }
    if (engine !== 'chromium') continue;

    const profile = defaultProfile(); profile.baseLevel = 100;
    const game = new Game(profile);
    assert.equal(game.dispatch({ type: 'chronicle-route', route: 'watch', battle: 0 }), true);
    assert.equal(game.dispatch({ type: 'start' }), true);
    for (let tick = 0; tick < 4500; tick++) game.step(1 / 60);
    assert.equal(game.state.phase, 'won'); assert.ok(game.profile.pendingVictory.newMask & 4);
    await run('watch-seal-reload', browser, { viewport: { width: 320, height: 568 }, profile: game.profile }, async page => {
      await page.goto(origin, { waitUntil: 'networkidle' }); await active(page);
      await page.getByRole('heading', { name: 'VICTORY!', exact: true }).waitFor();
      assert.equal(await page.locator('.battle-statistics dd').first().innerText(), '1:15');
      assert.ok(await page.getByRole('img', { name: 'Before the Embers Fade: earned', exact: true }).isVisible());
      await page.screenshot({ path: `${output}/watch-seal-reload.png`, fullPage: true });
      for (const key of ['coins', 'gems', 'wins']) assert.equal((await save(page))[key], game.profile[key]);
      await page.reload({ waitUntil: 'networkidle' }); await active(page);
      for (const key of ['coins', 'gems', 'wins']) assert.equal((await save(page))[key], game.profile[key]);
    });

    await run('offline-recovery', browser, { viewport: { width: 390, height: 844 }, otherCache: true }, async (page, context) => {
      marker = 'first';
      await page.goto(`${origin}/?visit=first`, { waitUntil: 'networkidle' }); await active(page);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      assert.ok(await page.evaluate(() => caches.has('other-app-v1')), 'activation preserves unrelated app caches');
      await page.reload({ waitUntil: 'networkidle' }); await active(page);
      const required = await page.evaluate(() => [...document.querySelectorAll('script[src],link[rel="stylesheet"],link[rel="modulepreload"]')].map(element => element.src || element.href).filter(url => /\/assets\/.*\.(js|css)$/.test(url)));
      assert.ok(required.length >= 3);
      for (let index = 0; index < 9; index++) await page.evaluate(index => fetch(`/assets/older-${index}.js`).then(response => response.text()), index);
      await page.waitForFunction(async required => {
        const cache = await caches.open('almo7areboon-runtime-v1');
        const retained = await Promise.all(required.map(url => cache.match(url)));
        return retained.every(Boolean) && (await cache.keys()).filter(key => /\/assets\/.*\.(js|css)$/.test(key.url)).length <= 6;
      }, required);
      marker = 'second';
      await page.goto(`${origin}/?visit=second`, { waitUntil: 'networkidle' }); await active(page);
      await page.waitForFunction(async () => (await (await (await caches.open('almo7areboon-runtime-v1')).match('/'))?.text())?.includes('content="second"'));
      const worker = context.serviceWorkers().find(worker => worker.url().endsWith('/sw.js'));
      assert.ok(worker, 'the actual production worker is running');
      for (const [type, method] of [['CacheStorage', 'open'], ['Cache', 'match']]) {
        await worker.evaluate(({ type, method }) => {
          globalThis.__reliabilityOriginal = globalThis[type].prototype[method];
          globalThis[type].prototype[method] = () => Promise.reject(new Error('controlled storage failure'));
        }, { type, method });
        try { assert.equal(await page.evaluate(() => fetch('/__network-probe.txt').then(response => response.text())), 'network reachable'); }
        finally { await worker.evaluate(({ type, method }) => { globalThis[type].prototype[method] = globalThis.__reliabilityOriginal; delete globalThis.__reliabilityOriginal; }, { type, method }); }
      }
      navigationStatus = 503;
      const recovered = await page.reload({ waitUntil: 'networkidle' }); await active(page);
      assert.equal(recovered.status(), 200, 'cached game survives a temporary server outage');
      assert.equal(await page.locator('meta[name="reliability-build"]').getAttribute('content'), 'second');
      await page.screenshot({ path: `${output}/server-outage-recovery.png`, fullPage: true });
      navigationStatus = 200;
      await context.setOffline(true);
      await page.goto(origin, { waitUntil: 'networkidle' }); await active(page);
      assert.equal(await page.locator('meta[name="reliability-build"]').getAttribute('content'), 'second');
      await deployAndPause(page);
      await page.screenshot({ path: `${output}/offline-battle.png`, fullPage: true });
      assert.ok(await page.evaluate(() => caches.has('other-app-v1')));
    });
  }
  assert.deepEqual(diagnostics.pageErrors, []);
  assert.equal(diagnostics.cases.length, 7);
  assert.ok(diagnostics.cases.every(result => result.status === 'passed'));
  diagnostics.status = 'passed';
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2));
  await Promise.all(browsers.map(browser => browser.close()));
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
