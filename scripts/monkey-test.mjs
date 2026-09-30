/**
 * Robustness probe for a built or running game: starts it against damaged saves, then feeds it random taps, keys and
 * button presses. It fails on any uncaught page error or when the game does not start.
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
