/** Exact-source baseline only. No styling, rendering, simulation or clock overrides. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, extname, sep, dirname} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const expectedSource = '8086b009caf5351d9badd090612c676c1360b325';
const dimensions = {'390x844': [390, 844], '844x390': [844, 390], '1280x800': [1280, 800], '320x568': [320, 568], '360x640': [360, 640], '412x915': [412, 915]};
const viewportName = process.env.REVIEW_VIEWPORT;
assert(Object.hasOwn(dimensions, viewportName), 'one explicit supported viewport per job');
assert.equal(process.env.SOURCE_SHA, expectedSource);
assert.equal(process.env.REVIEW_REVISION, 'candidate');
const [width, height] = dimensions[viewportName], mobile = width !== 1280;
const root = process.cwd(), out = resolve(root, 'artifacts/single-review');
const harness = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
const source = git(['rev-parse', 'HEAD']);
assert.equal(source, expectedSource);
git(['diff', '--exit-code', 'HEAD', '--']);
mkdirSync(out, {recursive: true});
const requireSource = createRequire(resolve(root, 'package.json'));
const {chromium} = requireSource('playwright');
const {defaultProfile, SAVE_KEY, BACKUP_KEY} = await import(pathToFileURL(resolve(root, 'src/game/save.ts')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fileHashes = (base, paths) => Object.fromEntries(paths.map(path => [path, hash(readFileSync(resolve(base, path)))]));
const profile = defaultProfile();
// Same initial fixture as the repository's native battle-banner acceptance.
Object.assign(profile, {sound: false, motion: 'system', foodLevel: 20, kills: 10});
profile.chronicle.enabled = false;
assert.equal(profile.age, 0); assert.equal(profile.enemyAge, 0);
const contextOptions = {viewport: {width, height}, hasTouch: mobile, isMobile: mobile,
  deviceScaleFactor: mobile ? 2 : 1, reducedMotion: 'no-preference', locale: 'en-US'};
const manifest = {
  sourceCommit: source, sourceTree: git(['rev-parse', 'HEAD^{tree}']), revision: 'candidate',
  workflowCommit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID,
  game: 'Almo7areboon', viewportName, context: {...contextOptions, cpuThrottle: mobile ? 4 : 1},
  screenshotScale: 'css', languageCoverage: 'English only; no Arabic acceptance claimed',
  scope: 'One prepared First Fires session; real Start, Food Drop, five troop deployments and Advance inputs. No state mutation after initial save seeding, clock control, CSS injection or renderer replacement.',
  fixture: {constructor: 'src/game/save.ts#defaultProfile', reference: 'scripts/verify-battle-banner.mjs',
    overrides: {sound: false, motion: 'system', foodLevel: 20, kills: 10, 'chronicle.enabled': false},
    profileSha256: hash(JSON.stringify(profile))},
  sourceFilesSha256: fileHashes(root, ['package-lock.json', 'src/game/save.ts', 'src/main.ts',
    'src/view/battlefield.ts', 'src/ui/landscape-rail.css']),
  harnessFilesSha256: fileHashes(harness, ['.github/workflows/single-visual-review.yml',
    'scripts/capture-review.mjs', 'scripts/emit-originals.py']),
  images: [], checks: [], errors: []
};
const persist = () => writeFileSync(resolve(out, 'review-manifest.json'), JSON.stringify(manifest, null, 2));
persist();
const dist = resolve(root, 'dist');
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json'};
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(dist, '.' + (path === '/' ? '/index.html' : path));
  if (!file.startsWith(dist + sep)) { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store'); res.end(readFileSync(file)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser, context;
const pageErrors = [], assetFailures = [];
const observe = page => page.evaluate(key => {
  const canvas = document.querySelector('canvas');
  const rect = selector => { const el = document.querySelector(selector); if (!el) return null;
    const r = el.getBoundingClientRect(); return {x: r.x, y: r.y, width: r.width, height: r.height}; };
  const saved = JSON.parse(localStorage.getItem(key));
  return {phase: document.querySelector('#world')?.dataset.phase, title: document.querySelector('#age-title')?.textContent,
    scene: document.querySelector('#scene-name')?.textContent, wave: document.querySelector('#wave-label')?.textContent,
    orderStatus: document.querySelector('.order-status')?.textContent,
    order: JSON.parse(canvas?.dataset.battleOrder ?? 'null'),
    villageAnswer: JSON.parse(canvas?.dataset.villageOrderAnswer ?? 'null'),
    enemyViews: Number(canvas?.dataset.battlefieldEnemyViews ?? 0),
    deployed: saved?.deployed, age: saved?.age, enemyAge: saved?.enemyAge,
    paused: document.querySelector('#pause')?.getAttribute('aria-pressed'),
    viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio, touch: navigator.maxTouchPoints},
    scroll: {x: scrollX, y: scrollY, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight},
    world: rect('#world'), battlefield: rect('#battlefield'), waveBounds: rect('#wave-label'),
    advanceBounds: rect('[data-order="advance"]'), canvas: {width: canvas?.width, height: canvas?.height}};
}, SAVE_KEY);
async function capture(page, name, scenario) {
  const observationBefore = await observe(page);
  const filename = `${viewportName}-full-en-${name}.png`;
  const bytes = await page.screenshot({path: resolve(out, filename), fullPage: false, scale: 'css', timeout: 30000});
  assert.equal(bytes.readUInt32BE(16), width); assert.equal(bytes.readUInt32BE(20), height);
  manifest.images.push({path: filename, bytes: bytes.length, sha256: hash(bytes), screenshotScale: 'css',
    viewport: {width, height}, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
    cpuThrottle: mobile ? 4 : 1, locale: 'en-US', reducedMotion: false, scenario,
    observationBefore, observationAfter: await observe(page), transport: mobile || name === 'opening'});
  persist();
}
try {
  browser = await chromium.launch({headless: true, args: ['--enable-unsafe-swiftshader']});
  manifest.browser = {engine: 'chromium', version: browser.version(), playwright: requireSource('playwright/package.json').version};
  context = await browser.newContext(contextOptions);
  context.setDefaultTimeout(30000);
  await context.addInitScript(({profile, key, backup}) => {
    if (!sessionStorage.getItem('review-seeded')) {
      localStorage.setItem(key, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile));
      sessionStorage.setItem('review-seeded', '1');
    }
  }, {profile, key: SAVE_KEY, backup: BACKUP_KEY});
  const page = await context.newPage();
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('response', response => { if (response.url().includes('/art/storybook/') && !response.ok())
    assetFailures.push({status: response.status(), path: new URL(response.url()).pathname}); });
  if (mobile) await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', {rate: 4});
  await page.goto(origin, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'ready'
    && document.querySelector('#battlefield')?.dataset.renderer === 'ready'
    && !!document.querySelector('canvas'));
  await page.evaluate(() => document.fonts.ready);
  const action = async selector => { const el = page.locator(selector); if (mobile) await el.tap(); else await el.click(); };
  const initial = await observe(page);
  assert.equal(initial.age, 0); assert.equal(initial.enemyAge, 0);
  assert.match(`${initial.title} ${initial.scene}`, /First Fires/i);
  if (mobile) { assert(initial.viewport.touch > 0); assert.equal(initial.viewport.dpr, 2); }
  await action('[data-command="start"]');
  await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'running');
  await capture(page, 'opening', 'First Fires ordinary opening after real Start; prepared native profile, no troop deployment yet');
  await action('[data-skill="food"]');
  for (let i = 0; i < 5; i++) {
    await page.locator('[data-unit="0"]:enabled').waitFor(); await action('[data-unit="0"]');
  }
  await page.locator('button[data-order="advance"]:enabled').waitFor();
  await page.waitForFunction(() => !document.querySelector('canvas')?.dataset.villageWatchfire
    && JSON.parse(document.querySelector('canvas')?.dataset.battleOrder ?? 'null')?.ready === true);
  const ready = await observe(page);
  assert.equal(ready.deployed - initial.deployed, 5, 'five accepted real troop deployments');
  await capture(page, 'ready', 'First Fires five real troop deployments, natural running battle and enabled command; no guaranteed simultaneous live-unit count');
  await action('button[data-order="advance"]');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas')?.dataset.battleOrder ?? 'null')?.order === 'advance');
  await capture(page, 'advance', 'Same natural battle after accepted Advance input');
  assert.equal(await page.locator('button[data-order="advance"]').getAttribute('aria-pressed'), 'true');
  const after = await observe(page);
  assert(after.scroll.width <= after.viewport.width + 1, 'no horizontal overflow');
  assert.deepEqual(pageErrors, []); assert.deepEqual(assetFailures, []);
  git(['diff', '--exit-code', 'HEAD', '--']);
  manifest.checks.push({name: viewportName, passed: true, realDeployments: 5, readyOrder: ready.order,
    acceptedAdvance: true, sourceTrackedFilesUnchanged: true, pageErrors, assetFailures});
} catch (error) {
  manifest.errors.push({viewport: viewportName, error: String(error), pageErrors, assetFailures});
  process.exitCode = 1;
} finally {
  await context?.close(); await browser?.close(); server.closeAllConnections();
  await new Promise(r => server.close(r)); persist();
}
console.log(JSON.stringify({sourceCommit: source, sourceTree: manifest.sourceTree, viewport: viewportName,
  images: manifest.images.length, selectedImageBytes: manifest.images.reduce((sum, row) => sum + row.bytes, 0),
  checks: manifest.checks, errors: manifest.errors}));
