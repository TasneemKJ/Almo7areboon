import test from 'node:test';
import assert from 'node:assert/strict';
import type {WavePreview} from '../src/game/encounters.ts';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';

const path='../src/view/wave-arrival.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'wave-arrival presentation model must exist');
 return module;
}
const preview=(nextIn:number,intent:WavePreview['intent']='rush',counts:readonly [number,number,number]=[1,0,0]):WavePreview=>({number:1,total:5,intent,counts,nextIn});

test('road omen exists only for a nonempty wave in the final four running seconds',async()=>{
 const m=await subject(),base={phase:'running',paused:false,reduced:false} as const;
 assert.equal(m.waveArrivalFrame({...base,preview:preview(4.001)}),null,'a signal above the exact window would lie about imminence');
 assert.ok(m.waveArrivalFrame({...base,preview:preview(4)}),'the exact four-second boundary must render');
 assert.ok(m.waveArrivalFrame({...base,preview:preview(0)}),'the launch boundary must remain visible until the schedule advances');
 for(const phase of ['ready','won','lost'] as const)assert.equal(m.waveArrivalFrame({...base,phase,preview:preview(2)}),null);
 assert.equal(m.waveArrivalFrame({...base,preview:null}),null);
 assert.equal(m.waveArrivalFrame({...base,preview:preview(2,'rush',[0,0,0])}),null);
});

test('intent and troop roles use independently readable shapes',async()=>{
 const m=await subject(),base={phase:'running',paused:false,reduced:false} as const;
 const rush=m.waveArrivalFrame({...base,preview:preview(2,'rush',[1,0,0])});
 const volley=m.waveArrivalFrame({...base,preview:preview(2,'volley',[0,1,0])});
 const bulwark=m.waveArrivalFrame({...base,preview:preview(2,'bulwark',[0,0,1])});
 assert.equal(rush.banner.shape,'swallowtail');assert.deepEqual(rush.roleMarks.map((mark:any)=>mark.shape),['footprints']);
 assert.equal(volley.banner.shape,'split-pennant');assert.deepEqual(volley.roleMarks.map((mark:any)=>mark.shape),['sling-stitches']);
 assert.equal(bulwark.banner.shape,'weighted-square');assert.deepEqual(bulwark.roleMarks.map((mark:any)=>mark.shape),['block-tread']);
 assert.equal(new Set([rush.banner.shape,volley.banner.shape,bulwark.banner.shape]).size,3);
 assert.equal(new Set([rush.roleMarks[0].shape,volley.roleMarks[0].shape,bulwark.roleMarks[0].shape]).size,3);
});

test('schedule progress has literal boundaries and four truthful countdown knots',async()=>{
 const m=await subject(),base={phase:'running',paused:false,reduced:false} as const;
 const opening=m.waveArrivalFrame({...base,preview:preview(4,'volley',[1,1,0])});
 const middle=m.waveArrivalFrame({...base,preview:preview(2,'volley',[1,1,0])});
 const launch=m.waveArrivalFrame({...base,preview:preview(0,'volley',[1,1,0])});
 assert.equal(opening.progress,0);assert.equal(opening.countdownKnots.filter((k:any)=>k.filled).length,0);
 assert.equal(middle.progress,.5);assert.equal(middle.countdownKnots.filter((k:any)=>k.filled).length,2);
 assert.equal(launch.progress,1);assert.equal(launch.countdownKnots.filter((k:any)=>k.filled).length,4);
 assert.equal(opening.countdownKnots.length,4);assert.equal(middle.nextIn,2);
});

test('malformed preview values are finite, immutable, and capped at five role marks',async()=>{
 const m=await subject(),input={phase:'running',paused:false,reduced:false,preview:{number:NaN,total:Infinity,intent:'unknown',counts:[99,NaN,-8],nextIn:NaN}} as any;
 const empty=m.waveArrivalFrame(input);assert.equal(empty,null,'non-finite time must not fabricate a warning');
 input.preview.nextIn=-99;const frame=m.waveArrivalFrame(input);assert.ok(frame);
 assert.equal(frame.intent,'rush');assert.deepEqual(frame.counts,[5,0,0]);assert.equal(frame.roleMarks.length,5);assert.equal(frame.nextIn,0);assert.equal(frame.progress,1);
 assert.ok(Object.isFrozen(frame)&&Object.isFrozen(frame.banner)&&Object.isFrozen(frame.roleMarks)&&frame.roleMarks.every((mark:any)=>Object.isFrozen(mark)));
 assert.throws(()=>{(frame.roleMarks as any[]).push({});},TypeError);
 const numbers:number[]=[];JSON.stringify(frame,(_key,value)=>{if(typeof value==='number')numbers.push(value);return value;});
 assert.ok(numbers.every(Number.isFinite));
 for(const point of frame.banner.points){assert.ok(point.x>=-30&&point.x<=30);assert.ok(point.y>=-90&&point.y<=10);}
 for(const mark of frame.roleMarks){assert.ok(mark.x>=-30&&mark.x<=30);assert.ok(mark.y>=-20&&mark.y<=10);assert.ok(mark.alpha>=0&&mark.alpha<=1);}
});

test('reduced motion fixes the cloth while pause adds no independent view clock',async()=>{
 const m=await subject(),base={phase:'running',preview:preview(1.25,'rush',[2,1,1])} as const;
 const moving=m.waveArrivalFrame({...base,paused:false,reduced:false});
 const paused=m.waveArrivalFrame({...base,paused:true,reduced:false});
 const reduced=m.waveArrivalFrame({...base,paused:false,reduced:true});
 assert.deepEqual(paused,moving,'the same authoritative preview must paint identically while paused');
 assert.equal(reduced.clothLift,0);assert.notEqual(moving.clothLift,0);
 assert.deepEqual(m.waveArrivalFrame({...base,paused:true,reduced:true}),reduced);
 assert.equal(moving.depthOffset,-1);
});

test('view boundary delegates the real game preview without mutating combat or profile',async()=>{
 const m=await subject(),game=new Game(defaultProfile());assert.equal(game.dispatch({type:'start'}),true);
 const before=JSON.stringify({profile:game.profile,state:game.state}),frame=m.waveArrivalForPort(game,false);
 assert.ok(frame);assert.equal(frame.intent,'rush');assert.deepEqual(frame.counts,[1,0,0]);assert.equal(frame.nextIn,3);
 assert.equal(JSON.stringify({profile:game.profile,state:game.state}),before);
 assert.equal(game.dispatch({type:'pause'}),true);assert.deepEqual(m.waveArrivalForPort(game,false),frame,'manual pause must not replace the authoritative preview with a view clock');
 const noStatus={profile:game.profile,state:game.state,dispatch:game.dispatch.bind(game),step:game.step.bind(game),drainEvents:game.drainEvents.bind(game)};
 assert.equal(m.waveArrivalForPort(noStatus,false),null,'legacy or fixture ports without the optional query fail closed');
});
