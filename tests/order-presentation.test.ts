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
 assert.deepEqual(a.marks,b.marks);assert.equal(a.pulse,1);assert.equal(b.pulse,1);assert.equal(b.order,'hold');
});
