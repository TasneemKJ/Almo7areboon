/**
 * Geometry and legibility probe: at six viewport sizes and with very large coin and gem totals, checks that the main heads-up
 * elements (currencies, title, chapter dots, wave readout, speed and pause, skill buttons, ready panel, hint) never overlap.
 * Run against a running preview:  node scripts/hud-overlap-check.mjs [url=http://127.0.0.1:4173/]
 * Set CHROMIUM_PATH to reuse an installed Chromium. Also checks that the Settings and Quests dialog titles contrast with their parchment. Exits 1 when any pair overlaps by more than 2px each way or a title is illegible.
 */
import {chromium} from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const selectors = ['.currency', '.game-wordmark', '.world-tools button', '#timeline', '#age-title', '#scene-name', '#battle-select', '#wave-label', '#speed', '#pause', '.battle-skills button', '.ready-title', '.ready .big-button', '.ready p', '#deploy-hint'];
const sizes = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [768, 1024]];
const save = {version: 2, timeline: 1, age: 0, enemyAge: 0, furthestBattle: 0, coins: 123456, gems: 100000, foodLevel: 0, baseLevel: 0, unlocked: [true, true, true], cards: Array(30).fill(0), summonCount: 0, summonSeed: 99, pendingVictory: null, kills: 0, wins: 0, deployed: 0, claimed: [], dailyDay: 0, dailyStreak: 0, sound: false, speed: 1, motion: 'system'};
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
let failed = false;

for (const [width, height] of sizes) {
  const page = await browser.newPage({viewport: {width, height}});
  await page.addInitScript(value => localStorage.setItem('almo7areboon.save.v1', value), JSON.stringify(save));
  await page.goto(url);
  await page.waitForSelector('#age-title');
  await page.waitForTimeout(800);
  const scan = phase => page.evaluate(([selectors, phase]) => {
    const boxes = [];
    for (const selector of selectors) document.querySelectorAll(selector).forEach((element, index) => {
      const style = getComputedStyle(element);
      if (element.closest('[hidden]') || style.display === 'none' || style.visibility === 'hidden') return;
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height) boxes.push({name: `${selector}#${index}`, rect});
    });
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].rect, b = boxes[j].rect;
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 2 && y > 2) overlaps.push(`${boxes[i].name} x ${boxes[j].name} (${Math.round(x)}x${Math.round(y)}px)`);
    }
    return {phase, overlaps};
  }, [selectors, phase]);
  const results = [await scan('ready')];
  await page.click('[data-command=start]');
  await page.waitForTimeout(600);
  results.push(await scan('running'));
  for (const {phase, overlaps} of results) {
    if (overlaps.length) failed = true;
    console.log(`${overlaps.length ? 'FAIL' : 'ok  '} ${width}x${height} ${phase}${overlaps.length ? `: ${overlaps.join('; ')}` : ''}`);
  }
  await page.close();
}

// Legibility smoke test: dialog text must contrast with the parchment behind it (a stray inherited light colour once hid every label).
const page = await browser.newPage({viewport: {width: 390, height: 844}});
await page.addInitScript(value => localStorage.setItem('almo7areboon.save.v1', value), JSON.stringify(save));
await page.goto(url);
await page.waitForSelector('#age-title');
for (const command of ['settings', 'quests']) {
  await page.click(`[data-command=${command}]`);
  await page.waitForTimeout(500);
  const ratio = await page.evaluate(() => {
    const channels = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = luminance(channels(getComputedStyle(document.querySelector('#dialog-title')).color));
    const background = luminance(channels(getComputedStyle(document.querySelector('.dialog')).backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  const ok = ratio >= 4.5;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${command} dialog title contrast ${ratio.toFixed(1)}:1`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}
await browser.close();
process.exit(failed ? 1 : 0);
