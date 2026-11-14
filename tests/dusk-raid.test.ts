import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { duskAvailable, duskSight, DUSK_LAMPS, LAMP_REACH } from '../src/game/dusk-raid.ts';
import { campDuskHtml } from '../src/ui/camp-screen.ts';
import { lamplighterHtml } from '../src/ui/lamplighter-screen.ts';
import { compactResultsHtml } from '../src/ui/results-screen.ts';
import { setLang } from '../src/game/locale.ts';

const DAY = 20_400;
const veteran = (fields: Record<string, unknown> = {}) => Object.assign(defaultProfile(), { enemyAge: 1, furthestBattle: 1, wins: 1, coins: 300, played: true }, fields);
const raid = (game: Game, lit = true) => { assert.ok(game.dispatch({ type: 'dusk', day: DAY, lit })); for (const x of [300, 500, 700]) assert.ok(game.dispatch({ type: 'dusk-lamp', x })); assert.ok(game.dispatch({ type: 'start' })); };
const withoutStamp = (game: Game) => { const p = JSON.parse(JSON.stringify(game.profile)); delete p.dusk; return JSON.stringify(p); };

test('the Lamplighter lights the wall lamps once a day; without him they are lit once ever, as a sample', () => {
  const p = veteran();
  assert.equal(duskAvailable(p, DAY, true), true); assert.equal(duskAvailable(p, DAY, false), true, 'the free sample');
  assert.equal(duskAvailable(veteran({ wins: 0 }), DAY, true), false, 'not before the first victory');
  const game = new Game(p); assert.ok(game.dispatch({ type: 'dusk', day: DAY, lit: false }));
  assert.deepEqual(game.profile.dusk, { day: DAY, sampled: true });
  assert.equal(duskAvailable(game.profile, DAY + 1, false), false, 'the sample is spent');
  assert.equal(duskAvailable(game.profile, DAY, true), false, 'once a day even with him');
  assert.equal(duskAvailable(game.profile, DAY + 1, true), true);
  const sub = new Game(veteran()); sub.dispatch({ type: 'dusk', day: DAY, lit: true });
  assert.deepEqual(sub.profile.dusk, { day: DAY }, 'a subscriber keeps the free sample');
  assert.equal(decodeSave(JSON.stringify(sub.profile)).profile?.dusk?.day, DAY);
  assert.equal(decodeSave(JSON.stringify({ ...defaultProfile(), dusk: { day: 'x' } })).profile?.dusk, undefined);
});

test('a raid, won or lost, pays nothing: the profile is unchanged but for the day stamp, and the road does not move', () => {
  for (const outcome of ['won', 'lost'] as const) {
    const game = new Game(veteran()), before = withoutStamp(game);
    raid(game);
    for (let i = 0; i < 400; i++) { game.dispatch({ type: 'spawn', kind: 0 }); game.step(.1); game.drainEvents(); }
    if (game.state.phase === 'running') { if (outcome === 'won') game.state.enemyHp = 0; else game.state.playerHp = 0; game.step(1 / 60); }
    assert.equal(game.state.dusk?.settled, true);
    assert.equal(withoutStamp(game), before, `${outcome}: coins, gems, kills, deployed, wins, seals, streak untouched`);
    assert.equal(game.state.earned, 0);
    assert.equal(game.dispatch({ type: 'next' }), false, 'a raid never advances the road');
    assert.match(compactResultsHtml(game.profile, game.state, false, true), /data-command="retry" data-primary="true">To camp</);
    assert.ok(game.dispatch({ type: 'retry' })); assert.equal(game.state.dusk, undefined, 'the next battle is the chapter again');
  }
});

test('while lamps are hung and the raid runs, nothing can be bought or claimed; the third lamp is the last', () => {
  const game = new Game(veteran({ coins: 5000 }));
  game.dispatch({ type: 'dusk', day: DAY, lit: true });
  for (const action of [{ type: 'upgrade', stat: 'food' }, { type: 'unlock', kind: 1 }, { type: 'evolve' }, { type: 'next' }, { type: 'summon', count: 1 }, { type: 'daily', day: DAY }] as const) assert.equal(game.dispatch(action as never), false, action.type);
  for (let i = 0; i < DUSK_LAMPS; i++) assert.ok(game.dispatch({ type: 'dusk-lamp', x: 200 + i * 200 }));
  assert.equal(game.dispatch({ type: 'dusk-lamp', x: 800 }), false);
  assert.equal(game.dispatch({ type: 'dusk', day: DAY + 1, lit: true }), false, 'one raid at a time');
});

test('raiders show only inside lamplight; outside a raid every troop is whole', () => {
  const s = { dusk: { lamps: [300, 600] } };
  assert.equal(duskSight(s, 300), 1); assert.equal(duskSight(s, 300 + LAMP_REACH), 1);
  const edge = duskSight({ dusk: { lamps: [300] } }, 300 + LAMP_REACH + 20); assert.ok(edge > .1 && edge < 1, 'the light fades at its edge');
  assert.equal(duskSight({ dusk: { lamps: [100] } }, 800), .1);
  assert.equal(duskSight({}, 800), 1);
});

test('Camp shows the wall lamps after the first victory: lit for today\'s raid, unlit in the app to open the card; free players lose nothing', () => {
  assert.equal(campDuskHtml(veteran({ wins: 0 }), DAY, { lit: true, inApp: true }), '');
  assert.match(campDuskHtml(veteran(), DAY, { lit: false, inApp: false }), /data-command="camp-dusk"/, 'the sample');
  const sampled = veteran({ dusk: { day: DAY - 3, sampled: true } });
  assert.equal(campDuskHtml(sampled, DAY, { lit: false, inApp: false }), '', 'on the web nothing is sold, so nothing is shown');
  assert.match(campDuskHtml(sampled, DAY, { lit: false, inApp: true }), /data-command="lamplighter"/);
  assert.match(campDuskHtml(sampled, DAY, { lit: true, inApp: true }), /data-command="camp-dusk"/);
  assert.doesNotMatch(campDuskHtml(veteran(), DAY, { lit: true, inApp: true }), /data-primary/, 'never the primary action');
});

test('the card describes the raid truthfully in both languages and keeps the legal lines', () => {
  const store = { inApp: true, owned: {}, status: '', prices: { lamplighterMonthly: '$1.99', lamplighterYearly: '$14.99' }, price: '', owns: () => false };
  for (const language of ['en', 'ar'] as const) {
    setLang(language);
    try {
      const html = lamplighterHtml(store);
      assert.match(html, language === 'en' ? /dusk raid, once a day/ : /غارة الغسق، مرّةً كلّ يوم/);
      assert.match(html, language === 'en' ? /not a stronger army/ : /لا جيشٌ أقوى/);
      assert.match(html, language === 'en' ? /the raid earns none either/ : /ولا تكسب الغارة شيئاً/);
      assert.match(html, /data-command="open-terms"/); assert.match(html, /data-command="open-privacy"/);
      assert.doesNotMatch(html, /!|birth|born|ولادة|ميلاد|مولود/);
    } finally { setLang('en'); }
  }
});

test('a raid turned back leaves a dusk banner on the village wall (a keepsake that buys nothing); a lost raid leaves none', () => {
  const won = new Game(veteran()); raid(won); won.state.enemyHp = 0; won.step(1 / 60);
  assert.equal(won.state.phase, 'won'); assert.equal(won.profile.dusk?.kept, 1);
  const lost = new Game(veteran()); raid(lost); lost.state.playerHp = 0; lost.step(1 / 60);
  assert.equal(lost.profile.dusk?.kept, undefined);
  won.dispatch({ type: 'retry' }); assert.ok(won.dispatch({ type: 'dusk', day: DAY + 1, lit: true }));
  assert.equal(won.profile.dusk?.kept, 1, 'the next dusk keeps the banners already hung');
  assert.equal(decodeSave(JSON.stringify(won.profile)).profile?.dusk?.kept, 1);
  assert.equal(decodeSave(JSON.stringify({ ...defaultProfile(), dusk: { day: 3, kept: 'x' } })).profile?.dusk?.kept, undefined);
  const html = campDuskHtml(veteran({ dusk: { day: DAY, sampled: true, kept: 7 } }), DAY + 1, { lit: false, inApp: false });
  assert.match(html, /class="camp-dusk-banner" data-kept="5"/); assert.match(html, /7 raids turned back/);
  assert.doesNotMatch(html, /<button/, 'on the web, after the sample, it is a picture on the wall, nothing to open');
  assert.equal(campDuskHtml(veteran({ dusk: { day: DAY, sampled: true } }), DAY + 1, { lit: false, inApp: false }), '');
});

test('after a raid turned back: a held breath of 1.5 s, the banner settles, one line, and only then the rating ask', async () => {
  const { DUSK_HELD_BREATH_MS } = await import('../src/game/dusk-raid.ts');
  const { DUSK_AFTER_LINE } = await import('../src/ui/field-controller.ts');
  const { readFileSync } = await import('node:fs');
  assert.equal(DUSK_HELD_BREATH_MS, 1500);
  for (const line of Object.values(DUSK_AFTER_LINE)) assert.doesNotMatch(line, /!|لمس|ولادة|ميلاد|birth/);
  assert.equal(DUSK_AFTER_LINE.ar, 'صمدت القناديل، ورحل المغيرون.');
  const lifecycle = readFileSync(new URL('../src/app/lifecycle.ts', import.meta.url), 'utf8');
  assert.match(lifecycle, /ports\.showResult\(\);if\(sessionState\.ratingDue&&s\.phase==='won'\)\{sessionState\.ratingDue=false;askForRatingAfter/, 'the ask follows the result, after the pause');
  assert.match(lifecycle, /if\(batch\.some\(event=>event\.type==='lose'\)\)sessionState\.ratingDue=false;else if\(batch\.some\(event=>event\.type==='win'\)&&wonClimax\(sessionState\.game\.profile,sessionState\.game\.state\)\)sessionState\.ratingDue=true/, 'only a won climax just played');
  const controller = readFileSync(new URL('../src/ui/field-controller.ts', import.meta.url), 'utf8');
  assert.match(controller, /const settling=!!s\.dusk&&s\.phase==='won';node\.hidden=!running&&!settling;/);
});
