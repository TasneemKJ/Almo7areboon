import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, loadProfile, saveProfile, decodeSave } from '../src/game/save.ts';
import { ERAS } from '../src/game/data.ts';

// Lawful purchased roster fixtures are allowed; all combat outcomes use actions/ticks.
function prepared(chapter=0) { const p=defaultProfile(); p.age=5; p.enemyAge=chapter; p.furthestBattle=5; p.foodLevel=12; p.unlocked=[true,true,true]; return new Game(p); }
function fight(g:Game, deploy=true, chunk=1, pacing:1|2=1) {
  assert.equal(g.dispatch({type:'start'}),true);
  let cycle=0;
  for(let tick=0;tick<36000 && g.state.phase==='running';tick+=6) {
    if(deploy) {
      if(g.state.time>=8)g.dispatch({type:'skill',skill:'food'});
      const enemies=g.state.units.filter(u=>u.side==='enemy'&&u.hp>0);
      if(g.profile.enemyAge!==2 && enemies.length>=3)g.dispatch({type:'skill',skill:'freeze'});
      if(g.profile.enemyAge!==2 && enemies.length>=3)g.dispatch({type:'skill',skill:'meteor'});
      const roles=([0,1,2] as const).filter(kind=>g.profile.unlocked[kind]); const kind=roles[cycle%roles.length];
      const reserve = (g.profile.enemyAge===3 || g.profile.enemyAge===4) ? !g.state.skillsUsed.includes('freeze') : g.profile.enemyAge===5 ? false : g.state.time<10;
      if(!reserve && g.dispatch({type:'spawn',kind}))cycle++;
    }
    for(let i=0;i<6;i+=chunk) g.step(chunk/60);
    // speed is UI frame pacing; equivalent simulation-time inputs remain identical.
    g.profile.speed=pacing;
  }
  assert.notEqual(g.state.phase,'running'); return g;
}
test('successful actions count roles, actual freeze targets and meteor deaths, rejected calls count nothing',()=>{
 const g=prepared(4);g.dispatch({type:'start'});const before=structuredClone(g.state.stats);
 assert.equal(g.dispatch({type:'skill',skill:'meteor'}),false);assert.equal(g.dispatch({type:'spawn',kind:9 as never}),false);assert.deepEqual(g.state.stats,before);
 for(let i=0;i<2400&&g.state.units.filter(u=>u.side==='enemy').length<3;i++)g.step(1/60);
 const targets=g.state.units.filter(u=>u.side==='enemy'&&u.hp>0).length;
 assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);assert.equal(g.state.stats.maxFreezeTargets,targets);assert.equal(g.dispatch({type:'skill',skill:'freeze'}),false);
 const kills=g.profile.kills; assert.equal(g.dispatch({type:'skill',skill:'meteor'}),true);assert.equal(g.state.stats.meteorKills,g.profile.kills-kills);
 assert.equal(g.dispatch({type:'spawn',kind:2}),true);assert.deepEqual(g.state.stats.deployedByKind,[0,0,1]);
});
test('all eighteen seals are earned through real public battle actions',()=>{
 for(let chapter=0;chapter<6;chapter++) { const g=fight(prepared(chapter));assert.equal(g.state.phase,'won');assert.equal(g.profile.mastery.chapters[chapter].earnedMask,7,`chapter ${chapter}: ${JSON.stringify(g.state.stats)}`);assert.equal(g.profile.pendingVictory?.settlement,'mastery-v1'); }
});
for(const chapter of [0,5]) for(const reload of [false,true]) test(`real cleared chapter ${chapter} rematch loss ${reload?'reloads ready':'remains lost'} and advances once`,()=>{
 let g=fight(prepared(chapter));const receipt=structuredClone(g.profile.pendingVictory);assert.equal(g.profile.furthestBattle,5);assert.equal(g.dispatch({type:'retry'}),true);
 fight(g,false);assert.equal(g.state.phase,'lost');const wins=g.profile.wins,coins=g.profile.coins,gems=g.profile.gems,ledger=structuredClone(g.profile.mastery);
 if(reload) { g=new Game(g.profile);assert.equal(g.state.phase,'ready'); }
 assert.equal(g.dispatch({type:'next'}),true);assert.equal(g.profile.wins,wins);
 if(chapter===5) {assert.equal(g.profile.timeline,2);assert.equal(g.profile.gems,gems+100);assert.equal(g.profile.mastery.chapters.every(r=>r.earnedMask===0),true);assert.equal(g.dispatch({type:'next'}),false);}
 else {assert.equal(g.profile.enemyAge,1);assert.equal(g.profile.furthestBattle,5);assert.equal(g.profile.coins,coins);assert.equal(g.profile.gems,gems);assert.deepEqual(g.profile.mastery,ledger);}
 assert.ok(receipt);
});
test('evolution preserves selected opponent, frontier and won receipt; replay never pays old bits',()=>{
 const p=defaultProfile();p.coins=ERAS[0].evolveCost;p.foodLevel=12;p.unlocked=[true,true,true];p.enemyAge=0;p.furthestBattle=4;const g=new Game(p);fight(g);assert.equal(g.state.phase,'won');
 const receipt=structuredClone(g.profile.pendingVictory),ledger=structuredClone(g.profile.mastery);assert.equal(g.dispatch({type:'evolve'}),true);assert.equal(g.state.phase,'won');assert.equal(g.profile.enemyAge,0);assert.equal(g.profile.furthestBattle,4);assert.deepEqual(g.profile.pendingVictory,receipt);assert.deepEqual(g.profile.mastery,ledger);
 const reloaded=new Game(g.profile);assert.deepEqual(reloaded.profile.pendingVictory,receipt);assert.equal(reloaded.dispatch({type:'retry'}),true);fight(reloaded);assert.equal(reloaded.profile.pendingVictory?.settlement,'mastery-v1');if(reloaded.profile.pendingVictory?.settlement==='mastery-v1')assert.equal(reloaded.profile.pendingVictory.masteryCoins,0);
});
test('legacy Continue-first survives evolution and reload, with final cap return exception',()=>{
 for(const chapter of [0,5]) {
 const raw={...defaultProfile(),version:2,enemyAge:chapter,furthestBattle:5,coins:ERAS[0].evolveCost,pendingVictory:{timeline:1,battle:chapter,earned:123,seconds:40,playerHp:100}};
 let g=new Game(loadProfile({getItem:()=>JSON.stringify(raw)}));assert.equal(g.dispatch({type:'retry'}),false);assert.equal(g.dispatch({type:'evolve'}),true);g=new Game(g.profile);assert.equal(g.state.phase,'won');assert.equal(g.dispatch({type:'retry'}),false);assert.equal(g.dispatch({type:'next'}),true);
 const terminal=new Game(loadProfile({getItem:()=>JSON.stringify({...raw,timeline:1000,pendingVictory:{...raw.pendingVictory,timeline:1000}})}));assert.equal(terminal.dispatch({type:'next'}),chapter!==5);if(chapter===5)assert.equal(terminal.dispatch({type:'retry'}),true);
 }
});
test('paid malformed bests survive round trips then real final replay without duplicate credits',()=>{
 for(const mask of [7,3]) {
 const g=prepared(5),raw=JSON.parse(JSON.stringify(g.profile));raw.mastery.chapters[5]={earnedMask:mask,bestSeconds:'bad',bestGateDamage:12};
 const first=decodeSave(JSON.stringify(raw)).profile!;let saved='';assert.equal(saveProfile(first,{setItem:(_k,v)=>{saved=v;}}),true);
 const replay=fight(new Game(loadProfile({getItem:()=>saved})));assert.equal(replay.profile.mastery.chapters[5].earnedMask,7);
 const receipt=replay.profile.pendingVictory!;assert.equal(receipt.settlement,'mastery-v1');if(receipt.settlement==='mastery-v1'){assert.equal(receipt.newMask,mask===7?0:4);assert.equal(receipt.masteryCoins,mask===7?0:3276800);}
 }
});
test('simulation-time partitions and 1x/2x pacing preserve objective counters and settlement',()=>{
 const a=fight(prepared(3),true,1,1),b=fight(prepared(3),true,3,2);b.profile.speed=1;assert.deepEqual(a.state,b.state);assert.deepEqual(a.profile,b.profile);
 const running=prepared();running.profile.mastery.chapters[0].earnedMask=1;running.dispatch({type:'start'});assert.equal(running.dispatch({type:'next'}),false);running.dispatch({type:'pause'});assert.equal(running.dispatch({type:'next'}),false);
});
