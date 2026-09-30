import test from 'node:test';
import assert from 'node:assert/strict';
import { createChronicle, type RouteId } from '../src/game/chronicle.ts';
import { createChronicleBattle, chronicleSpawn, toggleRally, rallyPosition, chronicleDamage, chronicleAfterHit, chronicleTick, chronicleOutcome, captainSkill, chronicleSkill, chronicleStartingFood, chronicleGateFactor, chronicleGuidance } from '../src/game/chronicle-combat.ts';
import type { Profile, BattleState, Unit, GameEvent } from '../src/game/types.ts';
function fixture(route:RouteId='road'){
 const profile={age:0,enemyAge:0,timeline:1,chronicle:{...createChronicle(),route}} as Profile;
 const state={phase:'running',paused:false,time:0,food:6,playerHp:180,playerMaxHp:180,enemyHp:160,enemyMaxHp:160,freezeUntil:0,units:[],skillsUsed:[],stats:{deployedByKind:[0,0,0],damageTaken:0,damageDealt:0}} as unknown as BattleState;
 state.chronicle=createChronicleBattle(profile);
 const events:GameEvent[]=[];
 const host={hurt:(u:Unit,d:number)=>{const n=Math.min(u.hp,d);u.hp-=n;return n;},spawnEnemy:(kind:0|1|2)=>{const u=unit(state.units.length+10,'enemy',kind,800);state.units.push(u);return u;},emit:(e:GameEvent)=>events.push(e)};
 return {profile,state,host,events};
}
const unit=(id:number,side:'player'|'enemy',kind:0|1|2,x=200):Unit=>({id,side,kind,age:0,x,lane:0,hp:100,maxHp:100,attackTimer:0,attacking:false,hitFlash:0});
test('rally gathers only new troops, holds a bounded line and releases by one order',()=>{
 const f=fixture(),old=unit(1,'player',0,400);f.state.units.push(old);assert.equal(toggleRally(f.profile,f.state),true);
 const fresh=unit(2,'player',1);f.state.units.push(fresh);chronicleSpawn(f.profile,f.state,fresh);
 assert.equal(rallyPosition(f.state,old),null);assert.equal(rallyPosition(f.state,fresh),240);
 assert.equal(toggleRally(f.profile,f.state),true);assert.equal(rallyPosition(f.state,fresh),null);assert.equal(f.state.chronicle!.rally,false);
});
test('six assembled troops release automatically and pause blocks orders',()=>{
 const f=fixture();toggleRally(f.profile,f.state);
 for(let i=0;i<6;i++){const u=unit(i+1,'player',0,240-Math.floor(i/3)*24);f.state.units.push(u);chronicleSpawn(f.profile,f.state,u);}
 chronicleTick(f.profile,f.state,1/60,f.host);assert.equal(f.state.chronicle!.rally,false);
 f.state.paused=true;const before=JSON.stringify(f.state);assert.equal(toggleRally(f.profile,f.state),false);chronicleTick(f.profile,f.state,1,f.host);assert.equal(JSON.stringify(f.state),before);
});
test('a living forward defender protects a ranged ally, never a dead or rear guard',()=>{
 const f=fixture(),attacker=unit(1,'enemy',1,600),target=unit(2,'player',1,400),guard=unit(3,'player',0,440);f.state.units=[attacker,target,guard];
 assert.equal(chronicleDamage(f.profile,f.state,attacker,target,100),65);
 guard.hp=0;assert.equal(chronicleDamage(f.profile,f.state,attacker,target,100),100);
 guard.hp=100;guard.x=350;assert.equal(chronicleDamage(f.profile,f.state,attacker,target,100),100);
});
test('heavy breach temporarily cancels a defender’s role protection',()=>{
 const f=fixture(),heavy=unit(1,'player',2),guard=unit(2,'enemy',0,220),archer=unit(3,'player',1);
 chronicleAfterHit(f.profile,f.state,heavy,guard,10,false,f.host);
 assert.equal(chronicleDamage(f.profile,f.state,archer,guard,75),100);
 f.state.time=3;assert.equal(chronicleDamage(f.profile,f.state,archer,guard,75),75);
});
test('a frozen target shatters once and splash is bounded to two neighbours',()=>{
 const f=fixture(),heavy=unit(1,'player',2),victim=unit(2,'enemy',0,230);f.state.units=[heavy,victim,...[3,4,5].map(i=>unit(i,'enemy',0,230+i))];f.state.freezeUntil=7;chronicleSkill(f.profile,f.state,'freeze');
 chronicleAfterHit(f.profile,f.state,heavy,victim,20,false,f.host);assert.equal(f.state.units[2].hp,93);assert.equal(f.state.units[3].hp,93);assert.equal(f.state.units[4].hp,100);
 chronicleAfterHit(f.profile,f.state,heavy,victim,20,false,f.host);assert.equal(f.state.units[2].hp,93);assert.equal(f.state.chronicle!.shatters,1);
});
test('the Bell Keeper is a real actor with a telegraphed interruptible attack',()=>{
 const f=fixture('bell');f.state.time=6;chronicleTick(f.profile,f.state,1/60,f.host);const boss=f.state.units.find(u=>u.storyBoss)!;assert.ok(boss);assert.ok(boss.maxHp>100);
 f.state.time=14;chronicleTick(f.profile,f.state,1/60,f.host);assert.ok(f.state.chronicle!.boss.windupUntil>f.state.time);
 const heavy=unit(1,'player',2,boss.x-10);chronicleAfterHit(f.profile,f.state,heavy,boss,12,false,f.host);assert.equal(f.state.chronicle!.boss.windupUntil,0);assert.equal(f.state.chronicle!.boss.interrupts,1);
});
test('completed bell windup summons a bounded coat company',()=>{
 const f=fixture('bell');f.state.time=6;chronicleTick(f.profile,f.state,1/60,f.host);f.state.time=14;chronicleTick(f.profile,f.state,1/60,f.host);f.state.time=19;chronicleTick(f.profile,f.state,1/60,f.host);
 assert.equal(f.state.units.filter(u=>!u.storyBoss).length,2);assert.equal(f.state.chronicle!.boss.rings,1);
});
test('holding and escorting have outcomes independent of enemy-gate health',()=>{
 const f=fixture('watch');f.state.time=74;f.state.enemyHp=0;assert.equal(chronicleOutcome(f.profile,f.state),null);f.state.time=75;assert.equal(chronicleOutcome(f.profile,f.state),'won');f.state.playerHp=0;assert.equal(chronicleOutcome(f.profile,f.state),'lost');
 const e=fixture('escort');e.state.enemyHp=0;assert.equal(chronicleOutcome(e.profile,e.state),null);e.state.chronicle!.cart.x=790;assert.equal(chronicleOutcome(e.profile,e.state),'won');e.state.chronicle!.cart.hp=0;assert.equal(chronicleOutcome(e.profile,e.state),'lost');
});
test('escort cart moves with friends, stops under threat and takes bounded damage',()=>{
 const f=fixture('escort');f.state.units=[unit(1,'player',0,225)];const x=f.state.chronicle!.cart.x;chronicleTick(f.profile,f.state,.1,f.host);assert.ok(f.state.chronicle!.cart.x>x);
 f.state.units.push(unit(2,'enemy',0,235));const stopped=f.state.chronicle!.cart.x;chronicleTick(f.profile,f.state,.1,f.host);assert.equal(f.state.chronicle!.cart.x,stopped);assert.ok(f.state.chronicle!.cart.hp<f.state.chronicle!.cart.maxHp);
});
test('scout rescue takes occupation and then returns home rather than stalling for escorts',()=>{
 const f=fixture('scout');f.state.units=[unit(1,'player',0,620)];for(let i=0;i<250;i++){f.state.time+=1/60;chronicleTick(f.profile,f.state,1/60,f.host);}assert.equal(f.state.chronicle!.rescued,true);
 for(let i=0;i<600;i++){f.state.time+=1/60;chronicleTick(f.profile,f.state,1/60,f.host);}assert.equal(chronicleOutcome(f.profile,f.state),'won');
});
test('lantern victory needs occupation, not just gate damage',()=>{
 const f=fixture('lantern');f.state.enemyHp=0;assert.equal(chronicleOutcome(f.profile,f.state),null);f.state.units=[unit(1,'player',0,500)];
 for(let i=0;i<1300;i++){f.state.time+=1/60;chronicleTick(f.profile,f.state,1/60,f.host);}assert.equal(f.state.chronicle!.landmark.owner,'player');assert.equal(chronicleOutcome(f.profile,f.state),'won');
});
test('captains replace rather than add a skill, and original Food Drop stays available with none',()=>{
 const f=fixture();assert.equal(captainSkill(f.profile,f.state),false);f.profile.chronicle!.captain='gatekeeper';assert.equal(captainSkill(f.profile,f.state),true);assert.ok(f.state.chronicle!.shieldUntil>f.state.time);
 f.profile.chronicle!.captain='lantern';assert.equal(captainSkill(f.profile,f.state),true);assert.ok(f.state.chronicle!.revealUntil>f.state.time);
});
test('preparation and expedition reserve are bounded and have different consequences',()=>{
 const f=fixture();assert.equal(chronicleStartingFood(f.profile),0);f.profile.chronicle!.preparation='bread';assert.equal(chronicleStartingFood(f.profile),3);f.profile.chronicle!.preparation='repair';assert.equal(chronicleGateFactor(f.profile),1.15);
});
test('guidance names the current objective and new-player action',()=>{
 const f=fixture('escort');assert.match(chronicleGuidance(f.profile,f.state),/cart/i);
 const road=fixture();assert.match(chronicleGuidance(road.profile,road.state),/defender|troop|deploy/i);
});
