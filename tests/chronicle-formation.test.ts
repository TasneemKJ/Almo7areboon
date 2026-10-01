import test from 'node:test';
import assert from 'node:assert/strict';
import {chronicleFormationFrame,chronicleThreadDepth,chronicleThreadStyle} from '../src/view/chronicle-formation.ts';
import {paintChronicleFormation} from '../src/view/chronicle-formation-paint.ts';
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

test('malformed coordinates and timers cannot manufacture a protector relationship',()=>{
 const target=unit(1,'player',1,400,1),guard=unit(2,'player',0,430,1);const s=state([target,guard]);
 for(const poison of [()=>{guard.x=NaN;},()=>{guard.lane=NaN;},()=>{guard.breachedUntil=NaN;},()=>{s.time=NaN;},()=>{target.x=NaN;}]){Object.assign(target,{x:400,lane:1});Object.assign(guard,{x:430,lane:1,breachedUntil:0});s.time=5;poison();assert.deepEqual(chronicleFormationFrame(s).links,[]);}
});

test('malformed duplicate rally ids render only their authoritative first assignment',()=>{
 const s=state([unit(1,'player',0,180,0),unit(2,'player',1,180,1)]);s.chronicle!.rally=true;s.chronicle!.gathered=[1,2,999,1];
 assert.deepEqual(chronicleFormationFrame(s).rally.map(mark=>[mark.unitId,mark.holdX]),[[1,240],[2,240]]);
});

test('both sides and breach states have pigment plus shape distinction',()=>{
 const styles=[chronicleThreadStyle('player','active'),chronicleThreadStyle('enemy','active'),chronicleThreadStyle('player','breached'),chronicleThreadStyle('enemy','breached')];
 assert.equal(new Set(styles.map(style=>style.colour)).size,4);assert.equal(new Set(styles.map(style=>style.glyph)).size,4);
});

test('the painter executes active, breached and rally commands deterministically without motion state',()=>{
 class Painter {calls:Array<[string,...number[]]>=[];lineStyle(...v:number[]){this.calls.push(['lineStyle',...v]);return this;}lineBetween(...v:number[]){this.calls.push(['lineBetween',...v]);return this;}beginPath(){this.calls.push(['beginPath']);return this;}moveTo(...v:number[]){this.calls.push(['moveTo',...v]);return this;}lineTo(...v:number[]){this.calls.push(['lineTo',...v]);return this;}strokePath(){this.calls.push(['strokePath']);return this;}fillStyle(...v:number[]){this.calls.push(['fillStyle',...v]);return this;}fillEllipse(...v:number[]){this.calls.push(['fillEllipse',...v]);return this;}fillTriangle(...v:number[]){this.calls.push(['fillTriangle',...v]);return this;}strokeEllipse(...v:number[]){this.calls.push(['strokeEllipse',...v]);return this;}fillCircle(...v:number[]){this.calls.push(['fillCircle',...v]);return this;}}
 const frame={links:[{targetId:1,protectorId:2,side:'player' as const,status:'active' as const,targetX:400,targetLane:1,protectorX:430,protectorLane:0},{targetId:3,protectorId:4,side:'enemy' as const,status:'breached' as const,targetX:600,targetLane:2,protectorX:570,protectorLane:2}],rally:[{unitId:5,unitX:180,unitLane:1,holdX:240,holdLane:1}]};
 const render=()=>{const layers=[new Painter(),new Painter(),new Painter()];paintChronicleFormation(layers,frame,280,12);return layers.map(layer=>layer.calls);},first=render();
 assert.ok(first[0].some(([name])=>name==='beginPath'));assert.ok(first[1].some(([name])=>name==='fillCircle'));assert.ok(first[2].filter(([name])=>name==='lineBetween').length>=5);assert.deepEqual(render(),first);
});

test('pause changes no formation or painter command because marks carry no motion clock',()=>{
 const s=state([unit(1,'player',1,400,1),unit(2,'player',0,430,0)]),before=chronicleFormationFrame(s);s.paused=true;assert.deepEqual(chronicleFormationFrame(s),before);
});

test('thread depth follows the rear-most endpoint and stays behind actors on that foot plane',()=>{
 assert.equal(chronicleThreadDepth(280,2,0,12),278);
 assert.equal(chronicleThreadDepth(280,2,1,12),290);
 assert.equal(chronicleThreadDepth(280,99,NaN,12),290);
 const lowestStaggeredActor=280+12-2.2+.5;assert.ok(chronicleThreadDepth(280,2,1,12)<lowestStaggeredActor);
});
