import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppBridge } from '../src/ui/app-bridge.ts';
import { createStoreFlow } from '../src/app/store-flow.ts';
import { defaultProfile } from '../src/game/save.ts';
import { Game } from '../src/game/simulation.ts';
import { ERAS } from '../src/game/data.ts';
import { evolutionScreenHtml } from '../src/ui/evolution-screen.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';
import { regroupLearningHtml } from '../src/ui/regroup-learning.ts';

// Audit for 1.1: a free player in the app saw EVOLVE with a coin cost ("20k") for a chapter that Full Journey opens,
// and saved coins toward a wall. The control now shows a lock and the App Store's price, and a tap opens the card.

const appBridge = (owned: Record<string, boolean> = {}, prices: Record<string, string> = { fullGame: '$4.99' }) =>
  createAppBridge({ webkit: { messageHandlers: { almo7areboon: { postMessage: () => {} } } }, __almoAppBoot: { owned, prices } });
const gameAt = (age: number, coins: number) => { const p = defaultProfile(); Object.assign(p, { age, enemyAge: age, furthestBattle: age, coins, wins: 3 }); return new Game(p); };
const evolveButton = (html: string) => html.match(/<button[^>]*data-command="evolve"[^>]*>[\s\S]*?<\/button>/)![0];

test('a free player at the end of chapter 3 sees a lock and the store price on EVOLVE, never a coin cost', () => {
  for (const coins of [0, ERAS[2].evolveCost * 2]) {
    const game = gameAt(2, coins), button = evolveButton(evolutionScreenHtml(game.profile, game.state, appBridge()));
    assert.match(button, /data-locked="full-journey"/);
    assert.match(button, /<bdi dir="ltr">\$4\.99<\/bdi>/, 'the App Store price, isolated left to right like the card');
    assert.match(button, /aria-label="MOVE CAMP\. Locked\. Opens with Full Journey, \$4\.99"/);
    assert.doesNotMatch(button, /170k|disabled/, 'no coin cost, and it can always be tapped to open the card');
  }
  const game = gameAt(2, 5), html = evolutionScreenHtml(game.profile, game.state, appBridge());
  assert.doesNotMatch(html, /camp-shortfall|Needs [\d,]+ more/, 'no coin shortfall toward a wall');
  assert.match(html, /This chapter opens with Full Journey, bought once\. Moving camp then costs 170,000 coins\./, 'both costs are said plainly');
});

test('before the store has answered the lock names Full Journey instead of a price', () => {
  const game = gameAt(2, 0), button = evolveButton(evolutionScreenHtml(game.profile, game.state, appBridge({}, {})));
  assert.match(button, /data-locked="full-journey"/);
  assert.match(button, /<span>Full Journey<\/span>/);
  assert.doesNotMatch(button, /undefined|\$|disabled/);
});

test('owners, the free evolutions (into chapters 2 and 3) and the web keep the normal coin cost', () => {
  const owner = gameAt(2, 5), owned = evolveButton(evolutionScreenHtml(owner.profile, owner.state, appBridge({ fullGame: true })));
  assert.match(owned, /170k/); assert.match(owned, /disabled/); assert.doesNotMatch(owned, /data-locked/);
  const first = gameAt(0, ERAS[0].evolveCost), free = evolveButton(evolutionScreenHtml(first.profile, first.state, appBridge()));
  assert.match(free, /2\.5k/); assert.doesNotMatch(free, /data-locked|disabled/);
  const second = gameAt(1, ERAS[1].evolveCost), third = evolveButton(evolutionScreenHtml(second.profile, second.state, appBridge()));
  assert.match(third, /20k/); assert.doesNotMatch(third, /data-locked|disabled/, 'chapter 3 is free since 1.3: moving camp into it costs coins only');
  const web = gameAt(2, 5);
  assert.match(evolveButton(evolutionScreenHtml(web.profile, web.state)), /170k/);
  assert.doesNotMatch(evolutionScreenHtml(web.profile, web.state), /data-locked/);
});

test('the result details and the regroup advice stop pointing coins at the locked chapter', () => {
  const game = gameAt(2, ERAS[2].evolveCost); game.state.phase = 'won';
  const locked = evolveButton(resultsHtml(game.profile, game.state, appBridge()));
  assert.match(locked, /data-locked="full-journey"/); assert.match(locked, /\$4\.99/); assert.doesNotMatch(locked, /coins|disabled/);
  assert.match(evolveButton(resultsHtml(game.profile, game.state, appBridge({ fullGame: true }))), /Move camp · 170,000 coins/);
  game.state.phase = 'lost';
  assert.match(regroupLearningHtml(game.profile, game.state), /Moving camp is affordable: 170,000 coins/, 'the web keeps the advice');
});

test('tapping the locked control opens the store card once; declining closes it and nothing reopens it', () => {
  const bridge = appBridge(), profile = { ...defaultProfile(), age: 2, enemyAge: 2, furthestBattle: 2, wins: 3 };
  const navState = { modal: null as string | null, evolutionFromResult: false, activeTab: 'evolution' }, shown: string[] = [], redraws: string[] = [];
  const ports = {
    action: () => false, closeModal: () => { navState.modal = null; }, navState, persist: () => {}, playable: () => true, renderScreen: () => { redraws.push('screen'); },
    sessionState: { game: { profile } }, showModal: (id: string) => { navState.modal = id; shown.push(id); },
    showResult: () => { navState.modal = 'result'; }, showSettings: () => {}, toast: () => {},
  };
  const disposers: (() => void)[] = [];
  const flow = createStoreFlow({ dom: { lifetime: { add: (f: () => void) => disposers.push(f) } }, ports } as never, bridge);
  assert.equal(flow.gateEvolution(), true); // listeners.ts 'evolve' asks this first
  assert.deepEqual(shown, ['full-journey']);
  assert.equal(flow.handleStoreCommand('close'), true);
  assert.equal(navState.modal, null);
  assert.deepEqual(shown, ['full-journey'], 'declined: the card is not shown again until the player taps');
  bridge.update({ prices: { fullGame: '4,99 €' } });
  assert.deepEqual(shown, ['full-journey'], 'a store answer redraws the control, not the card');
  assert.ok(redraws.length > 0, 'the lock on the Evolution page follows the store (price, then ownership)');
  bridge.update({ owned: { fullGame: true } });
  assert.equal(flow.gateEvolution(), false, 'owned: the normal evolution dialog');
  disposers.forEach(f => f());
});
