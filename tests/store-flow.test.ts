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

test('chapters 1 to 3 evolve freely; chapter 3 to 4 opens Full Journey instead, and owning it lets it through', () => {
  for (const age of [0, 1]) { const free = setup(age); assert.equal(free.flow.gateEvolution(), false, `army of chapter ${age + 1} moves on freely`); free.dispose(); }
  const gated = setup(2);
  assert.equal(gated.flow.gateEvolution(), true);
  assert.equal(gated.navState.modal, 'full-journey');
  assert.match(gated.last.html, /Lantern Quarter and the two chapters after it/);
  assert.match(gated.last.html, /Nine new troops/);
  assert.match(gated.last.html, /data-command="buy-full-journey"/);
  gated.dispose();
  const owner = setup(2, { fullGame: true }); assert.equal(owner.flow.gateEvolution(), false); owner.dispose();
  const subscriber = setup(2, { lamplighterYearly: true }); assert.equal(subscriber.flow.gateEvolution(), true, 'the subscription opens no chapter'); subscriber.dispose();
});

test('buying, restoring, legal pages and manage go to the app; the card redraws when the store answers', () => {
  const s = setup(2);
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

test('the entry screen lets the locked stretch of the path open Full Journey before entering the world', async () => {
  const { readFileSync } = await import('node:fs');
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /!ports\.navState\.entryEntered&&!ports\.navState\.modal&&[^\n]*command!=='full-journey'/);
});

test('Settings names the version and the studio, and in the app links Support and Privacy', async () => {
  const { preferencesHtml } = await import('../src/ui/preferences-screen.ts');
  const mix = { effects: 80, atmosphere: 60 };
  const web = preferencesHtml(defaultProfile(), true, mix, true, '');
  assert.match(web, /class="preferences-about"[^>]*>Almo7areboon <bdi dir="ltr">[^<]+<\/bdi> · A game by Tas Games</);
  const app = preferencesHtml(defaultProfile(), true, mix, true, '', { inApp: true });
  assert.match(app, /data-command="open-support"/);
  assert.match(app, /data-command="open-privacy"/);
  const { STORE_COMMANDS } = await import('../src/app/store-flow.ts');
  assert.ok((STORE_COMMANDS as readonly string[]).includes('open-support'));
});

test('the paid stretch of the journey path appears only after a first win, never at first launch', async () => {
  const { readFileSync } = await import('node:fs');
  const nav = readFileSync(new URL('../src/app/navigation.ts', import.meta.url), 'utf8');
  assert.match(nav, /journeyPathHtml\(ports\.sessionState\.game\.profile\.enemyAge,ports\.sessionState\.game\.profile\.wins>0&&!ownsFullJourney\(\)\)/);
});

// QA gate 2026-11-13: a free player could fight paid chapters by going on to the next battle; only evolving asked.
// 1.3: chapters 1 to 3 are free, so the gate is chapter 4.
test('in the app, going on to chapter 4 or later, or choosing it, opens Full Journey instead; chapters 1-3 stay free', () => {
  const s = setup(1);
  assert.equal(s.flow.gateBattle(1), false, 'chapter 2 is free');
  assert.equal(s.flow.gateBattle(2), false, 'chapter 3 is free');
  assert.equal(s.navState.modal, null);
  assert.equal(s.flow.gateBattle(3), true);
  assert.equal(s.navState.modal, 'full-journey');
  s.dispose();
  const owner = setup(1, { fullGame: true }); assert.equal(owner.flow.gateBattle(4), false); owner.dispose();
  const web = setup(1); (web.bridge as { inApp: boolean }).inApp = false; assert.equal(web.flow.gateBattle(5), false, 'the web never gates'); web.dispose();
});

test('the next-battle and choose-battle routes ask the gate before acting', async () => {
  const { readFileSync } = await import('node:fs');
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /advancement\.target==='battle'&&advancement\.nextBattle!==null&&ports\.gateBattle\(advancement\.nextBattle\)/);
  assert.match(listeners, /if\(ports\.gateBattle\(Number\(button\.dataset\.battle\)\)\)return true;/);
});

test('Full Journey opened on purpose from a result closes back to that result, never to an empty field', () => {
  const s = setup(1); s.navState.modal = 'result';
  assert.equal(s.flow.handleStoreCommand('full-journey'), true); assert.equal(s.navState.modal, 'full-journey');
  s.flow.handleStoreCommand('close');
  assert.equal(s.navState.modal, 'result'); assert.ok(s.calls.includes('result')); s.dispose();
});
