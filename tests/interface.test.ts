import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { exportBackup, importBackup, restoreBackup, restoreBackupWithSave } from '../src/game/backup.ts';
import { createSaveSession, type SaveSessionLocks } from '../src/game/save-session.ts';
import { pauseReason } from '../src/ui/pause.ts';
import { isEditingTarget, nextFocusIndex, createModalIsolation } from '../src/ui/accessibility.ts';
import { createArmyUpdater } from '../src/ui/army-screen.ts';
import { baseHealthDisplay, battleGuidance, compactNumber } from '../src/ui/battle-hud.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../src/ui/progression-screen.ts';
import { createLifetime } from '../src/ui/lifetime.ts';
const main=()=>readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');

test('P17: closing one pause owner cannot clear another owner',()=>{
 const context={phase:'running' as const,manual:true,tab:'cards',modal:'settings',hidden:true};
 assert.equal(pauseReason(context),'hidden');context.hidden=false;assert.equal(pauseReason(context),'menu');
 assert.equal(pauseReason({...context,modal:null}),'screen');assert.equal(pauseReason({...context,modal:null,tab:'battle'}),'manual');
 assert.equal(pauseReason({...context,phase:'ready'}),null);
});
test('P20: backup round-trip preserves progress and failed writes do not replace the game',()=>{
 const g=new Game(),p=defaultProfile();p.coins=987;p.cards[2]=4;
 const decoded=importBackup(exportBackup(p,new Date('2026-09-28T00:00:00Z')));assert.equal(decoded.ok,true);
 if(!decoded.ok)return;assert.deepEqual(decoded.profile,p);
 const values=new Map<string,string>();const result=restoreBackup(g,decoded.profile,{getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(k===SAVE_KEY)throw Error('quota');values.set(k,v);}});
 assert.equal(result.ok,false);assert.equal(result.game,g);assert.equal(values.get(BACKUP_KEY),undefined);
 for(const text of ['{}','null','[]','broken',JSON.stringify({...p,version:99}),'x'.repeat(100001)])assert.equal(importBackup(text).ok,false);
});
test('P22: card screen renders actual rarities, levels, odds and all three pack sizes',async()=>{
 const path='../src/ui/cards-screen.ts';const screen=await import(path).catch(()=>null);assert.ok(screen,'card screen must exist');
 const p=defaultProfile();p.cards[0]=3;p.gems=1000;const html=screen.cardsScreenHtml(p);
 assert.equal((html.match(/class="collection-card /g)??[]).length,30);
 assert.match(html,/LEGENDARY/);assert.match(html,/LEVEL 2/);assert.match(html,/data-pack="1"/);assert.match(html,/data-pack="10"/);assert.match(html,/data-pack="50"[^>]*disabled/);
 assert.match(html,/Summon level 1/);assert.match(html,/0 \/ 5/);
});
test('P23: battle selection exposes only unlocked ready-state battles',()=>{
 const p=defaultProfile();p.enemyAge=1;p.furthestBattle=2;const g=new Game(p);let html=battleSelectionHtml(g.profile,g.state);
 assert.equal((html.match(/class="battle-option"/g)??[]).length,6);assert.equal((html.match(/ disabled/g)??[]).length,3);
 g.dispatch({type:'start'});html=battleSelectionHtml(g.profile,g.state);assert.equal((html.match(/ disabled/g)??[]).length,6);
 assert.match(main(),/battleSelectionHtml\(game.profile,\s*game.state\)/);
});
test('P24: evolution has an explicit reset warning and confirmation action',()=>{
 const g=new Game();const html=evolutionDialogHtml(g.profile,g.state)!;assert.match(html,/All coins/);assert.match(html,/cards and gems/);assert.match(html,/confirm-evolve/);
 g.dispatch({type:'start'});assert.equal(evolutionDialogHtml(g.profile,g.state),null);
 assert.match(main(),/case 'confirm-evolve'/);assert.match(main(),/evolutionDialogHtml\(game.profile,\s*game.state\)/);
});
test('P25: modal focus traversal wraps, recovers outside focus and handles no controls',()=>{
 assert.equal(nextFocusIndex(0,3,true),2);assert.equal(nextFocusIndex(2,3,false),0);assert.equal(nextFocusIndex(-1,3,false),0);assert.equal(nextFocusIndex(-1,3,true),2);assert.equal(nextFocusIndex(0,0,false),null);
 assert.match(main(),/createModalIsolation/);assert.match(main(),/modalFocusables/);
});
test('P26: editing and modifier shortcuts are not used as game controls',()=>{
 for(const tagName of ['input','TEXTAREA','SELECT'])assert.equal(isEditingTarget({tagName,isContentEditable:false}),true);
 assert.equal(isEditingTarget({tagName:'DIV',isContentEditable:true}),true);assert.equal(isEditingTarget(null),false);
 assert.match(main(),/isEditingTarget/);assert.match(main(),/e\.ctrlKey/);assert.match(main(),/e\.isComposing/);
});
test('P27: food and coin ticks never rebuild troop buttons or their focus state',()=>{
 let writes=0;const units={get innerHTML(){return '';},set innerHTML(_s:string){writes++;}};
 const render=createArmyUpdater({units,skills:{innerHTML:''},stages:{innerHTML:''}},()=>'/unit.svg');const p=defaultProfile();
 assert.equal(render(p),true);p.coins=100;assert.equal(render(p),false);assert.equal(writes,1);
 p.unlocked[1]=true;assert.equal(render(p),true);assert.equal(writes,2);
 assert.match(main(),/createArmyUpdater/);
});
test('P28: guidance explains first deployment, pause, danger and waiting for food',()=>{
 const g=new Game();assert.match(battleGuidance(g.profile,g.state),/Tap Battle/);g.dispatch({type:'start'});assert.match(battleGuidance(g.profile,g.state),/first warrior/);
 g.state.paused=true;assert.match(battleGuidance(g.profile,g.state),/paused/);g.state.paused=false;g.state.playerHp=10;assert.match(battleGuidance(g.profile,g.state),/danger/);
 assert.deepEqual(baseHealthDisplay(-3,100),{ratio:0,label:'0 / 100',danger:true});assert.equal(baseHealthDisplay(1e40,1e40).label.length<30,true);
 assert.match(main(),/battleGuidance\(p,\s*s\)/);
});
test('P31: results show durable statistics and do not imply a second reward claim',async()=>{
 const path='../src/ui/results-screen.ts';const screen=await import(path).catch(()=>null);assert.ok(screen,'results screen must exist');
 const g=new Game();g.dispatch({type:'start'});g.dispatch({type:'spawn',kind:0});g.state.enemyHp=0;g.step(1/60);
 const html=screen.resultsHtml(g.profile,g.state);assert.match(html,/Already added/);assert.match(html,/Warriors deployed/);assert.match(html,/Food spent/);assert.match(html,/10 gems/);
 const h=new Game(g.profile);assert.equal(screen.resultsHtml(h.profile,h.state),html);
});
test('P33: reduced-motion policy applies to renderer, not only CSS transitions',async()=>{
 const path='../src/view/combat-feedback.ts';const feedback=await import(path).catch(()=>null);assert.ok(feedback,'combat feedback model must exist');
 assert.equal(feedback.reducedMotion('system',true),true);assert.equal(feedback.reducedMotion('system',false),false);assert.equal(feedback.reducedMotion('reduced',false),true);
 const source={id:1,kind:1,age:2,side:'player',x:300,lane:0};const shot=feedback.projectileForHit({type:'hit',source,target:'unit',x:333,lane:2,amount:4});
 assert.equal(shot.targetX,333);assert.equal(shot.targetLane,2);assert.equal(feedback.projectileForHit({type:'coin'}),null);
 const renderer=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');assert.match(renderer,/projectileForHit\(e\)/);assert.match(renderer,/reducedMotion\(game.profile.motion/);
});
test('P34: lifecycle cleanup removes input handlers once and continues after a cleanup failure',()=>{
 const life=createLifetime(),target=new EventTarget();let actions=0,cleaned=0;life.listen(target,'tap',()=>actions++);
 target.dispatchEvent(new Event('tap'));assert.equal(actions,1);life.add(()=>cleaned++);life.add(()=>{throw Error('cleanup');});
 assert.equal(life.dispose().length,1);target.dispatchEvent(new Event('tap'));assert.equal(actions,1);assert.equal(cleaned,1);assert.deepEqual(life.dispose(),[]);
 assert.match(main(),/createLifetime/);assert.match(main(),/lifetime\.dispose\(/);
});
test('P35: unchanged HUD values do not rewrite DOM nodes',async()=>{
 const path='../src/ui/dom-state.ts';const dom=await import(path).catch(()=>null);assert.ok(dom,'DOM updater must exist');let writes=0,value='';
 const target={get textContent(){return value;},set textContent(v:string){value=v;writes++;}};
 dom.textIfChanged(target,'12');dom.textIfChanged(target,'12');assert.equal(writes,1);dom.textIfChanged(target,'13');assert.equal(writes,2);
});
test('P38: secondary screens isolate the battlefield and restore a meaningful focus target',()=>{
 assert.match(main(),/battle-view'\)\.inert/);assert.match(main(),/secondary-title/);assert.match(main(),/focusBefore\?\.isConnected/);
});

function importStorage() {
 const values=new Map<string,string>();
 return {values,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
}
function importLocks(): SaveSessionLocks {
 let held=false;
 return {request(name,options,callback) {
  assert.deepEqual(options,{mode:'exclusive',ifAvailable:true});
  const lock=held?null:{name};if(lock)held=true;
  return Promise.resolve().then(()=>callback(lock)).finally(()=>{if(lock)held=false;});
 }};
}
test('guarded import commits replacement and later saves use its refreshed baseline',async()=>{
 const restore=restoreBackupWithSave,storage=importStorage(),session=createSaveSession({storage,locks:importLocks()});
 const loaded=await session.acquire();assert.ok(loaded.profile);const current=new Game(loaded.profile),candidate=defaultProfile();candidate.coins=432;candidate.cards[3]=2;
 try {
  const result=restore(current,candidate,profile=>session.save(profile).ok);
  assert.equal(result.ok,true);assert.notEqual(result.game,current);assert.equal(result.game.profile.coins,432);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)!).coins,432);assert.equal(session.check(),true);
  result.game.profile.coins=543;assert.deepEqual(session.save(result.game.profile),{ok:true,reason:null});
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)!).coins,543);assert.equal(JSON.parse(storage.getItem(BACKUP_KEY)!).coins,432);assert.equal(session.check(),true);
 } finally {session.dispose();}
});
test('guarded import preserves the original Game when the writer rejects or throws',()=>{
 const restore=restoreBackupWithSave,current=new Game(),candidate=defaultProfile();candidate.coins=777;
 const before=JSON.stringify(current.profile);
 for(const commit of [()=>false,()=>{throw Error('writer failed');}]){
  const result=restore(current,candidate,commit);assert.equal(result.ok,false);assert.equal(result.game,current);assert.equal(JSON.stringify(current.profile),before);
 }
});
for(const failure of ['conflict','unsupported','quota'] as const)test(`guarded ${failure} import leaves current game and both stored bytes unchanged`,async()=>{
 const restore=restoreBackupWithSave,storage=importStorage(),old=defaultProfile();old.coins=88;
 storage.setItem(SAVE_KEY,JSON.stringify(old));storage.setItem(BACKUP_KEY,JSON.stringify(old));
 const session=createSaveSession({storage:{getItem:storage.getItem,setItem:(key,value)=>{if(failure==='quota')throw Error('quota');storage.setItem(key,value);}},locks:importLocks()});
 if(failure==='unsupported')storage.setItem(BACKUP_KEY,JSON.stringify({...old,version:99}));
 const loaded=await session.acquire();assert.ok(loaded.profile);const current=new Game(loaded.profile),candidate=defaultProfile();candidate.coins=999;
 if(failure==='conflict')storage.setItem(SAVE_KEY,JSON.stringify({...old,coins:89}));
 const before=[storage.getItem(SAVE_KEY),storage.getItem(BACKUP_KEY)],inMemory=JSON.stringify(current.profile);
 try {
  const result=restore(current,candidate,profile=>session.save(profile).ok);
  assert.equal(result.ok,false);assert.equal(result.game,current);assert.equal(JSON.stringify(current.profile),inMemory);
  assert.deepEqual([storage.getItem(SAVE_KEY),storage.getItem(BACKUP_KEY)],before);
 } finally {session.dispose();}
});

test('a backup saved with a UTF-8 byte-order mark still imports',()=>{
 const text=exportBackup(defaultProfile(),new Date('2026-09-28T00:00:00Z'));
 assert.equal(importBackup('﻿'+text).ok,true);
});

test('modal isolation inerts siblings once, spares the layer and toast, and restores prior state',()=>{
 class HTMLElementStub{}
 const previous=(globalThis as any).HTMLElement;(globalThis as any).HTMLElement=HTMLElementStub;
 const el=(id:string,inert=false)=>Object.assign(new HTMLElementStub(),{id,inert}) as any;
 const layer=el('modal-layer'),toast=el('toast'),plain=el('battle'),alreadyInert=el('nav',true);
 (layer as any).parentElement={children:[layer,toast,plain,alreadyInert]};
 const isolate=createModalIsolation(layer as any);
 isolate(true);isolate(true);
 assert.deepEqual([layer.inert,toast.inert,plain.inert,alreadyInert.inert],[false,false,true,true]);
 isolate(false);
 assert.deepEqual([plain.inert,alreadyInert.inert],[false,true]);
 (globalThis as any).HTMLElement=previous;
});

test('compactNumber switches to exponent notation for astronomically large values',()=>{
 assert.equal(compactNumber(2.5e15),'2.5e15');
 assert.equal(compactNumber(Number.NaN),'0');
});
