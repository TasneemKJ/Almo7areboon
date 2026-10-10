/** Built-app mastery acceptance. Seeds use real simulation actions before startup;
 * browser flows use painted controls, keyboard input, storage and exports only. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { createMastery } from '../src/game/mastery.ts';
import { reviewPrestige } from './capture-prestige-review.mjs';
import { reviewScouting } from './capture-scouting-review.mjs';
import { villageVoice, villageMoment } from '../src/ui/chapter-scouting.ts';
import { ERAS } from '../src/game/data.ts';

const output = 'artifacts/browser-review/mastery', origin = 'http://127.0.0.1:4176';
mkdirSync(output, { recursive: true });
const diagnostics = {
  revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  origin, status: 'failed', seeds: [], cases: [], pageErrors: [], assetFailures: [], layouts: [],
};
let browser, server, serverLog = '';
const clone = value => structuredClone(value);
const command = (page, name) => page.locator(`#modal-layer [data-command="${name}"]`);

// Historical holdings/purchased rosters are permitted save fixtures. All result,
// stats, earned masks and new credits below come from Game.dispatch/Game.step.
function prepared(chapter, { age = 5, timeline = 1, coins = 0, strongCards = false } = {}) {
  const profile = defaultProfile();
  Object.assign(profile, { age, enemyAge: chapter, furthestBattle: 5, timeline,
    mastery: createMastery(timeline), coins, foodLevel: 12,
    unlocked: [true, true, true], sound: false, speed: 2, motion: 'reduced' });
  if (strongCards) { profile.cards = profile.cards.map(() => 100); profile.summonCount = profile.cards.reduce((sum, copies) => sum + copies, 0); }
  return new Game(profile);
}
function winSeed(game, name, { clearOnly = false } = {}) {
  assert.equal(game.dispatch({ type: 'start' }), true);
  let cycle = 0;
  for (let tick = 0; tick < 36000 && game.state.phase === 'running'; tick += 6) {
    if (game.state.time >= 8) game.dispatch({ type: 'skill', skill: 'food' });
    const enemies = game.state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0);
    const missOptional = clearOnly && (game.state.stats.gateDamageTaken === 0 || game.state.time <= 75);
    if (!missOptional && game.profile.enemyAge !== 2 && enemies.length >= 3) {
      game.dispatch({ type: 'skill', skill: 'freeze' });
      game.dispatch({ type: 'skill', skill: 'meteor' });
    }
    const reserve = missOptional || ([3, 4].includes(game.profile.enemyAge)
      ? !game.state.skillsUsed.includes('freeze') : game.profile.enemyAge !== 5 && game.state.time < 10);
    if (!reserve && game.dispatch({ type: 'spawn', kind: cycle % 3 })) cycle++;
    for (let step = 0; step < 6; step++) game.step(1 / 60);
  }
  assert.equal(game.state.phase, 'won', `${name}: public actions must really win`);
  assert.equal(game.profile.pendingVictory.settlement, 'mastery-v1');
  assert.ok(game.profile.mastery.chapters[game.profile.enemyAge].earnedMask & 1);
  if (clearOnly) assert.equal(game.profile.mastery.chapters[game.profile.enemyAge].earnedMask, 1);
  diagnostics.seeds.push({ name, chapter: game.profile.enemyAge, age: game.profile.age,
    timeline: game.profile.timeline, seconds: game.state.time, stats: clone(game.state.stats),
    coins: game.profile.coins, gems: game.profile.gems, receipt: clone(game.profile.pendingVictory) });
  return clone(game.profile);
}
function legacy(seed) {
  const raw = clone(seed); raw.version = 2; delete raw.mastery;
  // Actual historical receipt, interpreted as pre-mastery display data. Migration
  // grants nothing; the already credited historical wallet remains unchanged.
  for (const field of ['settlement', 'eligibleMask', 'newMask', 'masteryCoins', 'masteryGems']) delete raw.pendingVictory[field];
  delete raw.pendingVictory.stats;
  const migrated = decodeSave(JSON.stringify(raw)).profile;
  assert.equal(migrated.pendingVictory.settlement, 'legacy');
  assert.ok(migrated.mastery.chapters.every(record => record.earnedMask === 0));
  return raw;
}
function ledger(profile) {
  return { timeline: profile.timeline, enemyAge: profile.enemyAge, furthestBattle: profile.furthestBattle,
    wins: profile.wins, coins: profile.coins, gems: profile.gems,
    mastery: profile.mastery, pendingVictory: profile.pendingVictory };
}
function watch(page) {
  page.on('pageerror', error => diagnostics.pageErrors.push({ url: page.url(), message: error.message }));
  page.on('response', response => {
    if (response.url().includes('/art/storybook/') && !response.ok()) diagnostics.assetFailures.push(`${response.status()} ${response.url()}`);
  });
  return page;
}
async function setup(context, profile) {
  const source = watch(await context.newPage());
  await source.route(`${origin}/__mastery-setup`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Mastery save setup</title>' }));
  await source.goto(`${origin}/__mastery-setup`);
  await source.evaluate(({ profile, primary, backup }) => {
    localStorage.setItem(primary, JSON.stringify(profile)); localStorage.setItem(backup, JSON.stringify(profile));
  }, { profile, primary: SAVE_KEY, backup: BACKUP_KEY });
  return source;
}
async function bytes(page) {
  return page.evaluate(({ primary, backup }) => [localStorage.getItem(primary), localStorage.getItem(backup)], { primary: SAVE_KEY, backup: BACKUP_KEY });
}
async function saved(page) { return JSON.parse((await bytes(page))[0]); }
async function open(context) {
  const page = watch(await context.newPage()); await page.goto(origin, { waitUntil: 'networkidle' });
  return page;
}
async function active(page) { await page.waitForFunction(() => document.querySelector('#app')?.dataset.saveSession === 'active'); }
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('#world')?.dataset.phase === 'ready' && document.querySelector('#modal-layer')?.hidden && document.querySelector('#secondary-screen')?.hidden && document.querySelector('#battle-view')?.inert === false && document.querySelector('[data-tab="battle"]')?.getAttribute('aria-current') === 'page');
}
async function result(page, won = true) {
  await page.locator('.result-dialog').waitFor({ timeout: 150000 });
  await page.getByRole('heading', { name: won ? 'VICTORY!' : 'REGROUP', exact: true }).waitFor();
  if(await page.locator('#app').getAttribute('data-save-session')==='active') {
    const profile=await saved(page);
    const receipt=profile.pendingVictory,voice=page.locator('.village-voice');
    if(won){
      const stats=receipt?.settlement==='mastery-v1'?receipt.stats:undefined;
      assert.equal(await voice.innerText(),villageVoice(profile.enemyAge,'won',stats));
      assert.equal(await voice.getAttribute('data-village-moment'),villageMoment(stats));
    }else{
      assert.ok((await voice.innerText()).startsWith(villageVoice(profile.enemyAge,'lost').split('“')[0]),'loss keeps the actual opponent speaker');
      assert.ok(['ordinary','freeze','meteor','company'].includes(await voice.getAttribute('data-village-moment')));
    }
  }
  assert.equal(await page.locator('.result-dialog [data-command="close"]').count(), 0, 'results have explicit routes, no generic dismissal');
  if (won && await page.locator('#app').getAttribute('data-save-session') === 'active') {
    const profile = await saved(page), receipt = profile.pendingVictory;
    if (receipt.settlement === 'mastery-v1') {
      const number = value => Math.floor(value).toLocaleString('en-US');
      const text = await page.locator('.result-dialog').textContent();
      assert.ok(text.includes(`Mastery credited: ${number(receipt.masteryCoins)} coins · ${number(receipt.masteryGems)} gems`), 'rendered credit equals the settled receipt');
      assert.ok(text.includes(`Normal combat: ${number(receipt.earned - receipt.masteryCoins)} coins`), 'normal and mastery breakdown does not double-count');
      assert.ok(text.includes(`Gate damage this attempt: ${number(receipt.stats.gateDamageTaken)}`));
    }
  }
}
async function exported(page) {
  const pending = page.waitForEvent('download'); await page.locator('[data-command="export"]').click();
  return JSON.parse(readFileSync(await (await pending).path(), 'utf8')).profile;
}
async function memoryProfile(page) {
  await page.locator('[data-command="settings"]').click(); const profile = await exported(page);
  await command(page, 'close').first().click(); return profile;
}
async function isolation(page) {
  assert.equal(await page.locator('#battle-view').evaluate(node => node.inert), true);
  const food = await page.locator('#food-count').textContent(), before = ledger(await saved(page));
  // Space legitimately activates a focused modal button. Focus its dialog first
  // to test gameplay shortcut isolation without selecting the primary route.
  await page.locator('#modal-layer .dialog').focus();
  for (const key of ['1', '2', '3', 'q', 'w', 'e', 'Space']) await page.keyboard.press(key);
  assert.equal(await page.locator('#food-count').textContent(), food);
  assert.deepEqual(ledger(await saved(page)), before, 'modal keys cannot mutate gameplay');
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('#modal-layer')), true, 'focus stays inside modal');
  }
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => !!document.activeElement?.closest('#modal-layer')), true);
}
async function inspect(page, name, seals = false) {
  // Decode lazy chapter art after scrolling each existing selection row into view.
  const images = page.locator('#modal-layer img');
  for (let index = 0; index < await images.count(); index++) await images.nth(index).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('#modal-layer img')].every(image => image.complete && image.naturalWidth > 0));
  const geometry = await page.locator('#modal-layer .dialog').evaluate(dialog => {
    const b = dialog.getBoundingClientRect();
    return { left: b.left, right: b.right, top: b.top, bottom: b.bottom,
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      motion: matchMedia('(prefers-reduced-motion: reduce)').matches };
  });
  assert.ok(geometry.left >= -1 && geometry.right <= geometry.width + 1 && geometry.top >= -1 && geometry.bottom <= geometry.height + 1, JSON.stringify(geometry));
  assert.ok(geometry.scrollWidth <= geometry.width, 'no horizontal overflow'); assert.equal(geometry.motion, true);
  const masteryCopy = await page.locator('#modal-layer .mastery-mark-title, #modal-layer .mastery-requirement, #modal-layer .mastery-remaining, #modal-layer .result-mastery p, #modal-layer .result-mastery small, #modal-layer .result-dialog .reward small, #modal-layer .chapter-continuation p').evaluateAll(nodes => nodes.flatMap(node => {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0 || node.getClientRects().length === 0) return [];
    return [{ text: node.textContent.trim(), fontSize: parseFloat(style.fontSize) }];
  }));
  if (seals) assert.ok(masteryCopy.length > 0, 'painted mastery information remains present');
  assert.ok(masteryCopy.every(copy => copy.fontSize >= 11), `Readable mastery copy: ${JSON.stringify(masteryCopy)}`);
  if (seals) {
    const marks = await page.locator('#modal-layer .mastery-mark').evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect(), style = getComputedStyle(node);
      return { label: node.getAttribute('aria-label'), width: r.width, height: r.height,
        opacity: style.opacity, visibility: style.visibility, text: node.textContent,
        animation: style.animationDuration, transition: style.transitionDuration };
    }));
    assert.ok(marks.length >= 3 && marks.every(mark => mark.label && mark.width > 0 && mark.height > 0 && mark.opacity !== '0' && mark.visibility === 'visible'), JSON.stringify(marks));
    assert.ok(marks.every(mark => mark.animation.split(',').every(value => parseFloat(value) === 0) && mark.transition.split(',').every(value => parseFloat(value) === 0)), 'reduced motion disables seal animation');
    diagnostics.layouts.push({ name, geometry, marks, masteryCopy });
  } else diagnostics.layouts.push({ name, geometry, masteryCopy });
  await page.locator('#modal-layer .dialog').evaluate(node => { node.scrollTop = 0; });
  await page.screenshot({ path: `${output}/${name}.png` });
  const buttons = page.locator('#modal-layer button:not([disabled])');
  for (let index = 0; index < await buttons.count(); index++) {
    const button = buttons.nth(index);
    if(!await button.isVisible()) {
      const intentionallyCollapsed = await button.evaluate(node => node.closest('details:not([open])') !== null);
      assert.equal(intentionallyCollapsed, true, `enabled action hidden outside closed details: ${await button.textContent()}`);
      continue;
    }
    await button.scrollIntoViewIfNeeded();
    const painted = await button.evaluate(node => {
      const r = node.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight + 1 && (top === node || node.contains(top));
    });
    assert.equal(painted, true, `reachable painted action: ${await button.textContent()}`);
  }
  await page.screenshot({ path: `${output}/${name}-actions.png` });
  assert.equal(await page.locator('body').getAttribute('data-review-fallback'), null, 'no missing-art fallback');
}
async function scenario(name, viewport, callback, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', acceptDownloads: true });
  context.setDefaultTimeout(12000);
  await context.addInitScript(() => document.addEventListener('visual-fallback', () => { document.body.dataset.reviewFallback = 'true'; }));
  let timer;
  try {
    if (options.noLocks) await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined }));
    const evidence = await Promise.race([callback(context), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Scenario ${name} exceeded its 210-second budget`)), 210000);
    })]);
    diagnostics.cases.push({ name, viewport, status: 'passed', evidence });
  } catch (error) {
    diagnostics.cases.push({ name, viewport, status: 'failed', error: error.stack });
    for (const [index, page] of context.pages().entries()) await page.screenshot({ path: `${output}/${name}-failure-${index}.png` }).catch(() => {});
  } finally { clearTimeout(timer); await context.close(); }
}
/** Keep native input bounded when real combat replaces controls during its await. */
async function deployIfAvailable(page, kind) {
  const button = page.locator(`[data-unit="${kind}"]`);
  if (await page.locator('#world').getAttribute('data-phase') !== 'running' || !await button.isEnabled()) return;
  try { await button.click({ timeout: 750 }); }
  catch (error) {
    const phase = await page.locator('#world').getAttribute('data-phase');
    // Only a verified natural terminal transition excuses this input race.
    // Ready/running, closed pages and all other input failures still fail the case.
    if (phase !== 'won' && phase !== 'lost') throw error;
  }
}
async function startAndLose(page) {
  await page.locator('[data-command="start"]').click();
  // Observe natural battle resolution, with no deployment/skill and no outcome injection.
  await result(page, false);
}
async function assertContinue(page, source, chapter, before) {
  const next = command(page, 'next'); await next.click({ clickCount: 2 });
  if (chapter === 5) {
    await page.locator('[data-command="confirm-prestige"]').waitFor({state:'visible'});
    assert.deepEqual(await saved(source), before, 'preview does not mutate the settled save');
    await page.locator('[data-command="confirm-prestige"]').click({clickCount:2});
  }
  await ready(page);
  assert.equal(await page.locator('[data-tab="battle"]').getAttribute('aria-current'), 'page', 'double continuation retains Battle navigation');
  assert.equal(await page.locator('#secondary-screen').isHidden(), true, 'double continuation cannot click through into a secondary screen');
  const after = await saved(source);
  assert.equal(after.wins, before.wins, 'continuation creates no extra win'); assert.equal(after.pendingVictory, null);
  if (chapter === 5) {
    assert.equal(after.timeline, before.timeline + 1); assert.equal(after.gems, before.gems + 100);
    assert.equal(after.coins, 0); assert.equal(after.enemyAge, 0); assert.equal(after.furthestBattle, 0);
    assert.ok(after.mastery.chapters.every(record => record.earnedMask === 0));
    await page.locator('[data-command="battles"]').click(); assert.equal(await command(page, 'next').count(), 0);
    await command(page, 'close').first().click();
  } else {
    assert.equal(after.enemyAge, chapter + 1); assert.equal(after.furthestBattle, before.furthestBattle);
    assert.equal(after.coins, before.coins); assert.equal(after.gems, before.gems); assert.deepEqual(after.mastery, before.mastery);
  }
  return ledger(after);
}

try {
  const seeds = {
    evolve: winSeed(prepared(0, { age: 0, coins: ERAS[0].evolveCost }), 'evolution-funded'),
    refreshedCost: winSeed(prepared(1, { age: 0, coins: ERAS[0].evolveCost }), 'evolution-refreshed-cost'),
    insufficient: winSeed(prepared(0, { age: 0 }), 'evolution-insufficient'),
    ordinary: winSeed(prepared(0), 'ordinary-cleared'),
    final: winSeed(prepared(5), 'final-cleared'),
    older: winSeed(prepared(1), 'older-cleared-frontier-five'),
    penultimate: winSeed(prepared(5, { timeline: 999, strongCards: true }), 'penultimate-real-win'),
    terminal: winSeed(prepared(5, { timeline: 1000, strongCards: true }), 'terminal-real-win'),
    partial: winSeed(prepared(0), 'clear-only-intentionally-missed-objectives', { clearOnly: true }),
  };
  assert.ok(seeds.evolve.coins >= ERAS[0].evolveCost); assert.ok(seeds.insufficient.coins < ERAS[0].evolveCost);
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { stdio: 'pipe' });
  server.stdout.on('data', chunk => { serverLog += chunk; }); server.stderr.on('data', chunk => { serverLog += chunk; });
  let started = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview exited ${server.exitCode}: ${serverLog}`);
    try { started = (await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (started) break; await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(started, `Preview did not start: ${serverLog}`);
  browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), headless: true, timeout: 30000 });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    const width = viewport.width;
    await scenario(`evolve-return-${width}`, viewport, async context => {
      const source = await setup(context, seeds.evolve), page = await open(context); await active(page); await result(page);
      const before = await saved(source); await inspect(page, `won-${width}`, true); await isolation(page);
      for (const route of ['cancel', 'close', 'Escape']) {
        await command(page, 'evolve').click(); await command(page, 'confirm-evolve').waitFor();
        await inspect(page, `evolution-${route}-${width}`); await isolation(page);
        if (route === 'Escape') await page.keyboard.press('Escape');
        else if (route === 'close') await page.locator('#modal-layer .close-button').click();
        else await command(page, 'close').last().click();
        await result(page); assert.deepEqual(ledger(await saved(source)), ledger(before), `${route} preserves the receipt and credits`);
      }
      await command(page, 'evolve').click(); await command(page, 'confirm-evolve').click({ clickCount: 2 }); await result(page);
      const after = await saved(source);
      assert.equal(after.age, before.age + 1); assert.equal(after.coins, 0);
      for (const field of ['enemyAge', 'furthestBattle', 'wins', 'gems', 'mastery', 'pendingVictory']) assert.deepEqual(after[field], before[field], field);
      assert.equal(await command(page, 'evolve').count(), 0, 'updated age/opponent prerequisite removes another evolution');
      await inspect(page, `evolved-result-${width}`, true);
      await page.reload({ waitUntil: 'networkidle' }); await result(page); assert.deepEqual(ledger(await saved(source)), ledger(after));
      await assertContinue(page, source, 0, after);
      return { before: ledger(before), after: ledger(after) };
    });
    await scenario(`insufficient-${width}`, viewport, async context => {
      const source = await setup(context, seeds.insufficient), page = await open(context); await result(page);
      const before = ledger(await saved(source)); assert.equal(await command(page, 'evolve').isDisabled(), true);
      await command(page, 'evolve').scrollIntoViewIfNeeded(); const box = await command(page, 'evolve').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await result(page);
      assert.equal(await command(page, 'confirm-evolve').count(), 0); assert.deepEqual(ledger(await saved(source)), before);
      await inspect(page, `insufficient-result-${width}`, true); await command(page, 'next').click(); await ready(page);
      // The confirmation's own disabled affordability is reachable on Evolution.
      await page.getByRole('button', { name: 'Evolution', exact: true }).click();
      assert.equal(await page.locator('[data-command="evolve"]').isDisabled(), true);
      return before;
    });
    await scenario(`refreshed-cost-${width}`, viewport, async context => {
      const source = await setup(context, seeds.refreshedCost), page = await open(context); await result(page);
      assert.match(await command(page, 'evolve').textContent(), new RegExp(ERAS[0].evolveCost.toLocaleString('en-US')));
      await command(page, 'evolve').click(); await command(page, 'confirm-evolve').click(); await result(page);
      const after = await saved(source);
      assert.equal(after.age, 1); assert.equal(after.coins, 0); assert.equal(after.enemyAge, 1);
      assert.equal(await command(page, 'evolve').isDisabled(), true);
      assert.match(await command(page, 'evolve').textContent(), new RegExp(ERAS[1].evolveCost.toLocaleString('en-US')));
      assert.deepEqual(after.pendingVictory, seeds.refreshedCost.pendingVictory);
      await inspect(page, `refreshed-cost-${width}`, true); return ledger(after);
    });
    await scenario(`remaining-seals-${width}`, viewport, async context => {
      const source = await setup(context, seeds.partial), page = await open(context); await result(page);
      assert.equal((await saved(source)).mastery.chapters[0].earnedMask, 1);
      assert.match(await command(page, 'retry').textContent(), /Try for remaining seals/i);
      assert.equal(await page.locator('.result-dialog .mastery-mark.earned').count(), 1);
      assert.equal(await page.locator('.result-dialog .mastery-mark.unearned').count(), 2);
      assert.match(await page.locator('.result-dialog .mastery-remaining').textContent(), /150 coins · 30 gems remaining/);
      await inspect(page, `remaining-seals-${width}`, true);
      const before = ledger(await saved(source)); await command(page, 'retry').click(); await ready(page);
      const after = await saved(source); assert.equal(after.pendingVictory, null);
      for (const field of ['wins', 'coins', 'gems', 'mastery', 'furthestBattle']) assert.deepEqual(after[field], before[field]);
      return ledger(after);
    });
    for (const chapter of [0, 5]) for (const reload of [false, true]) await scenario(`rematch-${chapter}-${reload ? 'reload' : 'direct'}-${width}`, viewport, async context => {
      const source = await setup(context, chapter === 0 ? seeds.ordinary : seeds.final), page = await open(context); await result(page);
      const win = await saved(source); assert.match(await command(page, 'retry').textContent(), /Replay|remaining seals/i);
      await command(page, 'retry').click(); await ready(page);
      assert.deepEqual((await saved(source)).mastery, win.mastery);
      await startAndLose(page); const loss = await saved(source);
      assert.equal(loss.wins, win.wins); assert.equal(loss.pendingVictory, null); assert.deepEqual(loss.mastery, win.mastery);
      await inspect(page, `loss-${chapter}-${reload}-${width}`, true);
      if (reload) {
        await page.reload({ waitUntil: 'networkidle' }); await active(page); await ready(page);
        await page.locator('[data-command="battles"]').click(); await page.getByRole('heading', { name: 'Choose a battle', exact: true }).waitFor();
        await inspect(page, `picker-${chapter}-${width}`, true);
        assert.equal(await page.locator('.battle-option [data-command="next"]').count(), 0, 'selection and continuation are separate');
      }
      assert.match(await command(page, 'next').textContent(), chapter === 5 ? /Next Timeline/i : /Continue/i);
      if (chapter === 5) assert.match(await page.locator('#modal-layer').textContent(), /seal.*reset|seal.*start.*afresh/i);
      return { win: ledger(win), loss: ledger(loss), next: await assertContinue(page, source, chapter, loss) };
    });
    await scenario(`older-replay-${width}`, viewport, async context => {
      const replay = new Game(seeds.older); assert.equal(replay.dispatch({ type: 'retry' }), true);
      const source = await setup(context, replay.profile), page = await open(context); await active(page); await ready(page);
      await page.locator('[data-command="battles"]').click(); await page.locator('[data-battle="1"]').click(); await ready(page);
      await page.locator('[data-command="start"]').click();
      await page.locator('[data-skill="food"]').click();
      const deadline = Date.now() + 150000;
      while (await page.locator('#world').getAttribute('data-phase') === 'running' && Date.now() < deadline) {
        for (const kind of [2, 1, 0]) await deployIfAvailable(page, kind);
        await page.waitForTimeout(200);
      }
      await result(page); const before = await saved(source);
      assert.equal(before.wins, seeds.older.wins + 1); assert.equal(before.pendingVictory.newMask, 0);
      assert.equal(before.pendingVictory.masteryCoins, 0); assert.equal(before.pendingVictory.masteryGems, 0);
      await assertContinue(page, source, 1, before); assert.equal((await saved(source)).furthestBattle, 5);
      return ledger(before);
    });
    for (const chapter of [0, 5]) await scenario(`legacy-continue-${chapter}-${width}`, viewport, async context => {
      const original = chapter === 0 ? seeds.evolve : seeds.final;
      const source = await setup(context, legacy(original)), page = await open(context); await result(page);
      const before = await saved(source); assert.equal(await command(page, 'retry').count(), 0); assert.equal(before.pendingVictory.settlement, 'legacy');
      await page.keyboard.press('Escape'); await result(page); assert.deepEqual(ledger(await saved(source)), ledger(before));
      if (chapter === 0) {
        await command(page, 'evolve').click(); await command(page, 'confirm-evolve').click(); await result(page);
        assert.equal(await command(page, 'retry').count(), 0); assert.deepEqual((await saved(source)).pendingVictory, before.pendingVictory);
      }
      await page.reload({ waitUntil: 'networkidle' }); await result(page);
      assert.equal(await command(page, 'retry').count(), 0); const after = await saved(source);
      await inspect(page, `legacy-${chapter}-${width}`, true); return await assertContinue(page, source, chapter, after);
    });
    for (const old of [false, true]) for (const route of ['return-chapters', 'Escape']) await scenario(`terminal-${old ? 'legacy' : 'new'}-${route}-${width}`, viewport, async context => {
      const source = await setup(context, old ? legacy(seeds.terminal) : seeds.terminal), page = await open(context); await result(page);
      const before = await saved(source); assert.equal(await command(page, 'next').count(), 0);
      await inspect(page, `terminal-${old}-${route}-${width}`, true);
      if (route === 'Escape') await page.keyboard.press('Escape'); else await command(page, 'return-chapters').click();
      await page.getByRole('heading', { name: 'Choose a battle', exact: true }).waitFor();
      assert.equal(await page.locator('#world').getAttribute('data-phase'), 'ready'); assert.equal(await command(page, 'next').count(), 0);
      const after = await saved(source); assert.equal(after.pendingVictory, null);
      for (const field of ['coins', 'gems', 'wins', 'mastery', 'furthestBattle', 'timeline']) assert.deepEqual(after[field], before[field], field);
      await page.keyboard.press('Escape'); await ready(page);
      assert.equal(await page.locator('#battle-view').evaluate(node => node.inert), false);
      await page.locator('[data-command="settings"]').click(); await command(page, 'close').first().click(); await ready(page);
      await page.reload({ waitUntil: 'networkidle' }); await ready(page);
      await page.locator('[data-command="battles"]').click(); await command(page, 'close').first().click(); await ready(page);
      return ledger(after);
    });
  }
  const portrait = { width: 320, height: 568 };
  await scenario('settled-two-tab-takeover', portrait, async context => {
    const source = await setup(context, seeds.evolve), owner = await open(context); await result(owner);
    const before = ledger(await saved(source)), peer = await open(context);
    await peer.getByRole('heading', { name: 'Game open in another tab', exact: true }).waitFor();
    assert.equal(await command(peer, 'next').count(), 0); assert.equal(await command(peer, 'evolve').count(), 0);
    for (const key of ['Escape', 'Space', '1', 'q']) await peer.keyboard.press(key);
    await isolation(peer); assert.deepEqual(ledger(await saved(source)), before);
    await owner.close(); await command(peer, 'session-continue').click({ clickCount: 2 }); await result(peer);
    assert.deepEqual(ledger(await saved(source)), before);
    await peer.reload({ waitUntil: 'networkidle' }); await result(peer); assert.deepEqual(ledger(await saved(source)), before);
    await inspect(peer, 'settled-takeover', true); return before;
  });
  for (const route of ['Escape', 'close', 'confirm-evolve']) await scenario(`foreign-during-evolution-${route}`, portrait, async context => {
    const source = await setup(context, seeds.evolve), page = await open(context); await result(page); await command(page, 'evolve').click();
    // Inject unannounced bytes and invoke the actual return/confirm handler in
    // one browser task. A same-document write emits no storage event here; this
    // prevents autosave/focus from replacing the confirmation before its input.
    // Native ordinary-route clicks/keys and cross-tab notification checks remain above.
    const foreign = await page.evaluate(({ profile, primary, backup, route }) => {
      const confirmation = document.querySelector('#modal-layer [data-command="confirm-evolve"]');
      const button = document.querySelector(`#modal-layer [data-command="${route === 'confirm-evolve' ? 'confirm-evolve' : 'close'}"]`);
      if (!confirmation || (route !== 'Escape' && !button)) throw new Error('Evolution confirmation missing before fault injection');
      localStorage.setItem(primary, JSON.stringify(profile));
      localStorage.setItem(backup, JSON.stringify(profile));
      const expected = [localStorage.getItem(primary), localStorage.getItem(backup)];
      if (route === 'Escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else button.click();
      return expected;
    }, { profile: seeds.insufficient, primary: SAVE_KEY, backup: BACKUP_KEY, route });
    await page.getByRole('heading', { name: 'Your save changed in another tab', exact: true }).waitFor();
    assert.equal(await page.locator('.result-dialog').count(), 0); assert.equal(await command(page, 'confirm-evolve').count(), 0);
    assert.deepEqual(await bytes(source), foreign);
    const rescued = await exported(page); assert.equal(rescued.age, seeds.evolve.age); assert.equal(rescued.coins, seeds.evolve.coins); assert.deepEqual(rescued.pendingVictory, seeds.evolve.pendingVictory);
    await page.keyboard.press('Escape'); await inspect(page, `foreign-${route}`); assert.deepEqual(await bytes(source), foreign);
    await command(page, 'session-continue').click(); await result(page);
    assert.deepEqual(ledger(await saved(source)), ledger(seeds.insufficient));
    await page.reload({ waitUntil: 'networkidle' }); await result(page); assert.deepEqual(ledger(await saved(source)), ledger(seeds.insufficient));
    return { rescued: ledger(rescued), authoritative: ledger(await saved(source)) };
  });
  await scenario('temporary-settled-progression', portrait, async context => {
    const source = await setup(context, seeds.evolve), initial = await bytes(source), page = await open(context);
    await page.getByRole('heading', { name: 'Saving is unavailable', exact: true }).waitFor();
    await command(page, 'session-temporary').click(); await result(page);
    await page.getByText('Temporary play — progress is not saved.', { exact: true }).waitFor();
    await command(page, 'evolve').click(); await command(page, 'confirm-evolve').click(); await result(page);
    await command(page, 'next').click(); await ready(page);
    const current = await memoryProfile(page); assert.equal(current.age, 1); assert.equal(current.enemyAge, 1);
    assert.equal(current.wins, seeds.evolve.wins); assert.deepEqual(current.mastery, seeds.evolve.mastery);
    assert.deepEqual(await bytes(source), initial); await page.close(); assert.deepEqual(await bytes(source), initial);
    return ledger(current);
  }, { noLocks: true });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) await scenario(`fresh-win-paused-input-${viewport.width}`, viewport, async context => {
    const fresh = defaultProfile(); fresh.sound = false; fresh.motion = 'reduced';
    const source = await setup(context, fresh), page = await open(context); await active(page); await ready(page);
    assert.match(await page.locator('#deploy-hint').innerText(),/Tap Battle.*spend food.*fight automatically/,'fresh play teaches the deploy loop');
    await page.locator('[data-command="settings"]').click();
    await command(page, 'speed').click(); assert.equal((await saved(source)).speed, 2);
    await command(page, 'close').first().click(); await ready(page);
    await page.locator('[data-command="start"]').click();
    await page.locator('[data-command="pause"]').click();
    const before = ledger(await saved(source)), food = await page.locator('#food-count').textContent();
    for (const key of ['1', '2', '3', 'q', 'w', 'e']) await page.keyboard.press(key);
    assert.deepEqual(ledger(await saved(source)), before); assert.equal(await page.locator('#food-count').textContent(), food);
    assert.equal(await page.locator('[data-unit="1"]').isDisabled(), true);
    assert.equal(await page.locator('[data-command="battles"]').isDisabled(), true, 'paused running battle cannot open continuation picker');
    assert.equal(await command(page, 'next').count(), 0); await page.locator('[data-command="pause"]').click();
    await page.locator('[data-skill="food"]').click();
    const deadline = Date.now() + 150000;
    while (await page.locator('#world').getAttribute('data-phase') === 'running' && Date.now() < deadline) {
      await deployIfAvailable(page, 0);
      await page.waitForTimeout(200);
    }
    await result(page); const won = await saved(source);
    assert.equal(won.wins, 1); assert.ok(won.mastery.chapters[0].earnedMask & 1); assert.equal(won.pendingVictory.settlement, 'mastery-v1');
    await inspect(page, `fresh-win-${viewport.width}`, true);
    await command(page, 'next').click(); await ready(page); const purchaseBefore = await saved(source);
    await page.locator('[data-command="upgrade-food"]').click(); const purchaseAfter = await saved(source);
    assert.equal(purchaseAfter.foodLevel, 1); assert.equal(purchaseAfter.coins, purchaseBefore.coins - 50);
    assert.deepEqual(purchaseAfter.mastery, won.mastery); assert.equal(purchaseAfter.wins, won.wins);
    return { victory: ledger(won), usefulPurchase: { cost: 50, foodLevel: purchaseAfter.foodLevel } };
  });
  assert.deepEqual(diagnostics.pageErrors, [], 'no application page errors');
  assert.deepEqual(diagnostics.assetFailures, [], 'storybook requests succeed');
  assert.equal(diagnostics.cases.length, 37, 'all specified browser scenarios ran');
  await reviewPrestige({scenario,seeds,setup,open,active,ready,result,saved,bytes,command,inspect,isolation,exported,memoryProfile,startAndLose});
  await reviewScouting({scenario,seeds,setup,open,active,ready,result,saved,bytes,command,inspect});
  assert.equal(diagnostics.cases.length,53,'37 mastery, 14 prestige and 2 scouting scenarios ran');
  assert.deepEqual(diagnostics.pageErrors, [], 'prestige raises no application errors');
  assert.ok(diagnostics.cases.every(item => item.status === 'passed'), JSON.stringify(diagnostics.cases.filter(item => item.status !== 'passed'), null, 2));
  diagnostics.status = 'passed'; console.log(`Mastery browser review passed: ${diagnostics.cases.length} cases`);
} catch (error) { diagnostics.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  diagnostics.serverLog = serverLog;
  writeFileSync(`${output}/diagnostics.json`, JSON.stringify(diagnostics, null, 2));
  try { await browser?.close(); } finally { server?.kill('SIGTERM'); }
}
