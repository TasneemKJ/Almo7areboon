// Confirms the simulated app bridge is live: node scripts/qa-gate/inapp-check.mjs
import {launch, newPhone, BASE} from './lib.mjs';
const b = await launch(); const {page} = await newPhone(b, {lang: 'en'});
await page.goto(BASE); await page.waitForSelector('#entry-play:not([disabled])');
console.log(await page.evaluate(() => ({inApp: window.almoApp?.inApp, platform: window.almoApp?.platform, prices: window.almoApp?.prices})));
await b.close();
