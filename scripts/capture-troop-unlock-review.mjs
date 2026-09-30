import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';

const output = 'artifacts/browser-review/troop-unlock', origin = 'http://127.0.0.1:4183';
mkdirSync(output, { recursive: true });
const diagnostics = { revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), status: 'failed', cases: [], pageErrors: [], assetFailures: [] };
let browser, server, serverLog = '';
async function session(viewport, running) {
  const name = `${running ? 'running' : 'ready'}-${viewport.width}`, context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  context.setDefaultTimeout(15000); let page;
  try {
    const profile = defaultProfile(); Object.assign(profile, { coins: 150, sound: false, motion: 'reduced' });
    const setup = await context.newPage();
    await setup.route(`${origin}/__setup`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Save setup</title>' }));
    await setup.goto(`${origin}/__setup`);
    const keys = { primary: SAVE_KEY, backup: BACKUP_KEY };
    await setup.evaluate(({ profile, primary, backup }) => { localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile)); }, { profile, ...keys });
    await setup.close();
    page = await context.newPage();
    page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
    page.on('response', response => { if (/\/(art|assets)\//.test(response.url()) && !response.ok()) diagnostics.assetFailures.push(`${response.status()} ${response.url()}`); });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active');
    if (running) await page.locator('[data-command="start"]').click();
    const food = Number(await page.locator('#food-count').innerText());
    await page.locator('[data-unit="1"]').click();
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent.includes('Thrower unlocked!') && Number(getComputedStyle(document.querySelector('#toast')).opacity) >= .95);
    const message = await page.locator('#toast').innerText();
    assert.match(message, /Deals extra damage to heavy enemies/); assert.match(message, /5 food/);
    assert.match(message, running ? /Tap it again to deploy/ : /Start Battle, then deploy/);
    await page.waitForFunction(({ primary, backup }) => { const p = localStorage.getItem(primary); return p && p === localStorage.getItem(backup); }, keys);
    const bytes = () => page.evaluate(({ primary, backup }) => [localStorage.getItem(primary), localStorage.getItem(backup)], keys);
    const before = await bytes(), saved = JSON.parse(before[0]);
    assert.equal(saved.coins, 0); assert.equal(saved.unlocked[1], true); assert.equal(saved.deployed, 0);
    assert.ok(Number(await page.locator('#food-count').innerText()) >= food, 'unlock does not consume food');
    const bounds = await page.locator('#toast').evaluate(node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight, overflow: node.scrollWidth > node.clientWidth + 1 }; });
    assert.ok(bounds.left >= 0 && bounds.right <= bounds.width && bounds.top >= 0 && bounds.bottom <= bounds.height && !bounds.overflow, JSON.stringify(bounds));
    const troop = page.locator('[data-unit="1"]'); assert.match(await troop.getAttribute('aria-label'), /Deploy Thrower, 5 food/);
    await page.screenshot({ path: `${output}/unlock-${name}.png` });
    assert.deepEqual(await bytes(), before, 'reading acknowledgement preserves both save streams');
    if (!running) await page.locator('[data-command="start"]').click();
    const button = await troop.evaluate(node => { const r = node.getBoundingClientRect(); return { width: r.width, height: r.height, hit: node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; });
    assert.ok(button.width >= 44 && button.height >= 44 && button.hit, JSON.stringify(button));
    await troop.click();
    await page.waitForFunction(primary => JSON.parse(localStorage.getItem(primary)).deployed === 1, SAVE_KEY);
    assert.match(await page.locator('#toast').innerText(), /Thrower unlocked!/);
    diagnostics.cases.push({ name, status: 'passed', message, bounds, button, unlockOnly: true, actualSeparateDeployment: true, unchangedReadingBytes: true });
  } catch (error) {
    diagnostics.cases.push({ name, status: 'failed', error: error.stack }); await page?.screenshot({ path: `${output}/unlock-failure-${name}.png` }).catch(() => {}); throw error;
  } finally { await context.close(); }
}
try {
  assert.ok(existsSync('dist/index.html'));
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4183', '--strictPort'], { stdio: 'pipe' });
  server.stdout.on('data', chunk => serverLog += chunk); server.stderr.on('data', chunk => serverLog += chunk);
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw Error(serverLog);
    try { ready = (await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break; await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'production preview starts'); browser = await chromium.launch({ headless: true, timeout: 30000 }); diagnostics.browser = browser.version();
  await session({ width: 320, height: 568 }, false); await session({ width: 390, height: 844 }, true);
  assert.equal(diagnostics.cases.length, 2); assert.deepEqual(diagnostics.pageErrors, []); assert.deepEqual(diagnostics.assetFailures, []);
  diagnostics.status = 'passed'; console.log('Troop unlock teaching passed: 2 native production scenarios');
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally { diagnostics.serverLog = serverLog; writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2)); try { await browser?.close(); } finally { server?.kill('SIGTERM'); } }
