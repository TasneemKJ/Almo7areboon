import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { setLang } from '../src/game/locale.ts';
import { compactResultsHtml } from '../src/ui/results-screen.ts';
import { postcardLines, drawPostcard, sharePostcard, POSTCARD } from '../src/ui/victory-postcard.ts';

const wonAt = (chapter: number) => { const p = defaultProfile(); Object.assign(p, { enemyAge: chapter, furthestBattle: chapter, played: true }); const g = new Game(p); g.state.phase = 'won'; g.state.time = 83; g.state.stats.deployed = 21; return g; };

test('the postcard is written Arabic first: the game, the chapter and its line, then English under it', () => {
  const g = wonAt(1), lines = postcardLines(g.profile, g.state);
  assert.equal(lines.game, 'المحاربون');
  assert.equal(lines.titleAr, 'نصرٌ في مدرّجات الزيتون');
  assert.equal(lines.subtitleAr, 'آخر القناديل فوق الحقول.');
  assert.equal(lines.titleEn, 'Victory at Olive Terraces');
  assert.equal(lines.chapter, '2 / 6');
  assert.match(lines.detail, /1:23/);
  assert.match(lines.detail, /21/);
});

test('the result offers the postcard only after a win, and only where the iPhone share sheet exists', () => {
  setLang('en');
  const g = wonAt(0);
  assert.match(compactResultsHtml(g.profile, g.state, true), /data-command="share-postcard"/);
  assert.doesNotMatch(compactResultsHtml(g.profile, g.state, false), /share-postcard/);
  assert.doesNotMatch(compactResultsHtml(g.profile, g.state), /share-postcard/, 'off the app (and in node) there is no share sheet');
  g.state.phase = 'lost';
  assert.doesNotMatch(compactResultsHtml(g.profile, g.state, true), /share-postcard/);
});

function fakeCanvas(fail = false) {
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, { get: (_t, key) => key === 'measureText' ? () => ({ width: 100 }) : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (...args: unknown[]) => { calls.push(`${String(key)}:${typeof args[0] === 'string' ? args[0] : ''}`); }, set: () => true });
  return { calls, canvas: { width: 0, height: 0, getContext: () => ctx, toDataURL: () => { if (fail) throw new Error('tainted'); return 'data:image/png;base64,AAAA'; } } };
}

test('drawing paints the chapter plate, the village lantern, then the Arabic lines before the English', () => {
  const { calls, canvas } = fakeCanvas(), g = wonAt(1);
  drawPostcard(canvas.getContext() as unknown as CanvasRenderingContext2D, { plate: {} as CanvasImageSource, lamp: {} as CanvasImageSource }, postcardLines(g.profile, g.state));
  const images = calls.filter(c => c.startsWith('drawImage')).length, texts = calls.filter(c => c.startsWith('fillText:'));
  assert.ok(images >= 2, 'plate and lantern');
  assert.equal(texts[0], 'fillText:المحاربون');
  assert.ok(texts.findIndex(t => t.includes('مدرّجات')) < texts.findIndex(t => t.includes('Olive')));
  assert.equal(POSTCARD.width, 1080); assert.equal(POSTCARD.height, 1350);
});

test('sharing hands one PNG to the bridge, and a canvas that cannot export fails quietly', async () => {
  const g = wonAt(1), sent: string[] = [];
  const bridge = { inApp: true, share: (url: string) => { sent.push(url); return true; } };
  const ok = await sharePostcard(g.profile, g.state, bridge, { canvas: () => fakeCanvas().canvas as unknown as HTMLCanvasElement, image: async () => ({}) as CanvasImageSource, fonts: async () => {} });
  assert.equal(ok, true); assert.deepEqual(sent, ['data:image/png;base64,AAAA']);
  const bad = await sharePostcard(g.profile, g.state, bridge, { canvas: () => fakeCanvas(true).canvas as unknown as HTMLCanvasElement, image: async () => ({}) as CanvasImageSource, fonts: async () => {} });
  assert.equal(bad, false); assert.equal(sent.length, 1);
  assert.equal(await sharePostcard(g.profile, g.state, { inApp: false, share: () => true }, { canvas: () => fakeCanvas().canvas as unknown as HTMLCanvasElement, image: async () => ({}) as CanvasImageSource, fonts: async () => {} }), false);
});
