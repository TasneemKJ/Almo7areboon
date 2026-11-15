// The tray's card names at 375 pt (an iPhone SE / mini width) and the final ي, measured in a real browser on the dev
// build: every name sits on one line clear of its portrait ring in EN and AR, and a final ي keeps its two dots, in the
// card itself and in every Arabic word the game ends with ي. Slow (a dev server and Chromium): npm test, not test:fast.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';

const ROOT = new URL('..', import.meta.url).pathname;
const SHELL = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
let server: ViteDevServer | undefined, browser: Browser | undefined, url = '';
async function boot(): Promise<boolean> {
  if (browser) return true;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : existsSync(SHELL) ? { executablePath: SHELL } : {}) });
  } catch { return false; }
  server = await createServer({ root: ROOT, logLevel: 'silent', server: { port: 0, strictPort: false, host: '127.0.0.1' } });
  await server.listen(); url = server.resolvedUrls!.local[0];
  return true;
}
test.after(async () => { await browser?.close(); await server?.close(); });

async function tray(lang: 'en' | 'ar', width = 375): Promise<Page> {
  const ctx = await browser!.newContext({ viewport: { width, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: lang === 'ar' ? 'ar-SA' : 'en-US' });
  const page = await ctx.newPage(); await page.goto(url);
  await page.waitForSelector('#entry-play:not([disabled])', { timeout: 60000 });
  await page.tap('#entry-play'); await page.waitForSelector('.deployment .unit-card .unit-name', { state: 'visible', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  return page;
}

for (const lang of ['en', 'ar'] as const) test(`every card name fits one line at 375 pt, clear of its portrait ring (${lang})`, async t => {
  if (!(await boot())) return t.skip('no Chromium');
  const page = await tray(lang);
  const cards = await page.evaluate(() => Array.from(document.querySelectorAll('.deployment .unit-card')).map(card => {
    const name = card.querySelector<HTMLElement>('.unit-name')!, ring = card.querySelector('img')!.getBoundingClientRect(), box = name.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(name);
    const rects = Array.from(range.getClientRects()).filter(r => r.width > 0), lines = new Set(rects.map(r => Math.round(r.top))).size;
    const ink = rects.reduce((a, r) => ({ left: Math.min(a.left, r.left), right: Math.max(a.right, r.right) }), { left: Infinity, right: -Infinity });
    return { text: name.textContent!.trim(), lines, overlap: Math.max(0, Math.min(ink.right, ring.right) - Math.max(ink.left, ring.left)), clipped: name.scrollWidth > name.clientWidth + 1, box: Math.round(box.width) };
  }));
  await page.context().close();
  assert.equal(cards.length, 3);
  for (const c of cards) {
    assert.equal(c.lines, 1, `${c.text} wraps onto ${c.lines} lines`);
    assert.equal(c.overlap, 0, `${c.text} runs ${c.overlap.toFixed(1)} px onto the portrait ring`);
    assert.equal(c.clipped, false, `${c.text} is cut off in its ${c.box} px box`);
  }
});

/** Every Arabic word the game ends with ي (U+064A), from its source text. */
function finalYehWords(): string[] {
  const words = new Set<string>();
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|html)$/.test(f)) for (const m of readFileSync(p, 'utf8').matchAll(/[ء-يً-ْـ]*ي(?![ء-يً-ْ])/g)) if (m[0].length > 1) words.add(m[0]);
    }
  };
  walk(join(ROOT, 'src'));
  return [...words];
}

test('a final ي keeps its dots: in the card name, and in every Arabic word the game ends with ي', async t => {
  if (!(await boot())) return t.skip('no Chromium');
  const page = await tray('ar');
  // In place: the card as drawn against the same card with nothing clipped around its name. The dots of a final ي sit
  // below the line; a name box that cuts them off draws «الرامي» as «الرامى».
  const named = await page.$$eval('.deployment .unit-card .unit-name', els => els.map(e => e.textContent!.trim()));
  let checked = 0;
  for (const [index, text] of named.entries()) {
    if (!/ي(?![ء-ي])/.test(text)) continue;
    const card = (await page.$$('.deployment .unit-card'))[index];
    const box = await card.evaluate(c => { const r = c.querySelector('.unit-name')!.getBoundingClientRect(); return { x: r.left - 2, y: r.top - 2, width: r.width + 4, height: r.height + 10 }; });
    const shot = () => page.screenshot({ clip: box, animations: 'disabled' });
    const drawn = await shot();
    await card.evaluate(c => { const n = c.querySelector<HTMLElement>('.unit-name')!; n.dataset.was = n.getAttribute('style') ?? ''; n.style.overflow = 'visible'; n.style.webkitLineClamp = 'none'; n.style.display = 'block'; n.style.whiteSpace = 'nowrap'; });
    const whole = await shot();
    await card.evaluate(c => { const n = c.querySelector<HTMLElement>('.unit-name')!; n.setAttribute('style', n.dataset.was ?? ''); delete n.dataset.was; });
    assert.ok(drawn.equals(whole), `«${text}»: the name box clips its letters (the final ي loses its dots)`);
    checked++;
  }
  assert.ok(checked >= 1, 'the tray holds a name ending in ي («الرامي»)');
  // Every word, in the game's Arabic face at the sizes it is read at.
  const words = finalYehWords();
  assert.ok(words.length > 50, `${words.length} words`);
  const missing = await page.evaluate(async (list: string[]) => {
    await document.fonts.load('700 12px "Almo Arabic"'); await document.fonts.load('400 12px "Almo Arabic"');
    const c = document.createElement('canvas'); c.width = 400; c.height = 60;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    const draw = (w: string, font: string) => { g.clearRect(0, 0, 400, 60); g.font = font; g.direction = 'rtl'; g.textAlign = 'right'; g.fillText(w, 390, 40); return g.getImageData(0, 0, 400, 60).data; };
    const out: string[] = [];
    for (const w of list) for (const font of ['700 12px "Almo Arabic"', '400 15px "Almo Arabic"']) {
      const a = draw(w, font), b = draw(w.slice(0, -1) + 'ى', font);
      let diff = 0;
      for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i]) diff++;
      if (diff < 3) { out.push(`${w} @ ${font}`); break; }
    }
    return out;
  }, words);
  await page.context().close();
  assert.deepEqual(missing, [], 'words drawn without the dots of their final ي');
});
