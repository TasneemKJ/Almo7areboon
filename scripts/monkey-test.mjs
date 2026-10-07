/**
 * Robustness probe for a built or running game: starts it against damaged saves, then feeds it random taps, keys and
 * button presses, plus one end-to-end evolution through Camp, keyboard-only play and a backup round trip. It fails on any
 * uncaught page error, when the game does not start, or when evolving does not reset local army progress while retaining
 * the selected opponent.
 * Run: npm run build && npm run preview, then  node scripts/monkey-test.mjs [url=http://127.0.0.1:4173/] [seconds=30]
 * Set CHROMIUM_PATH to use an existing Chromium instead of the one Playwright downloads.
 */
import {launchChromium, enterWorld, openEvolution, openSettings, phase, waitForEntry} from './lib/browser.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/', seconds = Number(process.argv[3] ?? 30);
const SAVE = 'almo7areboon.save.v1';
const saves = {
  'no save': null, garbage: '{{{not json', 'empty object': '{}', 'json null': 'null',
  'absurd numbers': JSON.stringify({version: 2, timeline: 1e99, age: 99, enemyAge: -4, coins: 'x', cards: [1, 2], pendingVictory: {timeline: 1}}),
  'future version': JSON.stringify({version: 9}),
  'wrong types': JSON.stringify({version: 2, timeline: 1, age: 0, enemyAge: 0, coins: 0, cards: 'abc', unlocked: 'yes', claimed: {}, pendingVictory: []}),
};
const failures = [];
const browser = await launchChromium();

const stored = (page, key = SAVE) => page.evaluate(key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }, key);

for (const [name, raw] of Object.entries(saves)) {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(([key, value]) => {
    localStorage.removeItem(`${key}.backup`);
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  }, [SAVE, raw]);
  await page.goto(url);
  // A save from a newer game version is protected: the game shows a recovery dialog instead of starting, and must
  // leave the stored value untouched even after the player chooses temporary play.
  const protect = page.locator('button', {hasText: 'PLAY WITHOUT SAVING'}).first();
  await Promise.race([protect.waitFor({timeout: 15000}), waitForEntry(page, 15000)]).catch(() => {});
  const protectedDialog = await protect.isVisible().catch(() => false);
  if (protectedDialog) await protect.click();
  const title = await waitForEntry(page, 15000).then(() => page.locator('#entry-chapter').textContent(), () => null);
  await enterWorld(page).catch(() => {});
  await page.waitForTimeout(500);
  const now = await phase(page);
  const untouched = !protectedDialog || (await page.evaluate(key => localStorage.getItem(key), SAVE)) === raw;
  const ok = Boolean(title) && now === 'running' && errors.length === 0 && untouched && protectedDialog === (name === 'future version');
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(15)} chapter=${title} phase=${now}${protectedDialog ? ' (protected save, stored value ' + (untouched ? 'untouched' : 'CHANGED') + ')' : ''}${errors.length ? ` errors=${errors.join(' | ')}` : ''}`);
  if (!ok) failures.push(name);
  await page.close();
}

// Evolution flow through Camp (Your company, then Evolution): confirmed evolution changes army age and resets coins,
// upgrades and troop unlocks. The selected opponent, unlocked chapter frontier and earned seals stay.
{
  const flow = await browser.newPage({viewport: {width: 390, height: 844}});
  const flowErrors = [];
  flow.on('pageerror', error => flowErrors.push(error.message));
  await flow.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [SAVE, JSON.stringify({version: 2, timeline: 1, age: 4, enemyAge: 4, furthestBattle: 4, coins: 14000000, gems: 100, foodLevel: 5, baseLevel: 3, unlocked: [true, true, true], cards: Array(30).fill(0), summonCount: 0, summonSeed: 99, pendingVictory: null, kills: 0, wins: 0, deployed: 0, claimed: [], dailyDay: 0, dailyStreak: 0, sound: false, speed: 1, motion: 'system', played: true})]);
  await flow.goto(url);
  await openEvolution(flow);
  await flow.click('[data-command=evolve]');
  await flow.click('[data-command=confirm-evolve]');
  await flow.waitForFunction(key => JSON.parse(localStorage.getItem(key)).age === 5, SAVE);
  const saved = await stored(flow);
  const after = {age: saved.age, enemyAge: saved.enemyAge, coins: saved.coins, foodLevel: saved.foodLevel, unlocked: saved.unlocked.map(u => u ? 'U' : 'L').join('')};
  const good = after.age === 5 && after.enemyAge === 4 && after.coins === 0 && after.foodLevel === 0 && after.unlocked === 'ULL' && flowErrors.length === 0;
  console.log(`${good ? 'ok  ' : 'FAIL'} evolution flow: ${JSON.stringify(after)}${flowErrors.length ? ` errors=${flowErrors.join(' | ')}` : ''}`);
  if (!good) failures.push('evolution flow');
  await flow.close();
}

// Keyboard-only play: Tab reaches Play and Enter starts the battle; Space then pauses and resumes it, and the skill keys
// Q (Freeze) and E (Food Drop) are accepted once each.
{
  const keys = await browser.newPage({viewport: {width: 390, height: 844}});
  const keyErrors = [];
  keys.on('pageerror', error => keyErrors.push(error.message));
  await keys.addInitScript(([key]) => { if (!sessionStorage.getItem('fresh')) { sessionStorage.setItem('fresh', '1'); localStorage.removeItem(key); } }, [SAVE]);
  await keys.goto(url);
  await waitForEntry(keys);
  for (let i = 0; i < 10 && !(await keys.evaluate(() => document.activeElement?.id === 'entry-play')); i++) await keys.keyboard.press('Tab');
  await keys.keyboard.press('Enter');
  await keys.waitForTimeout(600);
  const started = (await phase(keys)) === 'running';
  await keys.keyboard.press('Space');
  await keys.waitForTimeout(300);
  const paused = await keys.locator('#pause-banner').isVisible();
  await keys.keyboard.press('Space');
  await keys.waitForTimeout(300);
  const resumed = !(await keys.locator('#pause-banner').isVisible());
  await keys.keyboard.press('q');
  await keys.keyboard.press('e');
  await keys.waitForTimeout(300);
  // The skill readout keeps each skill's used state for the field's enemy and supplies menus.
  const usedSkills = await keys.evaluate(() => [...document.querySelectorAll('#battle-skills [data-skill]')].filter(button => button.classList.contains('used')).map(button => button.dataset.skill).sort().join(','));
  const good = started && paused && resumed && usedSkills === 'food,freeze' && keyErrors.length === 0;
  console.log(`${good ? 'ok  ' : 'FAIL'} keyboard play: started=${started} pausedBySpace=${paused} resumedBySpace=${resumed} skillKeysUsed=${usedSkills || 'none'}${keyErrors.length ? ` errors=${keyErrors.join(' | ')}` : ''}`);
  if (!good) failures.push('keyboard play');
  await keys.close();
}

// Backup round trip and a save that stops working mid-session: the warning appears, the session keeps running, and an
// exported backup restores the exact progress in a fresh browser profile.
{
  const seed = {version: 2, timeline: 2, age: 1, enemyAge: 1, furthestBattle: 1, coins: 4321, gems: 555, foodLevel: 4, baseLevel: 3, unlocked: [true, true, false], cards: Array.from({length: 30}, (_, i) => i % 3), summonCount: 12, summonSeed: 777, pendingVictory: null, kills: 40, wins: 6, deployed: 90, claimed: ['first-blood'], dailyDay: 99999, dailyStreak: 2, sound: false, speed: 1, motion: 'system'};
  const source = await browser.newContext({viewport: {width: 390, height: 844}, acceptDownloads: true});
  const origin = await source.newPage();
  const roundTripErrors = [];
  origin.on('pageerror', error => roundTripErrors.push(error.message));
  await origin.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, [SAVE, JSON.stringify(seed)]);
  await origin.goto(url);
  await waitForEntry(origin);
  await origin.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (name.startsWith(key)) throw new DOMException('full', 'QuotaExceededError'); return original.call(this, name, value); };
  }, SAVE);
  await enterWorld(origin);
  await origin.waitForTimeout(6500);
  const warned = await origin.evaluate(() => document.getElementById('toast').textContent.includes('could not be saved'));
  const stillRunning = (await phase(origin)) === 'running';
  await openSettings(origin);
  await origin.click('#modal-layer [data-command=save-recovery]');
  const download = origin.waitForEvent('download', {timeout: 5000}).catch(() => null);
  await origin.click('#modal-layer [data-command=export]');
  const file = await download;
  let restored = null;
  if (file) {
    const path = await file.path();
    const target = await browser.newContext({viewport: {width: 390, height: 844}});
    const fresh = await target.newPage();
    fresh.on('pageerror', error => roundTripErrors.push(error.message));
    await fresh.goto(url);
    await openSettings(fresh);
    await fresh.click('#modal-layer [data-command=save-recovery]');
    await fresh.setInputFiles('#import-save', path);
    await fresh.click('[data-command=confirm-import]', {timeout: 5000}).catch(() => {});
    await fresh.waitForFunction(key => JSON.parse(localStorage.getItem(key) ?? 'null')?.coins === 4321, SAVE, {timeout: 5000}).catch(() => {});
    const profile = await stored(fresh);
    restored = profile && {timeline: profile.timeline, coins: profile.coins, gems: profile.gems};
    await target.close();
  }
  const good = warned && stillRunning && restored?.coins === 4321 && restored?.gems === 555 && restored?.timeline === 2 && roundTripErrors.length === 0;
  console.log(`${good ? 'ok  ' : 'FAIL'} unwritable save + backup round trip: warned=${warned} running=${stillRunning} restored=${JSON.stringify(restored)}${roundTripErrors.length ? ` errors=${roundTripErrors.join(' | ')}` : ''}`);
  if (!good) failures.push('backup round trip');
  await source.close();
}

const page = await browser.newPage({viewport: {width: 390, height: 844}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(url);
await waitForEntry(page);
let seed = 7;
const random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const keys = ['1', '2', '3', 'q', 'w', 'e', 'Space', 'Escape', 'Tab', 'Enter', 'ArrowDown', 'p'];
const end = Date.now() + seconds * 1000;
let actions = 0;
while (Date.now() < end) {
  actions++;
  const roll = random();
  if (roll < 0.45) await page.mouse.click(Math.floor(random() * 390), Math.floor(random() * 844)).catch(() => {});
  else if (roll < 0.75) await page.keyboard.press(keys[Math.floor(random() * keys.length)]).catch(() => {});
  else {
    const buttons = await page.$$('button:not([disabled])');
    if (buttons.length) await buttons[Math.floor(random() * buttons.length)].click({timeout: 500, force: true}).catch(() => {});
  }
  await page.waitForTimeout(40);
}
console.log(`${errors.length ? 'FAIL' : 'ok  '} random input: ${actions} actions${errors.length ? `, errors: ${errors.join(' | ')}` : ', no page errors'}`);
if (errors.length) failures.push('random input');
await browser.close();
process.exit(failures.length ? 1 : 0);
