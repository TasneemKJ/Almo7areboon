import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, loadProfileWithStatus, saveProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { drawCard, availableSummonOdds, cardBonuses } from '../src/game/cards.ts';
import { readFileSync } from 'node:fs';

test('a partially fillable pack is rolled back as one transaction',()=>{
 const p=defaultProfile();p.cards.fill(1000);p.cards[0]=995;p.summonCount=1000;p.gems=10000;
 const g=new Game(p),before=JSON.stringify(g.profile);assert.equal(g.dispatch({type:'summon',count:10}),false);assert.equal(JSON.stringify(g.profile),before);
 assert.equal(g.dispatch({type:'summon',count:1}),true);assert.equal(g.profile.cards[0],996);
});
test('future-version backup data is protected even with a missing primary',()=>{
 const future=JSON.stringify({...defaultProfile(),version:99});let writes=0;
 const storage={getItem:(key:string)=>key===BACKUP_KEY?future:null,setItem:()=>{writes++;}};
 assert.equal(loadProfileWithStatus(storage).status,'unsupported');assert.equal(saveProfile(defaultProfile(),storage),false);assert.equal(writes,0);
});
test('failed primary save does not change the recovery copy',()=>{
 const old=JSON.stringify(defaultProfile());const values=new Map([[SAVE_KEY,old],[BACKUP_KEY,old]]);const p=defaultProfile();p.coins=500;
 assert.equal(saveProfile(p,{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(k===SAVE_KEY)throw Error('quota');values.set(k,v);}}),false);
 assert.equal(values.get(BACKUP_KEY),old);assert.equal(values.get(SAVE_KEY),old);
});
test('draw boundaries remain inside available pools after card storage caps',()=>{
 for(let mask=0;mask<16;mask++)for(const draws of [0,5,50,140,950]){
  const p=defaultProfile();p.cards=p.cards.map((_,i)=>((mask>>(i%4))&1)?1000:0);
  const odds=availableSummonOdds(draws,p.cards);
  for(const roll of [0,.5,.999999999,1]){
   const index=drawCard(draws,roll,roll,p.cards);
   if(!odds.some(x=>x>0))assert.equal(index,-1);else {assert.ok(index>=0&&index<30);assert.ok(p.cards[index]<1000);}
  }
 }
});
test('P39: CI is read-only and publishes a build only after a successful production build',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/full-verify.yml',import.meta.url),'utf8');
 assert.match(workflow,/contents: read/);assert.match(workflow,/persist-credentials: false/);assert.doesNotMatch(workflow,/almo7areboon-web-build|path: dist\//);assert.match(workflow,/compression-level: 9/);assert.match(workflow,/retention-days: 1/);assert.doesNotMatch(workflow,/contents: write|git push/);
});
test('P40: integrated combat remains finite, bounded and saveable across extreme valid profiles',()=>{
 for(let scenario=0;scenario<12;scenario++){
  const p=defaultProfile();p.age=scenario%6;p.enemyAge=p.age;p.timeline=scenario===11?1000:1;p.foodLevel=100;p.unlocked=[true,true,true];
  if(scenario>=6)p.cards.fill(1000);
  const g=new Game(p);g.dispatch({type:'start'});
  for(let frame=0;frame<3600&&g.state.phase==='running';frame++){
   if(frame%6===0)g.dispatch({type:'spawn',kind:(Math.floor(frame/6)%3) as 0|1|2});
   g.step(1/60);if(frame%30===0)g.drainEvents();
   assert.ok(Number.isFinite(g.state.playerHp)&&Number.isFinite(g.state.enemyHp));assert.ok(g.state.food>=0&&g.state.food<=99);
   assert.ok(g.state.units.length<=120);assert.ok(g.state.units.every(u=>Number.isFinite(u.x)&&u.hp>=0&&u.hp<=u.maxHp));
  }
  for(const value of Object.values(cardBonuses(p.cards)))assert.ok(Number.isFinite(value));
  const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
  assert.equal(saveProfile(g.profile,storage),true);const restored=new Game(loadProfileWithStatus(storage).profile);assert.equal(restored.profile.cards.length,30);assert.equal(restored.profile.timeline,g.profile.timeline);
 }
});
