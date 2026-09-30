/**
 * Robustness probe for a built or running game: starts it against damaged saves, then feeds it random taps, keys and
 * button presses, plus one end-to-end evolution. It fails on any uncaught page error, when the game does not start, or when
 * evolving does not reset local army progress while retaining the selected opponent.
 * Run: npm run build && npm run preview, then  node scripts/monkey-test.mjs [url=http://127.0.0.1:4173/] [seconds=30]
 * Set CHROMIUM_PATH to use an existing Chromium instead of the one Playwright downloads.
 */
import {chromium} from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/', seconds = Number(process.argv[3] ?? 30);
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
  await page.click('[data-command=start]').catch(() => {});
  await page.waitForTimeout(500);
  const phase = await page.getAttribute('#world', 'data-phase').catch(() => null);
  const ok = Boolean(title) && phase === 'running' && errors.length === 0;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(15)} title=${title} phase=${phase}${errors.length ? ` errors=${errors.join(' | ')}` : ''}`);
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
