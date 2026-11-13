/**
 * Wins chapter 1 in the simulated iPhone app, taps "Send a postcard home" and writes the PNG the share sheet would get.
 * node scripts/qa-gate/postcard-capture.mjs <url> <out.png> [en|ar]
 */
import {writeFileSync} from 'node:fs';
import {webkit} from 'playwright';
const [url = 'http://127.0.0.1:5794/', out = 'postcard.png', lang = 'ar'] = process.argv.slice(2);
const browser = await webkit.launch();
const context = await browser.newContext({viewport: {width: 375, height: 667}, deviceScaleFactor: 2, hasTouch: true, isMobile: true});
await context.addInitScript(({lang, seed}) => {
  localStorage.setItem('almo7areboon.lang.v1', lang); if (!localStorage.getItem('almo7areboon.save.v1')) localStorage.setItem('almo7areboon.save.v1', seed);
  Object.defineProperty(window, 'webkit', {configurable: true, value: {messageHandlers: {almo7areboon: {postMessage(m) { (window.__posted ||= []).push(m); }}}}});
  window.__almoAppBoot = {owned: {}, prices: {fullGame: '$4.99'}};
}, {lang, seed: JSON.stringify({version: 2, timeline: 1, age: 0, enemyAge: 0, coins: 120, cards: [], unlocked: [true, true, true], foodLevel: 6, sound: false, deployed: 12, kills: 9, wins: 1, played: true, furthestBattle: 1})});
const page = await context.newPage();
await page.goto(url); await page.waitForSelector('#entry-play:not([disabled])'); await page.locator('#entry-play').tap();
for (let i = 0; i < 400 && !(await page.locator('[data-command=share-postcard]').isVisible().catch(() => false)); i++) { const card = page.locator('[data-unit]:visible:not([disabled])').first(); if (await card.count()) await card.tap({timeout: 1000}).catch(() => {}); await page.waitForTimeout(250); }
await page.locator('[data-command=share-postcard]').tap();
const msg = await page.waitForFunction(() => (window.__posted || []).find(m => m && m.type === 'share'), null, {timeout: 15000}).then(h => h.jsonValue());
writeFileSync(out, Buffer.from(String(msg.data.dataURL).split(',')[1], 'base64'));
console.log('postcard', out);
await browser.close();
