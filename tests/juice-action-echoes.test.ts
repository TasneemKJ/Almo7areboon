import test from 'node:test';
import assert from 'node:assert/strict';
import type Phaser from 'phaser';
import type {GamePort,Unit} from '../src/game/types.ts';
import {Game} from '../src/game/simulation.ts';
import {createActionEchoes} from '../src/view/action-echoes.ts';

function fixture(reduced=true,realGame?:GamePort) {
 const calls:{name:string;args:unknown[]}[]=[],shakes:unknown[][]=[];let resets=0;
 const graphics=new Proxy({}, {get:(_target,name)=>(...args:unknown[])=>{calls.push({name:String(name),args});return graphics;}}) as Phaser.GameObjects.Graphics;
 const state=realGame?.state??({phase:'running',paused:false,time:4} as GamePort['state']);
 const camera={shake:(...args:unknown[])=>shakes.push(args),shakeEffect:{reset:()=>resets++}} as unknown as Phaser.Cameras.Scene2D.Camera;
 const game=realGame??({state} as GamePort);
 const echoes=createActionEchoes({game,clock:()=>0,reduce:()=>reduced,layout:()=>({groundY:200,laneGap:12}),camera},{fx:graphics,groundFx:[graphics,graphics,graphics]});
 return {echoes,state,calls,shakes,resets:()=>resets};
}

test('reduced action replies retire on battle time even when the view clock stays frozen',()=>{
 const f=fixture(),unit={id:8,x:60,lane:1,side:'player',kind:0} as Unit;
 f.echoes.recordArrival({type:'spawn',x:60,lane:1,side:'player'},[unit]);
 f.echoes.recordProvision({type:'skill',skill:'food',amount:3});
 f.state.time=4.2;f.echoes.step(.2);
 assert.ok(f.calls.some(c=>c.name==='fillEllipse'));
 assert.ok(f.calls.some(c=>c.name==='fillRoundedRect'));
 f.calls.length=0;f.state.time=4.9;f.echoes.step(.7);
 assert.equal(f.calls.length,0,'no contact/provision glyph may survive a completed finite interval');
});

test('paused or ready presentation cannot manufacture recruit arrivals',()=>{
 const f=fixture(false),unit={id:8,x:60,lane:1,side:'player',kind:0} as Unit;
 f.state.paused=true;f.echoes.recordArrival({type:'spawn',x:60,lane:1,side:'player'},[unit]);
 f.state.paused=false;f.state.time=4.1;
 assert.deepEqual(f.echoes.arrivalFor(8),{sx:1,sy:1,lift:0,forward:0});
 f.state.phase='ready';f.echoes.recordArrival({type:'spawn',x:60,lane:1,side:'player'},[unit]);
 f.state.phase='running';assert.equal(f.echoes.arrivalFor(8).lift,0);
 f.echoes.recordArrival({type:'spawn',x:60,lane:1,side:'player'},[unit]);f.state.time=4.25;
 assert.ok(f.echoes.arrivalFor(8).lift>0);f.echoes.reset();assert.equal(f.echoes.arrivalFor(8).lift,0);
});

test('meteor contact is absent until a landing is registered and resets with the scene',()=>{
 const f=fixture();f.echoes.step(.1);assert.equal(f.calls.length,0);
 f.echoes.meteorLanding(150,190);f.echoes.step(.1);
 assert.equal(f.calls.filter(c=>c.name==='strokeEllipse').length,2);
 f.calls.length=0;f.state.time=4.6;f.echoes.step(.6);assert.equal(f.calls.length,0);
 f.echoes.meteorLanding(150,190);f.echoes.reset();f.echoes.step(.1);assert.equal(f.calls.length,0);
});

test('only admitted camera impulses force a cut-in and replacement cancels the live shake',()=>{
 const f=fixture(false);assert.equal(f.echoes.cameraKick(55,.0012,1),true);
 assert.equal(f.echoes.cameraKick(55,.0012,1),false);
 assert.equal(f.echoes.cameraKick(70,.0016,2),true,'a heavy fall may preempt ordinary contact');
 assert.equal(f.echoes.cameraKick(70,.0016,2),false,'crowded heavy falls cannot restart the camera');
 assert.equal(f.echoes.cameraKick(180,.0025,3),true);
 assert.equal(f.echoes.cameraKick(100,.0015,4),true,'the final outcome may preempt an in-flight meteor response');
 assert.equal(f.echoes.cameraKick(100,.0015,4),false);
 assert.deepEqual(f.shakes,[[55,.0012,true],[70,.0016,true],[180,.0025,true],[100,.0015,true]]);
 f.echoes.reset();assert.equal(f.resets(),1);assert.equal(f.echoes.cameraKick(55,.0012,1),true);
 const calm=fixture(true);for(const [duration,intensity,rank] of [[55,.0012,1],[70,.0016,2],[180,.0025,3],[100,.0015,4]])assert.equal(calm.echoes.cameraKick(duration,intensity,rank),false);assert.deepEqual(calm.shakes,[]);
});

for(const phase of ['won','lost'] as const)test(`terminal ${phase} retires replies when the real simulation clock is frozen`,()=>{
 const game=new Game();game.state.phase='running';game.state.time=4;
 const f=fixture(false,game),unit={id:8,x:60,lane:1,side:'player',kind:0} as Unit;
 f.echoes.recordArrival({type:'spawn',x:60,lane:1,side:'player'},[unit]);
 f.echoes.recordProvision({type:'skill',skill:'food',amount:3});f.echoes.meteorLanding(150,190);
 game.state.time=4.1;assert.ok(f.echoes.arrivalFor(8).lift>0);f.echoes.step(.1);assert.ok(f.calls.length>0);
 game.state.phase=phase;f.calls.length=0;const before=JSON.stringify(game.state);
 for(let i=0;i<120;i++){game.step(.05);f.echoes.step(.05);}
 assert.equal(game.state.time,4.1);assert.equal(JSON.stringify(game.state),before);
 assert.equal(f.calls.length,0,'the results frame may not retain a frozen action reply');
 assert.deepEqual(f.echoes.arrivalFor(8),{sx:1,sy:1,lift:0,forward:0});
 game.state.phase='running';f.echoes.step(.05);assert.equal(f.calls.length,0,'restart cannot resurrect retired replies');
});
