import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPresentationFrame } from '../src/view/order-presentation.ts';
import { Game } from '../src/game/simulation.ts';

test('inactive and reset order frames draw nothing',()=>{
 const g=new Game();assert.equal(orderPresentationFrame(g.state,300,false),null);g.dispatch({type:'start'});g.state.orders!.charge=60;g.dispatch({type:'order',order:'hold'});assert(orderPresentationFrame(g.state,300,false));g.dispatch({type:'retreat'});g.dispatch({type:'retry'});assert.equal(orderPresentationFrame(g.state,300,false),null);
});
test('order marks exclude dead and enemy units and cap the pool',()=>{
 const g=new Game();g.dispatch({type:'start'});g.state.orders!.charge=60;g.dispatch({type:'order',order:'advance'});g.state.food=99;g.dispatch({type:'spawn',kind:0});const u=g.state.units[0];g.state.units=[...Array.from({length:60},(_,id)=>({...u,id,x:140+id*5})),{...u,id:99,side:'enemy',hp:20},{...u,id:100,hp:0}];
 const f=orderPresentationFrame(g.state,300,false)!;assert.equal(f.marks.length,24);assert(f.marks.every(m=>m.id<60&&m.x>=0&&m.x<=450));assert.equal(f.order,'advance');
});
test('reduced-motion order identity remains static and readable',()=>{
 const g=new Game();g.dispatch({type:'start'});g.state.orders!.charge=60;g.dispatch({type:'order',order:'hold'});g.state.food=99;g.dispatch({type:'spawn',kind:0});const a=orderPresentationFrame(g.state,300,true)!;g.state.time=2;const b=orderPresentationFrame(g.state,300,true)!;
 assert.deepEqual(a.marks,b.marks);assert.equal(a.pulse,1);assert.equal(b.pulse,1);assert.equal(b.order,'hold');assert(b.pennant.x>=110,'order identity clears the player gate silhouette');
});

test('one authoritative order frame owns a short village answer on simulation time',()=>{
 const g=new Game();g.dispatch({type:'start'});g.state.time=12;g.state.orders!.charge=60;g.dispatch({type:'order',order:'advance'});
 const opening=orderPresentationFrame(g.state,300,false)!;assert.deepEqual(opening.answer,{kind:'advance',progress:0});
 g.state.time=13.2;const middle=orderPresentationFrame(g.state,300,false)!;assert.ok(middle.answer&&middle.answer.progress>.49&&middle.answer.progress<.51);
 g.state.paused=true;const frozen=orderPresentationFrame(g.state,300,false)!.answer;assert.deepEqual(frozen,middle.answer,'pause freezes the simulation-owned answer');
 g.state.time=14.4;assert.equal(orderPresentationFrame(g.state,300,false)!.answer,null,'the village settles while the ten-second order remains active');
 assert.equal(orderPresentationFrame(g.state,300,false)!.order,'advance');
});

test('reduced motion keeps a static village answer without extending its lifetime',()=>{
 const g=new Game();g.dispatch({type:'start'});g.state.orders!.charge=60;g.dispatch({type:'order',order:'hold'});
 assert.deepEqual(orderPresentationFrame(g.state,300,true)!.answer,{kind:'hold',progress:1});
 g.state.time=2.4;assert.equal(orderPresentationFrame(g.state,300,true)!.answer,null);
});

test('gate pennant becomes ready only when the real command can be accepted',()=>{
 const g=new Game();g.state.orders!.charge=100;
 assert.equal(orderPresentationFrame(g.state,300,false),null,'preparation is not command readiness');
 g.dispatch({type:'start'});g.state.orders!.charge=59.99;
 assert.equal(orderPresentationFrame(g.state,300,false),null,'below the actual 60 momentum cost');
 g.state.orders!.charge=60;const before=JSON.stringify(g.state),ready=orderPresentationFrame(g.state,300,false)!;
 assert.ok(ready,'the gate should acknowledge a charged command');assert.equal(ready.ready,true);assert.equal(ready.order,null);
 assert.equal(ready.answer,null,'readiness must not pretend a command happened');assert.deepEqual(ready.marks,[]);
 assert.equal(JSON.stringify(g.state),before,'presentation cannot spend momentum');
 g.dispatch({type:'pause'});assert.equal(orderPresentationFrame(g.state,300,false),null,'a paused command is unavailable');
 g.dispatch({type:'pause'});assert.equal(g.dispatch({type:'order',order:'hold'}),true);
 const active=orderPresentationFrame(g.state,300,false)!;assert.equal(active.ready,false);assert.equal(active.order,'hold');
 assert.equal(g.state.orders!.charge,0);assert.equal(g.state.orders!.until,10);
 g.state.orders!.charge=100;assert.equal(orderPresentationFrame(g.state,300,false)!.ready,false,'charge earned during an order cannot offer an overlapping cast');
 g.dispatch({type:'retreat'});assert.equal(orderPresentationFrame(g.state,300,false),null);
 g.dispatch({type:'retry'});assert.equal(orderPresentationFrame(g.state,300,false),null);
});

test('readiness stays quieter than an active order and reduced motion has static cloth',()=>{
 const g=new Game();g.dispatch({type:'start'});g.state.orders!.charge=60;
 const still=orderPresentationFrame(g.state,300,true)!;assert.ok(still,'charged readiness exists');
 g.state.time=7;assert.deepEqual(orderPresentationFrame(g.state,300,true),still);
 const moving=orderPresentationFrame(g.state,300,false)!;
 assert.ok(Math.abs(moving.pennant.tipOffset)<=1,'cloth motion is no larger than a source-space pixel');
 assert.equal(g.dispatch({type:'order',order:'advance'}),true);const active=orderPresentationFrame(g.state,300,false)!;
 assert.ok(still.pennant.alpha<active.pennant.alpha);assert.ok(still.pennant.width<active.pennant.width);
 assert.equal(still.pennant.x,active.pennant.x,'the same existing gate pennant owns readiness and order identity');
 assert.equal(still.pennant.y,active.pennant.y);assert.equal(still.pennant.tipOffset,0);
});
