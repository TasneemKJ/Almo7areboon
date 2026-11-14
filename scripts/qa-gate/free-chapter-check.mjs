// Can a free player (simulated app, no Full Journey) fight chapter 3? Since 1.3 it must (chapters 1-3 are free; chapter 4
// is the first that opens the card). Loads a profile with chapter 3 open and presses Play.
// node scripts/qa-gate/free-chapter-check.mjs
import {readFileSync} from 'node:fs';
import {launch, newPhone, BASE, OUT} from './lib.mjs';
const b = await launch();
for (const owned of [{}, {fullGame: true}]) {
  const {page, context} = await newPhone(b, {lang: 'en', owned});
  await context.addInitScript(p => { if (!sessionStorage.getItem('s')) { localStorage.setItem('almo7areboon.save.v1', p); sessionStorage.setItem('s', '1'); } }, readFileSync(`${OUT}/profile-mid.json`, 'utf8'));
  await page.goto(BASE); await page.waitForSelector('#entry-play:not([disabled])'); await page.waitForTimeout(500);
  const entry = await page.evaluate(() => ({chapter: document.getElementById('entry-chapter')?.innerText, path: document.getElementById('entry-path')?.innerText, play: document.getElementById('entry-play')?.innerText}));
  await page.locator('#entry-play').tap(); await page.waitForTimeout(3000);
  const battle = await page.evaluate(() => ({phase: document.getElementById('world')?.dataset.phase, title: document.querySelector('.field-title, #field-title, h1')?.innerText, modal: document.querySelector('#modal-layer:not([hidden])')?.innerText.slice(0, 200), enemyAge: JSON.parse(localStorage.getItem('almo7areboon.save.v1')).enemyAge}));
  await page.screenshot({path: `${OUT}/en-check-free-chapter-${owned.fullGame ? 'owned' : 'free'}.png`});
  console.log(owned, entry, battle);
  await context.close();
}
await b.close();
