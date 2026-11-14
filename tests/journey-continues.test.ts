import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { setLang } from '../src/game/locale.ts';
import { compactResultsHtml } from '../src/ui/results-screen.ts';

// The 1.0 loop: after the last free chapter's win a free player's Continue opened Full Journey, Close returned to the
// same Continue, forever. The free path must be the primary; the sheet opens only on purpose. Since 1.3 the last free
// chapter is chapter 3 (the Harbor Watch).
const wonChapter3 = () => { const p = defaultProfile(); Object.assign(p, { age: 1, enemyAge: 2, furthestBattle: 2, played: true, wins: 3 }); const g = new Game(p); g.state.phase = 'won'; return g; };

test('a free player who won chapter 3 is sent to Camp, with the next chapter named as continuing in the Full Journey', () => {
  setLang('en');
  const g = wonChapter3(), html = compactResultsHtml(g.profile, g.state, false, false);
  assert.match(html, /<button class="big-button green" data-command="result-camp" data-primary="true">To Camp</);
  assert.doesNotMatch(html, /data-command="next"/, 'no Continue that can only open the sheet');
  assert.match(html, /Lantern Quarter continues in the Full Journey/);
  assert.match(html, /class="result-journey" data-command="full-journey"/, 'the sheet is one quiet tap away, on purpose');
});

test('the same card speaks Arabic first', () => {
  setLang('ar');
  try {
    const g = wonChapter3(), html = compactResultsHtml(g.profile, g.state, false, false);
    assert.match(html, /إلى المخيّم/);
    assert.match(html, /تمضي الرحلة إلى حيّ الفوانيس في «الرحلة كاملة»/);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /[A-Za-z]{3,}/);
  } finally { setLang('en'); }
});

test('with the journey open (owned, or on the web) Continue stays as it was', () => {
  setLang('en');
  const g = wonChapter3();
  assert.match(compactResultsHtml(g.profile, g.state, false, true), /data-command="next"/);
  assert.match(compactResultsHtml(g.profile, g.state), /data-command="next"/, 'off the app nothing is locked');
  for (const chapter of [0, 1]) {
    const won = wonChapter3(); won.profile.enemyAge = chapter; won.profile.furthestBattle = chapter; won.profile.age = 0;
    assert.match(compactResultsHtml(won.profile, won.state, false, false), /data-command="next"/, `chapter ${chapter + 1} -> ${chapter + 2} is free`);
  }
});
