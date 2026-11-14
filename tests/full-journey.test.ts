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

test('opened before the player has held chapter 3, the card does not claim they have', () => {
  const early = fullJourneyHtml(store(false), 'Lantern Quarter', false);
  assert.doesNotMatch(early, /has held the three free chapters/);
  assert.match(early, /The first three chapters are free/);
  assert.match(fullJourneyHtml(store(false), 'Lantern Quarter', true), /has held the three free chapters/);
});

test('1.3: the card sells chapters 4 to 6, with their true count of chapters and troops', () => {
  const html = fullJourneyHtml(store(false), 'Lantern Quarter');
  assert.match(html, /<li>Lantern Quarter and the two chapters after it<\/li>/);
  assert.match(html, /<li>Nine new troops in new wardrobes<\/li>/);
  assert.doesNotMatch(html, /first two|three chapters after|Twelve/);
  setLang('ar');
  try {
    const ar = fullJourneyHtml(store(false), 'حيّ الفوانيس', false);
    assert.match(ar, /حيّ الفوانيس والفصلان اللذان يليانه/);
    assert.match(ar, /تسعة جنود جدد/);
    assert.match(ar, /الفصول الثلاثة الأولى مجّانية/);
    assert.doesNotMatch(ar, /الفصلان الأوّلان|الفصلين الأوّلين|اثنا عشر/);
  } finally { setLang('en'); }
});
