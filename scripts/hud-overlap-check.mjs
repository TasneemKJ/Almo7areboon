/**
 * Geometry and legibility probe for the world-first shell. At six viewport sizes (touch) and with very large coin and gem
 * totals it checks that nothing the player taps or reads overlaps:
 *  - in battle: the chapter title, the field cue, the pause button, the waiting recruits, the Hold/Advance gates and the
 *    standard and supplies once they appear;
 *  - in Camp: the heading, the four places and the Battle/Home footer.
 * Every visible control in both is a 44px target, and the page never scrolls sideways. It also checks that the Settings and
 * Quests dialog titles contrast with their parchment.
 * Run against a running preview:  node scripts/hud-overlap-check.mjs [url=http://127.0.0.1:4173/]
 * Set CHROMIUM_PATH to reuse an installed Chromium. Exits 1 when any pair overlaps by more than 2px each way, a target is
 * small, the page scrolls sideways or a title is illegible.
 */
import {launchChromium, enterCamp, goHome, openQuests, openSettings} from './lib/browser.mjs';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const FIELD = ['#age-title', '#field-food', '#field-cue', '.field-chrome button', '[data-field-recruit]', '[data-field-gate]', '#field-standard', '#field-supplies'];
const CAMP = ['.camp-heading', '.camp-place', '.camp-footer button'];
const sizes = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [768, 1024]];
const save = {version: 2, timeline: 1, age: 0, enemyAge: 0, furthestBattle: 0, coins: 123456, gems: 100000, foodLevel: 0, baseLevel: 0, unlocked: [true, true, true], cards: Array(30).fill(0), summonCount: 0, summonSeed: 99, pendingVictory: null, kills: 0, wins: 1, deployed: 3, claimed: [], dailyDay: 0, dailyStreak: 0, sound: false, speed: 1, motion: 'system', played: true};
const browser = await launchChromium();
let failed = false;

const scan = (page, selectors) => page.evaluate(selectors => {
  const boxes = [], small = [];
  for (const selector of selectors) document.querySelectorAll(selector).forEach((element, index) => {
    const style = getComputedStyle(element);
    if (element.closest('[hidden],[inert]') || style.display === 'none' || style.visibility === 'hidden' || !element.textContent.trim() && element.tagName !== 'BUTTON') return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    boxes.push({name: `${selector}#${index}`, rect});
    if (element.tagName === 'BUTTON' && (rect.width < 43.5 || rect.height < 43.5)) small.push(`${selector}#${index} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
  });
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i].rect, b = boxes[j].rect;
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (x > 2 && y > 2) overlaps.push(`${boxes[i].name} x ${boxes[j].name} (${Math.round(x)}x${Math.round(y)}px)`);
  }
  return {overlaps, small, sideways: document.documentElement.scrollWidth > innerWidth + 1};
}, selectors);

function report(label, {overlaps, small, sideways}) {
  const problems = [...overlaps, ...small.map(s => `small target ${s}`), ...(sideways ? ['horizontal scroll'] : [])];
  if (problems.length) failed = true;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${label}${problems.length ? `: ${problems.join('; ')}` : ''}`);
}

for (const [width, height] of sizes) {
  const context = await browser.newContext({viewport: {width, height}, hasTouch: true, isMobile: width < 700, deviceScaleFactor: 2}); context.setDefaultTimeout(90000);
  const page = await context.newPage();
  await page.addInitScript(value => localStorage.setItem('almo7areboon.save.v1', value), JSON.stringify(save));
  await page.goto(url);
  await enterCamp(page);
  await page.waitForTimeout(500);
  report(`${width}x${height} camp`, await scan(page, CAMP));
  await page.tap('[data-command=camp-battle]');
  await page.waitForTimeout(800);
  report(`${width}x${height} battle start`, await scan(page, FIELD));
  // Deploy by touch so the standard and supplies join the field, then look again.
  for (let i = 0; i < 4; i++) { await page.tap('[data-field-recruit="0"]', {timeout: 2000}).catch(() => {}); await page.waitForTimeout(700); }
  report(`${width}x${height} battle running`, await scan(page, FIELD));
  await context.close();
}

// Legibility smoke test: dialog text must contrast with the parchment behind it (a stray inherited light colour once hid every label).
const context = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true}); context.setDefaultTimeout(90000);
const page = await context.newPage();
await page.addInitScript(value => localStorage.setItem('almo7areboon.save.v1', value), JSON.stringify(save));
await page.goto(url);
for (const [name, open] of [['settings', openSettings], ['quests', openQuests]]) {
  await open(page);
  await page.waitForTimeout(400);
  const ratio = await page.evaluate(() => {
    const channels = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = luminance(channels(getComputedStyle(document.querySelector('#modal-layer #dialog-title')).color));
    const background = luminance(channels(getComputedStyle(document.querySelector('#modal-layer .dialog')).backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  const ok = ratio >= 4.5;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} dialog title contrast ${ratio.toFixed(1)}:1`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await goHome(page);
}
await browser.close();
process.exit(failed ? 1 : 0);
