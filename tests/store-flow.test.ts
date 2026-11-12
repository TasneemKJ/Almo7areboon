import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppBridge } from '../src/ui/app-bridge.ts';
import { createStoreFlow } from '../src/app/store-flow.ts';
import { defaultProfile } from '../src/game/save.ts';

function setup(age: number, owned: Record<string, boolean> = {}) {
  const posted: { type: string; data: unknown }[] = [];
  const win = { webkit: { messageHandlers: { almo7areboon: { postMessage: (m: { type: string; data: unknown }) => posted.push(m) } } }, __almoAppBoot: { owned, prices: { fullGame: '$4.99', lamplighterMonthly: '$1.99', lamplighterYearly: '$14.99' } } };
  const bridge = createAppBridge(win);
  const profile = { ...defaultProfile(), age };
  const calls: string[] = [];
  const navState = { modal: null as string | null, evolutionFromResult: false };
  const disposers: (() => void)[] = [];
  const ports = {
    closeModal: () => { calls.push('close'); navState.modal = null; },
    navState, persist: () => calls.push('persist'), playable: () => true,
    sessionState: { game: { profile } },
    showModal: (id: string, html: string) => { navState.modal = id; calls.push(`modal:${id}`); last.html = html; },
    showResult: () => { calls.push('result'); navState.modal = 'result'; },
    showSettings: () => { calls.push('settings'); navState.modal = 'settings'; },
    toast: (m: string) => calls.push(`toast:${m}`),
  };
  const last = { html: '' };
  const flow = createStoreFlow({ dom: { lifetime: { add: (f: () => void) => disposers.push(f) } }, ports } as never, bridge);
  return { flow, bridge, posted, calls, navState, last, dispose: () => disposers.forEach(f => f()) };
}

test('the page asks the app for prices as soon as the bridge exists', () => {
  const s = setup(0); s.dispose();
  assert.deepEqual(s.posted[0], { type: 'price', data: null });
});

test('chapter 1 to 2 evolves freely; chapter 2 to 3 opens Full Journey instead, and owning it lets it through', () => {
  const free = setup(0); assert.equal(free.flow.gateEvolution(), false); free.dispose();
  const gated = setup(1);
  assert.equal(gated.flow.gateEvolution(), true);
  assert.equal(gated.navState.modal, 'full-journey');
  assert.match(gated.last.html, /Lantern Quarter|Harbor Watch/);
  assert.match(gated.last.html, /data-command="buy-full-journey"/);
  gated.dispose();
  const owner = setup(1, { fullGame: true }); assert.equal(owner.flow.gateEvolution(), false); owner.dispose();
  const subscriber = setup(1, { lamplighterYearly: true }); assert.equal(subscriber.flow.gateEvolution(), true, 'the subscription opens no chapter'); subscriber.dispose();
});

test('buying, restoring, legal pages and manage go to the app; the card redraws when the store answers', () => {
  const s = setup(1);
  s.flow.gateEvolution();
  for (const c of ['buy-full-journey', 'restore-purchases', 'open-terms', 'open-privacy']) assert.equal(s.flow.handleStoreCommand(c), true);
  assert.deepEqual(s.posted.slice(-4).map(p => p.type), ['buy', 'restore', 'openURL', 'openURL']);
  s.bridge.update({ owned: { fullGame: true }, status: '' });
  assert.match(s.last.html, /The road is open/, 'the open card redraws as owned');
  assert.ok(s.calls.some(c => c.startsWith('toast:Full Journey is yours')));
  s.flow.handleStoreCommand('lamplighter');
  s.flow.handleStoreCommand('buy-lamplighter-yearly');
  assert.deepEqual(s.posted.at(-1), { type: 'buy', data: { id: 'lamplighterYearly' } });
  s.bridge.update({ owned: { lamplighterYearly: true } });
  assert.match(s.last.html, /manage-subscriptions/);
  s.flow.handleStoreCommand('manage-subscriptions');
  assert.equal(s.posted.at(-1)!.type, 'manageSubscriptions');
  s.dispose();
});

test('closing a card goes back where it was opened from', () => {
  const s = setup(1);
  s.navState.modal = 'settings';
  s.flow.handleStoreCommand('full-journey');
  assert.equal(s.flow.handleStoreCommand('close'), true);
  assert.equal(s.navState.modal, 'settings');
  s.navState.modal = 'result'; s.navState.evolutionFromResult = true;
  s.flow.gateEvolution();
  s.flow.handleStoreCommand('close');
  assert.equal(s.navState.modal, 'result');
  s.navState.modal = 'battles';
  assert.equal(s.flow.handleStoreCommand('close'), false, 'other dialogs close as before');
  s.dispose();
});

test('Settings offers Full Journey and the Lamplighter in the app only', async () => {
  const { preferencesHtml } = await import('../src/ui/preferences-screen.ts');
  const mix = { effects: 80, atmosphere: 60 };
  const web = preferencesHtml(defaultProfile(), true, mix, true, '');
  assert.doesNotMatch(web, /data-command="full-journey"|data-command="lamplighter"/);
  const app = preferencesHtml(defaultProfile(), true, mix, true, '', { inApp: true });
  assert.match(app, /data-command="full-journey"/);
  assert.match(app, /data-command="lamplighter"/);
});
