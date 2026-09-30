import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { currentSealCount, isLegacyChoice, legacyCandidateRank, legacyEffects, normalizeLegacy, prestigePreview } from '../src/game/prestige.ts';

const choices = ['hearth','watch','stillness'] as const;
function completed(seals=0) {
  const p=defaultProfile();p.enemyAge=5;p.furthestBattle=5;
  p.pendingVictory={settlement:'legacy',timeline:1,battle:5,earned:123,seconds:40,playerHp:100};
  for(let i=0;i<seals;i++)p.mastery.chapters[Math.floor(i/3)].earnedMask|=1<<(i%3);
  return new Game(p);
}
test('current masks alone count seals at the finite rank boundaries',()=>{
  for(const n of [0,11,12,17,18]) {const g=completed(n);assert.equal(currentSealCount(g.profile),n);assert.equal(legacyCandidateRank(n),n>=18?3:n>=12?2:1);}
  const p=completed(18).profile;p.mastery.timeline=2;assert.equal(currentSealCount(p),0);p.mastery.timeline=1;p.mastery.chapters[0].earnedMask=8;assert.equal(currentSealCount(p),15);
});
test('every rank applies exactly one bounded preparation effect',()=>{
  for(const rank of [0,1,2,3] as const)for(const selected of choices)assert.deepEqual(legacyEffects({rank,selected}),{
    startingFood:selected==='hearth'?6+2*rank:6,gateFactor:selected==='watch'?1+0.1*rank:1,freezeSeconds:selected==='stillness'?7+rank:7,
  });
  assert.deepEqual(legacyEffects({rank:3,selected:'watch'}),{startingFood:6,gateFactor:1.30,freezeSeconds:7});
});
test('normalization retains valid rank independently and never manufactures rank three',()=>{
  for(const timeline of [1,2,1000])for(const version of [1,2,3,4]) {
    const input={rank:3,selected:'bad'};const before=structuredClone(input);
    assert.deepEqual(normalizeLegacy(input,timeline,version),{rank:version===4?3:timeline>1?1:0,selected:'hearth'});assert.deepEqual(input,before);
  }
  for(const rank of [undefined,NaN,Infinity,-1,4,3.5,1e99,'3'])assert.deepEqual(normalizeLegacy({rank,selected:'watch'},2,4),{rank:1,selected:'watch'});
  for(const c of choices)assert.equal(isLegacyChoice(c),true);for(const c of [null,undefined,'bad',1])assert.equal(isLegacyChoice(c),false);
});
test('preview is detached, cap truthful, monotone and uses absolute timeline factors',()=>{
  const g=completed(12);g.profile.gems=9_999_950;const before=JSON.stringify({profile:g.profile,state:g.state});
  const preview=prestigePreview(g.profile,g.state,'watch')!;
  assert.equal(preview.expectedTimeline,1);assert.equal(preview.nextTimeline,2);assert.equal(preview.currentEnemyFactor,1);assert.equal(preview.nextEnemyFactor,1.22);
  assert.equal(preview.rankBefore,0);assert.equal(preview.rankAfter,2);assert.equal(preview.earnedSeals,12);assert.deepEqual(preview.nextRank,{rank:3,remainingSeals:6});assert.equal(preview.timelineGemCredit,50);assert.equal(preview.gemsAfter,10_000_000);assert.equal(JSON.stringify({profile:g.profile,state:g.state}),before);
  g.profile.legacy={rank:3,selected:'stillness'};g.profile.gems=10_000_000;g.profile.timeline=9;g.profile.mastery.timeline=9;
  const later=prestigePreview(g.profile,g.state,'hearth')!;assert.equal(later.currentEnemyFactor,2.76);assert.equal(later.nextEnemyFactor,2.98);assert.equal(later.timelineGemCredit,0);assert.equal(later.rankAfter,3);assert.equal(later.nextRank,null);
  assert.deepEqual(prestigePreview(completed(0).profile,completed(0).state,'hearth')?.nextRank,{rank:2,remainingSeals:12});
});
test('preview cannot authorize rank without eligible final advancement',()=>{
  const g=completed(18);g.state.phase='running';assert.equal(prestigePreview(g.profile,g.state,'watch'),null);g.state.phase='ready';g.profile.enemyAge=4;assert.equal(prestigePreview(g.profile,g.state,'watch'),null);g.profile.enemyAge=5;g.profile.timeline=1000;assert.equal(prestigePreview(g.profile,g.state,'watch'),null);assert.equal(prestigePreview(completed().profile,completed().state,'bad' as never),null);
});

test('schemas one through four normalize and round trip without wallet settlement',async()=>{
  const {decodeSave,saveProfile,loadProfile,MAX_SAVE_CHARS}=await import('../src/game/save.ts');
  const source=completed(18).profile;Object.assign(source,{coins:1234,gems:5678,dailyDay:20726,dailyStreak:3,kills:31,wins:7,deployed:90,claimed:['first-blood'],summonCount:4,summonSeed:12345,legacy:{rank:3,selected:'watch'}});
  for(const version of [1,2,3,4])for(const timeline of [1,2]) {
    const raw={...source,version,timeline,mastery:{...source.mastery,timeline},pendingVictory:{...source.pendingVictory,timeline}};
    const p=decodeSave(JSON.stringify(raw)).profile!;assert.equal(p.version,5);assert.equal(p.coins,1234);assert.equal(p.gems,5678);assert.equal(p.dailyDay,20726);assert.equal(p.dailyStreak,3);assert.equal(p.summonSeed,12345);assert.equal(p.wins,7);
    assert.deepEqual(p.legacy,{rank:version===4?3:timeline>1?1:0,selected:version===4?'watch':'hearth'});assert.equal(currentSealCount(p),version>=3?18:0);
    let bytes='';assert.equal(saveProfile(p,{setItem:(_k,v)=>{bytes=v;}}),true);assert.deepEqual(loadProfile({getItem:()=>bytes}),p);
  }
  for(const rank of [undefined,NaN,Infinity,1e99,3.5,-1,4])assert.deepEqual(decodeSave(JSON.stringify({...source,legacy:{rank,selected:'stillness'}})).profile!.legacy,{rank:0,selected:'stillness'});
  for(const bests of [{bestSeconds:'bad',bestGateDamage:12},{bestSeconds:20,bestGateDamage:'bad'},{bestSeconds:'bad',bestGateDamage:'bad'}]) {
    const raw={...source,legacy:{rank:3,selected:'bad'},mastery:{timeline:1,chapters:source.mastery.chapters.map(r=>({...r,...bests}))}};
    const p=decodeSave(JSON.stringify(raw)).profile!;assert.deepEqual(p.legacy,{rank:3,selected:'hearth'});assert.equal(currentSealCount(p),18);assert.equal(currentSealCount(loadProfile({getItem:()=>JSON.stringify(p)})),18);
  }
  const capped={...source,coins:1e9,gems:1e7,foodLevel:100,baseLevel:100,cards:Array(30).fill(1000),summonCount:1e9,kills:1e9,wins:1e9,deployed:1e9};assert.ok(JSON.stringify(decodeSave(JSON.stringify(capped)).profile).length<MAX_SAVE_CHARS);
});
test('future schema six protects both primary and backup bytes',async()=>{
  const {SAVE_KEY,BACKUP_KEY,decodeSave,loadProfileWithStatus,saveProfile}=await import('../src/game/save.ts');
  for(const key of [SAVE_KEY,BACKUP_KEY]) {
    const values=new Map<string,string>([[key,JSON.stringify({...defaultProfile(),version:6})]]),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)};
    const before=[...values];assert.equal(decodeSave(storage.getItem(key)!).problem,'unsupported');assert.equal(loadProfileWithStatus(storage).status,'unsupported');assert.equal(saveProfile(defaultProfile(),storage),false);assert.deepEqual([...values],before);
  }
});
