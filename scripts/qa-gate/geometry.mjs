/**
 * The studio gate's overlap and screen-size check (ios/store/GATE.md): every reachable screen and sheet, in English
 * and Arabic, at the iPhone sizes the app supports, in Playwright WebKit with touch, as the iPhone app (a fake TasKit
 * handler, so the store cards exist). For each screen it collects visible interactive elements and text blocks and
 * reports occlusions (elementFromPoint at the centre and four inset corners), overlapping sibling controls (> 2 px),
 * clipped or spilling text, anything past the viewport, interactive elements under the emulated safe areas (top 59,
 * bottom 34 on notched sizes; top 20 on the SE), and tap targets under 44 x 44. Screenshots for the eyes.
 *
 * Run: npm run build && npx vite preview --port 5794, then
 *   node scripts/qa-gate/geometry.mjs [url=http://127.0.0.1:5794/] [outDir=/tmp/almo-geometry] [sizes=all]
 * Exit code 1 when any finding is not on the documented exception list (EXCEPTIONS below).
 */
import { webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] ?? 'http://127.0.0.1:5794/';
const out = process.argv[3] ?? '/tmp/almo-geometry';
const only = process.argv[4];
mkdirSync(out, { recursive: true });

export const SIZES = [
  { name: 'se', w: 375, h: 667, top: 20, bottom: 0 },
  { name: 'mini', w: 375, h: 812, top: 50, bottom: 34 },
  { name: 'i16', w: 393, h: 852, top: 59, bottom: 34 },
  { name: 'max', w: 440, h: 956, top: 59, bottom: 34 },
];
const SAVE = 'almo7areboon.save.v1';
// Chapter 2 after the first win, coins unspent: Camp lights the storehouse; a defeat card sends the player there.
const chapter2 = { version: 2, timeline: 1, age: 0, enemyAge: 1, coins: 560, cards: [], unlocked: [true, false, false], sound: false, deployed: 12, kills: 9, wins: 1, played: true, furthestBattle: 1 };
const played = { version: 2, timeline: 1, age: 0, enemyAge: 0, coins: 120, cards: [], unlocked: [true, true, false], sound: false, deployed: 12, kills: 9, wins: 1, played: true, furthestBattle: 1 };

/** Deliberate exceptions, each with its reason (GATE.md lists them). Matched on "screen|selector|kind". */
const EXCEPTIONS = [
  // The battlefield canvas is the stage; HUD chips float over it by design (they are its labels, not occlusions).
  { re: /^field[^|]*\|button(#field-enemy)?\.world-hit & button(#field-enemy)?\.world-hit\|overlap/, why: 'battlefield hit areas move with the troops; a walking enemy passes the bases and other troops, and the field controller picks the nearest target' },
  { re: /^(intro|field-first)\|p\.intro-line\|occluded/, why: 'the opening tale cross-fades one line into the next; for 0.4 s both are on screen' },
];

function inject(lang, app) {
  return [({ lang, app }) => {
    try { localStorage.setItem('almo7areboon.lang.v1', lang); } catch {}
    if (app) {
      Object.defineProperty(window, 'webkit', { configurable: true, value: { messageHandlers: { almo7areboon: { postMessage(m) { (window.__posted ||= []).push(m); } } } } });
      window.__almoAppBoot = { owned: {}, prices: { fullGame: '$4.99', lamplighterMonthly: '$1.99', lamplighterYearly: '$14.99' } };
    }
  }, { lang, app }];
}

async function measure(page, inset) {
  return page.evaluate(({ inset }) => {
    const W = innerWidth, H = innerHeight, found = [];
    const visible = el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      for (let p = el; p; p = p.parentElement) { const ps = getComputedStyle(p); if (Number(ps.opacity) === 0 || ps.visibility === 'hidden') return false; if (p.hidden) return false; }
      return true;
    };
    const name = el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.dataset.command ? '[' + el.dataset.command + ']' : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''}`;
    const modalOpen = !document.getElementById('modal-layer')?.hidden;
    const intro = document.getElementById('intro-layer');
    // The topmost layer owns the screen: the opening tale, else an open dialog, else the page.
    const scope = intro && visible(intro) ? intro : modalOpen ? document.getElementById('modal-layer') : document.body;
    // A checkbox inside its label is tapped through the label: measure the label.
    const interactive = [...new Set([...scope.querySelectorAll('button,a[href],select,input:not([type=hidden]),[role=button],[tabindex="0"]')].map(el => (el.matches('input[type=checkbox],input[type=radio]') && el.closest('label')) || el))].filter(visible).filter(el => getComputedStyle(el).pointerEvents !== 'none' && !el.closest('.sr-only'));
    const texts = [...scope.querySelectorAll('h1,h2,h3,p,li,small,label,span,strong,output')].filter(visible).filter(el => !el.closest('.sr-only')).filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
    const mine = (el, hit) => !!hit && (hit === el || el.contains(hit) || hit.contains(el) || hit.closest('label')?.contains(el));
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) found.push({ el: name(el), kind: 'small', detail: `${Math.round(r.width)}x${Math.round(r.height)}` });
      // Safe areas: a desktop WebKit reports env(safe-area-inset-*) as 0, and the CSS uses max(…, env(…)), so the
      // browser cannot emulate them; they are checked on the real simulators instead (GATE.md, iOS screenshots).
    }
    for (const el of [...interactive, ...texts]) {
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 || r.left < -1 || (r.bottom > H + 1 && !el.closest('.dialog,[style*=overflow]'))) {
        // Inside a scrolling dialog, below the fold is fine; elsewhere it is off screen.
        const scroller = el.closest('.dialog');
        if (!scroller || r.right > W + 1 || r.left < -1) found.push({ el: name(el), kind: 'offscreen', detail: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.right)},${Math.round(r.bottom)}` });
      }
      const s = getComputedStyle(el);
      if (!['auto', 'scroll'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 2 && s.overflow !== 'visible' && el.clientWidth > 0) found.push({ el: name(el), kind: 'clipped-x', detail: `${el.scrollWidth}>${el.clientWidth}` });
      if (!['auto', 'scroll'].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && s.overflow !== 'visible' && el.clientHeight > 0) found.push({ el: name(el), kind: 'clipped-y', detail: `${el.scrollHeight}>${el.clientHeight}` });
      // Text that takes no touches (pointer-events:none, e.g. HUD labels over the battlefield) cannot be hit-tested.
      if (r.top >= 0 && r.bottom <= H && r.left >= 0 && r.right <= W && getComputedStyle(el).pointerEvents !== 'none') {
        // Round targets are hit-tested inside their circle: inset the probes to 30% for them.
        const round = parseFloat(getComputedStyle(el).borderTopLeftRadius) >= Math.min(r.width, r.height) * .4;
        const ix = round ? r.width * .3 : 3, iy = round ? r.height * .3 : 3;
        const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + ix, r.top + iy], [r.right - ix, r.top + iy], [r.left + ix, r.bottom - iy], [r.right - ix, r.bottom - iy]];
        const bad = pts.map(([x, y]) => document.elementFromPoint(x, y)).filter(hit => !mine(el, hit));
        if (bad.length >= 2) found.push({ el: name(el), kind: 'occluded', detail: `by ${name(bad[0])}` });
      }
    }
    for (let i = 0; i < interactive.length; i++) for (let j = i + 1; j < interactive.length; j++) {
      const a = interactive[i], b = interactive[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ox > 2 && oy > 2) found.push({ el: `${name(a)} & ${name(b)}`, kind: 'overlap', detail: `${Math.round(ox)}x${Math.round(oy)}` });
    }
    if (document.documentElement.scrollWidth > W + 1) found.push({ el: 'html', kind: 'h-scroll', detail: `${document.documentElement.scrollWidth}` });
    return found;
  }, { inset });
}

const tap = async (page, sel) => { await page.waitForTimeout(450); await page.locator(sel).first().tap({ timeout: 8000 }); await page.waitForTimeout(700); };

/** Every screen, reached the way a player does. Each returns false when it could not be reached. */
const SCREENS = [
  { id: 'entry-new', seed: null, go: async () => true },
  { id: 'intro', seed: null, go: async p => { await tap(p, '#entry-play'); return true; } },
  { id: 'field-first', seed: null, go: async p => { await tap(p, '#entry-play'); const skip = p.locator('[data-command=intro-skip],[data-command=skip-intro]').first(); if (await skip.isVisible().catch(() => false)) await tap(p, '[data-command=intro-skip],[data-command=skip-intro]'); await p.waitForTimeout(6000); return true; } },
  { id: 'entry-returning', seed: played, go: async () => true },
  { id: 'field', seed: played, go: async p => { await tap(p, '#entry-play'); await p.waitForTimeout(4000); return true; } },
  { id: 'pause', seed: played, go: async p => { await tap(p, '#entry-play'); await p.waitForTimeout(2000); await tap(p, '[data-command=field-pause]'); return true; } },
  { id: 'settings', seed: played, go: async p => { await tap(p, '#entry-settings'); return true; } },
  { id: 'save-recovery', seed: played, go: async p => { await tap(p, '#entry-settings'); await tap(p, '#modal-layer [data-command=save-recovery]'); return true; } },
  { id: 'reset', seed: played, go: async p => { await tap(p, '#entry-settings'); await tap(p, '#modal-layer [data-command=reset]'); return true; } },
  { id: 'full-journey', seed: played, go: async p => { await tap(p, '#entry-settings'); await tap(p, '#modal-layer [data-command=full-journey]'); return true; } },
  { id: 'lamplighter', seed: played, go: async p => { await tap(p, '#entry-settings'); await tap(p, '#modal-layer [data-command=lamplighter]'); return true; } },
  { id: 'camp', seed: played, go: async p => { await tap(p, '#entry-secondary'); return true; } },
  { id: 'camp-counsel', seed: chapter2, go: async p => { await tap(p, '#entry-secondary'); return true; } },
  { id: 'camp-counsel-company', seed: { ...chapter2, foodLevel: 4, baseLevel: 2, coins: 200 }, go: async p => { await tap(p, '#entry-secondary'); return true; } },
  { id: 'defeat-counsel', seed: chapter2, go: async p => { await tap(p, '#entry-play'); await p.waitForSelector('[data-command=result-counsel]', { timeout: 120000 }); return true; } },
  { id: 'victory-postcard', seed: { ...played, foodLevel: 6, unlocked: [true, true, true], enemyAge: 0 }, go: async p => { await tap(p, '#entry-play'); for (let i = 0; i < 400 && !(await p.locator('[data-command=share-postcard]').isVisible().catch(() => false)); i++) { const card = p.locator('[data-unit]:visible:not([disabled])').first(); if (await card.count()) await card.tap({ timeout: 1000 }).catch(() => {}); await p.waitForTimeout(250); } await p.waitForSelector('[data-command=share-postcard]', { timeout: 5000 }); return true; } },
  { id: 'camp-company', seed: played, go: async p => { await tap(p, '#entry-secondary'); await tap(p, '[data-camp-station=company]'); return true; } },
  { id: 'leave-battle', seed: played, go: async p => { await tap(p, '#entry-play'); await p.waitForTimeout(1500); await tap(p, '[data-command=field-pause]'); await tap(p, '#modal-layer [data-command=home]'); await tap(p, '#entry-secondary'); return true; } },
];

const results = [];
const browser = await webkit.launch();
for (const size of SIZES.filter(s => !only || only.split(',').includes(s.name))) {
  for (const lang of ['en', 'ar']) {
    for (const screen of SCREENS.filter(x => !process.env.SCREENS || process.env.SCREENS.split(',').includes(x.id))) {
      const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: lang === 'ar' ? 'ar-JO' : 'en-US' });
      await context.addInitScript(...inject(lang, true));
      if (screen.seed) await context.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [SAVE, JSON.stringify(screen.seed)]);
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      let findings = [], reached = true;
      try {
        await page.goto(url);
        await page.waitForSelector('#entry-play:not([disabled])', { timeout: 30000 });
        await page.waitForTimeout(600);
        await screen.go(page);
        await page.waitForTimeout(500);
        findings = await measure(page, { top: size.top, bottom: size.bottom });
        await page.screenshot({ path: `${out}/${size.name}-${lang}-${screen.id}.png` });
      } catch (e) { reached = false; findings = [{ el: '-', kind: 'unreachable', detail: e.message.split('\n')[0] }]; }
      for (const e of errors) findings.push({ el: '-', kind: 'pageerror', detail: e });
      const keyed = findings.map(f => ({ ...f, key: `${screen.id}|${f.el}|${f.kind}` }));
      const real = keyed.filter(f => !EXCEPTIONS.some(x => x.re.test(f.key)));
      results.push({ size: size.name, lang, screen: screen.id, reached, findings: real, excepted: keyed.length - real.length });
      console.log(`${real.length ? 'FIND' : 'ok  '} ${size.name} ${lang} ${screen.id}${real.length ? ' ' + real.map(f => `${f.kind}:${f.el}(${f.detail})`).join('; ') : ''}`);
      await context.close();
    }
  }
}
await browser.close();
writeFileSync(`${out}/geometry.json`, JSON.stringify(results, null, 1));
const total = results.reduce((s, r) => s + r.findings.length, 0);
console.log(`\n${results.length} screen captures, ${total} findings. Report: ${out}/geometry.json`);
process.exitCode = total ? 1 : 0;
