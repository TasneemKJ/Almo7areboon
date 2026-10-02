/** Prepared-state boundary sweeps, not organic player campaigns or browser playthroughs. */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Game} from '../../src/game/simulation.ts';
import {defaultProfile,loadProfileWithStatus,saveProfile,SAVE_KEY,BACKUP_KEY,MAX_SAVE_CHARS} from '../../src/game/save.ts';
import {exportBackup,importBackup} from '../../src/game/backup.ts';
import {ERAS,unlockCost,foodUpgradeCost,baseUpgradeCost} from '../../src/game/data.ts';
import {cardPackCost} from '../../src/game/cards.ts';
import {createChronicle,ROUTES} from '../../src/game/chronicle.ts';
import {createMastery} from '../../src/game/mastery.ts';
import {prestigePreview} from '../../src/game/prestige.ts';
import {simulateChronicle,preparedChronicleProfile} from '../simulate-chronicle.ts';
import type {Profile,Action,UnitKind} from '../../src/game/types.ts';
const out=process.env.QA_OUT??'artifacts/expanded-qa/domain';mkdirSync(out,{recursive:true});
type Case={behavior:string;dimensions:Record<string,unknown>;status:string;error?:string;metrics?:unknown};
const report={scope:'New deterministic boundary sweeps; disclosed prepared profiles and state values; no physical-device or organic-balance claims',cases:[] as Case[],observations:[] as unknown[],started:new Date().toISOString()};
function check(behavior:string,dimensions:Record<string,unknown>,fn:()=>unknown){
 const item:Case={behavior,dimensions,status:'failed'};report.cases.push(item);
 try{item.metrics=fn();item.status='passed';}catch(error){item.error=error instanceof Error?error.stack:String(error);console.error('FAIL',behavior,JSON.stringify(dimensions),item.error);}
}
const snapshot=(g:Game)=>JSON.stringify({p:g.profile,s:g.state,events:g.events});
function rejected(g:Game,a:Action){const before=snapshot(g);assert.equal(g.dispatch(a),false,`reject ${JSON.stringify(a)}`);assert.equal(snapshot(g),before,'rejected command must be mutation-free');}
function fixture(age=0,timeline=1):Profile{const p=defaultProfile();p.age=age;p.enemyAge=age;p.timeline=timeline;p.furthestBattle=5;p.chronicle=createChronicle(timeline,age);p.mastery=createMastery(timeline);return p;}
function finite(value:unknown,path='state'):void{if(typeof value==='number')assert.ok(Number.isFinite(value),`${path} must be finite`);else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))finite(item,`${path}.${key}`);}
function invariant(g:Game){
 finite(g.state);finite(g.profile);assert.ok(g.profile.coins>=0&&g.profile.coins<=1e9);assert.ok(g.profile.gems>=0&&g.profile.gems<=1e7);
 assert.ok(g.state.food>=-1e-8&&g.state.food<=99);assert.ok(g.state.playerHp>=0&&g.state.playerHp<=g.state.playerMaxHp+1e-8);
 assert.ok(g.state.enemyHp>=0);assert.ok(g.state.units.every(u=>u.hp>=0&&u.hp<=u.maxHp+1e-8));
 assert.equal(new Set(g.state.units.map(u=>u.id)).size,g.state.units.length);assert.equal(new Set(g.state.skillsUsed).size,g.state.skillsUsed.length);
}
for(let age=0;age<6;age++){
 check('ready-combat-and-advance-gates',{age},()=>{
  const g=new Game(fixture(age));for(const a of [{type:'spawn',kind:0},{type:'skill',skill:'freeze'},{type:'pause'},{type:'retreat'},{type:'retry'},{type:'next'}] as Action[])rejected(g,a);invariant(g);
 });
 check('paused-combat-time-and-input-gates',{age},()=>{
  const p=fixture(age);p.baseLevel=100;p.unlocked=[true,true,true];const g=new Game(p);
  g.dispatch({type:'start'});g.dispatch({type:'spawn',kind:0});g.dispatch({type:'pause'});const before=snapshot(g);
  for(const dt of [1/60,0.25,0,NaN,-1,Infinity])g.step(dt);assert.equal(snapshot(g),before);
  for(const a of [{type:'spawn',kind:0},{type:'skill',skill:'food'},{type:'skill',skill:'freeze'},{type:'rally'}] as Action[])rejected(g,a);
  assert.equal(g.dispatch({type:'pause'}),true);g.step(1/60);assert.ok(g.state.time>0);
 });
 for(const kind of [0,1,2] as UnitKind[])check('troop-affordability-edges',{age,kind},()=>{
  const p=fixture(age);p.unlocked=[true,true,true];const g=new Game(p);g.dispatch({type:'start'});const cost=ERAS[age].units[kind].cost;
  g.state.food=cost-0.0001;rejected(g,{type:'spawn',kind});g.state.food=cost;assert.equal(g.dispatch({type:'spawn',kind}),true);assert.equal(g.state.food,0);assert.equal(g.state.stats.deployed,1);rejected(g,{type:'spawn',kind});invariant(g);
 });
 for(const kind of [1,2] as UnitKind[])check('troop-unlock-wallet-and-repeat',{age,kind},()=>{
  const p=fixture(age);p.coins=unlockCost(kind,p)-1;const g=new Game(p);rejected(g,{type:'unlock',kind});g.profile.coins++;assert.equal(g.dispatch({type:'unlock',kind}),true);assert.equal(g.profile.coins,0);rejected(g,{type:'unlock',kind});
 });
 for(const stat of ['food','base'] as const)check('upgrade-affordability-and-cap',{age,stat},()=>{
  const p=fixture(age),cost=stat==='food'?foodUpgradeCost(p):baseUpgradeCost(p);p.coins=cost-1;const g=new Game(p);rejected(g,{type:'upgrade',stat});g.profile.coins++;
  assert.equal(g.dispatch({type:'upgrade',stat}),true);assert.equal(g.profile.coins,0);const key=stat==='food'?'foodLevel':'baseLevel';g.profile[key]=100;g.profile.coins=1e9;rejected(g,{type:'upgrade',stat});invariant(g);
 });
 check('skill-once-empty-target-and-food-cap',{age},()=>{
  const p=fixture(age);p.baseLevel=100;const g=new Game(p);g.dispatch({type:'start'});rejected(g,{type:'skill',skill:'meteor'});g.state.food=99;rejected(g,{type:'skill',skill:'food'});
  g.state.food=98.5;assert.equal(g.dispatch({type:'skill',skill:'food'}),true);assert.equal(g.state.food,99);rejected(g,{type:'skill',skill:'food'});
  assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);rejected(g,{type:'skill',skill:'freeze'});
  for(let t=0;t<3600&&!g.state.units.some(u=>u.side==='enemy');t++)g.step(1/60);
  assert.ok(g.state.units.some(u=>u.side==='enemy'));assert.equal(g.dispatch({type:'skill',skill:'meteor'}),true);rejected(g,{type:'skill',skill:'meteor'});invariant(g);
 });
 check('running-progression-blocks-and-retreat-repeat',{age},()=>{
  const p=fixture(age);p.coins=1e9;const g=new Game(p);g.dispatch({type:'start'});
  for(const a of [{type:'start'},{type:'retry'},{type:'next'},{type:'evolve'},{type:'select-battle',battle:0},{type:'chronicle-route',route:'escort',battle:age}] as Action[])rejected(g,a);
  const coins=g.profile.coins,gems=g.profile.gems;assert.equal(g.dispatch({type:'retreat'}),true);rejected(g,{type:'retreat'});assert.equal(g.profile.coins,coins);assert.equal(g.profile.gems,gems);assert.equal(g.profile.pendingVictory,null);assert.equal(g.dispatch({type:'retry'}),true);assert.equal(g.state.phase,'ready');
 });
 check('evolution-cost-reset-and-persistent-progression',{age},()=>{
  const p=fixture(age);p.foodLevel=5;p.baseLevel=4;p.unlocked=[true,true,true];p.cards[0]=2;p.gems=1234;p.coins=age<5?ERAS[age].evolveCost:1e9;const g=new Game(p);
  if(age===5){rejected(g,{type:'evolve'});return;}
  assert.equal(g.dispatch({type:'evolve'}),true);assert.equal(g.profile.age,age+1);assert.equal(g.profile.enemyAge,age);assert.equal(g.profile.coins,0);assert.equal(g.profile.gems,1234);assert.equal(g.profile.cards[0],2);assert.equal(g.profile.foodLevel,0);assert.equal(g.profile.baseLevel,0);assert.deepEqual(g.profile.unlocked,[true,false,false]);invariant(g);
 });
}
for(const timeline of [1,2,3,4])for(let age=0;age<6;age++)for(const route of ROUTES)check('route-simulation-invariants-and-save-receipt',{timeline,age,route:route.id},()=>{
 const p={...preparedChronicleProfile(),age,enemyAge:age,timeline,furthestBattle:5};p.chronicle=createChronicle(timeline,age);p.mastery=createMastery(timeline);p.chronicle.clears=Array(6).fill(127);p.chronicle.discoveries=7;p.chronicle.restoration=7;
 const g=simulateChronicle(route.id,p);invariant(g);const decoded=importBackup(exportBackup(g.profile,new Date('2026-01-01T00:00:00Z')));assert.ok(decoded.ok);if(!decoded.ok)return;const copy=new Game(decoded.profile);
 assert.equal(copy.profile.coins,g.profile.coins);assert.equal(copy.profile.gems,g.profile.gems);assert.equal(copy.profile.wins,g.profile.wins);
 if(g.state.phase==='won'){assert.equal(copy.state.phase,'won');const before=JSON.stringify(copy.profile);for(let t=0;t<10;t++)copy.step(.25);assert.equal(JSON.stringify(copy.profile),before);}else assert.equal(copy.state.phase,'ready','non-victory battlefield is intentionally not persisted');
 if(g.state.phase==='running')report.observations.push({timeline,age,route:route.id,outcome:'not terminal at policy horizon; not classified as game defect'});
 return {phase:g.state.phase,time:g.state.time,deployed:g.state.stats.deployed,earned:g.state.earned};
});
for(const timeline of [1,2,999,1000])check('timeline-prestige-guard-reset-and-replay',{timeline},()=>{
 const p=fixture(5,timeline);p.coins=99999;p.gems=1000;p.cards[0]=4;p.mastery.chapters[5].earnedMask=1;const g=new Game(p);const preview=prestigePreview(p,g.state,'hearth');rejected(g,{type:'prestige',expectedTimeline:timeline-1,legacy:'hearth'});
 if(timeline===1000){assert.equal(preview,null);rejected(g,{type:'prestige',expectedTimeline:timeline,legacy:'hearth'});return;}
 assert.ok(preview);assert.equal(g.dispatch({type:'prestige',expectedTimeline:timeline,legacy:'hearth'}),true);assert.equal(g.profile.timeline,timeline+1);assert.equal(g.profile.age,0);assert.equal(g.profile.enemyAge,0);assert.equal(g.profile.cards[0],4);assert.equal(g.profile.gems,preview!.gemsAfter);assert.equal(g.profile.coins,0);rejected(g,{type:'prestige',expectedTimeline:timeline,legacy:'hearth'});invariant(g);
});
check('expedition-three-stages-consume-receipt-once',{},()=>{
 const p=preparedChronicleProfile();p.foodLevel=30;p.baseLevel=100;let g=new Game(p);assert.equal(g.dispatch({type:'chronicle-expedition',battle:0}),true);rejected(g,{type:'chronicle-continue'});
 for(let stage=0;stage<3;stage++){assert.equal(g.profile.chronicle!.expedition!.stage,stage);g=simulateChronicle(g.profile.chronicle!.route,g.profile);assert.equal(g.state.phase,'won');assert.equal(g.dispatch({type:'chronicle-provision',provision:'shelter'}),true);assert.equal(g.dispatch({type:'chronicle-continue'}),true);rejected(g,{type:'chronicle-continue'});}
 assert.equal(g.profile.chronicle!.expedition,null);assert.equal(g.profile.chronicle!.expeditionsWon,1);
});
for(const count of [1,10,50] as const)check('card-pack-affordability-and-capacity-atomicity',{count},()=>{
 const p=defaultProfile();p.gems=cardPackCost(count)-1;const g=new Game(p);rejected(g,{type:'summon',count});g.profile.gems++;assert.equal(g.dispatch({type:'summon',count}),true);assert.equal(g.profile.gems,0);assert.equal(g.profile.cards.reduce((a,b)=>a+b,0),count);g.profile.cards.fill(1000);g.profile.gems=1e7;rejected(g,{type:'summon',count});
});
const valid=JSON.stringify(defaultProfile()),future=JSON.stringify({...defaultProfile(),version:999});
const saveFixtures={missing:null,valid,corrupt:'{"version":',future,oversized:'x'.repeat(MAX_SAVE_CHARS+1),empty:''};
for(const [pn,primary] of Object.entries(saveFixtures))for(const [bn,backup] of Object.entries(saveFixtures))check('primary-backup-recovery-precedence',{primary:pn,backup:bn},()=>{
 const loaded=loadProfileWithStatus({getItem:key=>key===SAVE_KEY?primary:backup});const expected=pn==='valid'?'loaded':pn==='future'?'unsupported':bn==='valid'?'recovered':bn==='future'?'unsupported':primary||backup?'corrupt':'new';assert.equal(loaded.status,expected);finite(loaded.profile);
});
for(const failure of ['read','primary','backup','future'] as const)check('save-writes-fail-closed-or-retain-durable-primary',{failure},()=>{
 const items=new Map([[SAVE_KEY,failure==='future'?future:valid],[BACKUP_KEY,valid]]);const before=[...items];let writes=0;const next={...defaultProfile(),coins:4321};
 const ok=saveProfile(next,{getItem:k=>{if(failure==='read')throw Error('read failure');return items.get(k)??null;},setItem:(k,v)=>{writes++;if(failure==='primary'&&k===SAVE_KEY||failure==='backup'&&k===BACKUP_KEY)throw Error('write failure');items.set(k,v);}});
 if(failure==='backup'){assert.equal(ok,true);assert.equal(JSON.parse(items.get(SAVE_KEY)!).coins,4321);}else{assert.equal(ok,false);assert.deepEqual([...items],before);if(failure==='read'||failure==='future')assert.equal(writes,0);}
});
for(const kind of ['null','array','truncated','oversized','future','bad-envelope','bom','legacy'] as const)check('backup-import-format-validation',{kind},()=>{
 let text=valid,ok=false;if(kind==='null')text='null';if(kind==='array')text='[]';if(kind==='truncated')text=valid.slice(0,-1);if(kind==='oversized')text=' '.repeat(MAX_SAVE_CHARS+1);if(kind==='future')text=future;if(kind==='bad-envelope')text=JSON.stringify({format:'other',version:1,profile:defaultProfile()});if(kind==='bom'){text='\ufeff'+valid;ok=true;}if(kind==='legacy'){text=JSON.stringify({...defaultProfile(),version:1});ok=true;}assert.equal(importBackup(text).ok,ok);
});
const summary={...report,finished:new Date().toISOString(),distinctBehaviors:[...new Set(report.cases.map(c=>c.behavior))],passed:report.cases.filter(c=>c.status==='passed').length,failed:report.cases.filter(c=>c.status==='failed').length};
writeFileSync(`${out}/report.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify({executions:summary.cases.length,behaviors:summary.distinctBehaviors.length,passed:summary.passed,failed:summary.failed,observations:summary.observations.length}));if(summary.failed)process.exitCode=1;
