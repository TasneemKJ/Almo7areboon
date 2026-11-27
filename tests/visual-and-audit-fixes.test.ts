import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { chronicleMovementLimit, chronicleDamage } from '../src/game/chronicle-combat.ts';
import { settleDusk } from '../src/game/dusk-raid.ts';
import { campSmithyHtml } from '../src/ui/smithy-screen.ts';
import { quietGuidance, IDLE_LINE_SECONDS } from '../src/ui/first-battle.ts';
import { fieldGoalSummary } from '../src/ui/field-controls.ts';
import { setLang } from '../src/game/locale.ts';
import { sideTint, sideRing } from '../src/view/side-identity.ts';
import { paintDuskLamps, type LanternGraphics } from '../src/view/gate-lanterns.ts';
import { paintWaveArrival } from '../src/view/wave-arrival-paint.ts';
import { waveArrivalFrame } from '../src/view/wave-arrival.ts';
import { troopPose } from '../src/view/visual-theme.ts';
import { characterGesture } from '../src/view/character-gesture.ts';
import { DeathVisuals } from '../src/view/death-visuals.ts';
import { readFileSync } from 'node:fs';

test('lantern route melee units advance to fight enemies contesting the lantern instead of soft-locking at x=480', () => {
  const g = new Game();
  g.dispatch({ type: 'start' });
  g.state.chronicle = {
    enabled: true, objective: 'light', lightSeconds: 5, rally: false, gathered: [],
    landmark: { kind: 'lantern', x: 500, owner: 'player', broken: false },
    shieldUntil: 0, revealUntil: 0, coveredHits: 0, shatters: 0,
    boss: { id: -1, windupUntil: 0, nextRing: 99, interrupts: 0 },
  } as any;
  const melee = { id: 1, side: 'player', kind: 0, x: 480, lane: 1, hp: 100, maxHp: 100 } as any;
  g.state.units = [melee];
  assert.equal(chronicleMovementLimit(g.state, melee), 480, 'clamps at 480 when lantern is uncontested');
  const enemyRanged = { id: 2, side: 'enemy', kind: 1, x: 560, lane: 1, hp: 50, maxHp: 50 } as any;
  g.state.units = [melee, enemyRanged];
  assert.equal(chronicleMovementLimit(g.state, melee), null, 'advances to engage enemy contesting lantern');
});

test('shadow attacker weakness only triggers near a player-owned lantern landmark', () => {
  const g = new Game();
  g.dispatch({ type: 'start' });
  g.state.chronicle = {
    enabled: true, objective: 'road', lightSeconds: 0, rally: false, gathered: [],
    landmark: { kind: 'cover', x: 500, owner: 'player', broken: false },
    shieldUntil: 0, revealUntil: 0, coveredHits: 0, shatters: 0,
    boss: { id: -1, windupUntil: 0, nextRing: 99, interrupts: 0 },
  } as any;
  const shadow = { id: 2, side: 'enemy', kind: 0, x: 510, lane: 1, hp: 50, maxHp: 50, storyShadow: true } as any;
  const target = { id: 1, side: 'player', kind: 0, x: 400, lane: 1, hp: 100, maxHp: 100 } as any;
  assert.equal(chronicleDamage(g.profile, g.state, shadow, target, 100), 100, 'cover landmark does not weaken shadow');
  g.state.chronicle!.landmark.kind = 'lantern';
  assert.equal(chronicleDamage(g.profile, g.state, shadow, target, 100), 80, 'lantern landmark weakens shadow');
});

test('smithy hook cycles through all forged blades of a kind and allows unequipping', () => {
  const g = new Game();
  g.profile.smithy = {
    next: 4,
    blades: [
      { id: 1, kind: 0, chapter: 0, forged: true },
      { id: 2, kind: 0, chapter: 1, forged: true },
      { id: 3, kind: 0, chapter: 2, forged: true, hung: true },
    ],
  };
  const html1 = campSmithyHtml(g.profile);
  assert.match(html1, /data-command="smithy-hang" data-blade="2"/, 'cycles from newest blade #3 down to #2');
  delete g.profile.smithy!.blades[2].hung;
  g.profile.smithy!.blades[0].hung = true;
  const html2 = campSmithyHtml(g.profile);
  assert.match(html2, /data-command="smithy-hang" data-blade="1"/, 'at oldest blade #1, tapping unhangs #1');
});

test('settleDusk preserves the marks accessibility preference', () => {
  const g = new Game();
  const snap = JSON.stringify(g.profile);
  g.profile.marks = true;
  g.state.phase = 'won';
  g.state.dusk = { lamps: [300], settled: false } as any;
  settleDusk(g.profile, g.state, snap);
  assert.equal(g.profile.marks, true);
});

test('quietGuidance fires at IDLE_LINE_SECONDS before first deploy, then waits 8s after deploy', () => {
  const g = new Game();
  g.dispatch({ type: 'start' });
  g.state.food = 10;
  assert.ok(quietGuidance(g, IDLE_LINE_SECONDS).length > 0);
  g.state.stats.deployed = 1;
  assert.equal(quietGuidance(g, IDLE_LINE_SECONDS), '');
  assert.ok(quietGuidance(g, 8).length > 0);
});

test('fieldGoalSummary isolates hp/max ratio in Arabic RTL', () => {
  setLang('ar');
  try {
    const out = fieldGoalSummary(100, 45, 160, '0/60');
    assert.ok(out.includes('\u206645/160\u2069'));
  } finally {
    setLang('en');
  }
});

test('refined side identity keeps warm terracotta enemy tint and sleeker ground ring', () => {
  assert.equal(sideTint('enemy'), 0xebad9e);
  const ring = sideRing('player', 1, false);
  assert.ok(ring.rx < 15 && ring.alpha >= 0.6);
});

test('paintDuskLamps draws ready-state placement cues only while lamps remain to be hung', () => {
  const makeRec = (): LanternGraphics & { calls: number } => ({
    calls: 0,
    clear() {},
    fillStyle() {},
    lineStyle() {},
    fillCircle() { this.calls++; },
    fillRect() { this.calls++; },
    fillTriangle() { this.calls++; },
    lineBetween() { this.calls++; },
  });
  const bodyReady = makeRec(), glowReady = makeRec();
  paintDuskLamps(bodyReady, glowReady, [], 285, 0, true, true);
  assert.ok(bodyReady.calls > 0 && glowReady.calls > 0, 'draws 3 ready cues when no lamps hung');

  const bodyNotReady = makeRec(), glowNotReady = makeRec();
  paintDuskLamps(bodyNotReady, glowNotReady, [], 285, 0, true, false);
  assert.equal(bodyNotReady.calls, 0);
  assert.equal(glowNotReady.calls, 0);

  const bodyFullReady = makeRec(), glowFullReady = makeRec();
  paintDuskLamps(bodyFullReady, glowFullReady, [280, 500, 720], 285, 0, true, true);
  const bodyFullRunning = makeRec(), glowFullRunning = makeRec();
  paintDuskLamps(bodyFullRunning, glowFullRunning, [280, 500, 720], 285, 0, true, false);
  assert.equal(bodyFullReady.calls, bodyFullRunning.calls, 'no extra cues once 3 lamps are hung');
});

test('createBaseSprite applies warm terracotta rival tint to enemy storybook base only', () => {
  const src = readFileSync(new URL('../src/view/battlefield-sprites.ts', import.meta.url), 'utf8');
  assert.match(src, /storybookArt\(age\)&&side==='enemy'\)image\.setTint\(0xdf9f88\)/);
});

test('dusk-veil keeps atmospheric midnight opacity instead of crushed near-black', () => {
  const css = readFileSync(new URL('../src/ui/world-play.css', import.meta.url), 'utf8');
  assert.match(css, /\.dusk-veil\{[^}]*#081520a6/);
  assert.doesNotMatch(css, /#050c12ee/);
});

test('paintWaveArrival uses distinct high-contrast intent colours within bounded commands', () => {
  const colors = new Set<number>();
  for (const intent of ['rush', 'volley', 'bulwark'] as const) {
    const fills: number[] = [];
    let cmds = 0;
    const g: any = {
      lineStyle() { cmds++; return g; },
      lineBetween() { cmds++; return g; },
      fillStyle(c: number) { cmds++; fills.push(c); return g; },
      fillPoints() { cmds++; return g; },
      fillCircle() { cmds++; return g; },
      strokeCircle() { cmds++; return g; },
      fillRect() { cmds++; return g; },
      strokeRect() { cmds++; return g; },
    };
    const frame = waveArrivalFrame({ phase: 'running', paused: false, reduced: true, preview: { number: 2, total: 5, intent, counts: [1, 1, 1], nextIn: 2 } })!;
    paintWaveArrival(g, frame, { x: 340, y: 267 });
    colors.add(fills[1]);
    assert.ok(cmds < 50, `${intent} exceeded 50 commands: ${cmds}`);
  }
  assert.equal(colors.size, 3);
});

test('troopPose syncs attack windup, strike and recovery to attackProgress and keeps walk frames in 0..3', () => {
  assert.equal(troopPose(1, false, true, false, 0.1).frame, 5);
  assert.equal(troopPose(1, false, true, false, 0.45).frame, 0);
  assert.equal(troopPose(1, false, true, false, 0.85).frame, 4);
  for (let i = 0; i < 12; i++) {
    const f = troopPose(i * 0.13, true, false, false).frame;
    assert.ok(f >= 0 && f <= 3);
  }
});

test('characterGesture breathes gently when idle and stays neutral under reduced motion', () => {
  const idle = characterGesture(0, 0.7, false, false, false);
  assert.ok(idle.sy > 1 && idle.sx < 1);
  assert.deepEqual(characterGesture(0, 0.7, false, false, true), { forward: 0, lift: 0, angle: 0, sx: 1, sy: 1 });
});

test('DeathVisuals knocks defeated units backward away from the blow', () => {
  const dv = new DeathVisuals();
  const make = () => ({ x: 100, y: 120, scaleX: 1, scaleY: 1, angle: 0, setPosition(x: number, y: number) { this.x = x; this.y = y; }, setScale() {}, setAngle() {}, setAlpha() {}, destroy() {} });
  const player = make(), enemy = make();
  dv.add(player, 'player');
  dv.add(enemy, 'enemy');
  dv.step(0.15, false);
  assert.ok(player.x < 100 && player.y > 120);
  assert.ok(enemy.x > 100 && enemy.y > 120);
});

test('troopPose weights walk cadence and stride lift by troop role', () => {
  const peakMelee = Math.max(...Array.from({ length: 20 }, (_, i) => troopPose(i * 0.03, true, false, false, undefined, 0).lift));
  const peakHeavy = Math.max(...Array.from({ length: 20 }, (_, i) => troopPose(i * 0.03, true, false, false, undefined, 2).lift));
  assert.ok(peakHeavy < peakMelee);
});
