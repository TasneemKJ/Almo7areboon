import test from 'node:test';
import assert from 'node:assert/strict';
import { setLang } from '../src/game/locale.ts';
import { fullJourneyHtml, fullJourneyStatus } from '../src/ui/full-journey-screen.ts';

const store = (owned: boolean, status = '', price = '$4.99') => ({ owns: () => owned, status, prices: (price ? { fullGame: price } : {}) as Record<string, string>, price: '' });

test('the card offers the price, Restore, Terms and Privacy together, and every state has words', () => {
  const html = fullJourneyHtml(store(false), 'Harbor Watch');
  for (const command of ['buy-full-journey', 'restore-purchases', 'open-terms', 'open-privacy', 'close']) assert.match(html, new RegExp(`data-command="${command}"`));
  assert.match(html, /<bdi dir="ltr">\$4\.99<\/bdi>/);
  assert.match(html, /aria-label="Buy Full Journey for \$4\.99"/);
  assert.match(fullJourneyHtml(store(false, 'buying'), 'x'), /data-command="buy-full-journey"[^>]*disabled/);
  assert.doesNotMatch(fullJourneyHtml(store(true), 'x'), /buy-full-journey/);
  for (const status of ['buying', 'pending', 'failed', 'unavailable', 'nothing']) assert.ok(fullJourneyStatus(store(false, status)).length > 10, status);
  assert.match(fullJourneyHtml(store(false, '', ''), 'x'), />Continue the journey</, 'no price yet still offers the purchase');
  assert.doesNotMatch(html, /nothing else to buy/i, 'the Lamplighter subscription exists, so the card must not say there is nothing else');
  assert.match(html, /yours to keep/i, 'says it is a one-time purchase');
});

test('in Arabic the card is all Arabic but the price', () => {
  setLang('ar');
  try {
    for (const status of ['', 'buying', 'pending', 'failed', 'unavailable', 'nothing']) {
      const html = fullJourneyHtml(store(false, status), 'حراسة الميناء');
      const visible = html.replace(/<bdi[^>]*>[^<]*<\/bdi>/g, '').replace(/<[^>]+>/g, ' ') + ' ' + [...html.matchAll(/aria-label="([^"]*)"/g)].map(m => m[1].replace('$4.99', '')).join(' ');
      assert.doesNotMatch(visible, /[A-Za-z]{3,}/, status);
    }
  } finally { setLang('en'); }
});

test('opened before the player has held chapter 2, the card does not claim they have', () => {
  const early = fullJourneyHtml(store(false), 'Harbor Watch', false);
  assert.doesNotMatch(early, /has held the first two chapters/);
  assert.match(early, /The first two chapters are free/);
  assert.match(fullJourneyHtml(store(false), 'Harbor Watch', true), /has held the first two chapters/);
});
