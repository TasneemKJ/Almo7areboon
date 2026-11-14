import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { ORDER_EFFECTS, activeBattleOrder } from '../src/game/battle-orders.ts';
import { BANNER_COMMIT, BANNER_TRAVEL, bannerDragIntent, bannerDragOffset, bannerOrderFromDrag, bannerView } from '../src/ui/banner-gesture.ts';

// 2026-11-14: Advance/Hold are carried out with the company banner in the field. Drag forward (toward the enemy gate,
// world +x) to Advance, back to Hold. The simulation still owns the order's cost, length and strength.
const fresh=()=>{const p=defaultProfile();p.chronicle!.enabled=false;const g=new Game(p);g.dispatch({type:'start'});g.state.food=99;return g;};

test('dragging the banner forward is Advance, back is Hold, and a short or vertical drag issues nothing', () => {
  assert.equal(bannerOrderFromDrag(50, 4), 'advance');
  assert.equal(bannerOrderFromDrag(BANNER_COMMIT, 0), 'advance');
  assert.equal(bannerOrderFromDrag(-50, -6), 'hold');
  assert.equal(bannerOrderFromDrag(-BANNER_COMMIT, 0), 'hold');
  assert.equal(bannerOrderFromDrag(BANNER_COMMIT - 1, 0), null, 'the neutral zone plants the banner back');
  assert.equal(bannerOrderFromDrag(0, 0), null, 'a tap is not an order');
  assert.equal(bannerOrderFromDrag(40, 60), null, 'mostly vertical is not a carry');
  assert.equal(bannerOrderFromDrag(Number.NaN, 0), null);
  assert.equal(bannerOrderFromDrag(Infinity, 0), null);
});

test('the banner follows the finger only a bounded distance', () => {
  assert.equal(bannerDragOffset(500), BANNER_TRAVEL);
  assert.equal(bannerDragOffset(-500), -BANNER_TRAVEL);
  assert.equal(bannerDragOffset(20), 20);
  assert.equal(bannerDragOffset(Number.NaN), 0);
});

test('while dragging, the plate names the order it would give, or that momentum is not ready', () => {
  assert.equal(bannerDragIntent(60, 0, true), 'advance');
  assert.equal(bannerDragIntent(-60, 0, true), 'hold');
  assert.equal(bannerDragIntent(60, 0, false), 'wait');
  assert.equal(bannerDragIntent(10, 0, true), null);
});

for (const [dx, order] of [[64, 'advance'], [-64, 'hold']] as const) test(`a ${order} drag gives exactly the existing ${order} order: 60 momentum, 10 seconds`, () => {
  const g = fresh(); g.state.orders!.charge = 60;
  const mapped = bannerOrderFromDrag(dx, 0);
  assert.equal(mapped, order);
  assert.equal(g.dispatch({type: 'order', order: mapped!}), true);
  assert.equal(activeBattleOrder(g.state, g.state.time), order);
  assert.equal(g.state.orders!.charge, 0);
  assert.equal(g.state.orders!.until, g.state.time + 10);
  assert.equal(g.state.stats.ordersCast, 1);
});

test('the order effects are unchanged by the gesture: Advance +20% strike and +15% pace, Hold -25% damage taken', () => {
  assert.deepEqual(ORDER_EFFECTS, {advance: {damage: 1.2, movement: 1.15}, hold: {received: .75}});
});

test('a carry without momentum, while paused or during an order changes nothing', () => {
  const g = fresh(); g.state.orders!.charge = 59;
  const before = JSON.stringify(g.state);
  assert.equal(g.dispatch({type: 'order', order: bannerOrderFromDrag(70, 0)!}), false);
  assert.equal(JSON.stringify(g.state), before);
  g.state.orders!.charge = 100; g.dispatch({type: 'pause'});
  assert.equal(g.dispatch({type: 'order', order: bannerOrderFromDrag(-70, 0)!}), false);
  g.dispatch({type: 'pause'});
  assert.equal(g.dispatch({type: 'order', order: 'advance'}), true);
  assert.equal(g.dispatch({type: 'order', order: bannerOrderFromDrag(-70, 0)!}), false, 'one order at a time');
});

test('momentum is the banner cloth: quarters toward 60, full and ready at 60, then the order burns it down', () => {
  const g = fresh();
  assert.deepEqual(bannerView(g.state), {ready: false, order: null, cloth: 0, steps: 0});
  g.state.orders!.charge = 30;
  assert.deepEqual(bannerView(g.state), {ready: false, order: null, cloth: .5, steps: 2});
  g.state.orders!.charge = 100;
  assert.deepEqual(bannerView(g.state), {ready: true, order: null, cloth: 1, steps: 4});
  g.dispatch({type: 'order', order: 'hold'});
  for (let i = 0; i < 20; i++) g.step(.25);
  const view = bannerView(g.state);
  assert.equal(view.order, 'hold'); assert.equal(view.ready, false);
  assert.ok(Math.abs(view.cloth - .5) < 1e-9); assert.equal(view.steps, 2);
});

test('the banner is drawn in the world and the native Advance/Hold buttons remain its accessible proxies', async () => {
  const {fieldControlsHtml} = await import('../src/ui/field-controls.ts');
  const html = fieldControlsHtml();
  assert.match(html, /id="field-banner" class="field-banner" aria-hidden="true"/);
  assert.match(html, /standard\.webp/, 'the banner is the game\'s own painted standard');
  assert.match(html, /id="field-standard" class="world-hit camp-hit" data-command="story-rally" aria-label="[^"]*camp/);
  const shell = readFileSync(new URL('../src/ui/app-shell.ts', import.meta.url), 'utf8');
  assert.match(shell, /data-order="advance"/); assert.match(shell, /data-order="hold"/);
  const css = readFileSync(new URL('../src/ui/field-board.css', import.meta.url), 'utf8');
  assert.match(css, /\.order-banner\{position:absolute!important;width:1px;height:1px;overflow:hidden;clip-path:inset\(50%\)/, 'proxies are visually hidden, not display:none');
  assert.match(css, /\.order-banner:focus-within\{/, 'keyboard focus shows them');
  assert.match(css, /\.food-line,\n[^{]*\.chronicle-command-row\{display:none!important\}/);
  assert.match(css, /\.field-banner\{[^}]*touch-action:none/);
  assert.match(css, /\.unit-card\{\n height:62px!important;min-height:44px/);
});

test('the banner drag goes through the same guarded order action as the buttons', () => {
  const src = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(src, /const order=bannerOrderFromDrag\(dx,dy\);/);
  assert.match(src, /if\(order&&allowed\(\)\)\{[^]*?ports\.action\(\{type:'order',order\}\)/);
  assert.match(src, /ports\.navState\.entryEntered&&!ports\.navState\.modal&&ports\.navState\.activeTab==='battle'&&ports\.sessionState\.game\.state\.phase==='running'&&!ports\.sessionState\.game\.state\.paused&&ports\.playable\(\)/);
});

test('copy teaches the banner in both languages', async () => {
  const guidance = readFileSync(new URL('../src/ui/field-guidance.ts', import.meta.url), 'utf8');
  assert.match(guidance, /Drag the banner forward to advance, back to hold\./);
  assert.match(guidance, /اسحب الراية إلى الأمام لتتقدّم، وإلى الخلف لتثبت\./);
});

for (const [width, height] of [[320, 568], [390, 844], [390, 700], [412, 915], [844, 390], [667, 375]]) test(`the banner is a 44px+ target inside the field, clear of the supply basket, at ${width}x${height}`, async () => {
  const {campLayout} = await import('../src/view/world-camp.ts');
  const plan = campLayout(width, height), b = plan.banner, s = plan.supplies;
  assert.ok(b.width >= 44 && b.height >= 44);
  assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height);
  assert.ok(b.x + b.width <= s.x || s.x + s.width <= b.x || b.y + b.height <= s.y || s.y + s.height <= b.y, 'banner and basket do not overlap');
  if (height > width) assert.ok(b.y >= height * .66 + 24 * width / 450, 'in portrait the banner stands below the combat lanes');
});
