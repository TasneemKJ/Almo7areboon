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
    const html = compactResultsHtml(lostAtChapter2(560).profile, lostAtChapter2(560).state);
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
  const p = defaultProfile(); Object.assign(p, { enemyAge: 1, furthestBattle: 1, coins: 560, played: true });
  const day = 20_000, lit = campRootHtml(p, day);
  assert.equal((lit.match(/camp-place-counsel/g) || []).length, 1);
  assert.match(lit, /camp-place camp-place-storehouse camp-place-counsel/);
  assert.match(lit, /class="camp-places" data-counsel="storehouse"/);
  assert.match(lit, /aria-label="Storehouse\. Lit for you now\./);
  assert.match(lit, /class="camp-lamp"/, 'a village lantern hangs over the lit place');
  assert.doesNotMatch(lit, /camp-goal/, 'one obvious next action: the daily detour waits');
  p.coins = 0;
  const calm = campRootHtml(p, day);
  assert.doesNotMatch(calm, /camp-place-counsel|data-counsel|camp-lamp/);
  assert.match(calm, /camp-goal/);
});
