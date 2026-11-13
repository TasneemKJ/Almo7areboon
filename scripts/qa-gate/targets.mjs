// Tap-target audit including links, <summary>, <select>, checkboxes and ranges (the controls the bot's button scan misses).
// node scripts/qa-gate/targets.mjs [en|ar]
import {readFileSync} from 'node:fs';
import {launch, newPhone, BASE, OUT} from './lib.mjs';
const lang = process.argv[2] || 'en';
const b = await launch();
const measure = page => page.evaluate(() => [...document.querySelectorAll('a[href], summary, select, input, label, button, [role=button]')].filter(el => {
  if (el.closest('[hidden], .sr-only')) return false; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight;
}).map(el => { const r = el.getBoundingClientRect(); return {tag: el.tagName.toLowerCase(), type: el.type || '', text: (el.getAttribute('aria-label') || el.innerText || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40), w: Math.round(r.width), h: Math.round(r.height)}; }).filter(x => x.w < 44 || x.h < 44));
const {page, context} = await newPhone(b, {lang});
await context.addInitScript(p => { if (!sessionStorage.getItem('s')) { localStorage.setItem('almo7areboon.save.v1', p); sessionStorage.setItem('s', '1'); } }, readFileSync(`${OUT}/profile-mid.json`, 'utf8'));
await page.goto(BASE); await page.waitForSelector('#entry-play:not([disabled])'); await page.waitForTimeout(500);
console.log('ENTRY', await measure(page));
await page.locator('#entry-settings').tap(); await page.waitForTimeout(700);
console.log('SETTINGS', await measure(page));
await page.keyboard.press('Escape'); await page.waitForTimeout(500);
await page.locator('#entry-secondary').tap().catch(() => {}); await page.waitForTimeout(800);
const j = page.locator('[data-camp-station=journal]'); if (await j.count()) { await j.tap(); await page.waitForTimeout(500); await page.locator('[data-command=camp-journal]').tap(); await page.waitForTimeout(700);
  console.log('JOURNEY', await measure(page)); await page.locator('[data-journey-tab=cards]').tap(); await page.waitForTimeout(800); console.log('CARDS', await measure(page)); }
await b.close();
