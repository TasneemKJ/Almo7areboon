import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { setLang } from '../src/game/locale.ts';
import { FIELD_TALE } from '../src/ui/intro-screen.ts';
import { IDLE_LINE_SECONDS, firstBattleTale, isFirstBattle, quietGuidance, worldTeaching } from '../src/ui/first-battle.ts';
import { fieldGuidance } from '../src/ui/field-guidance.ts';
import { compactResultsHtml } from '../src/ui/results-screen.ts';

/* DESIGN.md #79 «سطرٌ واحد»: the first battle opens with the storyteller's one line, then the world teaches; the guide's
   lines move into the after-battle chronicle; a short line returns only when nothing is sent for 8 s. */
const fresh = () => { const g = new Game(); g.dispatch({ type: 'start' }); return g; };
const SECOND_PERSON = /(?:^|[\s،.«])[؀-ۿ]*(?:تَ|تِ|تُما|تُم|تُنّ)(?=[\s،.»]|$)|(?:^|[\s،.«])(?:أرسلت|أنت|أنتِ|لقد\s+أرسلت|جعلت|حملت|تركت)(?=[\s،.»]|$)/;

test('the storyteller opens the first battle with one line, in plain words, in both languages', () => {
  assert.equal(FIELD_TALE.ar, 'كان يا ما كان، في وادٍ بعيد، قريةٌ لا تملك إلا بابها.');
  assert.match(FIELD_TALE.en, /^Once upon a time/);
  assert.doesNotMatch(FIELD_TALE.en + FIELD_TALE.ar, /!|birth|born|ولادة|ميلاد|مولود|لمس/);
});

test('only the first battle of a new company is quiet; later battles keep their guide', () => {
  const g = fresh();
  assert.equal(isFirstBattle(g.profile, g.state), true);
  const later = new Game(Object.assign(defaultProfile(), { wins: 1, enemyAge: 1, furthestBattle: 1 })); later.dispatch({ type: 'start' });
  assert.equal(isFirstBattle(later.profile, later.state), false);
  later.step(.5); assert.notEqual(fieldGuidance(later), '', 'the guide still speaks after the first battle');
  g.state.enemyHp = 0; g.step(1 / 60); assert.equal(g.state.phase, 'won');
  assert.equal(isFirstBattle(g.profile, g.state), true, 'its result is still the first battle');
});

test('in the first battle the guide starts quiet briefly, and returns promptly after 1.5 s with nothing sent', () => {
  const g = fresh();
  for (let t = 0; t < 1.2; t += .5) { g.step(.5); g.drainEvents(); assert.equal(quietGuidance(g, Math.min(t, IDLE_LINE_SECONDS - .2)), '', `quiet at ${t}s`); }
  assert.ok(g.deploymentStatus(0).allowed);
  const line = quietGuidance(g, IDLE_LINE_SECONDS);
  assert.match(line, /^Tap a troop card/); assert.ok(line.length < 60, 'a short line');
  setLang('ar'); try { assert.match(quietGuidance(g, IDLE_LINE_SECONDS), /^اختر بطاقة مقاتل/); } finally { setLang('en'); }
  assert.equal(fieldGuidance(g, 0.5), '', 'fieldGuidance follows the brief opening in the first battle');
  assert.equal(fieldGuidance(g, IDLE_LINE_SECONDS), line);
});

test('the world teaches instead: the food sack glows, a ripple shows where a tap sends, dust and a horn before a stronger wave', () => {
  const g = fresh();
  let w = worldTeaching(g, 0);
  assert.equal(w.foodReady, g.deploymentStatus(0).allowed);
  g.state.food = 0; w = worldTeaching(g, 3); assert.equal(w.foodReady, false); assert.equal(w.ripple, false, 'no ripple when nothing can be sent');
  g.state.food = 9; assert.equal(worldTeaching(g, 0).ripple, false, 'a busy player is not shown the way'); assert.equal(worldTeaching(g, 2).ripple, true);
  let dust = false, horns = new Set<number>();
  for (let t = 0; t < 60; t += .1) { g.state.food = 0; g.step(.1); g.drainEvents(); const v = worldTeaching(g, 0); dust ||= v.dust; if (v.horn !== null) horns.add(v.horn); }
  assert.ok(dust, 'the dust cloud shows on the road before a stronger wave');
  assert.ok(horns.size >= 1, 'the horn sounds for a stronger wave');
  assert.ok([...horns].every(n => n >= 2), 'never for the first lone rival');
});

test('after the first battle the storyteller tells it: a few lines naming the troops and the village, never the player', () => {
  for (const lang of ['en', 'ar'] as const) {
    setLang(lang);
    try {
      for (const outcome of ['won', 'lost'] as const) {
        const g = fresh();
        for (let i = 0; i < 6; i++) { g.state.food = 9; g.dispatch({ type: 'spawn', kind: 0 }); g.step(1); g.drainEvents(); }
        if (outcome === 'won') g.state.enemyHp = 0; else g.state.playerHp = 0;
        g.step(1 / 60);
        const lines = firstBattleTale(g.profile, g.state);
        assert.ok(lines.length >= 2 && lines.length <= 3, `${lang} ${outcome}: ${lines.length} lines`);
        for (const l of lines) {
          assert.doesNotMatch(l, /!|لمس|birth|born|ولادة|ميلاد|مولود/);
          if (lang === 'ar') assert.doesNotMatch(l, SECOND_PERSON, `no gendered address: ${l}`);
          else assert.doesNotMatch(l, /\byou\b|\byour\b/i, l);
        }
        const html = compactResultsHtml(g.profile, g.state, false, true);
        assert.match(html, /class="result-tale"/); for (const l of lines) assert.ok(html.includes(l));
      }
    } finally { setLang('en'); }
  }
  const later = new Game(Object.assign(defaultProfile(), { wins: 4, enemyAge: 1, furthestBattle: 1 })); later.dispatch({ type: 'start' }); later.state.playerHp = 0; later.step(1 / 60);
  assert.doesNotMatch(compactResultsHtml(later.profile, later.state, false, true), /result-tale/);
});

test('the food sack glow uses its own class, never the shell\'s .ready (which positions the start panel)', async () => {
  const { readFileSync } = await import('node:fs');
  const controller = readFileSync(new URL('../src/ui/field-controller.ts', import.meta.url), 'utf8');
  assert.match(controller, /food\.classList\.toggle\('sack-ready',teach\.foodReady\)/);
  assert.doesNotMatch(readFileSync(new URL('../src/ui/world-play.css', import.meta.url), 'utf8'), /\.field-food\.ready/);
});

test('with momentum ready and no order yet this battle, the drag lesson outranks tactical hints (orders are dragged)', () => {
  setLang('en');
  const later = new Game(Object.assign(defaultProfile(), { wins: 1, enemyAge: 1, furthestBattle: 1 })); later.dispatch({ type: 'start' });
  later.step(.5); later.state.stats.deployed = 5; later.state.orders!.charge = 60;
  assert.match(fieldGuidance(later), /Drag the banner forward to advance, back to hold/);
});

test('the drag lesson and the tactical hints share the line in six-second turns, so neither is hidden for the battle', async () => {
  const { dragTurn } = await import('../src/ui/field-guidance.ts');
  assert.equal(dragTurn(0), true); assert.equal(dragTurn(5.9), true); assert.equal(dragTurn(6), false); assert.equal(dragTurn(11.9), false); assert.equal(dragTurn(12), true);
  const src = (await import('node:fs')).readFileSync(new URL('../src/ui/field-guidance.ts', import.meta.url), 'utf8');
  assert.match(src, /canCast&&!\(\(s\.stats\.ordersCast\?\?0\)>0\)&&\(!hint\|\|dragTurn\(s\.time\)\)\)return drag;/, 'a due hint gets the odd slices');
});

test('a first victory without an order names the banner on its card (the drag lesson lives on the first Victory card)', () => {
  setLang('en');
  const g = fresh(); g.state.stats.deployed = 8; g.state.enemyHp = 0; g.step(1 / 60); assert.equal(g.state.phase, 'won');
  assert.ok(firstBattleTale(g.profile, g.state).some(l => /The banner stayed planted all battle/.test(l)), 'no order given: the banner lesson is shown');
  const h = fresh(); h.state.stats.deployed = 8; h.state.stats.ordersCast = 1; h.state.enemyHp = 0; h.step(1 / 60);
  assert.ok(!firstBattleTale(h.profile, h.state).some(l => /banner stayed planted/.test(l)), 'an order given: no banner lesson');
});
