import test from 'node:test';
import assert from 'node:assert/strict';
import {waveArrivalFrame} from '../src/view/wave-arrival.ts';
import {actorRenderDepth} from '../src/view/lane-perspective.ts';

const path='../src/view/wave-arrival-paint.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'wave-arrival painter must exist');
 return module;
}
class Recorder {
 commands:{name:string;args:unknown[]}[]=[];
 record(name:string,args:unknown[]){this.commands.push({name,args});return this;}
 lineStyle(...args:unknown[]){return this.record('lineStyle',args)}
 lineBetween(...args:unknown[]){return this.record('lineBetween',args)}
 fillStyle(...args:unknown[]){return this.record('fillStyle',args)}
 fillPoints(...args:unknown[]){return this.record('fillPoints',args)}
 fillCircle(...args:unknown[]){return this.record('fillCircle',args)}
 strokeCircle(...args:unknown[]){return this.record('strokeCircle',args)}
 fillRect(...args:unknown[]){return this.record('fillRect',args)}
 strokeRect(...args:unknown[]){return this.record('strokeRect',args)}
}
const frame=(intent:'rush'|'volley'|'bulwark',counts:readonly [number,number,number])=>waveArrivalFrame({phase:'running',paused:false,reduced:true,preview:{number:2,total:5,intent,counts,nextIn:2}})!;

test('render plan stays behind every lane and rank-stagger residue',async()=>{
 const m=await subject(),plan=m.waveArrivalRenderPlan(260);
 assert.deepEqual(plan,{x:340,y:267,depth:257,baseDepth:272,actorFrontDepth:258.3});
 for(let lane=0;lane<3;lane++)for(let id=0;id<5;id++){
  assert.ok(plan.depth<actorRenderDepth(260,lane,24,id),`signal must stay behind lane ${lane}, stagger residue ${id}`);
 }
 assert.ok(plan.depth<plan.actorFrontDepth&&plan.depth<plan.baseDepth);
 assert.ok(Object.isFrozen(plan));
});

test('road omen cloth stays in the clear road pocket left of the enemy outpost',async()=>{
 const m=await subject(),plan=m.waveArrivalRenderPlan(260);
 // The widest cloth reaches 20 source pixels right of its pole. The painted
 // enemy outpost begins around x=375, so preserve a visible ink gap as well.
 assert.ok(plan.x+20<=368,'banner must not disappear behind the enemy outpost');
 assert.ok(plan.x-24>=300,'role marks must remain on the approach road, away from central objectives');
});

test('painter emits distinct banner geometry with composition held constant',async()=>{
 const m=await subject(),banners=new Map<string,string>();
 for(const intent of ['rush','volley','bulwark'] as const){
  const counts=[1,1,1] as const;
  const graphics=new Recorder(),report=m.paintWaveArrival(graphics,frame(intent,counts),{x:376,y:267});
  assert.equal(report.banner,({rush:'swallowtail',volley:'split-pennant',bulwark:'weighted-square'} as const)[intent]);
  assert.deepEqual(report.roleShapes,['footprints','sling-stitches','block-tread']);assert.equal(report.knots,4);
  const cloth=graphics.commands.filter(command=>command.name==='fillPoints');
  assert.equal(cloth.length,1,'each signal owns one cloth polygon');
  assert.equal(graphics.commands.filter(command=>command.name==='fillCircle'||command.name==='strokeCircle').length>=4,true,'countdown knots must be painted');
  banners.set(intent,JSON.stringify(cloth[0].args[0]));
 }
 assert.equal(new Set(banners.values()).size,3,'shape-distinct waves must not collapse to one banner polygon');
});

test('painter uses bounded immutable frame data without changing it',async()=>{
 const m=await subject(),input=frame('volley',[2,2,1]),before=JSON.stringify(input),graphics=new Recorder();
 const report=m.paintWaveArrival(graphics,input,{x:376,y:267});
 assert.equal(JSON.stringify(input),before);assert.deepEqual(report.roleShapes,['footprints','footprints','sling-stitches','sling-stitches','block-tread']);
 const numbers=graphics.commands.flatMap(command=>command.args).flatMap(value=>typeof value==='number'?[value]:Array.isArray(value)?value.flatMap((point:any)=>[point.x,point.y]):[]);
 assert.ok(numbers.every(Number.isFinite));assert.ok(graphics.commands.length<50,'one bounded frame must not emit an unbounded command stream');
 assert.ok(Object.isFrozen(report)&&Object.isFrozen(report.roleShapes));
});
