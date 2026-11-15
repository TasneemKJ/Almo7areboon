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

test('in the first battle the guide is silent, and one short line returns only after 8 s with nothing sent', () => {
  const g = fresh();
  for (let t = 0; t < 30; t += .5) { g.step(.5); g.drainEvents(); assert.equal(quietGuidance(g, Math.min(t, IDLE_LINE_SECONDS - .5)), '', `quiet at ${t}s`); }
  assert.ok(g.deploymentStatus(0).allowed);
  const line = quietGuidance(g, IDLE_LINE_SECONDS);
  assert.match(line, /^Tap the field/); assert.ok(line.length < 60, 'a short line');
  setLang('ar'); try { assert.match(quietGuidance(g, IDLE_LINE_SECONDS), /^انقر على الساحة/); } finally { setLang('en'); }
  assert.equal(fieldGuidance(g, 3), '', 'fieldGuidance follows the quiet rule in the first battle');
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
