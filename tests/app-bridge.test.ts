import test from 'node:test';
import assert from 'node:assert/strict';
import { FULL_JOURNEY, almoApp, createAppBridge, evolutionNeedsFullJourney, installSaveFlush, onStoreChange, ownsFullJourney } from '../src/ui/app-bridge.ts';

function fakeApp(boot?: unknown) {
  const posted: unknown[] = [];
  const win = { webkit: { messageHandlers: { almo7areboon: { postMessage: (m: unknown) => posted.push(m) } } }, __almoAppBoot: boot };
  return { win, posted };
}

test('on the web nothing is gated and nothing is posted', () => {
  assert.equal(almoApp.inApp, false);
  assert.equal(ownsFullJourney(), true);
  assert.equal(evolutionNeedsFullJourney(1), false);
  assert.equal(almoApp.buy(FULL_JOURNEY), false);
  assert.equal((globalThis as unknown as { almoApp: unknown }).almoApp, almoApp);
});

test('in the app unknown means locked, and only the next evolution past chapter 3 asks', () => {
  const { win, posted } = fakeApp();
  const bridge = createAppBridge(win);
  assert.equal(bridge.inApp, true);
  assert.equal(ownsFullJourney(bridge), false);
  assert.equal(evolutionNeedsFullJourney(0, bridge), false, 'chapter 1 → 2 is free');
  assert.equal(evolutionNeedsFullJourney(1, bridge), false, 'chapter 2 → 3 is free (1.3)');
  assert.equal(evolutionNeedsFullJourney(2, bridge), true, 'chapter 3 → 4 needs Full Journey');
  assert.equal(evolutionNeedsFullJourney(4, bridge), true);
  bridge.buy(FULL_JOURNEY); bridge.restore(); bridge.openPage('privacy');
  assert.deepEqual(posted, [{ type: 'buy', data: { id: 'fullGame' } }, { type: 'restore', data: null }, { type: 'openURL', data: { page: 'privacy' } }]);
});

test('the boot answer and store updates unlock it, and listeners hear the moment once', () => {
  const booted = createAppBridge(fakeApp({ owned: { fullGame: true }, prices: { fullGame: '$4.99' } }).win);
  assert.equal(ownsFullJourney(booted), true);
  assert.equal(booted.prices.fullGame, '$4.99');

  const bridge = createAppBridge(fakeApp().win);
  const heard: boolean[] = [];
  const stop = onStoreChange((_, unlockedNow) => heard.push(unlockedNow));
  bridge.update({ owned: {}, prices: { fullGame: '4,99 €' }, status: '' });
  bridge.update({ owned: { fullGame: true }, prices: { fullGame: '4,99 €' }, status: '' });
  bridge.update({ owned: { fullGame: true }, prices: { fullGame: '4,99 €' }, status: '' });
  stop();
  bridge.update({ owned: {}, status: '' });
  assert.deepEqual(heard, [false, true, false]);
  assert.equal(ownsFullJourney(bridge), false, 'a refund locks again');
  bridge.update({ owned: { fullGame: 'yes' } });
  assert.equal(ownsFullJourney(bridge), false, 'only a literal true owns');
});

test('the app can flush the save through one guarded hook', () => {
  let flushed = 0;
  installSaveFlush(() => { flushed++; });
  (globalThis as unknown as { __almoFlushSave: () => void }).__almoFlushSave();
  installSaveFlush(() => { throw new Error('storage full'); });
  assert.doesNotThrow(() => (globalThis as unknown as { __almoFlushSave: () => void }).__almoFlushSave());
  assert.equal(flushed, 1);
});

test('the Lamplighter walks only while a plan is live in the app, and never on the web', async () => {
  const { lamplighterWalks, lamplighterPlan, manageSubscriptions } = await import('../src/ui/app-bridge.ts');
  assert.equal(lamplighterWalks(), false, 'the web never shows him: nothing is sold there');
  const { win, posted } = fakeApp();
  const bridge = createAppBridge(win);
  assert.equal(lamplighterWalks(bridge), false);
  bridge.update({ owned: { fullGame: true } });
  assert.equal(lamplighterWalks(bridge), false, 'Full Journey does not bring him');
  bridge.update({ owned: { lamplighterMonthly: true } });
  assert.equal(lamplighterWalks(bridge), true);
  assert.equal(lamplighterPlan(bridge), 'lamplighterMonthly');
  assert.equal(ownsFullJourney(bridge), false, 'the subscription opens no chapter');
  assert.equal(evolutionNeedsFullJourney(2, bridge), true);
  bridge.update({ owned: { lamplighterMonthly: true, lamplighterYearly: true } });
  assert.equal(lamplighterPlan(bridge), 'lamplighterYearly');
  bridge.update({ owned: {} });
  assert.equal(lamplighterWalks(bridge), false, 'expired: he leaves');
  manageSubscriptions(bridge);
  assert.deepEqual(posted.at(-1), { type: 'manageSubscriptions', data: null });
});
