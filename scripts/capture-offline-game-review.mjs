import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import {reviewPort} from './review-port.mjs';

const output = 'artifacts/browser-review/offline-game';
const upstream = `http://127.0.0.1:${reviewPort(4181)}`, origin = `http://127.0.0.1:${reviewPort(4182)}`;
mkdirSync(output, { recursive: true });
const diagnostics = { revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), status: 'failed', cases: [], pageErrors: [], assetFailures: [] };
let browser, preview, proxy, serverLog = '', probeVersion = 'first', heldRefresh;

async function session(viewport) {
  const name = `offline-${viewport.width}`, context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  context.setDefaultTimeout(15000);
  let page;
  try {
    probeVersion = 'first';
    const setup = await context.newPage();
    await setup.goto(`${origin}/__setup`);
    const profile = defaultProfile(); Object.assign(profile, { sound: false, motion: 'reduced' });
    await setup.evaluate(({ profile, primary, backup }) => {
      localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile));
    }, { profile, primary: SAVE_KEY, backup: BACKUP_KEY });
    await setup.close();
    page = await context.newPage();
    page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
    page.on('response', response => { if (/\/(art|assets)\//.test(response.url()) && !response.ok()) diagnostics.assetFailures.push(`${response.status()} ${response.url()}`); });
    await page.goto(origin, { waitUntil: 'networkidle' });
    // A rejected or stalled installation must fail here, not hang until the CI job is cancelled.
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
    // Load every production entry under the active worker before testing a return visit.
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active');
    assert.equal(await page.evaluate(() => fetch('/__offline-probe.txt').then(r => r.text())), 'first');
    const waitForCached = value => page.waitForFunction(async expected => {
      const response = await (await caches.open('almo7areboon-runtime-v1')).match('/__offline-probe.txt');
      return response && await response.text() === expected;
    }, value);
    await waitForCached('first');
    probeVersion = 'second';
    // The server holds revalidation open until the cached response has arrived.
    assert.equal(await page.evaluate(() => Promise.race([
      fetch('/__offline-probe.txt').then(r => r.text()),
      new Promise((_, reject) => setTimeout(() => reject(Error('cached response waited for network refresh')), 5000)),
    ])), 'first');
    for (let i = 0; i < 100 && !heldRefresh; i++) await new Promise(resolve => setTimeout(resolve, 25));
    assert.ok(heldRefresh, 'the cached fetch also requested a real background refresh');
    heldRefresh.end('second'); heldRefresh = undefined;
    await waitForCached('second');
    await context.setOffline(true);
    assert.equal(await page.evaluate(() => fetch('/__offline-probe.txt').then(r => r.text())), 'second');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active');
    await page.locator('[data-command="start"]').click();
    await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
    const foodBefore = Number(await page.locator('#food-count').innerText());
    await page.locator('[data-unit="0"]').click();
    await page.waitForFunction(before => Number(document.querySelector('#food-count')?.textContent) < before, foodBefore);
    await page.locator('[data-command="pause"]').click();
    await page.waitForFunction(() => document.querySelector('#pause')?.getAttribute('aria-pressed') === 'true');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/${name}.png` });
    diagnostics.cases.push({ name, status: 'passed', refreshedCache: 'second', cachedResponseBeforeNetworkRelease: true, offlineReload: true, actualStartAndDeployment: true });
  } catch (error) {
    diagnostics.cases.push({ name, status: 'failed', error: error.stack });
    await page?.screenshot({ path: `${output}/${name}-failure.png` }).catch(() => {});
    throw error;
  } finally {
    heldRefresh?.end('second'); heldRefresh = undefined;
    await context.close();
  }
}

try {
  assert.ok(existsSync('dist/index.html'));
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port',String(reviewPort(4181)), '--strictPort'], { stdio: 'pipe' });
  preview.stdout.on('data', chunk => serverLog += chunk); preview.stderr.on('data', chunk => serverLog += chunk);
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (preview.exitCode !== null) throw Error(serverLog);
    try { ready = (await fetch(upstream, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'production preview starts');
  proxy = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/__setup') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Save setup</title>'); return; }
    if (request.url === '/__offline-probe.txt') {
      response.setHeader('Content-Type', 'text/plain');
      if (probeVersion === 'first') response.end('first'); else heldRefresh = response;
      return;
    }
    try {
      const result = await fetch(new URL(request.url, upstream));
      response.statusCode = result.status;
      response.setHeader('Content-Type', result.headers.get('content-type') || 'application/octet-stream');
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch { response.statusCode = 502; response.end('preview unavailable'); }
  });
  await new Promise((resolve, reject) => { proxy.once('error', reject); proxy.listen(4182, '127.0.0.1', resolve); });
  browser = await chromium.launch({ headless: true, timeout: 30000 }); diagnostics.browser = browser.version();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) await session(viewport);
  assert.equal(diagnostics.cases.length, 2);
  assert.deepEqual(diagnostics.pageErrors, []); assert.deepEqual(diagnostics.assetFailures, []);
  diagnostics.status = 'passed'; console.log('Offline return review passed: 2 native production scenarios');
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  diagnostics.serverLog = serverLog; writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2));
  try { await browser?.close(); } finally { proxy?.closeAllConnections(); proxy?.close(); preview?.kill('SIGTERM'); }
}
