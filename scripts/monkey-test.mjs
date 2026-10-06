/**
 * Robustness probe for a built or running game: starts it against damaged saves, then feeds it random taps, keys and
 * button presses, plus one end-to-end evolution. It fails on any uncaught page error, when the game does not start, or when
 * evolving does not reset local army progress while retaining the selected opponent.
 * Run: npm run build && npm run preview, then  node scripts/monkey-test.mjs [url=http://127.0.0.1:4173/] [seconds=30]
 * Set CHROMIUM_PATH to use an existing Chromium instead of the one Playwright downloads.
 */
import {chromium} from 'playwright';
import {reviewPort} from './review-port.mjs';

const url = process.argv[2] ?? `http://127.0.0.1:${reviewPort(4173)}/`, seconds = Number(process.argv[3] ?? 30);
const SAVE = 'almo7areboon.save.v1';
const saves = {
  'no save': null, garbage: '{{{not json', 'empty object': '{}', 'json null': 'null',
  'absurd numbers': JSON.stringify({version: 2, timeline: 1e99, age: 99, enemyAge: -4, coins: 'x', cards: [1, 2], pendingVictory: {timeline: 1}}),
  'future version': JSON.stringify({version: 9}),
  'wrong types': JSON.stringify({version: 2, timeline: 1, age: 0, enemyAge: 0, coins: 0, cards: 'abc', unlocked: 'yes', claimed: {}, pendingVictory: []}),
};
const failures = [];
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});

for (const [name, raw] of Object.entries(saves)) {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(([key, value]) => {
    localStorage.removeItem(`${key}.backup`);
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  }, [SAVE, raw]);
  await page.goto(url);
  const title = await page.waitForSelector('#age-title', {timeout: 10000}).then(el => el.textContent()).catch(() => null);
  // A save from a newer game version is protected: the game shows a recovery dialog instead of starting, and must
  // leave the stored value untouched even after the player chooses temporary play.
  const protectedDialog = await page.locator('button', {hasText: 'PLAY WITHOUT SAVING'}).first().isVisible().catch(() => false);
  if (protectedDialog) await page.locator('button', {hasText: 'PLAY WITHOUT SAVING'}).first().click();
  await page.click('[data-command=start]').catch(() => {});
  await page.waitForTimeout(500);
  const phase = await page.getAttribute('#world', 'data-phase').catch(() => null);
  const untouched = !protectedDialog || (await page.evaluate(key => localStorage.getItem(key), SAVE)) === raw;
  const ok = Boolean(title) && phase === 'running' && errors.length === 0 && untouched && protectedDialog === (name === 'future version');
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(15)} title=${title} phase=${phase}${protectedDialog ? ' (protected save, stored value ' + (untouched ? 'untouched' : 'CHANGED') + ')' : ''}${errors.length ? ` errors=${errors.join(' | ')}` : ''}`);
  if (!ok) failures.push(name);
  await page.close();
}

// Evolution flow: confirmed evolution changes army age and resets coins, upgrades and troop unlocks.
// The selected opponent, unlocked chapter frontier and earned seals stay. This seed selects opponent 5.
{
  const flow = await browser.newPage({viewport: {width: 390, height: 844}});
  const flowErrors = [];
  flow.on('pageerror', error => flowErrors.push(error.message));
  await flow.addInitScript(([key, value]) => localStorage.setItem(key, value), [SAVE, JSON.stringify({version: 2, timeline: 1, age: 4, enemyAge: 4, furthestBattle: 4, coins: 14000000, gems: 100, foodLevel: 5, baseLevel: 3, unlocked: [true, true, true], cards: Array(30).fill(0), summonCount: 0, summonSeed: 99, pendingVictory: null, kills: 0, wins: 0, deployed: 0, claimed: [], dailyDay: 0, dailyStreak: 0, sound: false, speed: 1, motion: 'system'})]);
  await flow.goto(url);
  await flow.waitForSelector('#age-title', {timeout: 10000});
  await flow.click('[data-tab=evolution]');
  await flow.click('[data-command=evolve]');
  await flow.click('[data-command=confirm-evolve]');
  await flow.waitForTimeout(600);
  const after = await flow.evaluate(() => ({
    title: document.getElementById('age-title').textContent,
    timeline: document.getElementById('timeline').textContent,
    coins: document.getElementById('coins').textContent,
    locked: [...document.querySelectorAll('.unit-card')].map(card => card.classList.contains('locked') ? 'L' : 'U').join(''),
  }));
  const good = after.title === 'Courtyards Beyond' && after.timeline.includes('BATTLE 5') && after.coins === '0' && after.locked === 'ULL' && flowErrors.length === 0;
  console.log(`${good ? 'ok  ' : 'FAIL'} evolution flow: ${JSON.stringify(after)}${flowErrors.length ? ` errors=${flowErrors.join(' | ')}` : ''}`);
  if (!good) failures.push('evolution flow');
  await flow.close();
}

// Keyboard-only start: nothing may hold focus after loading, so Space starts the battle and a second Space pauses it.
{
  const keys = await browser.newPage({viewport: {width: 390, height: 844}});
  const keyErrors = [];
  keys.on('pageerror', error => keyErrors.push(error.message));
  await keys.addInitScript(([key]) => localStorage.removeItem(key), [SAVE]);
  await keys.goto(url);
  await keys.waitForSelector('#age-title', {timeout: 10000});
  await keys.waitForTimeout(1200);
  const focusOnButton = await keys.evaluate(() => document.activeElement instanceof HTMLButtonElement);
  await keys.keyboard.press('Space');
  await keys.waitForTimeout(500);
  const started = (await keys.getAttribute('#world', 'data-phase')) === 'running';
  await keys.keyboard.press('Space');
  await keys.waitForTimeout(300);
  const paused = (await keys.getAttribute('#pause', 'aria-pressed')) === 'true';
  await keys.keyboard.press('Space');
  await keys.waitForTimeout(300);
  // Skill keys: Q casts Freeze and E casts Food Drop, each once per battle.
  await keys.keyboard.press('q');
  await keys.keyboard.press('e');
  await keys.waitForTimeout(300);
  const usedSkills = await keys.evaluate(() => [...document.querySelectorAll('.skill-circle')].filter(button => button.classList.contains('used')).map(button => button.dataset.skill).sort().join(','));
  const skillKeys = usedSkills === 'food,freeze';
  const good = !focusOnButton && started && paused && skillKeys && keyErrors.length === 0;
  console.log(`${good ? 'ok  ' : 'FAIL'} keyboard start: focusOnButton=${focusOnButton} started=${started} pausedBySecondSpace=${paused} skillKeysUsed=${usedSkills || 'none'}${keyErrors.length ? ` errors=${keyErrors.join(' | ')}` : ''}`);
  if (!good) failures.push('keyboard start');
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
  await origin.waitForSelector('#age-title', {timeout: 10000});
  await origin.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (name.startsWith(key)) throw new DOMException('full', 'QuotaExceededError'); return original.call(this, name, value); };
  }, SAVE);
  await origin.click('[data-command=start]');
  await origin.waitForTimeout(6500);
  const warned = await origin.evaluate(() => document.getElementById('toast').textContent.includes('could not be saved'));
  const stillRunning = (await origin.getAttribute('#world', 'data-phase')) === 'running';
  await origin.click('[data-command=settings]');
  const download = origin.waitForEvent('download', {timeout: 5000}).catch(() => null);
  await origin.click('[data-command=export]');
  const file = await download;
  let restored = null;
  if (file) {
    const path = await file.path();
    const target = await browser.newContext({viewport: {width: 390, height: 844}});
    const fresh = await target.newPage();
    fresh.on('pageerror', error => roundTripErrors.push(error.message));
    await fresh.goto(url);
    await fresh.waitForSelector('#age-title', {timeout: 10000});
    await fresh.click('[data-command=settings]');
    await fresh.setInputFiles('#import-save', path);
    await fresh.click('[data-command=confirm-import]', {timeout: 5000}).catch(() => {});
    await fresh.waitForTimeout(700);
    restored = await fresh.evaluate(() => ({timeline: document.getElementById('timeline').textContent, coins: document.getElementById('coins').textContent, gems: document.getElementById('gems').textContent}));
    await target.close();
  }
  const good = warned && stillRunning && restored?.coins === '4,321' && restored?.gems === '555' && restored?.timeline.includes('TIMELINE 2') && roundTripErrors.length === 0;
  console.log(`${good ? 'ok  ' : 'FAIL'} unwritable save + backup round trip: warned=${warned} running=${stillRunning} restored=${JSON.stringify(restored)}${roundTripErrors.length ? ` errors=${roundTripErrors.join(' | ')}` : ''}`);
  if (!good) failures.push('backup round trip');
  await source.close();
}

const page = await browser.newPage({viewport: {width: 390, height: 844}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(url);
await page.waitForSelector('#age-title', {timeout: 10000});
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
