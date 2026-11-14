import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { campCounsel, counselAction, litCounsel } from '../src/game/counsel.ts';
import { easesLoneCompany, encounterForAge, rallyLevel, rallyPower, RALLY_FOOD, LONE_COMPANY_DELAY } from '../src/game/encounters.ts';
import { compactResultsHtml } from '../src/ui/results-screen.ts';
import { campRootHtml, counselActLabel } from '../src/ui/camp-screen.ts';

const chapterTwo = (fields: Record<string, unknown> = {}) => Object.assign(defaultProfile(), { enemyAge: 1, furthestBattle: 1, wins: 1, played: true }, fields);
const primaries = (html: string) => [...html.matchAll(/<button\b[^>]*data-primary="true"[^>]*>/g)].map(m => m[0]);

test('after a defeat with coins, the Regroup card has one primary action and it leads to the lit place', () => {
  const game = new Game(chapterTwo({ coins: 560 }));
  game.dispatch({ type: 'start' }); game.dispatch({ type: 'retreat' });
  const html = compactResultsHtml(game.profile, game.state, false, true), primary = primaries(html);
  assert.equal(primary.length, 1);
  assert.match(primary[0], /data-command="result-counsel"/); assert.match(primary[0], /data-counsel="storehouse"/);
});

test('the lit camp place carries its act in the world; one tap buys exactly what the place would; Battle is primary once nothing is lit', () => {
  const p = chapterTwo({ coins: 560 }), html = campRootHtml(p), primary = primaries(html);
  assert.equal(primary.length, 1); assert.match(primary[0], /data-command="camp-counsel-act"/); assert.match(html, /Improve food · 50 coins/);
  assert.match(html, /class="camp-counsel-act camp-counsel-act-storehouse"/);
  assert.deepEqual(counselAction({ station: 'storehouse' }), { type: 'upgrade', stat: 'food' });
  assert.deepEqual(counselAction({ station: 'company', kind: 1 }), { type: 'unlock', kind: 1 });
  assert.match(counselActLabel(chapterTwo({ coins: 400, foodLevel: 5, baseLevel: 2 }), { station: 'company', kind: 1 }), /Invite the .+ · 150 coins/);
  const empty = campRootHtml(chapterTwo({ coins: 0 }));
  assert.deepEqual(primaries(empty).map(b => /camp-battle/.test(b)), [true]);
  assert.doesNotMatch(empty, /camp-counsel-act/);
  const later = campRootHtml(chapterTwo({ coins: 560, furthestBattle: 2 }));
  assert.doesNotMatch(later, /camp-counsel-act/, 'the in-world act is for the free chapters, like the lamp');
});

test('the counsel spends bread first: five levels before the gate or a new troop', () => {
  assert.deepEqual(campCounsel(chapterTwo({ coins: 2000, foodLevel: 4 })), { station: 'storehouse' });
  assert.deepEqual(campCounsel(chapterTwo({ coins: 2000, foodLevel: 5 })), { station: 'gate' });
});

test('battle 2 eases only for a lone company on the first timeline, read when the battle starts', () => {
  assert.equal(easesLoneCompany(chapterTwo()), true);
  assert.equal(easesLoneCompany(chapterTwo({ unlocked: [true, true, false] })), false, 'a second troop meets the full chapter');
  assert.equal(easesLoneCompany(chapterTwo({ enemyAge: 0 })), false, 'chapter 1 is unchanged');
  assert.equal(easesLoneCompany(chapterTwo({ enemyAge: 2 })), false);
  assert.equal(easesLoneCompany(chapterTwo({ timeline: 2 })), false);
  const full = encounterForAge(1).waves[1].time;
  const lone = new Game(chapterTwo()); lone.dispatch({ type: 'start' });
  assert.equal(lone.waveStatus().preview?.nextIn, Math.round(encounterForAge(1).waves[0].time * LONE_COMPANY_DELAY * 10) / 10);
  // Inviting a troop in Camp after Retry: the battle built at Retry is rebuilt at the start, so it is the full chapter.
  const invited = new Game(chapterTwo({ coins: 500 })); assert.ok(invited.dispatch({ type: 'unlock', kind: 1 })); invited.dispatch({ type: 'start' });
  assert.equal(invited.waveStatus().preview?.nextIn, encounterForAge(1).waves[0].time);
  assert.ok(full > 0);
});

test('the pacing director: two defeats in a row quietly thin and weaken the next battle; a victory ends it; old saves load', () => {
  const game = new Game(chapterTwo({ unlocked: [true, true, false] }));
  const startFood = () => game.state.food;
  game.dispatch({ type: 'start' }); game.dispatch({ type: 'retreat' }); assert.equal(game.profile.lossStreak, undefined, 'leaving is no fallen gate');
  game.dispatch({ type: 'retry' });
  for (let loss = 1; loss <= 4; loss++) {
    game.dispatch({ type: 'start' }); game.state.playerHp = 0; game.step(1 / 60); assert.equal(game.state.phase, 'lost');
    assert.equal(game.profile.lossStreak, loss);
    game.dispatch({ type: 'retry' });
    assert.equal(rallyLevel(game.profile), Math.min(3, Math.max(0, loss - 1)));
  }
  assert.equal(startFood(), new Game(chapterTwo({ unlocked: [true, true, false] })).state.food + RALLY_FOOD);
  assert.ok(Math.abs(rallyPower(game.profile) - .7) < 1e-9);
  game.dispatch({ type: 'start' }); game.state.enemyHp = 0; game.step(1 / 60);
  assert.equal(game.state.phase, 'won'); assert.equal(game.profile.lossStreak, undefined);
  assert.equal(rallyLevel({}), 0); assert.equal(rallyLevel({ lossStreak: 1 }), 0); assert.equal(rallyPower({}), 1);
  assert.equal(decodeSave(JSON.stringify(defaultProfile())).profile?.lossStreak, undefined);
  assert.equal(decodeSave(JSON.stringify({ ...defaultProfile(), lossStreak: 3 })).profile?.lossStreak, 3);
  assert.equal(decodeSave(JSON.stringify({ ...defaultProfile(), lossStreak: 'x' })).profile?.lossStreak, undefined);
});

test('later chapters light the counsel only after a defeat, and a defeat with coins to move camp makes Move camp the primary', () => {
  const later = chapterTwo({ enemyAge: 2, furthestBattle: 2, coins: 600 });
  assert.equal(litCounsel(later), null, 'no lantern that never goes out');
  assert.deepEqual(litCounsel({ ...later, lossStreak: 1 }), { station: 'storehouse' });
  const game = new Game(chapterTwo({ enemyAge: 2, furthestBattle: 2, coins: 3000 }));
  game.dispatch({ type: 'start' }); game.state.playerHp = 0; game.step(1 / 60);
  const primary = primaries(compactResultsHtml(game.profile, game.state, false, true));
  assert.equal(primary.length, 1); assert.match(primary[0], /data-command="evolve"/);
});
