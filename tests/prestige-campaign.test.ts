import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile,loadProfile } from '../src/game/save.ts';
import { currentSealCount,legacyEffects,prestigePreview } from '../src/game/prestige.ts';
import type { LegacyChoice } from '../src/game/types.ts';

// Disclosed prepared historical army; current mastery always starts empty.
function prepared(chapter=0) { const p=defaultProfile();p.age=5;p.enemyAge=chapter;p.furthestBattle=5;p.foodLevel=12;p.unlocked=[true,true,true];return new Game(p); }
function fight(g:Game,deploy=true) {
  assert.equal(g.dispatch({type:'start'}),true);let cycle=0;
  for(let tick=0;tick<36000&&g.state.phase==='running';tick+=6) {
    if(deploy) {
      if(g.state.time>=8)g.dispatch({type:'skill',skill:'food'});
      const enemies=g.state.units.filter(u=>u.side==='enemy'&&u.hp>0);
      if(g.profile.enemyAge!==2&&enemies.length>=3) {g.dispatch({type:'skill',skill:'freeze'});g.dispatch({type:'skill',skill:'meteor'});}
      const reserve=(g.profile.enemyAge===3||g.profile.enemyAge===4)?!g.state.skillsUsed.includes('freeze'):g.profile.enemyAge===5?false:g.state.time<10;
      if(!reserve&&g.dispatch({type:'spawn',kind:([0,1,2] as const)[cycle%3]}))cycle++;
    }
    for(let i=0;i<6;i++)g.step(1/60);
  }
  assert.notEqual(g.state.phase,'running','real combat must reach terminal outcome');return g;
}
const bytes=(g:Game)=>JSON.stringify({profile:g.profile,state:g.state});
test('one prepared empty-ledger campaign earns all eighteen seals and rank three through real actions',()=>{
  const g=prepared();assert.equal(currentSealCount(g.profile),0);
  for(let chapter=0;chapter<6;chapter++) {fight(g);assert.equal(g.state.phase,'won');assert.equal(g.profile.mastery.chapters[chapter].earnedMask,7,`chapter ${chapter}`);if(chapter<5)assert.equal(g.dispatch({type:'next'}),true);}
  assert.equal(currentSealCount(g.profile),18);const before=structuredClone(g.profile);assert.equal(g.dispatch({type:'next'}),false);
  assert.equal(g.dispatch({type:'prestige',expectedTimeline:1,legacy:'stillness'}),true);assert.equal(g.profile.legacy.rank,3);assert.equal(g.profile.timeline,2);assert.equal(currentSealCount(g.profile),0);assert.equal(g.profile.gems,before.gems+100);assert.equal(g.profile.wins,before.wins);
  assert.equal(g.state.phase,'ready');assert.equal(g.state.freezeUntil,0);const after=bytes(g);assert.equal(g.dispatch({type:'prestige',expectedTimeline:1,legacy:'hearth'}),false);assert.equal(bytes(g),after);
});
test('reset is atomic and retains permanent state while clearing exactly local progress',()=>{
  const g=fight(prepared(5));Object.assign(g.profile,{claimed:['first-blood'],dailyDay:20726,dailyStreak:4,sound:false,speed:2,motion:'reduced',legacy:{rank:3,selected:'watch'}});
  const before=structuredClone(g.profile),draft=bytes(g);for(const choice of ['hearth','watch','stillness'] as const)assert.ok(prestigePreview(g.profile,g.state,choice));assert.equal(bytes(g),draft);
  assert.equal(g.dispatch({type:'prestige',expectedTimeline:1,legacy:'hearth'}),true);
  for(const key of ['cards','claimed','kills','wins','deployed','summonCount','summonSeed','dailyDay','dailyStreak','sound','speed','motion'] as const)assert.deepEqual(g.profile[key],before[key],key);
  assert.deepEqual(g.profile.legacy,{rank:3,selected:'hearth'});assert.equal(g.state.food,12);assert.equal(g.state.playerMaxHp,180);assert.equal(g.profile.pendingVictory,null);
  assert.deepEqual([g.profile.coins,g.profile.age,g.profile.enemyAge,g.profile.furthestBattle,g.profile.foodLevel,g.profile.baseLevel],[0,0,0,0,0,0]);assert.deepEqual(g.profile.unlocked,[true,false,false]);assert.ok(g.profile.mastery.chapters.every(r=>r.earnedMask===0&&r.bestSeconds===null&&r.bestGateDamage===null));
});
test('prestige rejects stale malformed running paused early and uncleared routes without mutation',()=>{
 const g=fight(prepared(5));for(const expectedTimeline of [0,2,1.5,NaN]){const before=bytes(g);assert.equal(g.dispatch({type:'prestige',expectedTimeline,legacy:'watch'}),false);assert.equal(bytes(g),before);}
 const before=bytes(g);assert.equal(g.dispatch({type:'prestige',expectedTimeline:1,legacy:'bad' as never}),false);assert.equal(bytes(g),before);
 for(const phase of ['running','ready','lost'] as const) {const p=defaultProfile();p.enemyAge=phase==='running'?5:0;p.furthestBattle=5;const blocked=new Game(p);if(phase==='running'){assert.equal(blocked.dispatch({type:'start'}),true);blocked.profile.mastery.chapters[5].earnedMask=1;}else if(phase==='lost'){fight(blocked,false);assert.equal(blocked.state.phase,'lost');}
   for(const paused of [false,true]){if(phase==='running'&&paused)assert.equal(blocked.dispatch({type:'pause'}),true);const b=bytes(blocked);assert.equal(blocked.dispatch({type:'prestige',expectedTimeline:1,legacy:'watch'}),false);assert.equal(bytes(blocked),b);}
 }
});
for(const reload of [false,true])test(`real durable final Clear after lost rematch ${reload?'reloads ready':'stays lost'} resets once`,()=>{
 let g=fight(prepared(5));assert.equal(g.dispatch({type:'retry'}),true);fight(g,false);assert.equal(g.state.phase,'lost');if(reload)g=new Game(g.profile);const before=structuredClone(g.profile);assert.equal(g.dispatch({type:'prestige',expectedTimeline:1,legacy:'watch'}),true);assert.equal(g.profile.gems,before.gems+100);assert.equal(g.profile.wins,before.wins);assert.deepEqual(g.profile.legacy,{rank:1,selected:'watch'});assert.equal(g.state.playerMaxHp,198);
});
test('migrated legacy final win remains eligible and capped terminal transition never replays rewards',()=>{
 for(const timeline of [1,999,1000])for(const gems of [9999950,10000000]) {
 const raw={...defaultProfile(),version:2,timeline,enemyAge:5,furthestBattle:5,gems,pendingVictory:{timeline,battle:5,earned:123,seconds:40,playerHp:100}};
 const g=new Game(loadProfile({getItem:()=>JSON.stringify(raw)}));const before=bytes(g);assert.equal(g.dispatch({type:'next'}),false);
 assert.equal(g.dispatch({type:'prestige',expectedTimeline:timeline,legacy:'watch'}),timeline<1000);
 if(timeline===1000)assert.equal(bytes(g),before);else {assert.equal(g.profile.timeline,timeline+1);assert.equal(g.profile.gems,1e7);assert.equal(g.profile.wins,0);assert.equal(g.profile.legacy.rank,1);}
 }
});
test('ready selection rebuilds only clean derived battle and preserves the whole permanent profile',()=>{
 for(const selected of ['hearth','watch','stillness'] as const) {
 const p=defaultProfile();Object.assign(p,{legacy:{rank:3,selected:'hearth'},coins:1e6,age:3,baseLevel:2,foodLevel:4,cards:p.cards.map((_,i)=>i===24?1:0)});const g=new Game(p);const before=structuredClone(g.profile);const preview=g.upgradeStatus('base').nextValue;
 assert.equal(g.dispatch({type:'select-legacy',legacy:selected}),true);assert.deepEqual(g.profile,{...before,legacy:{rank:3,selected}});assert.equal(g.state.food,legacyEffects(g.profile.legacy).startingFood);assert.deepEqual(new Game(g.profile).state,g.state);if(selected==='watch'){const next=g.upgradeStatus('base').nextValue;assert.ok(next!>preview!);assert.equal(g.dispatch({type:'upgrade',stat:'base'}),true);assert.equal(g.state.playerMaxHp,next);}
 const b=bytes(g);assert.equal(g.dispatch({type:'select-legacy',legacy:'bad' as LegacyChoice}),false);assert.equal(bytes(g),b);
 }
 const g=new Game();const b=bytes(g);assert.equal(g.dispatch({type:'select-legacy',legacy:'watch'}),false);assert.equal(bytes(g),b);
 for(const phase of ['running','won','lost'] as const){const g=phase==='won'?fight(prepared(5)):prepared(5);g.profile.legacy={rank:3,selected:'hearth'};if(phase==='lost')fight(g,false);if(phase==='running')g.dispatch({type:'start'});for(const paused of [false,true]){if(phase==='running'&&paused)g.dispatch({type:'pause'});const b=bytes(g);assert.equal(g.dispatch({type:'select-legacy',legacy:'watch'}),false);assert.equal(bytes(g),b);}}
});
for(const rank of [1,2,3] as const)test(`Stillness rank ${rank} suppresses real movement and attacks for ${7+rank} simulation seconds including delayed arrivals`,()=>{
 const p=defaultProfile();p.age=5;p.enemyAge=1;p.legacy={rank,selected:'stillness'};const g=new Game(p);assert.equal(g.dispatch({type:'start'}),true);
 for(let i=0;i<900;i++)g.step(1/60);
 const targets=g.state.units.filter(u=>u.side==='enemy'&&u.hp>0).length;assert.equal(g.waveStatus().pendingEnemies,1);assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);assert.equal(g.state.stats.maxFreezeTargets,targets);assert.equal(g.state.freezeUntil,g.state.time+7+rank);assert.equal(g.dispatch({type:'skill',skill:'freeze'}),false);
 g.drainEvents();assert.equal(g.dispatch({type:'pause'}),true);const paused=bytes(g);g.step(.25);assert.equal(bytes(g),paused);assert.equal(g.dispatch({type:'pause'}),true);
 const frozen=new Map(g.state.units.filter(u=>u.side==='enemy').map(u=>[u.id,{x:u.x,timer:u.attackTimer}]));
 for(let i=0;i<(7+rank)*60-1;i++) {
   g.step(1/60);assert.equal(g.state.phase,'running');
   for(const unit of g.state.units.filter(u=>u.side==='enemy')){const snapshot=frozen.get(unit.id);if(snapshot){assert.equal(unit.x,snapshot.x);assert.equal(unit.attackTimer,snapshot.timer);}else frozen.set(unit.id,{x:unit.x,timer:unit.attackTimer});assert.equal(unit.attacking,false);}
   assert.equal(g.drainEvents().filter(e=>e.type==='hit'&&e.side==='enemy').length,0);
 }
 assert.ok(frozen.size>targets,'scheduled enemy must actually arrive during active interval');assert.equal(g.state.stats.maxFreezeTargets,targets);
 const expiry=g.state.freezeUntil;for(let i=0;i<2&&g.state.time<expiry;i++)g.step(1/60);
 assert.ok(g.state.units.some(u=>u.side==='enemy'&&u.x<frozen.get(u.id)!.x),'enemy resumes on first eligible expiry step');
});
for(const rank of [1,2,3] as const)test(`Stillness rank ${rank} suppresses a real gate attacker then resumes actual damage at expiry`,()=>{
 const p=defaultProfile();p.age=5;p.legacy={rank,selected:'stillness'};const g=new Game(p);g.dispatch({type:'start'});
 for(let i=0;i<18000&&g.state.stats.gateDamageTaken===0&&g.state.phase==='running';i++)g.step(1/60);
 assert.equal(g.state.phase,'running');assert.ok(g.state.units.some(u=>u.side==='enemy'&&u.attacking));assert.ok(g.state.stats.gateDamageTaken>0);
 assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);const damage=g.state.stats.gateDamageTaken;
 for(let i=0;i<(7+rank)*60-1;i++){g.step(1/60);assert.equal(g.state.stats.gateDamageTaken,damage);assert.ok(g.state.units.filter(u=>u.side==='enemy').every(u=>!u.attacking));}
 // Attack cooldown resumes at expiry, so the next actual hit follows the ordinary cooldown.
 for(let i=0;i<180&&g.state.stats.gateDamageTaken===damage;i++)g.step(1/60);assert.ok(g.state.stats.gateDamageTaken>damage);
});
test('Watch cap arithmetic joins card and age product before rounding and preserves recorded gate damage',()=>{
 const p=defaultProfile();Object.assign(p,{age:5,enemyAge:5,timeline:1000,mastery:{...p.mastery,timeline:1000},foodLevel:100,baseLevel:99,coins:1e9,cards:Array(30).fill(1000),legacy:{rank:3,selected:'watch'}});
 const g=new Game(p);const next=g.upgradeStatus('base').nextValue!;assert.ok(Number.isFinite(next));assert.ok(next>g.state.playerMaxHp);assert.equal(g.dispatch({type:'upgrade',stat:'base'}),true);assert.equal(g.state.playerMaxHp,next);assert.equal(g.upgradeStatus('base').reason,'max');assert.equal(g.dispatch({type:'select-legacy',legacy:'hearth'}),true);assert.equal(g.state.food,12);assert.ok(Number.isFinite(g.state.enemyMaxHp));
 const q=defaultProfile();q.age=5;q.coins=2e6;q.legacy={rank:3,selected:'watch'};const attacked=new Game(q);attacked.dispatch({type:'start'});for(let i=0;i<18000&&attacked.state.stats.gateDamageTaken===0;i++)attacked.step(1/60);assert.ok(attacked.state.stats.gateDamageTaken>0);const damage=attacked.state.stats.gateDamageTaken;assert.equal(attacked.dispatch({type:'upgrade',stat:'base'}),true);assert.equal(attacked.state.stats.gateDamageTaken,damage);
});
test('Stillness simulation time matches equivalent frame partitions and wall pacing',()=>{
 const run=(chunk:number,speed:1|2)=>{const p=defaultProfile();p.age=5;p.enemyAge=1;p.legacy={rank:3,selected:'stillness'};p.speed=speed;const g=new Game(p);g.dispatch({type:'start'});for(let i=0;i<900;i+=chunk*speed)g.step(chunk/60*speed);g.dispatch({type:'skill',skill:'freeze'});for(let i=0;i<660;i+=chunk*speed)g.step(chunk/60*speed);g.profile.speed=1;return g;};
 const a=run(1,1),b=run(3,2);assert.deepEqual(a.state,b.state);assert.deepEqual(a.profile,b.profile);assert.ok(a.state.time>a.state.freezeUntil);
});
test('Watch multiplies the unrounded age-one gate product before the only final rounding',()=>{
 const p=defaultProfile();p.age=1;p.coins=1000;p.legacy={rank:1,selected:'watch'};const g=new Game(p);
 assert.equal(g.upgradeStatus('base').nextValue,457); // round(180 * 1.65 * 1.4 * 1.10) = round(457.38)
 assert.equal(g.dispatch({type:'upgrade',stat:'base'}),true);assert.equal(g.state.playerMaxHp,457);
 const reloaded=new Game(g.profile);assert.equal(reloaded.state.playerMaxHp,457);assert.notEqual(reloaded.state.playerMaxHp,458); // round(round(415.8) * 1.10) is wrong.
});
test('fresh public-action campaigns reconcile actual gem sources, rank thresholds and the second timeline',async()=>{
 const {simulatePrestige}=await import('../scripts/simulate-prestige.ts');
 for(const policy of ['mixed','immediate'] as const){const trace=simulatePrestige({targetTimeline:3,maxAttempts:100,policy,choice:'hearth',summon:true});assert.equal(trace.stopReason,'target-reached');assert.equal(trace.ledger.expectedGems,trace.finalProfile.gems);assert.equal(trace.ledger.dailyGems,0);assert.equal(trace.finalProfile.dailyDay,0);assert.ok(trace.transitions.length===2);assert.ok(trace.transitions.every(t=>t.rankAfter===Math.max(t.rankBefore,t.seals>=18?3:t.seals>=12?2:1)));assert.ok(trace.actions.some(a=>a.action.type==='prestige'));assert.ok(trace.attemptRows.every(a=>a.outcome==='won'||a.outcome==='lost'));assert.ok(trace.firstVictoryPurchase);assert.ok(trace.evolutionPurchases.every(p=>p.wins<=1&&p.losses<=2));}
});
test('actual win and mastery ledger split remains correct at the gem cap',async()=>{
 const {simulatePrestige}=await import('../scripts/simulate-prestige.ts');const p=defaultProfile();p.age=5;p.enemyAge=5;p.foodLevel=12;p.unlocked=[true,true,true];p.gems=9999955;
 const trace=simulatePrestige({profile:p,source:'prepared cap boundary',targetTimeline:2,maxAttempts:1,policy:'objectives',summon:false,choice:'watch'});assert.equal(trace.stopReason,'target-reached');assert.equal(trace.ledger.ordinaryGems,10);assert.equal(trace.ledger.masteryGems,35);assert.equal(trace.ledger.resetGems,0);assert.equal(trace.ledger.expectedGems,10000000);assert.equal(trace.finalProfile.gems,10000000);assert.equal(trace.ledger.spentGems,0);assert.equal(trace.finalProfile.summonCount,0);
});
test('a fresh deliberate low-seal policy earns rank one without daily or fabricated completion',async()=>{
 const {simulatePrestige}=await import('../scripts/simulate-prestige.ts');const trace=simulatePrestige({targetTimeline:2,maxAttempts:100,policy:'minimal',choice:'watch',summon:true});assert.equal(trace.stopReason,'target-reached');assert.equal(trace.transitions[0].rankAfter,1);assert.ok(trace.transitions[0].seals<12);assert.equal(trace.ledger.expectedGems,trace.finalProfile.gems);assert.equal(trace.ledger.dailyGems,0);
});
test('prepared objective and Clear-only routes keep one initially empty ledger and reconcile actual rewards',async()=>{
 const {preparedSealCampaign}=await import('../scripts/simulate-prestige.ts');for(const clearOnly of [false,true]){const trace=preparedSealCampaign(clearOnly);assert.ok(trace.source.includes('EMPTY current mastery'));assert.ok(trace.initialProfile.mastery.chapters.every(r=>r.earnedMask===0));assert.equal(trace.stopReason,'target-reached');assert.equal(trace.attempts,6);assert.equal(trace.transitions[0].seals,clearOnly?6:18);assert.equal(trace.finalProfile.legacy.rank,clearOnly?1:3);assert.equal(trace.finalProfile.mastery.chapters.reduce((s,r)=>s+r.earnedMask,0),0);assert.equal(trace.ledger.expectedGems,trace.finalProfile.gems);assert.equal(trace.ledger.ordinaryGems,60);assert.equal(trace.ledger.masteryGems,clearOnly?120:300);assert.equal(trace.ledger.resetGems,100);assert.equal(trace.ledger.spentGems,0);assert.equal(trace.finalProfile.wins,6);assert.equal(trace.finalProfile.summonCount,0);}
});
test('matched preparation comparisons expose concrete useful cases with identical starting profiles apart from legacy',async()=>{
 const {compareLegacyPreparations}=await import('../scripts/simulate-prestige.ts');const rows=compareLegacyPreparations();assert.equal(rows.length,27);
 for(const scenario of ['opening','pressured-gate','control']){const group=rows.filter(r=>r.scenario===scenario),baseline=group[0];for(const r of group){assert.deepEqual({...r.profile,legacy:baseline.profile.legacy},baseline.profile);assert.ok(r.source.includes('NOT earned'));assert.ok(r.outcome==='won'||r.outcome==='lost');}assert.equal(new Set(group.filter(r=>r.rank===0).map(r=>r.seconds)).size,1);}
 const get=(scenario:string,rank:number,choice:string)=>rows.find(r=>r.scenario===scenario&&r.rank===rank&&r.choice===choice)!;
 assert.ok(get('opening',3,'hearth').seconds<get('opening',0,'hearth').seconds);assert.equal(get('opening',3,'hearth').startingFood,12);
 assert.ok(get('pressured-gate',3,'watch').seconds>get('pressured-gate',3,'stillness').seconds);assert.equal(get('pressured-gate',1,'watch').startingGate,457);assert.equal(get('pressured-gate',3,'watch').outcome,'lost');
 const control=get('control',3,'stillness');assert.equal(control.outcome,'won');assert.ok(control.seconds<get('control',0,'stillness').seconds);assert.equal(control.freeze[0].until,control.freeze[0].castTime+10);assert.equal(control.freeze[0].targets,3);
});
test('bounded campaign reports a still-running timeout rather than inventing defeat or Retry',async()=>{
 const {simulatePrestige}=await import('../scripts/simulate-prestige.ts');const p=defaultProfile();p.age=5;p.baseLevel=100;p.cards.fill(1000);
 const trace=simulatePrestige({profile:p,source:'prepared maximum gate timeout boundary',targetTimeline:2,maxAttempts:1,policy:'hold-gate',summon:false});assert.equal(trace.stopReason,'battle-timeout');assert.equal(trace.attempts,1);assert.equal(trace.attemptRows.length,0);assert.ok(trace.combatTimeout);assert.equal(trace.transitions.length,0);assert.ok(!trace.actions.some(a=>a.action.type==='retry'));assert.equal(trace.ledger.expectedGems,trace.finalProfile.gems);assert.equal(trace.ledger.expectedCoins,trace.finalProfile.coins);
});
