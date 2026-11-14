import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { ERAS } from '../src/game/data.ts';
import { decodeSave, defaultProfile } from '../src/game/save.ts';
import { startOverProfile } from '../src/game/reset.ts';
import { blades, brokenBlades, dropBlades, fieldBlades, forgeWaits, hungBlades, normalizeSmithy, noteFall, reforgeCost, TEMPERS, temperOf, troopDef, wallBlades, SMITHY_CAP } from '../src/game/smithy.ts';
import { campSmithyHtml, FORGE_WAITS_LINE, HAKAWATI_BLADE_LINE, NO_BLADE_LINE, WALL_LINE, brokenName, fieldBladeLabel, temperLine, weaponName } from '../src/ui/smithy-screen.ts';
import { setLang } from '../src/game/locale.ts';

/** A battle where troops fall: a lone company against a far stronger chapter. */
function lostBattle(): Game {
  const p = defaultProfile(); Object.assign(p, { enemyAge: 2, furthestBattle: 2, played: true });
  const g = new Game(p); g.dispatch({ type: 'start' });
  for (let t = 0; g.state.phase === 'running' && t < 200; t += 0.1) { g.dispatch({ type: 'spawn', kind: 0 }); g.step(0.1); g.drainEvents(); }
  return g;
}
/** A profile at rest with carried blades (the lamp out: past the free chapters, no defeat streak, bread built). */
function atRest(coins = 50_000): Game {
  const p = defaultProfile(); Object.assign(p, { age: 1, enemyAge: 2, furthestBattle: 2, foodLevel: 5, baseLevel: 2, coins, unlocked: [true, true, true] });
  p.smithy = { next: 5, blades: [{ id: 1, chapter: 0, kind: 0 }, { id: 2, chapter: 1, kind: 0, lost: true }, { id: 3, chapter: 1, kind: 1 }, { id: 4, chapter: 2, kind: 2, lost: true }] };
  return new Game(p);
}

test('a defeat leaves two broken blades where the company fell; a tap carries one home; the next battle leaves the rest', () => {
  const g = lostBattle();
  assert.equal(g.state.phase, 'lost');
  const lying = fieldBlades(g.profile).map(b => ({ ...b }));
  assert.equal(lying.length, 2, 'a loss leaves two');
  assert.ok(lying.every(b => b.chapter === 2 && b.lost && b.x >= 90 && b.x <= 910 && [0, 1, 2].includes(b.lane)));
  assert.equal(g.dispatch({ type: 'blade-carry', id: lying[0].id }), true);
  assert.equal(blades(g.profile).length, 1); assert.equal(fieldBlades(g.profile).length, 1);
  assert.equal(g.dispatch({ type: 'blade-carry', id: lying[0].id }), false, 'carried once');
  g.dispatch({ type: 'retry' });
  assert.equal(fieldBlades(g.profile).length, 1, 'still lying on the ready field');
  g.dispatch({ type: 'start' });
  assert.equal(fieldBlades(g.profile).length, 0, 'left behind when the next battle starts');
  assert.equal(g.dispatch({ type: 'blade-carry', id: lying[1].id }), false);
});

test('a victory leaves one blade, a battle nobody fell in leaves none, and drops change nothing else', () => {
  const g = new Game(); g.dispatch({ type: 'start' });
  noteFall(g.state, { side: 'player', x: 400, lane: 1, kind: 0 }); noteFall(g.state, { side: 'player', x: 600, lane: 2, kind: 1 }); noteFall(g.state, { side: 'enemy', x: 700, lane: 0, kind: 2 });
  g.state.phase = 'won'; dropBlades(g.profile, g.state);
  assert.deepEqual(fieldBlades(g.profile).map(b => [b.x, b.kind, !!b.lost]), [[600, 1, false]], 'the fall furthest forward');
  dropBlades(g.profile, g.state); assert.equal(fieldBlades(g.profile).length, 1, 'idempotent');
  const clean = new Game(); clean.dispatch({ type: 'start' }); clean.state.phase = 'won'; const before = JSON.stringify(clean.state);
  dropBlades(clean.profile, clean.state); assert.equal(JSON.stringify(clean.state), before); assert.equal(clean.profile.smithy, undefined);
});

test('a dusk raid drops no blade', () => {
  const g = new Game(); g.dispatch({ type: 'start' }); g.state.dusk = { lamps: [] };
  noteFall(g.state, { side: 'player', x: 400, lane: 1, kind: 0 }); g.state.phase = 'lost'; dropBlades(g.profile, g.state);
  assert.equal(fieldBlades(g.profile).length, 0);
});

test('reforging costs the camp-scaled price, hangs on an empty hook, and the rest go on the wall', () => {
  const g = atRest(), price = reforgeCost(g.profile);
  assert.equal(price, 400 * 8, 'eraEconomyScale(age): 400 coins in the first camp, eight times more in each next one');
  assert.equal(reforgeCost({ age: 0 }) * 8, reforgeCost({ age: 1 }));
  assert.equal(g.dispatch({ type: 'reforge', id: 1 }), true); assert.equal(g.profile.coins, 50_000 - price);
  assert.deepEqual(hungBlades(g.profile).map(b => b.id), [1]);
  assert.equal(g.dispatch({ type: 'reforge', id: 2 }), true);
  assert.deepEqual(hungBlades(g.profile).map(b => b.id), [1], 'one weapon per troop kind: the second sword goes on the wall');
  assert.deepEqual(wallBlades(g.profile).map(b => b.id), [2]);
  assert.equal(g.dispatch({ type: 'reforge', id: 2 }), false, 'already forged');
  assert.equal(g.dispatch({ type: 'hang', id: 2 }), true, 'a sword from the wall takes the hook');
  assert.deepEqual(hungBlades(g.profile).map(b => b.id), [2]); assert.deepEqual(wallBlades(g.profile).map(b => b.id), [1]);
  assert.equal(g.dispatch({ type: 'hang', id: 2 }), true, 'tapping the hung one takes it down');
  assert.equal(hungBlades(g.profile).length, 0);
  assert.equal(g.dispatch({ type: 'hang', id: 3 }), false, 'a broken blade cannot hang');
  g.dispatch({ type: 'hang', id: 1 }); g.dispatch({ type: 'reforge', id: 3 }); g.dispatch({ type: 'reforge', id: 4 });
  assert.equal(hungBlades(g.profile).length, 3, 'at most three: one per kind');
  assert.equal(brokenBlades(g.profile).length, 0);
});

test('the forge waits while the village lamp is lit elsewhere, and refuses when coins are short or a battle runs', () => {
  const g = atRest(10_000); g.profile.lossStreak = 1; g.profile.foodLevel = 0;
  assert.equal(forgeWaits(g.profile), true);
  assert.equal(g.dispatch({ type: 'reforge', id: 1 }), false, 'bread first');
  const poor = atRest(10); assert.equal(poor.dispatch({ type: 'reforge', id: 1 }), false); assert.equal(poor.profile.coins, 10);
  const busy = atRest(); busy.dispatch({ type: 'start' }); assert.equal(busy.dispatch({ type: 'reforge', id: 1 }), false);
});

test('every temper is a sidegrade: one number better and one worse, for its own troop kind only', () => {
  for (const temper of Object.values(TEMPERS)) {
    const muls = Object.entries(temper.mul);
    assert.equal(muls.length, 2, temper.key);
    // Better means: more hp, damage, speed or range; a shorter interval.
    const better = muls.filter(([stat, m]) => stat === 'interval' ? m < 1 : m > 1).length;
    assert.equal(better, 1, `${temper.key} gains one thing and pays with another`);
  }
  assert.equal(temperOf({ kind: 0 }).key, 'heavy-edge'); assert.equal(temperOf({ kind: 0, lost: true }).key, 'light-edge');
  const g = atRest(); g.dispatch({ type: 'reforge', id: 1 });
  const sword = troopDef(g.profile, { side: 'player', age: 1, kind: 0 }), base = ERAS[1].units[0];
  assert.ok(sword.damage > base.damage && sword.interval > base.interval);
  assert.equal(troopDef(g.profile, { side: 'enemy', age: 1, kind: 0 }), base, 'the rival never carries our weapons');
  assert.equal(troopDef(g.profile, { side: 'player', age: 1, kind: 1 }), ERAS[1].units[1], 'other kinds unchanged');
  assert.equal(sword.role, base.role, 'the role still reads in the current language');
});

test('the smithy survives Move camp and saving, is normalized on load, and Start over begins without it', () => {
  const g = atRest(ERAS[1].evolveCost + 5000); g.dispatch({ type: 'reforge', id: 1 });
  assert.equal(g.dispatch({ type: 'evolve' }), true); assert.equal(blades(g.profile).length, 4);
  const loaded = decodeSave(JSON.stringify(g.profile)).profile!;
  assert.deepEqual(loaded.smithy, g.profile.smithy);
  assert.equal(startOverProfile(g.profile).smithy, undefined);
  assert.equal(normalizeSmithy({ blades: [{ id: 1, chapter: 9, kind: 0 }, { id: 2, chapter: 1, kind: 7 }] }), undefined);
  const odd = normalizeSmithy({ next: 1, blades: [{ id: 3, chapter: 1, kind: 0, forged: true, hung: true }, { id: 3, chapter: 1, kind: 1 }, { id: 4, chapter: 0, kind: 0, forged: true, hung: true }, { id: 5, chapter: 0, kind: 1, hung: true }], field: [{ id: 6, chapter: 0, kind: 2, x: 5000, lane: 1 }] })!;
  assert.deepEqual(odd.blades.map(b => [b.id, !!b.hung]), [[3, true], [4, false], [5, false]], 'unique ids, one hung per kind, only forged weapons hang');
  assert.equal(odd.field![0].x, 910); assert.equal(odd.next, 7);
  assert.equal(normalizeSmithy({ blades: Array.from({ length: 90 }, (_, i) => ({ id: i + 1, chapter: 0, kind: 0 })) })!.blades.length, SMITHY_CAP);
});

test('names come from the battle, in plain fusha; lines carry no exclamation and taps are «انقر»', () => {
  setLang('ar');
  assert.equal(weaponName({ kind: 0, chapter: 0 }), 'سيف النيران الأولى');
  assert.equal(weaponName({ kind: 1, chapter: 1 }), 'حربة مدرّجات الزيتون');
  assert.equal(weaponName({ kind: 2, chapter: 5 }), 'رمح ساحاتِ وراء الأفق', 'the genitive after a noun');
  assert.equal(brokenName({ kind: 1, chapter: 2 }), 'حربة مكسورة من حراسة الميناء');
  assert.match(fieldBladeLabel({ age: 0 }, { kind: 0, chapter: 0 }), /انقر لتحمله إلى الديار\.$/);
  assert.equal(HAKAWATI_BLADE_LINE.ar, 'السيف المكسور يعرف عن الحرب أكثر من السيف الجديد.');
  const ar = campSmithyHtml(atRest().profile);
  assert.doesNotMatch(ar, /aria-label="[^"]*<bdi/, 'no markup inside a label');
  setLang('en');
  assert.equal(weaponName({ kind: 0, chapter: 3 }), 'Sword of Lantern Quarter');
  assert.equal(temperLine({ age: 0 }, { kind: 2 }), 'Lizard Rider: arrives first, falls sooner');
  for (const line of [HAKAWATI_BLADE_LINE, NO_BLADE_LINE, FORGE_WAITS_LINE, WALL_LINE]) { assert.doesNotMatch(line.en + line.ar, /!/); assert.doesNotMatch(line.ar, /لمس/); }
});

test('Camp shows the smith only once a blade is home, as world objects: a forge and three hooks, no new panel', () => {
  setLang('en');
  assert.equal(campSmithyHtml(defaultProfile()), '');
  const g = atRest(), html = campSmithyHtml(g.profile);
  assert.match(html, /data-command="smithy-reforge" data-blade="1"/);
  assert.match(html, /Reforge · 3,200 coins/);
  assert.equal((html.match(/class="camp-smithy-hook[" ]/g) ?? []).length, 3);
  assert.doesNotMatch(html, /dialog|camp-focus/);
  Object.assign(g.profile, { lossStreak: 1, foodLevel: 0, coins: 10_000 });
  assert.match(campSmithyHtml(g.profile), /The fire waits\. Bread first, then iron\./);
  const camp = readFileSync(new URL('../src/ui/camp-screen.ts', import.meta.url), 'utf8');
  assert.match(camp, /\$\{campSmithyHtml\(p\)\}/);
});
