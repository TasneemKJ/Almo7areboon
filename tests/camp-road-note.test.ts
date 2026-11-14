import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLang } from '../src/game/locale.ts';
import { defaultProfile } from '../src/game/save.ts';
import { campRoadNote, campRootHtml } from '../src/ui/camp-screen.ts';
import { createAppBridge, evolutionNeedsFullJourney, FREE_AGES } from '../src/ui/app-bridge.ts';
import { journeyPathHtml } from '../src/ui/entry-screen.ts';
import type { Profile } from '../src/game/types.ts';

// 1.3: chapter 3 is free. A free player must see the wall coming: once the company reaches the last free chapter,
// Camp's footer line (the calm line above Battle) names what Full Journey opens. Not a dialog, nothing to tap.
const free = { lit: false, inApp: true, journey: false }, owned = { lit: false, inApp: true, journey: true }, web = { lit: false, inApp: false };
const at = (age: number, enemyAge: number, furthestBattle: number): Profile => Object.assign(defaultProfile(), { age, enemyAge, furthestBattle, wins: furthestBattle });
const footer = (html: string) => html.match(/<footer class="camp-footer">([\s\S]*?)<div>/)![1];

test('the line appears in chapter 3, before chapter 3 is won, and names the three chapters Full Journey opens', () => {
  setLang('en');
  const line = campRoadNote(at(1, 2, 2), free);
  assert.equal(line, 'Harbor Watch is the last free chapter. Full Journey opens the three after it, and the harder timeline.');
  assert.match(footer(campRootHtml(at(1, 2, 2), 1, free)), /<p class="camp-road-note">Harbor Watch is the last free chapter\./);
  assert.doesNotMatch(footer(campRootHtml(at(1, 2, 2), 1, free)), /Battle starts when you choose Battle/, 'one calm line, not two');
  assert.doesNotMatch(campRootHtml(at(1, 2, 2), 1, free), /data-command="full-journey"|class="dialog/, 'nothing to tap, no popup');
});

test('after chapter 3 is won the line says the free chapters stay and what opens next', () => {
  setLang('en');
  assert.equal(campRoadNote(at(2, 2, 3), free), 'The free chapters stay yours to replay. Full Journey opens Lantern Quarter and the two chapters after it.');
});

test('a held save with a paid army or a later timeline gets no line: it has no free chapter to replay', () => {
  assert.equal(campRoadNote(at(3, 3, 4), free), '');
  assert.equal(campRoadNote({ ...at(0, 0, 0), timeline: 2 }, free), '');
  assert.notEqual(campRoadNote(at(1, 3, 3), free), '', 'a free army whose chosen battle is paid can still step back');
});

test('earlier, for owners and on the web, Camp keeps its usual line', () => {
  for (const [p, store] of [[at(0, 0, 0), free], [at(0, 1, 1), free], [at(1, 2, 2), owned], [at(2, 2, 3), web], [at(1, 2, 2), { lit: false, inApp: true }]] as const) {
    assert.equal(campRoadNote(p, store), '');
    assert.match(footer(campRootHtml(p, 1, store)), /Battle starts when you choose Battle/);
  }
});

test('the line is up in every Camp state from which a free player can meet a lock', () => {
  const bridge = createAppBridge({ webkit: { messageHandlers: { almo7areboon: { postMessage: () => {} } } }, __almoAppBoot: { owned: {} } });
  let checked = 0;
  for (let age = 0; age < FREE_AGES; age++) for (let enemyAge = age; enemyAge < FREE_AGES; enemyAge++) for (let furthest = enemyAge; furthest <= FREE_AGES; furthest++) {
    // The locks a free player can reach from here: Move camp into a paid army (The Road, the result details), or a
    // chapter past the free ones on record (Continue, the battle list, the storybook routes).
    const lockAhead = evolutionNeedsFullJourney(age, bridge) || furthest >= FREE_AGES;
    if (!lockAhead) continue;
    assert.notEqual(campRoadNote(at(age, enemyAge, furthest), free), '', `army ${age}, chapter ${enemyAge}, furthest ${furthest}`);
    checked++;
  }
  assert.ok(checked >= 3);
  // The entry's journey path names the free scope from the first win, as it did since 1.0.
  assert.match(journeyPathHtml(2, true), /Chapters 1–3 free · 4–6 with Full Journey/);
});

test('in Arabic the line is plain fusha, all Arabic, with no word of the root ل-م-س and no exclamation', () => {
  setLang('ar');
  try {
    const before = campRoadNote(at(1, 2, 2), free), after = campRoadNote(at(2, 2, 3), free);
    assert.equal(before, 'حراسة الميناء آخر الفصول المجّانية. و«الرحلة كاملة» تفتح الفصول الثلاثة التي بعدها، والخطّ الزمني الأصعب.');
    assert.equal(after, 'الفصول المجّانية باقية لك تعيدها متى شئت. و«الرحلة كاملة» تفتح حيّ الفوانيس والفصلين اللذين يليانه.');
    for (const line of [before, after]) { assert.doesNotMatch(line, /[A-Za-z]|!|لمس|المس|لامس|ملموس/); }
    const path = journeyPathHtml(0, true).replace(/<bdi[^>]*>[^<]*<\/bdi>/g, '#').replace(/<[^>]+>/g, ' ');
    assert.match(path, /الفصول # مجّاناً · # مع الرحلة كاملة/, 'three free chapters take the plural, not the dual');
  } finally { setLang('en'); }
});

test('Camp redraws the line when the store answers (ownership is part of the render key)', () => {
  const nav = readFileSync(new URL('../src/app/navigation.ts', import.meta.url), 'utf8');
  assert.match(nav, /store=\{lit:lamplighterWalks\(\),inApp:almoApp\.inApp,journey:ownsFullJourney\(\)\},key=JSON\.stringify\(\[p\.age,p\.enemyAge,p\.furthestBattle,[^\n]*store,/);
});
