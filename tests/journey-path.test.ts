import test from 'node:test';
import assert from 'node:assert/strict';
import { setLang } from '../src/game/locale.ts';
import { journeyPathHtml } from '../src/ui/entry-screen.ts';

const marks = (html: string) => [...html.matchAll(/<li class="([^"]+)"/g)].map(m => m[1]);

test('the entry shows where you are on the six-chapter journey', () => {
  const html = journeyPathHtml(1, false);
  assert.deepEqual(marks(html), ['path-done', 'path-here', 'path-ahead', 'path-ahead', 'path-ahead', 'path-ahead']);
  assert.match(html, /aria-label="Chapter 2 of 6"/);
  assert.match(html, />Chapter <bdi dir="ltr">2<\/bdi> of <bdi dir="ltr">6<\/bdi></);
});

test('in the app without Full Journey, chapters 4-6 are a visible locked stretch and the free scope is named', () => {
  const html = journeyPathHtml(0, true);
  assert.deepEqual(marks(html), ['path-here', 'path-ahead', 'path-ahead', 'path-locked', 'path-locked', 'path-locked']);
  assert.match(html, /Chapters 1–3 free · 4–6 with Full Journey/);
  assert.match(html, /data-command="full-journey"/, 'the locked stretch opens the card that says what it adds');
  setLang('ar');
  try {
    const ar = journeyPathHtml(0, true).replace(/<bdi[^>]*>[^<]*<\/bdi>/g, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(ar, /[A-Za-z]/);
  } finally { setLang('en'); }
});
