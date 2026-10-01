import test from 'node:test';
import assert from 'node:assert/strict';
import { createMastery, normalizeMastery, masteryEligibleMask, masteryReward, masteryAward, chapterMastery, masteryObjectiveProgress, advanceStatus, canRetry } from '../src/game/mastery.ts';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';

const won = () => { const state = new Game().state; state.phase = 'won'; return state; };
test('six independent winning objectives have inclusive boundaries and actual gate damage', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const s = won(); s.time = 75; s.stats.deployedByKind = [1,1,1]; s.stats.skillsCast = 1; s.stats.maxFreezeTargets = 3; s.stats.meteorKills = 3; s.stats.deployed = 18;
    assert.equal(masteryEligibleMask(chapter,s),7);
    s.stats.gateDamageTaken = .01; assert.equal(masteryEligibleMask(chapter,s),5);
    s.phase = 'lost'; assert.equal(masteryEligibleMask(chapter,s),0); s.phase = 'running'; assert.equal(masteryEligibleMask(chapter,s),0);
    s.phase = 'won'; s.stats.gateDamageTaken = 0;
    if (chapter === 0) s.time = 75.001;
    if (chapter === 1) s.stats.deployedByKind[2] = 0;
    if (chapter === 2) s.stats.skillsCast = 2;
    if (chapter === 3) s.stats.maxFreezeTargets = 2;
    if (chapter === 4) s.stats.meteorKills = 2;
    if (chapter === 5) s.stats.deployed = 19;
    assert.equal(masteryEligibleMask(chapter,s),3);
  }
  assert.equal(masteryEligibleMask(6,won()),0);
});
test('fixed rewards, new bits, actual cap credits and detached best records are pure', () => {
  assert.deepEqual(masteryReward(0,7),{coins:300,gems:50}); assert.deepEqual(masteryReward(5,7),{coins:9830400,gems:50});
  for (const mask of [-1,8,1.5,NaN]) assert.deepEqual(masteryReward(0,mask),{coins:0,gems:0});
  const p = defaultProfile(), s = won(); p.cards.fill(100); const before = structuredClone(p);
  const award = masteryAward(p,s); assert.equal(award.coins,300); assert.equal(award.gems,50); assert.deepEqual(p,before);
  p.mastery.chapters[0] = award.record; assert.equal(masteryAward(p,s).newMask,0);
  p.mastery.chapters[0].earnedMask = 5; assert.deepEqual(masteryAward(p,s),{record:{earnedMask:7,bestSeconds:0,bestGateDamage:0},eligibleMask:7,newMask:2,coins:50,gems:15});
  p.coins = 1e9-3; p.gems = 1e7-2; const capped = masteryAward(p,s); assert.equal(capped.coins,3); assert.equal(capped.gems,2); assert.equal(capped.record.earnedMask,7);
  const view = chapterMastery(p,0); view.record.earnedMask = 0; assert.equal(p.mastery.chapters[0].earnedMask,5); assert.equal(view.remainingCoins,50); assert.equal(masteryObjectiveProgress(1,s).unit,'roles');
});
test('bounded current timeline records retain paid masks independently of descriptive bests', () => {
  const value = {timeline:2,chapters:[{earnedMask:7,bestSeconds:'bad',bestGateDamage:12},{earnedMask:3,bestSeconds:24,bestGateDamage:-1}]};
  const normalized = normalizeMastery(value,2); assert.equal(normalized.chapters.length,6);
  assert.deepEqual(normalized.chapters[0],{earnedMask:7,bestSeconds:null,bestGateDamage:12}); assert.deepEqual(normalized.chapters[1],{earnedMask:3,bestSeconds:24,bestGateDamage:null});
  assert.deepEqual(normalizeMastery(value,1),createMastery(1));
});
test('continuation follows selected Clear with legacy Continue-first and terminal retry exception', () => {
  const p = defaultProfile(); p.furthestBattle = 5; p.enemyAge = 1;
  for (const phase of ['ready','lost'] as const) { assert.equal(advanceStatus(p,{phase}).allowed,false); p.mastery.chapters[1].earnedMask = 1; assert.deepEqual(advanceStatus(p,{phase}),{allowed:true,reason:'available',target:'battle',nextBattle:2}); p.mastery.chapters[1].earnedMask = 0; }
  assert.equal(advanceStatus(p,{phase:'won'}).allowed,true); assert.equal(canRetry(p,{phase:'won'}),false); assert.equal(canRetry(p,{phase:'lost'}),true);
  p.mastery.chapters[1].earnedMask = 1; assert.equal(canRetry(p,{phase:'won'}),true); assert.equal(advanceStatus(p,{phase:'running'}).reason,'running'); assert.equal(canRetry(p,{phase:'running'}),false);
  p.mastery.timeline = 2; assert.equal(advanceStatus(p,{phase:'ready'}).allowed,false);
  p.enemyAge = 5; p.timeline = 1000; assert.equal(advanceStatus(p,{phase:'won'}).reason,'complete'); assert.equal(canRetry(p,{phase:'won'}),true);
  p.enemyAge = NaN; assert.equal(advanceStatus(p,{phase:'won'}).reason,'invalid');
});
test('schema 3 migration preserves paid masks and validates receipts without paying on load', () => {
  const p = defaultProfile(); assert.equal(p.version,5); p.mastery.chapters[0] = {earnedMask:7,bestSeconds:null,bestGateDamage:12};
  const raw = {...p,version:3,mastery:{timeline:1,chapters:[{earnedMask:7,bestSeconds:'bad',bestGateDamage:12}]}, pendingVictory:{timeline:1,battle:0,earned:560,seconds:50,playerHp:180,settlement:'mastery-v1',eligibleMask:7,newMask:7,masteryCoins:300,masteryGems:50}};
  const loaded = decodeSave(JSON.stringify(raw)).profile!; assert.equal(loaded.mastery.chapters[0].earnedMask,7); assert.equal(loaded.pendingVictory?.settlement,'mastery-v1'); assert.equal(loaded.coins,p.coins);
  raw.pendingVictory.newMask = 8; assert.equal(decodeSave(JSON.stringify(raw)).profile!.pendingVictory?.settlement,'legacy');
  for (const version of [1,2]) { const old = decodeSave(JSON.stringify({...p,version,pendingVictory:raw.pendingVictory})).profile!; assert.deepEqual(old.mastery,createMastery(1)); assert.equal(old.pendingVictory?.settlement,'legacy'); }
  assert.equal(decodeSave(JSON.stringify({...p,version:6})).problem,'unsupported');
});
