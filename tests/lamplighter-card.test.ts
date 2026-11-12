import test from 'node:test';
import assert from 'node:assert/strict';
import { setLang } from '../src/game/locale.ts';
import { lamplighterHtml, lamplighterStatus } from '../src/ui/lamplighter-screen.ts';

const prices = { lamplighterMonthly: '$1.99', lamplighterYearly: '$14.99' };
const store = (owned: Record<string, boolean> = {}, status = '', p: Record<string, string> = prices) => ({ inApp: true, owned, status, prices: p, price: '', owns: (k: string) => owned[k] === true });

test('before paying, the card says what he does, both lengths and prices, the renewal line, Restore, Terms and Privacy', () => {
  const html = lamplighterHtml(store());
  for (const command of ['buy-lamplighter-monthly', 'buy-lamplighter-yearly', 'restore-purchases', 'open-terms', 'open-privacy', 'close']) assert.match(html, new RegExp(`data-command="${command}"`), command);
  assert.match(html, /<bdi dir="ltr">\$1\.99<\/bdi>/);
  assert.match(html, /<bdi dir="ltr">\$14\.99<\/bdi>/);
  assert.match(html, /aria-label="Subscribe monthly to the Lamplighter for \$1\.99 a month"/);
  assert.match(html, /aria-label="Subscribe yearly to the Lamplighter for \$14\.99 a year"/);
  assert.match(html, /renews automatically/i);
  assert.match(html, /cancel/i);
  assert.match(html, /no food, coins or strength/i, 'says plainly it is not power');
  assert.doesNotMatch(html, /manage-subscriptions/, 'nothing to manage before subscribing');
  assert.match(lamplighterHtml(store({}, 'buying')), /data-command="buy-lamplighter-yearly"[^>]*disabled/);
  assert.match(lamplighterHtml(store({}, '', {})), /data-command="buy-lamplighter-monthly"/, 'no price yet still offers it');
});

test('while subscribed the card offers Manage subscription instead of the plans', () => {
  const html = lamplighterHtml(store({ lamplighterYearly: true }));
  assert.match(html, /data-command="manage-subscriptions"/);
  assert.doesNotMatch(html, /buy-lamplighter-/);
  assert.match(lamplighterStatus(store({ lamplighterYearly: true })), /lanterns lit at your gate/);
  for (const status of ['buying', 'pending', 'failed', 'unavailable', 'nothing']) assert.ok(lamplighterStatus(store({}, status)).length > 10, status);
});

test('in Arabic the card is all Arabic but the prices', () => {
  setLang('ar');
  try {
    for (const [owned, status] of [[{}, ''], [{}, 'pending'], [{ lamplighterMonthly: true }, '']] as const) {
      const html = lamplighterHtml(store(owned as Record<string, boolean>, status));
      const visible = html.replace(/Apple/g, '').replace(/<bdi[^>]*>[^<]*<\/bdi>/g, '').replace(/<[^>]+>/g, ' ') + ' ' + [...html.matchAll(/aria-label="([^"]*)"/g)].map(m => m[1].replace(/\$\d+\.\d+/g, '')).join(' ');
      assert.doesNotMatch(visible, /[A-Za-z]{2,}/, JSON.stringify(owned) + status);
    }
  } finally { setLang('en'); }
});
