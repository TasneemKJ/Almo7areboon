/** Exact-source baseline/candidate comparison. No styling, rendering, simulation or clock overrides. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, extname, sep, dirname} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tabTo, inspectControl, assertReachable} from './review-geometry.mjs';

const expectedSource = process.env.SOURCE_SHA;
assert.match(expectedSource ?? '', /^[a-f0-9]{40}$/);
const revision = process.env.REVIEW_REVISION;
assert(['baseline','candidate'].includes(revision));
const reduced = process.env.REVIEW_REDUCED === 'true';
const dimensions = {'390x844': [390, 844], '844x390': [844, 390], '1280x800': [1280, 800], '320x568': [320, 568], '360x640': [360, 640], '412x915': [412, 915]};
const viewportName = process.env.REVIEW_VIEWPORT;
assert(Object.hasOwn(dimensions, viewportName), 'one explicit supported viewport per job');
assert.equal(process.env.SOURCE_SHA, expectedSource);

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
Object.assign(profile, {sound: false, motion: reduced ? 'reduced' : 'system', foodLevel: 20, kills: 10});
profile.chronicle.enabled = false;
assert.equal(profile.age, 0); assert.equal(profile.enemyAge, 0);
const contextOptions = {viewport: {width, height}, hasTouch: mobile, isMobile: mobile,
  deviceScaleFactor: mobile ? 2 : 1, reducedMotion: reduced ? 'reduce' : 'no-preference', locale: 'en-US'};
const manifest = {
  sourceCommit: source, sourceTree: git(['rev-parse', 'HEAD^{tree}']), revision,
  workflowCommit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID,
  game: 'Almo7areboon', viewportName, context: {...contextOptions, cpuThrottle: mobile ? 4 : 1},
  screenshotScale: 'css', languageCoverage: 'English only; no Arabic acceptance claimed',
  scope: 'One prepared First Fires session; real Start, Food Drop, five troop deployments and Advance inputs. No state mutation after initial save seeding, clock control, CSS injection or renderer replacement.',
  fixture: {constructor: 'src/game/save.ts#defaultProfile', reference: 'scripts/verify-battle-banner.mjs',
    overrides: {sound: false, motion: reduced ? 'reduced' : 'system', foodLevel: 20, kills: 10, 'chronicle.enabled': false},
    profileSha256: hash(JSON.stringify(profile))},
  sourceFilesSha256: fileHashes(root, ['package-lock.json', 'src/game/save.ts', 'src/main.ts',
    'src/view/battlefield.ts', 'src/ui/landscape-rail.css']),
  harnessFilesSha256: fileHashes(harness, ['.github/workflows/single-visual-review.yml',
    'scripts/capture-review.mjs', 'scripts/review-geometry.mjs', 'scripts/emit-originals.py']),
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
    world: rect('#world'), battlefield: rect('#battlefield'), deck: rect('.deployment'), navigation: rect('.bottom-nav'), roster: rect('#unit-cards'), waveBounds: rect('#wave-label'),
    advanceBounds: rect('[data-order="advance"]'), canvas: {width: canvas?.width, height: canvas?.height}};
}, SAVE_KEY);
async function controlGeometry(page) {
 return page.evaluate(() => {
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const clipped=e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1;
  const cards=[...document.querySelectorAll('#unit-cards [data-unit]')].map(e=>({
   unit:e.dataset.unit,box:box(e),name:e.getAttribute('aria-label'),locked:e.classList.contains('locked'),disabled:e.disabled,
   labels:['.unit-name','.unit-role','.unit-price'].map(sel=>{const n=e.querySelector(sel);return {selector:sel,text:n.textContent.trim(),box:box(n),clipped:clipped(n),font:parseFloat(getComputedStyle(n).fontSize)};}),
   portrait:box(e.querySelector('img')),
   hit:e.contains(document.elementFromPoint(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,e.getBoundingClientRect().y+e.getBoundingClientRect().height/2))
  }));
  const nav=[...document.querySelectorAll('.bottom-nav [data-tab]')].map(e=>({tab:e.dataset.tab,label:e.getAttribute('aria-label'),box:box(e),text:e.textContent.trim(),clipped:clipped(e.querySelector('span'))}));
  const orders=[...document.querySelectorAll('.order-banner [data-order]')].map(e=>({order:e.dataset.order,box:box(e),name:e.getAttribute('aria-label')}));
  return {cards,nav,orders,viewport:{width:innerWidth,height:innerHeight},world:box(document.querySelector('#world')),deck:box(document.querySelector('.deployment')),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1};
 });
}

async function capture(page, name, scenario) {
  const observationBefore = await observe(page);
  const filename = `${viewportName}-${reduced ? 'reduced' : 'full'}-en-${name}.png`;
  const bytes = await page.screenshot({path: resolve(out, filename), fullPage: false, scale: 'css', timeout: 30000});
  assert.equal(bytes.readUInt32BE(16), width); assert.equal(bytes.readUInt32BE(20), height);
  manifest.images.push({path: filename, bytes: bytes.length, sha256: hash(bytes), screenshotScale: 'css',
    viewport: {width, height}, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile,
    cpuThrottle: mobile ? 4 : 1, locale: 'en-US', reducedMotion: reduced, scenario,
    observationBefore, observationAfter: await observe(page), purpose: name.startsWith('focus-') ? 'native-keyboard-focus' : 'canonical-game',
    transport: name === 'ready' || (revision === 'candidate' && !reduced && ['390x844','844x390'].includes(viewportName) && name.startsWith('focus-'))});
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
  const geometry = await controlGeometry(page);
  assert.equal(geometry.cards.length,3); assert.equal(geometry.nav.length,4); assert.equal(geometry.orders.length,2);
  assert.equal(geometry.horizontalOverflow,false);
  for(const button of [...geometry.cards,...geometry.nav,...geometry.orders]) {
    assert(button.box.width>=43.5 && button.box.height>=43.5,'native action keeps a 44px minimum target');
  }
  for(const card of geometry.cards) {
    assert(card.name && /food|coins/.test(card.name),'accessible troop cost remains');
    for(const label of card.labels) assert(label.text && !label.clipped,'troop name/role/price remains visibly complete');
    if(revision==='candidate') {
      assert(card.hit,'the roster control center is reachable');
      assert(Math.abs(card.box.height-88)<1,'live roster uses compact original buttons');
      assert(card.labels[1].font>=10,'role and specialty do not shrink below the existing floor');
      assert(card.portrait.y>=card.labels[1].box.bottom-1 && card.portrait.bottom<=card.labels[2].box.y+1,'portrait stays between role and real price');
    }
  }
  for(const item of geometry.nav)assert(item.label&&item.text&&!item.clipped,'every navigation label remains visible');
  manifest.checks.push({name:'same-state-native-geometry',passed:true,geometry});

  assert.equal(ready.deployed - initial.deployed, 5, 'five accepted real troop deployments');
  await capture(page, 'ready', 'First Fires five real troop deployments, natural running battle and enabled command; no guaranteed simultaneous live-unit count');
  await action('button[data-order="advance"]');
  await page.waitForFunction(() => JSON.parse(document.querySelector('canvas')?.dataset.battleOrder ?? 'null')?.order === 'advance');
  await capture(page, 'advance', 'Same natural battle after accepted Advance input');
  assert.equal(await page.locator('button[data-order="advance"]').getAttribute('aria-pressed'), 'true');

  // Existing modal/manual-pause ownership must survive repeated screen returns.
  await action('#pause');
  await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true');
  for(let i=0;i<2;i++) {
    await action('.bottom-nav [data-tab="cards"]');
    await page.locator('#secondary-title').waitFor({state:'visible'});
    await action('.bottom-nav [data-tab="battle"]');
    assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','navigation must retain manual pause');
  }
  await action('#pause');
  await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='false');
  // Native key events, rather than programmatic focus, exercise the tab order and activation.
  // Pause through the public button to give the unmodified focus pair a stable battle state.
  await action('#pause');
  await page.waitForFunction(()=>document.querySelector('#pause')?.getAttribute('aria-pressed')==='true');
  const toEvolution=await tabTo(page,'.bottom-nav [data-tab="evolution"]');
  await capture(page,'focus-before','Native keyboard focus on Evolution, manually paused through the public control; no animation or render freeze');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-tab')),'cards');
  const focused=await page.locator('.bottom-nav [data-tab="cards"]').evaluate(inspectControl);
  assertReachable(focused,'native keyboard Cards target');
  assert(focused.focusVisible,'real Tab activates :focus-visible');
  assert(parseFloat(focused.outline.width)>0 && focused.outline.style!=='none','computed focus style exists; painted acceptance requires original PNG inspection');
  await capture(page,'focus-after','Native Tab moves Evolution to Cards; original PNG for human painted-focus review');
  await page.keyboard.press('Enter');
  await page.locator('#secondary-title').waitFor({state:'visible'});
  assert.equal(await page.locator('.bottom-nav [data-tab="cards"]').getAttribute('aria-current'),'page');
  const toBattle=await tabTo(page,'.bottom-nav [data-tab="battle"]');
  await page.keyboard.press('Enter');
  await page.locator('#secondary-screen').waitFor({state:'hidden'});
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'),'true','keyboard screen returns retain manual pause');
  manifest.checks.push({name:'repeated-navigation-and-native-keyboard',passed:true,manualPausePreserved:true,toEvolution,toBattle,focused,
    paintedFocus:{status:'pending-original-pixel-review',reason:'Tab/Enter and computed focus were checked; inspect the untouched before/after PNGs to accept painted focus.'}});
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
