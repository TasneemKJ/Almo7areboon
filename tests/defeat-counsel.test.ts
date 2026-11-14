import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { setLang } from '../src/game/locale.ts';
import { compactResultsHtml } from '../src/ui/results-screen.ts';
import { campRootHtml } from '../src/ui/camp-screen.ts';

const controls = (html: string) => (html.match(/<button\b/g) || []).length;
const lostAtChapter2 = (coins: number) => { const p = defaultProfile(); Object.assign(p, { enemyAge: 1, furthestBattle: 1, coins, played: true }); const g = new Game(p); g.state.phase = 'lost'; return g; };

test('a defeat with coins to spend sends the player to the one lit Camp place instead of a bare Retry', () => {
  setLang('en');
  const g = lostAtChapter2(560), before = JSON.stringify([g.profile, g.state]);
  const html = compactResultsHtml(g.profile, g.state);
  assert.equal(controls(html), 3);
  assert.match(html, /data-command="result-counsel" data-counsel="storehouse"/);
  assert.match(html, />To the storehouse</);
  assert.match(html, /bread/);
  assert.doesNotMatch(html, /data-command="retry"/);
  assert.equal(JSON.stringify([g.profile, g.state]), before, 'reading the counsel spends nothing');
});

test('the counsel speaks Arabic first-class', () => {
  setLang('ar');
  try {
    const g = lostAtChapter2(560); g.state.playerHp = 0;
    const html = compactResultsHtml(g.profile, g.state);
    assert.match(html, /إلى المخزن/);
    assert.match(html, /الخبز/);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /[A-Za-z]{3,}/, 'no Latin words on an Arabic card');
  } finally { setLang('en'); }
});

test('with nothing affordable, or after a win, the result keeps its old choices', () => {
  setLang('en');
  const broke = lostAtChapter2(0);
  assert.match(compactResultsHtml(broke.profile, broke.state), /data-command="retry"/);
  const won = lostAtChapter2(560); won.state.phase = 'won';
  assert.doesNotMatch(compactResultsHtml(won.profile, won.state), /result-counsel/);
});

test('Camp lights only the counselled place and holds back the journal detour while something is worth doing', () => {
  setLang('en');
  const day = 20_000, p = defaultProfile(); Object.assign(p, { enemyAge: 1, furthestBattle: 1, coins: 560, played: true, dailyDay: day });
  const lit = campRootHtml(p, day);
  assert.equal((lit.match(/camp-place-counsel/g) || []).length, 1);
  assert.match(lit, /camp-place camp-place-storehouse camp-place-counsel/);
  assert.match(lit, /class="camp-places" data-counsel="storehouse"/);
  assert.match(lit, /aria-label="Storehouse\. Lit for you now\./);
  assert.match(lit, /class="camp-lamp"/, 'a village lantern hangs over the lit place');
  assert.doesNotMatch(lit, /camp-goal/, 'one obvious next action: the journal goal waits (the daily reward is claimed)');
  p.coins = 0;
  const calm = campRootHtml(p, day);
  assert.doesNotMatch(calm, /camp-place-counsel|data-counsel|camp-lamp/);
  assert.match(calm, /camp-goal/);
});

test('Camp keeps the lantern to the free chapters and never hides a ready daily reward', () => {
  setLang('en');
  const day = 20_000, p = defaultProfile(); Object.assign(p, { enemyAge: 1, furthestBattle: 1, coins: 560, played: true });
  assert.match(campRootHtml(p, day), /camp-goal/, 'a ready daily reward still shows');
  Object.assign(p, { age: 1, enemyAge: 3, furthestBattle: 3, coins: 5_000, foodLevel: 5 });
  assert.doesNotMatch(campRootHtml(p, day), /camp-lamp|data-counsel/, 'later, coins pile up: no permanent lantern');
  Object.assign(p, { foodLevel: 0 });
  assert.match(campRootHtml(p, day), /data-counsel="storehouse"/, 'a camp just moved: the lamp lights the storehouse until its first five levels of bread');
});

test('the defeat card names a cause only where it was measured (chapter 2, gate fallen); elsewhere it only points', () => {
  setLang('en');
  const g = lostAtChapter2(560); g.state.playerHp = 0;
  assert.match(compactResultsHtml(g.profile, g.state), /bread was/);
  const retreat = lostAtChapter2(560); retreat.state.playerHp = 50;
  const html = compactResultsHtml(retreat.profile, retreat.state);
  assert.doesNotMatch(html, /bread was/); assert.match(html, /To the storehouse/);
  const later = lostAtChapter2(560); later.profile.enemyAge = 4; later.state.playerHp = 0;
  assert.doesNotMatch(compactResultsHtml(later.profile, later.state), /bread was/);
});

test('inside the lit storehouse the lamp stays lit while another level is still worth it, then goes out', async () => {
  setLang('en');
  const { campFocusHtml } = await import('../src/ui/camp-screen.ts');
  const p = defaultProfile(); Object.assign(p, { enemyAge: 1, furthestBattle: 1, coins: 560, played: true });
  const g = new Game(p);
  assert.match(campFocusHtml(g, 'storehouse'), /class="camp-counsel-note"/);
  for (let i = 0; i < 4; i++) g.dispatch({ type: 'upgrade', stat: 'food' });
  assert.doesNotMatch(campFocusHtml(g, 'storehouse'), /camp-counsel-note/);
});
