/**
 * Text-clipping probe: on each screen and dialog, at 320 and 390px wide, measures every text run and reports any that a
 * `overflow: hidden|clip` ancestor cuts off, or that runs past the viewport edge.
 * Scrolling containers (overflow auto|scroll) are ignored because clipped content there is reachable by scrolling.
 * Run against a running preview:  node scripts/text-clip-check.mjs [url=http://127.0.0.1:4173/]
 * Set CHROMIUM_PATH to reuse an installed Chromium. Exits 1 when any text is cut off.
 */
import {chromium} from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
const save = {version: 2, timeline: 1, age: 0, enemyAge: 1, furthestBattle: 1, coins: 123456, gems: 100000, foodLevel: 2, baseLevel: 1, unlocked: [true, true, false], cards: Array.from({length: 30}, (_, i) => (i % 4) * 30), summonCount: 10, summonSeed: 4242, pendingVictory: null, kills: 12, wins: 2, deployed: 30, claimed: [], dailyDay: 0, dailyStreak: 0, sound: true, speed: 1, motion: 'system'};
let failed = false;

async function scan(page, label, width) {
  const clipped = await page.evaluate(() => {
    const found = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      const element = node.parentElement;
      if (!text || !element || element.closest('[hidden]') || (element.closest('[inert]') && !element.closest('#modal-layer'))) continue;
      if (element.closest('.sr-only, canvas, script, style, details:not([open]) > :not(summary)')) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || +style.opacity === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const box = range.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      let reason = null;
      if (box.right > innerWidth + 1 || box.left < -1) reason = 'past the viewport edge';
      let scrollsX = false, scrollsY = false;
      for (let ancestor = element; ancestor && !reason; ancestor = ancestor.parentElement) {
        const overflowX = getComputedStyle(ancestor).overflowX, overflowY = getComputedStyle(ancestor).overflowY;
        // Inside a scroller, content beyond an outer clip can be scrolled into view, so only clips nearer than the scroller count.
        const clipsX = !scrollsX && (overflowX === 'hidden' || overflowX === 'clip'), clipsY = !scrollsY && (overflowY === 'hidden' || overflowY === 'clip');
        if (overflowX === 'auto' || overflowX === 'scroll') scrollsX = true;
        if (overflowY === 'auto' || overflowY === 'scroll') scrollsY = true;
        if (!clipsX && !clipsY) continue;
        const room = ancestor.getBoundingClientRect();
        if (clipsX && (box.left < room.left - 1 || box.right > room.right + 1)) reason = `cut horizontally by ${ancestor.className || ancestor.tagName}`;
        else if (clipsY && (box.top < room.top - 1 || box.bottom > room.bottom + 1) && room.top >= 0 && room.bottom <= innerHeight + 1) reason = `cut vertically by ${ancestor.className || ancestor.tagName}`;
      }
      if (reason) found.push(`"${text.slice(0, 28)}" ${reason}`);
    }
    return [...new Set(found)];
  });
  if (clipped.length) failed = true;
  console.log(`${clipped.length ? 'FAIL' : 'ok  '} ${width}px ${label}${clipped.length ? `: ${clipped.join('; ')}` : ''}`);
}

for (const width of [320, 390]) {
  const page = await browser.newPage({viewport: {width, height: width === 320 ? 568 : 844}});
  await page.addInitScript(value => { if (!localStorage.getItem('almo7areboon.save.v1')) localStorage.setItem('almo7areboon.save.v1', value); }, JSON.stringify(save));
  await page.goto(url);
  await page.waitForSelector('#age-title');
  await page.waitForTimeout(900);
  await scan(page, 'battle (ready)', width);
  await page.click('[data-command=battles]'); await page.waitForTimeout(500); await scan(page, 'battle picker', width); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.click('[data-command=start]'); await page.waitForTimeout(1200); await scan(page, 'battle (running)', width);
  await page.click('[data-command=pause]');
  for (const tab of ['evolution', 'cards', 'skills']) { await page.click(`[data-tab=${tab}]`); await page.waitForTimeout(450); await scan(page, tab, width); }
  await page.click('[data-tab=battle]');
  for (const command of ['settings', 'quests']) { await page.click(`[data-command=${command}]`); await page.waitForTimeout(600); await scan(page, `${command} dialog`, width); await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
  await page.click('[data-command=settings]'); await page.waitForTimeout(400); await page.click('[data-command=reset]'); await page.waitForTimeout(600); await scan(page, 'start over dialog', width);
  await page.close();

  // Save protection: a save from a newer game version opens a recovery dialog.
  const guarded = await browser.newPage({viewport: {width, height: width === 320 ? 568 : 844}});
  await guarded.addInitScript(() => localStorage.setItem('almo7areboon.save.v1', JSON.stringify({version: 9})));
  await guarded.goto(url);
  await guarded.waitForSelector('.dialog');
  await guarded.waitForTimeout(600);
  await scan(guarded, 'save protection dialog', width);
  await guarded.close();

  // Victory: the result dialog with its mastery seals. A strong save wins the first battle quickly at double speed.
  const winner = await browser.newPage({viewport: {width, height: width === 320 ? 568 : 844}});
  await winner.addInitScript(value => { if (!localStorage.getItem('almo7areboon.save.v1')) localStorage.setItem('almo7areboon.save.v1', value); }, JSON.stringify({...save, age: 0, enemyAge: 0, furthestBattle: 0, foodLevel: 25, baseLevel: 12, unlocked: [true, true, true], speed: 2, claimed: [], coins: 0}));
  await winner.goto(url);
  await winner.waitForSelector('#age-title');
  await winner.click('[data-command=start]');
  const deadline = Date.now() + 120000;
  while (await winner.getAttribute('#world', 'data-phase') === 'running' && Date.now() < deadline) {
    for (const key of ['1', '2', '3']) await winner.keyboard.press(key);
    await winner.waitForTimeout(120);
  }
  await winner.waitForSelector('.result-dialog', {timeout: 15000}).catch(() => {});
  await winner.waitForTimeout(600);
  await scan(winner, 'result dialog', width);
  await winner.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
