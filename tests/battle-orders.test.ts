import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, loadProfile } from '../src/game/save.ts';
import { activeBattleOrder, createBattleOrders, earnMomentum } from '../src/game/battle-orders.ts';
import type { Unit } from '../src/game/types.ts';
const fresh=()=>{const p=defaultProfile();p.chronicle!.enabled=false;const g=new Game(p);g.dispatch({type:'start'});g.state.food=99;return g;};
const enemy=(x=160):Unit=>({id:99,side:'enemy',kind:0,age:0,x,lane:0,hp:1000,maxHp:1000,attackTimer:0,attacking:false,hitFlash:0});
const armed=(order:'advance'|'hold')=>{const g=fresh();g.state.orders!.charge=60;assert.equal(g.dispatch({type:'order',order}),true);return g;};

test('only accepted deployments earn momentum; cap is100',()=>{
 const g=fresh();for(let i=0;i<5;i++)assert(g.dispatch({type:'spawn',kind:0}));assert.equal(g.state.orders!.charge,60);
 g.state.food=0;assert.equal(g.dispatch({type:'spawn',kind:0}),false);assert.equal(g.state.orders!.charge,60);
 earnMomentum(g.state,200);assert.equal(g.state.orders!.charge,100);
});
test('unavailable paused invalid and repeated orders reject without mutation',()=>{
 const g=fresh();const reject=(order:any)=>{const before=JSON.stringify([g.state,g.profile]);assert.equal(g.dispatch({type:'order',order}),false);assert.equal(JSON.stringify([g.state,g.profile]),before);};
 reject('advance');g.state.orders!.charge=60;reject('invalid');g.dispatch({type:'pause'});reject('hold');g.dispatch({type:'pause'});
 assert(g.dispatch({type:'order',order:'advance'}));assert.equal(g.state.orders!.charge,0);reject('hold');reject('advance');
 assert.equal(g.state.stats.ordersCast,1);assert.equal(g.drainEvents().filter(e=>e.type==='order').length,1);
});
test('order strength lasts ten simulation seconds and pause freezes expiry',()=>{
 const g=armed('hold');assert.equal(activeBattleOrder(g.state,g.state.time),'hold');g.dispatch({type:'pause'});for(let i=0;i<100;i++)g.step(.25);assert.equal(g.state.time,0);assert.equal(activeBattleOrder(g.state,g.state.time),'hold');g.dispatch({type:'pause'});
 for(let i=0;i<39;i++)g.step(.25);assert.equal(activeBattleOrder(g.state,g.state.time),'hold');g.step(.25);assert.equal(activeBattleOrder(g.state,g.state.time),null);
});
test('retry and old-save loading clear transient order strength',()=>{
 const g=armed('advance');g.dispatch({type:'retreat'});assert(g.dispatch({type:'retry'}));assert.deepEqual(g.state.orders,createBattleOrders());assert.equal(g.state.stats.ordersCast,0);
 const p=loadProfile({getItem:()=>JSON.stringify({...g.profile,orders:{charge:100,active:'advance',until:999}})});const restored=new Game(p);assert.deepEqual(restored.state.orders,createBattleOrders());
});
const fight=(order?:'advance'|'hold')=>{const g=order?armed(order):fresh();assert(g.dispatch({type:'spawn',kind:0}));g.state.units[0].x=140;g.state.units.push(enemy());g.step(1/60);return g;};
test('Advance boosts normal troop damage by20percent and movement by15percent',()=>{
 const base=fight(),boost=fight('advance');assert(Math.abs(boost.state.stats.damageDealt/base.state.stats.damageDealt-1.2)<1e-9);
 const a=fresh(),b=armed('advance');a.dispatch({type:'spawn',kind:0});b.dispatch({type:'spawn',kind:0});a.step(1/60);b.step(1/60);assert(Math.abs((b.state.units[0].x-140)/(a.state.units[0].x-140)-1.15)<1e-8);
});
test('Hold reduces incoming troop and gate damage by25percent',()=>{
 const base=fight(),hold=fight('hold');assert(Math.abs(hold.state.stats.damageTaken/base.state.stats.damageTaken-.75)<1e-9);
 const a=fresh(),b=armed('hold');a.state.units.push(enemy(90));b.state.units.push(enemy(90));a.step(1/60);b.step(1/60);assert(Math.abs(b.state.stats.gateDamageTaken/a.state.stats.gateDamageTaken-.75)<1e-9);
});
test('real enemy death earns momentum once; skill damage is not boosted',()=>{
 for(const order of [undefined,'advance'] as const){const g=order?armed(order):fresh();g.state.units.push({...enemy(500),hp:1});g.dispatch({type:'skill',skill:'meteor'});assert.equal(g.state.orders!.charge,8);assert.equal(g.state.stats.kills,1);g.step(1/60);assert.equal(g.state.orders!.charge,8);}
 const a=fresh(),b=armed('advance');a.state.units.push(enemy(500));b.state.units.push(enemy(500));a.dispatch({type:'skill',skill:'meteor'});b.dispatch({type:'skill',skill:'meteor'});assert.equal(a.state.stats.damageDealt,b.state.stats.damageDealt);
});
