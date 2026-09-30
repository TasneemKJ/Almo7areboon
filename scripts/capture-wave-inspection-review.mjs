import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';

const output = 'artifacts/browser-review/wave-inspection', origin = 'http://127.0.0.1:4184';
mkdirSync(output, { recursive: true });
const diagnostics = { revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), status: 'failed', cases: [], pageErrors: [], assetFailures: [] };
let browser, server, serverLog = '';
async function tabTo(page, selector) {
  for (let i = 0; i < 35; i++) { if (await page.locator(selector).evaluate(node => node === document.activeElement)) return; await page.keyboard.press('Tab'); }
  throw Error(`Tab could not reach ${selector}`);
}
async function session(viewport, manual) {
  const name = `${viewport.width}${manual ? '-manual' : ''}`, context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  context.setDefaultTimeout(15000); let page;
  try {
    const setup = await context.newPage();
    await setup.route(`${origin}/__setup`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Save setup</title>' })); await setup.goto(`${origin}/__setup`);
    const profile = defaultProfile(); Object.assign(profile, { sound: false, motion: 'reduced' });
    const keys = { primary: SAVE_KEY, backup: BACKUP_KEY };
    await setup.evaluate(({ profile, primary, backup }) => { localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile)); }, { profile, ...keys }); await setup.close();
    page = await context.newPage();
    page.on('pageerror', error => diagnostics.pageErrors.push(error.message));
    page.on('response', response => { if (/\/(art|assets)\//.test(response.url()) && !response.ok()) diagnostics.assetFailures.push(`${response.status()} ${response.url()}`); });
    await page.goto(origin, { waitUntil: 'networkidle' }); await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active');
    await page.locator('[data-command="start"]').click();
    if (manual) await page.locator('[data-command="pause"]').click();
    await page.waitForFunction(({ primary, backup }) => { const p = localStorage.getItem(primary); return p && p === localStorage.getItem(backup); }, keys);
    const bytes = () => page.evaluate(({ primary, backup }) => [localStorage.getItem(primary), localStorage.getItem(backup)], keys), before = await bytes();
    const chip = await page.locator('#wave-label').evaluate(node => {
      const r = node.getBoundingClientRect(), skill = document.querySelector('[data-skill="freeze"]').getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, viewport: innerWidth, font: parseFloat(getComputedStyle(node).fontSize), skillTop: skill.top, hit: node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
    });
    assert.ok(chip.height >= 44 && chip.width >= 44 && chip.left >= 0 && chip.right <= chip.viewport && chip.font >= 11 && chip.bottom <= chip.skillTop && chip.hit, JSON.stringify(chip));
    assert.match(await page.locator('#wave-label').getAttribute('aria-label'), /^Inspect wave\./);
    await page.screenshot({ path: `${output}/wave-chip-${name}.png` });
    await tabTo(page, '#wave-label'); await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: /^Next wave:/ }).waitFor();
    const clock = await page.locator('#wave-label').innerText(); await page.waitForTimeout(1200);
    assert.equal(await page.locator('#wave-label').innerText(), clock, 'inspection pauses a full countdown tick');
    assert.match(await page.locator('.dialog').innerText(), /battle seconds.*staggered group/s);
    const paragraphs = page.locator('.dialog p'), bounds = [];
    for (let i = 0; i < await paragraphs.count(); i++) {
      await paragraphs.nth(i).scrollIntoViewIfNeeded();
      const b = await paragraphs.nth(i).evaluate(node => { const r = node.getBoundingClientRect(), dialog = node.closest('.dialog'); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight, overflow: dialog.scrollWidth > dialog.clientWidth + 1 }; });
      assert.ok(b.left >= 0 && b.right <= b.width && b.top >= 0 && b.bottom <= b.height && !b.overflow, JSON.stringify(b)); bounds.push(b);
      await page.screenshot({ path: `${output}/wave-notes-${name}-${i}.png` });
    }
    const close = page.locator('#modal-layer [data-command="close"]'); await close.scrollIntoViewIfNeeded();
    const action = await close.evaluate(node => { const r = node.getBoundingClientRect(); return { height: r.height, top: r.top, bottom: r.bottom, viewport: innerHeight, hit: node.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; });
    assert.ok(action.height >= 44 && action.top >= 0 && action.bottom <= action.viewport && action.hit, JSON.stringify(action));
    await page.screenshot({ path: `${output}/wave-close-${name}.png` }); assert.deepEqual(await bytes(), before, 'viewing wave notes preserves both save streams');
    await tabTo(page, '#modal-layer [data-command="close"]'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#modal-layer')?.hidden && document.activeElement === document.querySelector('#wave-label'));
    assert.equal(await page.locator('#pause').getAttribute('aria-pressed'), String(manual));
    const resumedFrom = await page.locator('#wave-label').innerText();
    if (manual) { await page.waitForTimeout(1200); assert.equal(await page.locator('#wave-label').innerText(), resumedFrom); await page.locator('[data-command="pause"]').click(); }
    await page.waitForFunction(held => document.querySelector('#wave-label')?.textContent !== held, resumedFrom);
    await page.waitForFunction(() => Number(document.querySelector('[data-skill="freeze"] small')?.textContent) > 0);
    diagnostics.cases.push({ name, status: 'passed', chip, bounds, action, nativeKeyboard: true, fullTickPause: true, manualPausePreserved: manual, unchangedSaveBytes: true, battleClockResumes: true, realLivingEnemies: true });
  } catch (error) { diagnostics.cases.push({ name, status: 'failed', error: error.stack }); await page?.screenshot({ path: `${output}/wave-failure-${name}.png` }).catch(() => {}); throw error; }
  finally { await context.close(); }
}
try {
  assert.ok(existsSync('dist/index.html'));
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4184', '--strictPort'], { stdio: 'pipe' }); server.stdout.on('data', chunk => serverLog += chunk); server.stderr.on('data', chunk => serverLog += chunk);
  let ready = false;
  for (let i = 0; i < 80; i++) { if (server.exitCode !== null) throw Error(serverLog); try { ready = (await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok; } catch {} if (ready) break; await new Promise(resolve => setTimeout(resolve, 250)); }
  assert.ok(ready, 'production preview starts'); browser = await chromium.launch({ headless: true, timeout: 30000 }); diagnostics.browser = browser.version();
  await session({ width: 320, height: 568 }, false); await session({ width: 390, height: 844 }, true);
  assert.equal(diagnostics.cases.length, 2); assert.deepEqual(diagnostics.pageErrors, []); assert.deepEqual(diagnostics.assetFailures, []); diagnostics.status = 'passed'; console.log('Wave inspection passed: 2 native production scenarios');
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally { diagnostics.serverLog = serverLog; writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2)); try { await browser?.close(); } finally { server?.kill('SIGTERM'); } }
