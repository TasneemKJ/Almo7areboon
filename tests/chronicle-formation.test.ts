import test from 'node:test';
import assert from 'node:assert/strict';
import {chronicleFormationFrame,chronicleThreadDepth} from '../src/view/chronicle-formation.ts';
import type {BattleState,Unit} from '../src/game/types.ts';

const unit=(id:number,side:'player'|'enemy',kind:0|1|2,x:number,lane=1,breachedUntil=0):Unit=>({id,side,kind,age:0,x,lane,hp:100,maxHp:100,attackTimer:0,attacking:false,hitFlash:0,...(breachedUntil?{breachedUntil}:{})});
function state(units:Unit[],time=5):BattleState {
 return {phase:'running',paused:false,time,units,chronicle:{enabled:true,rally:false,gathered:[]}} as unknown as BattleState;
}

test('a protected ranged troop gets one deterministic active thread to its nearest valid forward guard',()=>{
 const s=state([unit(1,'player',1,400,1),unit(2,'player',0,455,0),unit(3,'player',0,430,2),unit(4,'player',0,350,1)]);
 assert.deepEqual(chronicleFormationFrame(s).links,[{targetId:1,protectorId:3,side:'player',status:'active',targetX:400,targetLane:1,protectorX:430,protectorLane:2}]);
});

test('a sole breached guard leaves a split truthful thread, while another active guard keeps protection intact',()=>{
 const target=unit(1,'player',1,400,1),breached=unit(2,'player',0,425,1,8),active=unit(3,'player',0,440,0);
 assert.equal(chronicleFormationFrame(state([target,breached])).links[0]?.status,'breached');
 assert.deepEqual(chronicleFormationFrame(state([target,breached,active])).links.map(link=>[link.protectorId,link.status]),[[3,'active']]);
});

test('enemy protection mirrors its actual forward direction and invalid guards never create marks',()=>{
 const enemy=state([unit(1,'enemy',1,600,1),unit(2,'enemy',0,555,0),unit(3,'enemy',0,640,1),unit(4,'player',0,570,1)]);
 assert.deepEqual(chronicleFormationFrame(enemy).links.map(link=>[link.targetId,link.protectorId,link.side]),[[1,2,'enemy']]);
 enemy.chronicle!.enabled=false;assert.deepEqual(chronicleFormationFrame(enemy),{links:[],rally:[]});
});

test('crowded formations are frontier-first and hard bounded to six threads per side',()=>{
 const units:Unit[]=[];
 for(let i=0;i<10;i++){units.push(unit(100+i,'player',1,300+i*10,i%3),unit(200+i,'player',0,340+i*10,i%3));}
 const links=chronicleFormationFrame(state(units)).links;
 assert.equal(links.length,6);assert.deepEqual(links.map(link=>link.targetId),[109,108,107,106,105,104]);
});

test('rally knots point gathered living troops to their actual hold positions and remain bounded',()=>{
 const units=Array.from({length:8},(_,i)=>unit(i+1,'player',i%3 as 0|1|2,180+i,i%3));
 const s=state(units);s.chronicle!.rally=true;s.chronicle!.gathered=units.map(u=>u.id);
 assert.deepEqual(chronicleFormationFrame(s).rally.map(mark=>[mark.unitId,mark.holdX,mark.holdLane]),[[1,240,0],[2,240,1],[3,240,2],[4,216,0],[5,216,1],[6,216,2]]);
 units[2].hp=0;assert.deepEqual(chronicleFormationFrame(s).rally.map(mark=>mark.unitId),[1,2,4,5,6]);
});

test('thread depth follows the rear-most endpoint and stays behind actors on that foot plane',()=>{
 assert.equal(chronicleThreadDepth(280,2,0,12),280.25);
 assert.equal(chronicleThreadDepth(280,2,1,12),292.25);
 assert.equal(chronicleThreadDepth(280,99,NaN,12),292.25);
});
