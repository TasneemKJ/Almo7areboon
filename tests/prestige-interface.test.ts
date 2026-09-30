import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { prestigePreview } from '../src/game/prestige.ts';
import { resultsHtml } from '../src/ui/results-screen.ts';
import { battleSelectionHtml } from '../src/ui/progression-screen.ts';
import { evolutionScreenHtml } from '../src/ui/evolution-screen.ts';

async function presentation() {
  const path='../src/ui/prestige-presentation.ts';
  const module=await import(path).catch(()=>null);
  assert.ok(module,'the authoritative prestige preview needs a pure presentation surface');
  return module;
}
function prepared(seals=12, rank:0|1|2|3=1, gems=9999950) {
  const p=defaultProfile();Object.assign(p,{timeline:3,enemyAge:5,furthestBattle:5,age:4,coins:4321,foodLevel:4,baseLevel:2,unlocked:[true,true,true],gems,legacy:{rank,selected:'hearth'}});
  p.mastery.timeline=3;
  let remaining=seals;
  for(const record of p.mastery.chapters){const count=Math.min(3,remaining);record.earnedMask=[0,1,3,7][count];record.bestSeconds=count?80:null;record.bestGateDamage=count?12:null;remaining-=count;}
  // Preview eligibility, independent of whether the fixture filled chapter six.
  p.pendingVictory={settlement:'legacy',timeline:3,battle:5,earned:4321,seconds:80,playerHp:100};
  return new Game(p);
}
test('preview renders exact producer outputs and separates current from next effects',async()=>{
  const ui=await presentation(),g=prepared(),before=JSON.stringify(g.profile);
  const preview=prestigePreview(g.profile,g.state,'stillness')!;
  const html=ui.prestigeDialogHtml(g.profile,preview);
  for(const text of ['Timeline 3 → 4','Enemy strength: ×1.44 → ×1.66','12 / 18 seals','Rank 1 → Rank 2','6 more seals for rank 3','Current legacy: Hearth','Next legacy: Stillness','Freeze: 9 seconds','Timeline credit: 50 gems','Gems: 9,999,950 → 10,000,000','Begin timeline 4','Keep exploring this timeline','change your choice before battle'])assert.ok(html.includes(text),text);
  assert.equal(JSON.stringify(g.profile),before,'presentation is read only');
  assert.doesNotMatch(html,/victory bonus|Mastery credited|claim.*reward/i);
});
test('reset table discloses every discarded field and permanent retained field',async()=>{
  const ui=await presentation(),g=prepared(),html=ui.prestigeDialogHtml(g.profile,prestigePreview(g.profile,g.state,'hearth')!);
  for(const text of ['Coins: 4,321 → 0','Army: first age','Selected chapter: 1','Unlocked chapters: chapter 1 only','Food upgrade: level 4 → 0','Base upgrade: level 2 → 0','Ranged and heavy troops: locked','Six chapter records: seals and both bests cleared','Cards, copies and card bonuses','Gems and permanent legacy rank','Claimed quests and lifetime totals','Summon count and seed','Daily claim and streak','Sound, speed and motion preferences'])assert.ok(html.includes(text),text);
});
test('preview has one native labeled choice group with associated effect descriptions',async()=>{
  const ui=await presentation(),g=prepared(),html=ui.prestigeDialogHtml(g.profile,prestigePreview(g.profile,g.state,'watch')!);
  assert.equal((html.match(/type="radio"/g)??[]).length,3);
  for(const choice of ['hearth','watch','stillness']){
    assert.match(html,new RegExp(`id="prestige-${choice}"[^>]*name="prestige-legacy"[^>]*value="${choice}"[^>]*aria-describedby="prestige-${choice}-description"`));
    assert.match(html,new RegExp(`for="prestige-${choice}"`));assert.match(html,new RegExp(`id="prestige-${choice}-description"`));
  }
  assert.match(html,/value="watch"[^>]* checked/);assert.equal((html.match(/ checked/g)??[]).length,1);
  assert.match(html,/<fieldset/);assert.match(html,/<legend>Choose one legacy/);
});
test('rank three remains complete and the capped zero credit is rendered honestly',async()=>{
  const ui=await presentation(),g=prepared(6,3,10000000),html=ui.prestigeDialogHtml(g.profile,prestigePreview(g.profile,g.state,'stillness')!);
  assert.match(html,/Rank 3 → Rank 3/);assert.match(html,/Rank 3 complete/);assert.match(html,/Timeline credit: 0 gems/);assert.match(html,/Gems: 10,000,000 → 10,000,000/);
  assert.match(html,/Freeze: 10 seconds/);assert.doesNotMatch(html,/rank 4|more seals/i);
});
test('preparation offers ready earned choices only and reads current actual effects in other phases',async()=>{
  const ui=await presentation(),g=prepared();g.dispatch({type:'retry'});
  // Legacy receipt cannot retry; construct a ready copy without inventing a win.
  g.profile.pendingVictory=null;const ready=new Game(g.profile);
  for(const [choice,copy] of [['hearth','Starting food: 8'],['watch','Gate factor: ×1.1'],['stillness','Freeze: 8 seconds']] as const){
    assert.equal(ready.dispatch({type:'select-legacy',legacy:choice}),true);
    const html=ui.legacyPreparationHtml(ready.profile,ready.state);assert.match(html,/name="ready-legacy"/);assert.ok(html.includes(copy));assert.ok(evolutionScreenHtml(ready.profile,ready.state).includes('name="ready-legacy"'));
  }
  for(const phase of ['running','won','lost'] as const){ready.state.phase=phase;const html=ui.legacyPreparationHtml(ready.profile,ready.state);assert.doesNotMatch(html,/type="radio"|data-command="select-legacy"/);assert.match(html,/Current legacy: Stillness/);assert.match(html,/Freeze: 8 seconds/);}
  const fresh=new Game();assert.doesNotMatch(ui.legacyPreparationHtml(fresh.profile,fresh.state),/type="radio"/);assert.match(ui.legacyPreparationHtml(fresh.profile,fresh.state),/No earned legacy yet/);
});
test('terminal preview cannot offer a reset while final result and cleared picker direct to preview',async()=>{
  const ui=await presentation(),g=prepared(),preview=prestigePreview(g.profile,g.state,'watch')!;
  assert.match(resultsHtml(g.profile,g.state),/Preview the next timeline/);
  g.profile.pendingVictory=null;g.profile.mastery.chapters[5].earnedMask=1;const ready=new Game(g.profile);
  assert.match(battleSelectionHtml(ready.profile,ready.state),/Preview the next timeline/);
  ready.state.phase='lost';assert.match(resultsHtml(ready.profile,ready.state),/Preview the next timeline/);assert.doesNotMatch(resultsHtml(ready.profile,ready.state),/Timeline complete!/);
  g.profile.timeline=1000;g.profile.mastery.timeline=1000;
  assert.doesNotMatch(ui.prestigeDialogHtml(g.profile,preview),/confirm-prestige|type="radio"|Begin timeline/);
  assert.doesNotMatch(resultsHtml(g.profile,g.state),/data-command="next"|confirm-prestige/);
  g.profile.age=5;assert.doesNotMatch(evolutionScreenHtml(g.profile,g.state),/begin a new timeline/i);assert.match(evolutionScreenHtml(g.profile,g.state),/Timeline limit reached/);
});
