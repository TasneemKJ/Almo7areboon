/**
 * Mobile-first touch check against a running preview: phone portrait sizes plus one landscape phone, touch only,
 * device scale 2-3 and a 4x CPU throttle. Each size boots to the entry screen, taps Play (the battle starts in the world),
 * deploys by tapping the waiting recruits, taps the Hold/Advance gates when momentum is ready, and plays to a result.
 * It fails on page errors, horizontal or page scroll, visible tap targets under 44px, recruits or the pause button outside
 * the viewport (in landscape too), recruits overlapping each other or the pause button, or no result.
 * Screenshots go to OUT (default artifacts/mobile-touch).
 * Run: npm run build && npm run preview -- --port <port>, then
 *   node scripts/mobile-touch-check.mjs http://127.0.0.1:<port>/
 * Set CHROMIUM_PATH to reuse an installed Chromium.
 */
import {launchChromium, waitForEntry} from './lib/browser.mjs';
import {mkdirSync} from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const out = process.env.OUT ?? 'artifacts/mobile-touch';
const only = process.env.SIZES?.split(',');
mkdirSync(out, {recursive: true});
const SIZES = [[320, 568, 3], [360, 640, 2], [390, 844, 3], [412, 915, 2.625], [844, 390, 3]].filter(([w, h]) => !only || only.includes(`${w}x${h}`));
// A seasoned army against the first chapter, so a touch-only battle reaches a result in reasonable time.
const SAVE = JSON.stringify({version: 2, timeline: 1, age: 5, enemyAge: 0, furthestBattle: 0, coins: 0, gems: 100, foodLevel: 30, baseLevel: 30, unlocked: [true, true, true], cards: Array(30).fill(0), summonCount: 0, summonSeed: 9, pendingVictory: null, kills: 0, wins: 1, deployed: 0, claimed: [], dailyDay: 1e6, dailyStreak: 1, sound: false, speed: 1, motion: 'system'});
const browser = await launchChromium();
const failures = [];

const overlap = (a, b) => a && b && a.width > 0 && b.width > 0 && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
const inView = (r, w, h) => r && r.width > 0 && r.top >= -1 && r.left >= -1 && r.bottom <= h + 1 && r.right <= w + 1;

async function layout(page) {
  return page.evaluate(() => {
    const box = el => { const r = el.getBoundingClientRect(); return {left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height}; };
    const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && el.offsetParent !== null && !el.closest('[hidden],[inert]'); };
    const small = [...document.querySelectorAll('button,[role=button],input,summary,select')].filter(visible).filter(el => { const r = el.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(el => `${el.dataset.command ?? el.dataset.fieldRecruit ?? el.dataset.fieldGate ?? el.textContent.trim().slice(0, 16)}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
    return {
      hScroll: document.documentElement.scrollWidth > innerWidth + 1,
      pageScroll: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) > innerHeight + 1,
      small, recruits: [...document.querySelectorAll('[data-field-recruit]')].filter(visible).map(box),
      pause: (el => el && visible(el) ? box(el) : null)(document.querySelector('[data-command=field-pause]')),
      phase: document.getElementById('world')?.dataset.phase, title: document.getElementById('dialog-title')?.textContent ?? null,
    };
  });
}

/** Problems a running battle layout must never show by touch. */
function fieldProblems(running, width, height) {
  const problems = [];
  if (running.small.length) problems.push(`small targets ${running.small.join(', ')}`);
  if (running.hScroll) problems.push('horizontal scroll');
  if (running.pageScroll) problems.push('page scroll in battle');
  if (!running.recruits.length) problems.push('no waiting recruit to tap');
  if (!inView(running.pause, width, height)) problems.push('pause outside the viewport');
  running.recruits.forEach((r, i) => {
    if (!inView(r, width, height)) problems.push(`recruit ${i} outside the viewport`);
    if (overlap(r, running.pause)) problems.push(`recruit ${i} under the pause button`);
    running.recruits.slice(i + 1).forEach((other, j) => { if (overlap(r, other)) problems.push(`recruits ${i} and ${i + j + 1} overlap`); });
  });
  return problems;
}

for (const [width, height, scale] of SIZES) {
  const name = `${width}x${height}`, problems = [];
  const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: scale, hasTouch: true, isMobile: true}); context.setDefaultTimeout(90000);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('mobile-check')) { sessionStorage.setItem('mobile-check', '1'); localStorage.removeItem(`${key}.backup`); localStorage.setItem(key, value); } }, ['almo7areboon.save.v1', SAVE]);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const started = Date.now();
  await page.goto(url);
  await waitForEntry(page, 60000);
  const loadMs = Date.now() - started;
  await page.waitForSelector('#battlefield canvas', {state: 'attached', timeout: 60000});
  const battlefieldMs = Date.now() - started;
  await page.waitForTimeout(800);
  await page.screenshot({path: `${out}/${name}-entry.png`});
  const ready = await layout(page);
  await page.tap('#entry-play');
  await page.waitForTimeout(800);
  let orders = 0, result = null;
  const deadline = Date.now() + Number(process.env.RESULT_SECONDS ?? 300) * 1000; // software-rendered CI browsers at 4x throttle are slow
  for (let i = 0; Date.now() < deadline; i++) {
    for (const unit of ['0', '1', '2']) await page.tap(`[data-field-recruit="${unit}"]:not([hidden])`, {timeout: 2000}).catch(() => {});
    if (i === 3) {
      await page.screenshot({path: `${out}/${name}-running.png`});
      problems.push(...fieldProblems(await layout(page), width, height));
    }
    const gate = page.locator('[data-field-gate][aria-disabled="false"]:not([hidden])').last();
    if (await gate.count()) { await gate.tap({timeout: 2000}).then(() => orders++, () => {}); }
    await page.waitForTimeout(700);
    const now = await layout(page);
    if (now.title && (now.phase === 'won' || now.phase === 'lost')) { result = now.title.trim(); break; }
  }
  await page.waitForTimeout(500);
  await page.screenshot({path: `${out}/${name}-result.png`});
  const fps = await page.evaluate(() => new Promise(resolve => { let frames = 0; const start = performance.now(); const tick = () => { frames++; if (performance.now() - start < 2000) requestAnimationFrame(tick); else resolve(Math.round(frames / 2)); }; requestAnimationFrame(tick); }));
  if (ready.hScroll) problems.push('horizontal scroll on the entry screen');
  if (ready.small.length) problems.push(`small entry targets ${ready.small.join(', ')}`);
  if (!result) problems.push('no battle result by touch');
  if (errors.length) problems.push(`page errors: ${errors.join(' | ')}`);
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${name} interactive=${loadMs}ms battlefield=${battlefieldMs}ms result=${result} orderTaps=${orders} fps(throttled, result screen)=${fps}${problems.length ? ' :: ' + problems.join('; ') : ''}`);
  if (problems.length) failures.push(name);
  await context.close();
}
await browser.close();
if (failures.length) { console.error(`mobile touch check failed: ${failures.join(', ')}`); process.exit(1); }
