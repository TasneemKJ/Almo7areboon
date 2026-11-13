/**
 * QA gate helpers: WebKit iPhone context (390x844 @3x, touch), optional simulated iPhone app bridge, visible-UI
 * inspection and screenshot helpers. Serve dist first: npx vite preview --host 127.0.0.1 --port 5793 --strictPort
 */
import {webkit} from 'playwright';
import {mkdirSync} from 'node:fs';

export const BASE = process.env.QA_BASE || 'http://127.0.0.1:5793/';
export const OUT = process.env.QA_OUT || '/private/tmp/claude-504/-Users-tasnimkhaled-Projects/58d3fe0d-410f-4430-bca2-48921b0be831/scratchpad/almo-qa';
mkdirSync(OUT, {recursive: true});

export async function launch() { return webkit.launch({headless: true}); }

/** lang: 'en' | 'ar'. app: simulate the iPhone app bridge. now: fake epoch ms for Date (optional). */
export async function newPhone(browser, {lang = 'en', app = true, now = null, owned = {}} = {}) {
  const context = await browser.newContext({
    viewport: {width: 390, height: 844}, deviceScaleFactor: 3, hasTouch: true, isMobile: true,
    locale: lang === 'ar' ? 'ar-JO' : 'en-US',
  });
  if (lang === 'ar') await context.addInitScript(() => { try { localStorage.setItem('almo7areboon.lang.v1', 'ar'); } catch {} });
  else await context.addInitScript(() => { try { if (!localStorage.getItem('almo7areboon.lang.v1')) localStorage.setItem('almo7areboon.lang.v1', 'en'); } catch {} });
  if (app) await context.addInitScript(o => {
    // Playwright WebKit already defines window.webkit; a plain assignment is ignored, so redefine it.
    Object.defineProperty(window, 'webkit', {value: {messageHandlers: {almo7areboon: {postMessage(m) { (window.__posted ||= []).push(m); }}}}, configurable: true, writable: true});
    window.__almoAppBoot = {owned: o, prices: {fullGame: '$4.99', lamplighterMonthly: '$1.99', lamplighterYearly: '$14.99'}};
  }, owned);
  if (now != null) await context.clock?.install?.({time: now}).catch(() => {});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return {context, page, errors};
}

export async function shot(page, name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({path});
  return path;
}

/** Everything a player could tap right now: visible, enabled, unobscured buttons/links with text, size and rect. */
export async function visibleControls(page) {
  return page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll('button, [role=button], a[href], input[type=radio], input[type=checkbox], [data-command], summary');
    let i = -1;
    for (const el of els) {
      i++;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
      if (el.closest('[hidden]') || el.closest('[inert]')) continue;
      if (r.right < 0 || r.left > innerWidth) continue;
      // below/above the fold inside a scrollable dialog: reachable by scrolling, reported as offscreen
      const offscreen = r.top + r.height / 2 > innerHeight || r.top + r.height / 2 < 0;
      if (offscreen && !el.closest('#modal-layer, #secondary-screen')) continue;
      const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
      const hit = document.elementFromPoint(cx, cy);
      const onTop = offscreen || (!!hit && (hit === el || el.contains(hit) || hit.contains(el)));
      out.push({
        tag: el.tagName.toLowerCase(), id: el.id || '', cmd: el.dataset.command || '', cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 60),
        text: (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
        i, offscreen, disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true', onTop,
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        data: Object.fromEntries(Object.entries(el.dataset).slice(0, 6)),
      });
    }
    return out;
  });
}

export async function shellState(page) {
  return page.evaluate(() => {
    const app = document.getElementById('app'), layer = document.getElementById('modal-layer');
    const world = document.getElementById('world');
    const modal = layer && !layer.hidden ? (layer.querySelector('[data-modal], .dialog')?.className || 'modal') : '';
    return {
      entry: app?.dataset.entry, mode: app?.dataset.fieldMode, phase: world?.dataset.phase, modal: String(modal).slice(0, 80),
      camp: !document.getElementById('camp-view')?.hidden, secondary: !document.getElementById('secondary-screen')?.hidden,
      lang: document.documentElement.lang, dir: document.documentElement.dir,
    };
  });
}

/** Visible text nodes in the wrong script: Latin words on an Arabic screen, Arabic on an English screen. */
export async function mixedLanguage(page, lang) {
  return page.evaluate(lang => {
    const bad = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const latin = /[A-Za-z]{3,}/, arabic = /[؀-ۿ]{2,}/;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim(); if (!t) continue;
      const el = n.parentElement; if (!el || el.closest('[hidden], .sr-only') || el.closest('script,style,noscript')) continue;
      if (el.closest('.language-picker, [data-language-picker], [data-command=language], [name=language], [data-lang-option]')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
      if (lang === 'ar' && latin.test(t)) bad.add(t.slice(0, 70));
      if (lang === 'en' && arabic.test(t)) bad.add(t.slice(0, 70));
    }
    return [...bad];
  }, lang);
}

/** Text elements whose content overflows their box (clipped) and small tap targets. */
export async function layoutProblems(page) {
  return page.evaluate(() => {
    const clipped = [], small = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('[hidden], .sr-only, [class*=visually-hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (hasText && (cs.overflow.includes('hidden') || cs.textOverflow === 'ellipsis' || cs.overflowX === 'hidden') &&
          (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) clipped.push(el.innerText.trim().slice(0, 60));
      if (el.matches('button, [role=button], a[href]') && (r.width < 44 || r.height < 44)) {
        const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.left + r.width / 2), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
        if (hit && (hit === el || el.contains(hit))) small.push(`${(el.getAttribute('aria-label') || el.innerText || el.dataset.command || el.id).trim().slice(0, 40)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return {clipped: [...new Set(clipped)], small: [...new Set(small)]};
  });
}

/** Phrases a native app must never say. */
export async function webSpeak(page) {
  return page.evaluate(() => {
    const t = document.body.innerText;
    const hits = [];
    for (const re of [/\bbrowser\b/i, /\btabs?\b/i, /\breload\b/i, /\brefresh the page\b/i, /source code/i, /\bGitHub\b/i, /\bwebsite\b/i, /المتصفح/, /أعد تحميل/, /الشيفرة المصدرية/])
      { const m = t.match(new RegExp(`.{0,40}${re.source}.{0,40}`, re.flags)); if (m) hits.push(m[0].replace(/\s+/g, ' ')); }
    return hits;
  });
}

export async function tapEl(page, locatorOrSelector) {
  const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;
  await page.waitForTimeout(400);
  await loc.tap({timeout: 5000});
}

/** Tap a control from visibleControls like a person: scroll it into view first if it sits below the fold. */
export async function tapControl(page, c) {
  if (c.offscreen) {
    const r = await page.evaluate(i => { const el = document.querySelectorAll('button, [role=button], a[href], input[type=radio], input[type=checkbox], [data-command], summary')[i]; el?.scrollIntoView({block: 'center'}); const b = el?.getBoundingClientRect(); return b && {x: b.left + b.width / 2, y: b.top + b.height / 2}; }, c.i);
    await page.waitForTimeout(500);
    if (r) { await page.touchscreen.tap(r.x, r.y); return 'scrolled'; }
  }
  await page.touchscreen.tap(c.x + c.w / 2, c.y + c.h / 2); return 'tap';
}

export async function tapXY(page, x, y) { await page.waitForTimeout(400); await page.touchscreen.tap(x, y); }
