/**
 * Art-pass capture: every reachable screen and sheet at 1170x2532 (390x844 @3x) in one language, in the simulated
 * iPhone app. node scripts/qa-gate/capture.mjs <en|ar>. Writes <OUT>/<lang>-<nn>-<screen>.png and <OUT>/capture-<lang>.json
 * with per-screen mixed-language, clipped-text, small-target and web-speak findings.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {launch, newPhone, visibleControls, shellState, mixedLanguage, layoutProblems, webSpeak, BASE, OUT} from './lib.mjs';

const lang = process.argv[2] || 'en';
const browser = await launch();
let n = 0;
const report = {lang, screens: [], failures: []};

async function snap(page, name) {
  const file = `${OUT}/${lang}-${String(++n).padStart(2, '0')}-${name}.png`;
  await page.waitForTimeout(250);
  await page.screenshot({path: file});
  const [mixed, layout, web, st] = await Promise.all([mixedLanguage(page, lang).catch(() => []), layoutProblems(page).catch(() => ({})), webSpeak(page).catch(() => []), shellState(page).catch(() => ({}))]);
  report.screens.push({file, name, mixed, clipped: layout.clipped, small: layout.small, web, state: st});
  console.log(name, mixed.length ? `MIXED:${JSON.stringify(mixed)}` : '', layout.small?.length ? `SMALL:${JSON.stringify(layout.small)}` : '', web.length ? `WEB:${JSON.stringify(web)}` : '');
}
async function tap(page, selector, timeout = 6000) {
  const loc = page.locator(selector).filter({visible: true}).first();
  await loc.waitFor({state: 'visible', timeout});
  await page.waitForTimeout(450);
  await loc.tap({timeout});
}
async function step(name, fn) { try { await fn(); } catch (e) { report.failures.push(`${name}: ${e.message.split('\n')[0]}`); console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); } }
async function deployLoop(page, until, ms = 120000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await until()) return true;
    const rec = (await visibleControls(page)).filter(c => c.onTop && !c.disabled && c.data.fieldRecruit != null);
    if (rec.length) await page.touchscreen.tap(rec[0].x + rec[0].w / 2, rec[0].y + rec[0].h / 2);
    await page.waitForTimeout(700);
  }
  return false;
}
const phaseIs = (page, p) => async () => (await page.getAttribute('#world', 'data-phase').catch(() => '')) === p;
const modalOpen = page => page.evaluate(() => !document.getElementById('modal-layer')?.hidden);
async function closeAll(page) {
  for (let i = 0; i < 4 && await modalOpen(page); i++) {
    const c = page.locator('#modal-layer:not([hidden]) [data-command=close], #modal-layer:not([hidden]) [data-command=camp-back]').filter({visible: true}).first();
    if (await c.count()) await c.tap().catch(() => {}); else await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

// ---------- Session A: cold start, intro, first battle, pause, settings, store cards, first win, Camp ----------
{
  const {page, errors} = await newPhone(browser, {lang});
  await page.goto(BASE);
  await page.waitForSelector('#entry-play:not([disabled])');
  await snap(page, 'entry');
  await tap(page, '#entry-play');
  await page.waitForTimeout(1500); await snap(page, 'intro-1');
  await page.waitForTimeout(3200); await snap(page, 'intro-2');
  await page.waitForTimeout(3300); await snap(page, 'intro-3');
  await page.waitForFunction(() => document.getElementById('world')?.dataset.phase === 'running', null, {timeout: 20000}).catch(() => {});
  await page.waitForTimeout(800); await snap(page, 'battle-start');
  await step('pause', async () => { await tap(page, '[data-command=field-pause]'); await page.waitForTimeout(500); await snap(page, 'pause'); });
  await step('settings', async () => { await tap(page, '#modal-layer:not([hidden]) [data-command=settings]'); await page.waitForTimeout(500); await snap(page, 'settings');
    await page.evaluate(() => document.querySelector('#modal-layer .dialog, #modal-layer [role=dialog]')?.scrollBy(0, 2000)); await page.locator('#modal-layer [data-command=close]').last().scrollIntoViewIfNeeded().catch(() => {}); await snap(page, 'settings-bottom'); });
  await step('full journey card', async () => { await tap(page, '[data-command=full-journey]'); await page.waitForTimeout(600); await snap(page, 'full-journey'); await page.locator('#modal-layer [data-command=buy-full-journey]').scrollIntoViewIfNeeded().catch(() => {}); await snap(page, 'full-journey-bottom'); await closeAll(page); });
  await step('lamplighter card', async () => {
    if (!await page.locator('#modal-layer:not([hidden]) .preferences-dialog, #modal-layer:not([hidden]) [data-command=lamplighter]').count()) { await tap(page, '[data-command=field-pause]').catch(() => {}); await tap(page, '#modal-layer:not([hidden]) [data-command=settings]'); }
    await tap(page, '[data-command=lamplighter]'); await page.waitForTimeout(600); await snap(page, 'lamplighter'); await page.locator('#modal-layer [data-command=buy-lamplighter-yearly]').scrollIntoViewIfNeeded().catch(() => {}); await snap(page, 'lamplighter-bottom');
    report.posted = await page.evaluate(() => window.__posted || []); await closeAll(page); });
  await step('save & recovery', async () => { await tap(page, '[data-command=field-pause]').catch(() => {}); await tap(page, '#modal-layer:not([hidden]) [data-command=settings]'); await tap(page, '[data-command=save-recovery]'); await page.waitForTimeout(500); await snap(page, 'save-recovery'); await closeAll(page); });
  await step('resume', async () => { if (await modalOpen(page)) { const r = page.locator('[data-command=field-resume]').filter({visible: true}); if (await r.count()) await r.first().tap(); else await closeAll(page); } });
  await step('first deploys', async () => { await deployLoop(page, async () => false, 6000); await snap(page, 'battle-early'); });
  await step('supplies sheet', async () => { await tap(page, '#field-supplies'); await page.waitForTimeout(500); await snap(page, 'battle-supplies-sheet'); await tap(page, '[data-skill=food]'); });
  await step('enemy sheet', async () => { await deployLoop(page, async () => await page.locator('#field-enemy').isVisible(), 20000); await tap(page, '#field-enemy'); await page.waitForTimeout(500); await snap(page, 'battle-enemy-sheet'); await page.locator('[data-command=field-dismiss]').filter({visible: true}).first().tap().catch(() => page.keyboard.press('Escape')); });
  await step('battle mid', async () => { await deployLoop(page, async () => false, 8000); await snap(page, 'battle-mid'); });
  await step('win', async () => { const won = await deployLoop(page, phaseIs(page, 'won'), 150000); if (!won) throw new Error('no win in 150s'); await page.waitForTimeout(400); await snap(page, 'battle-won-banner');
    await page.waitForSelector('#modal-layer:not([hidden]) [data-command=next]', {timeout: 8000}); await page.waitForTimeout(1200); await snap(page, 'result-win'); });
  await step('result details', async () => { await tap(page, '[data-command=result-details]'); await page.waitForTimeout(500); await snap(page, 'result-details'); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    if (!await page.locator('#modal-layer:not([hidden]) [data-command=next]').count()) { const b = page.locator('#modal-layer:not([hidden]) [data-command=result-back], #modal-layer:not([hidden]) [data-command=close]').filter({visible: true}); if (await b.count()) await b.first().tap(); } });
  await step('camp', async () => { await tap(page, '#modal-layer:not([hidden]) [data-command=next]'); await page.waitForSelector('#camp-view:not([hidden])'); await page.waitForTimeout(800); await snap(page, 'camp'); });
  for (const st of ['storehouse', 'gate', 'company', 'journal']) await step(`camp ${st}`, async () => { await tap(page, `[data-camp-station=${st}]`); await page.waitForTimeout(600); await snap(page, `camp-${st}`);
    if (st === 'company') { await tap(page, '[data-camp-recruit="1"]'); await page.waitForTimeout(500); await snap(page, 'camp-company-recruit'); await tap(page, '[data-command=camp-back]'); }
    await tap(page, '[data-command=camp-back]'); });
  await step('home from camp', async () => { await tap(page, '[data-command=camp-home]'); await page.waitForTimeout(800); await snap(page, 'entry-returning'); });
  report.errorsA = errors;
  await page.context().close();
}

// ---------- Session B: mid-game profile (Farm army, chapter 3): evolution gate, journal, cards, storybook, lanterns ----------
{
  const profile = readFileSync(`${OUT}/profile-mid.json`, 'utf8');
  const {page, context, errors} = await newPhone(browser, {lang});
  await context.addInitScript(p => { if (!sessionStorage.getItem('qa-seeded')) { localStorage.setItem('almo7areboon.save.v1', p); sessionStorage.setItem('qa-seeded', '1'); } }, profile);
  await page.goto(BASE);
  await page.waitForSelector('#entry-play:not([disabled])');
  await page.waitForTimeout(600);
  await snap(page, 'entry-midgame');
  await step('camp mid', async () => { await page.waitForTimeout(1500); await tap(page, '#entry-secondary', 12000); await page.waitForSelector('#camp-view:not([hidden])'); await page.waitForTimeout(700); await snap(page, 'camp-midgame'); });
  await step('evolution', async () => { await tap(page, '[data-camp-station=company]'); await tap(page, '[data-command=camp-evolution]'); await page.waitForTimeout(700); await snap(page, 'evolution');
    const ev = page.locator('[data-command=evolve]').filter({visible: true}); if (await ev.count()) { await ev.first().tap(); await page.waitForTimeout(800); await snap(page, 'evolution-gate-full-journey'); await closeAll(page); }
    const back = page.locator('[data-command=camp-return]').filter({visible: true}); if (await back.count()) await back.first().tap(); });
  await step('chapters', async () => { await closeAll(page); await tap(page, '[data-camp-station=journal]'); await tap(page, '[data-command=camp-chapters]'); await page.waitForTimeout(600); await snap(page, 'choose-battle'); await closeAll(page); });
  await step('journey', async () => { await tap(page, '[data-camp-station=journal]'); await tap(page, '[data-command=camp-journal]'); await page.waitForTimeout(700); await snap(page, 'journey'); });
  await step('quests', async () => { await tap(page, '#modal-layer [data-command=quests]'); await page.waitForTimeout(600); await snap(page, 'quests'); await closeAll(page); });
  await step('cards', async () => { const j = page.locator('[data-camp-station=journal]').filter({visible: true}); if (await j.count()) { await j.first().tap(); await tap(page, '[data-command=camp-journal]'); }
    await tap(page, '[data-journey-tab=cards]'); await page.waitForTimeout(800); await snap(page, 'cards'); await page.evaluate(() => { const el = document.querySelector('#secondary-screen'); el?.scrollBy(0, 1400); window.scrollBy(0, 1400); document.querySelector('#secondary-screen [data-pack]')?.closest('section,div')?.scrollIntoView(); }); await page.waitForTimeout(300); await snap(page, 'cards-scrolled');
    const back = page.locator('[data-command=camp-return]').filter({visible: true}); if (await back.count()) await back.first().tap(); });
  await step('storybook', async () => { await closeAll(page); await tap(page, '[data-camp-station=company]'); await tap(page, '[data-command=camp-storybook]'); await page.waitForTimeout(800); await snap(page, 'storybook'); await closeAll(page);
    const back = page.locator('[data-command=camp-return]').filter({visible: true}); if (await back.count()) await back.first().tap(); });
  await step('lanterns battle', async () => {
    await closeAll(page);
    await page.evaluate(() => window.almoApp.update({owned: {lamplighterYearly: true}}));
    await tap(page, '[data-command=camp-battle]'); await page.waitForTimeout(2500); await snap(page, 'battle-lanterns-start');
    await deployLoop(page, async () => false, 15000); await snap(page, 'battle-lanterns-mid');
  });
  await step('lose', async () => {
    // a new player who stops deploying loses; wait for it without deploying (at most 4 min)
    await page.waitForFunction(() => ['lost', 'won'].includes(document.getElementById('world')?.dataset.phase), null, {timeout: 240000});
    await page.waitForSelector('#modal-layer:not([hidden]) [data-command=retry], #modal-layer:not([hidden]) [data-command=next]', {timeout: 10000}); await page.waitForTimeout(1200); await snap(page, 'result-lose');
  });
  await step('full journey owned settings', async () => {
    await page.evaluate(() => window.almoApp.update({owned: {fullGame: true, lamplighterYearly: true}})); await page.waitForTimeout(600); await snap(page, 'after-unlock');
  });
  report.errorsB = errors;
  await page.context().close();
}
writeFileSync(`${OUT}/capture-${lang}.json`, JSON.stringify(report, null, 1));
console.log('failures', report.failures, 'errors', report.errorsA, report.errorsB, 'posted', report.posted);
await browser.close();
