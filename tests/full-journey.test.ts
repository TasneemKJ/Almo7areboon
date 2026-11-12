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
