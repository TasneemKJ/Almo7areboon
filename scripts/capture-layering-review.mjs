/** Deterministic rendered regression cases. See tests/fixtures/layering.html. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const output = 'artifacts/browser-review/layering';
mkdirSync(output, { recursive: true });
const origin = 'http://127.0.0.1:4174';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'pipe' });
let serverLog = '';
server.stdout.on('data', chunk => { serverLog += chunk; });
server.stderr.on('data', chunk => { serverLog += chunk; });
let browser;
const reports = [];
const failures = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Fixture server exited ${server.exitCode}: ${serverLog}`);
    try { ready = (await fetch(`${origin}/tests/fixtures/layering.html`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, `Fixture server did not start: ${serverLog}`);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 490, height: 550 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  const cases = [];
  for (const age of [0, 1, 3]) for (const health of [70, 25]) for (const lane of [0, 1, 2]) {
    cases.push({ age, health, lane, effects: 'both' });
  }
  // The mixed chapter case exposes the current painted/vector style boundary.
  cases.push({ age: 3, enemyAge: 4, health: 25, lane: 1, effects: 'both' });
  // Isolated views make damage marks and each source effect easier to review.
  for (const age of [0, 1, 3]) cases.push({ age, health: 25, lane: 0, effects: 'none', troops: 0 });
  for (const effects of ['attack', 'dust']) cases.push({ age: 3, health: 25, lane: 0, effects });

  for (const fixture of cases) {
    const query = new URLSearchParams(Object.entries(fixture).map(([key, value]) => [key, String(value)]));
    const name = `age-${fixture.age}-enemy-${fixture.enemyAge ?? fixture.age}-hp-${fixture.health}-lane-${fixture.lane}-${fixture.effects}${fixture.troops === 0 ? '-bases' : ''}`;
    const page = await context.newPage();
    const errors = [], assetFailures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().includes('/art/storybook/') && !response.ok()) assetFailures.push(`${response.status()} ${response.url()}`); });
    let diagnostic;
    try {
      await page.goto(`${origin}/tests/fixtures/layering.html?${query}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 });
      await page.screenshot({ path: `${output}/${name}.png` });
      diagnostic = await page.evaluate(() => window.layeringReview.inspect());
      assert.deepEqual(errors, [], 'renderer must not raise page errors');
      assert.deepEqual(assetFailures, [], 'all painted assets must load');
      assert.equal(await page.locator('body').getAttribute('data-fallback'), null, 'fixture must use loaded art');
      assert.deepEqual(diagnostic.canvas, { width: 900, height: 860 }, 'renderer maintains 2x density');
      assert.equal(diagnostic.state.time, 0, 'fixture cannot advance gameplay');
      const bases = diagnostic.images.filter(image => image.texture.startsWith('base-')).sort((a, b) => a.x - b.x);
      assert.equal(bases.length, 2, 'both base images render');
      assert.equal(bases[0].flipX, false, 'player painted base keeps its authored orientation');
      if ((fixture.enemyAge ?? fixture.age) <= 3) assert.equal(bases[1].flipX, true, 'enemy painted base is mirrored');
      assert.ok(diagnostic.baseDamage?.commandCount > 8, 'damaged bases draw actual damage graphics');
      if (fixture.troops !== 0) {
        const troops = diagnostic.images.filter(image => image.texture.startsWith('army-')).sort((a, b) => a.x - b.x);
        assert.equal(troops.length, 2, 'both overlapping troop images render');
        for (const [index, troop] of troops.entries()) {
          const base = bases[index], a = troop.bounds, b = base.bounds;
          assert.ok(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, 'fixture troop must genuinely overlap its base');
          assert.equal(troop.paintIndex > base.paintIndex, fixture.lane > 0, 'rear troops hide behind bases; middle/front troops paint over them');
          assert.equal(troop.paintIndex > diagnostic.baseDamage.paintIndex, fixture.lane > 0, 'base damage must share the building occlusion boundary');
        }
      }
      if (fixture.effects !== 'none') {
        const effects = diagnostic.groundEffects[fixture.lane];
        assert.ok(effects?.commandCount > 8, 'source attack/dust events must paint a ground effect');
        for (const base of bases) assert.equal(effects.paintIndex > base.paintIndex, fixture.lane > 0, 'source attacks and foot dust follow their lane behind/in front of buildings');
      }
      reports.push({ name, status: 'passed', diagnostic });
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      reports.push({ name, status: 'failed', error: error.message, diagnostic, errors, assetFailures });
      await page.screenshot({ path: `${output}/${name}-failure.png` }).catch(() => {});
    } finally { await page.close(); }
  }
  await context.close();
  writeFileSync(`${output}/diagnostics.json`, JSON.stringify(reports, null, 2));
  assert.deepEqual(failures, [], failures.join('\n'));
  console.log(`Layering review passed: ${reports.length} frozen rendered cases; screenshots and diagnostics in ${output}`);
} finally {
  await browser?.close();
  server.kill();
}
