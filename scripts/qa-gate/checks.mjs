/**
 * Lifecycle checks in the simulated iPhone app: reload mid-battle (does the save come back, where does it land) and
 * backgrounding (visibilitychange hidden/visible: pause, audio state, does battle time run on).
 * node scripts/qa-gate/checks.mjs <en|ar>
 */
import {writeFileSync} from 'node:fs';
import {launch, newPhone, visibleControls, shellState, BASE, OUT} from './lib.mjs';

const lang = process.argv[2] || 'en';
const browser = await launch();
const out = {lang};
const {page, context, errors} = await newPhone(browser, {lang});
await context.addInitScript(() => {
  const Orig = window.AudioContext || window.webkitAudioContext;
  if (!Orig) return;
  const Wrapped = function (...a) { const c = new Orig(...a); (window.__ctx ||= []).push(c); return c; };
  Wrapped.prototype = Orig.prototype;
  window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped;
});
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('almo7areboon.save.v1') || 'null'));
const fieldState = () => page.evaluate(() => ({
  phase: document.getElementById('world')?.dataset.phase,
  food: document.querySelector('#field-food span')?.textContent,
  cue: document.getElementById('field-cue')?.innerText,
  hud: [...document.querySelectorAll('[class*=hp], [class*=health]')].map(e => e.textContent.trim()).filter(Boolean).slice(0, 4).join('|'),
  audio: (window.__ctx || []).map(c => c.state),
  paused: document.getElementById('world')?.dataset.paused ?? null,
  modal: !document.getElementById('modal-layer')?.hidden,
}));
async function deploy(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const r = (await visibleControls(page)).filter(c => c.onTop && !c.disabled && c.data.fieldRecruit != null);
    if (r.length) await page.touchscreen.tap(r[0].x + r[0].w / 2, r[0].y + r[0].h / 2);
    await page.waitForTimeout(700);
  }
}
await page.goto(BASE);
await page.waitForSelector('#entry-play:not([disabled])');
await page.locator('#entry-play').tap();
await page.locator('[data-intro=skip]').tap().catch(() => {});
await page.waitForFunction(() => document.getElementById('world')?.dataset.phase === 'running', null, {timeout: 20000});
await deploy(20000);

// --- Backgrounding ---
const setHidden = hidden => page.evaluate(h => {
  Object.defineProperty(document, 'visibilityState', {value: h ? 'hidden' : 'visible', configurable: true});
  Object.defineProperty(document, 'hidden', {value: h, configurable: true});
  document.dispatchEvent(new Event('visibilitychange'));
  if (window.__qaPagehide) window.dispatchEvent(new Event(h ? 'pagehide' : 'pageshow'));
}, hidden);
out.beforeHidden = await fieldState();
await page.screenshot({path: `${OUT}/${lang}-check-bg-1-before.png`});
await setHidden(true);
await page.waitForTimeout(1000);
out.justHidden = await fieldState();
await page.waitForTimeout(Number(process.env.HIDE_MS || 12000));
out.after12sHidden = await fieldState();
await page.screenshot({path: `${OUT}/${lang}-check-bg-2-hidden12s.png`});
out.saveBeforeVisible = (s => s && {coins: s.coins, wins: s.wins, deployed: s.deployed})(await save());
await setHidden(false);
out.trace = [];
for (let i = 0; i < 8; i++) { out.trace.push({t: i * 200, ...(await shellState(page)), toast: await page.evaluate(() => document.querySelector('.toast')?.innerText || '')}); await page.waitForTimeout(200); }
out.afterVisible = await fieldState();
out.afterVisibleShell = await shellState(page);
out.afterVisibleControls = (await visibleControls(page)).filter(c => c.onTop && !c.disabled).map(c => `${c.cmd || c.id || Object.keys(c.data)[0]}:${c.text.slice(0, 40)}`);
await page.screenshot({path: `${OUT}/${lang}-check-bg-3-visible.png`});
// resume if a pause dialog is waiting
const resume = page.locator('[data-command=field-resume]').filter({visible: true});
if (await resume.count()) { await page.waitForTimeout(400); await resume.first().tap(); out.resumeNeeded = true; }
await page.waitForTimeout(3000);
out.afterResume = await fieldState();
await deploy(2500);
out.audioAfterNextTap = await fieldState();

// make sure the reload happens in a running battle
if ((await fieldState()).phase !== 'running') {
  const b = page.locator('[data-command=camp-battle]').filter({visible: true});
  if (await b.count()) { await page.waitForTimeout(400); await b.first().tap(); await page.waitForFunction(() => document.getElementById('world')?.dataset.phase === 'running', null, {timeout: 15000}).catch(() => {}); }
  out.restartedBattleForReload = true;
}

// --- Reload mid-battle ---
await deploy(8000);
out.beforeReload = {field: await fieldState(), save: (s => s && {coins: s.coins, wins: s.wins, deployed: s.deployed, kills: s.kills, introPending: s.introPending, played: s.played})(await save())};
await page.screenshot({path: `${OUT}/${lang}-check-reload-1-before.png`});
const t0 = Date.now();
await page.reload();
await page.waitForSelector('#entry-play:not([disabled]), [data-intro=skip], #camp-view:not([hidden])', {timeout: 30000});
await page.waitForTimeout(1500);
out.reloadSeconds = (Date.now() - t0) / 1000;
out.afterReload = {shell: await shellState(page), field: await fieldState(), save: (s => s && {coins: s.coins, wins: s.wins, deployed: s.deployed, kills: s.kills, introPending: s.introPending, played: s.played})(await save()),
  controls: (await visibleControls(page)).filter(c => c.onTop).map(c => `${c.cmd || c.id || Object.keys(c.data)[0]}:${c.text.slice(0, 40)}`)};
await page.screenshot({path: `${OUT}/${lang}-check-reload-2-after.png`});
// press the first offered action and see where the player lands
const first = page.locator('#entry-play:not([disabled])');
if (await first.count()) { await page.waitForTimeout(400); await first.tap(); await page.waitForTimeout(2500);
  out.afterReloadPlay = {shell: await shellState(page), field: await fieldState(), controls: (await visibleControls(page)).filter(c => c.onTop).map(c => `${c.cmd || c.id || Object.keys(c.data)[0]}:${c.text.slice(0, 40)}`)};
  await page.screenshot({path: `${OUT}/${lang}-check-reload-3-play.png`}); }
out.errors = errors;
writeFileSync(`${OUT}/checks-${lang}${process.env.HIDE_MS ? '-hide' + process.env.HIDE_MS : ''}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
