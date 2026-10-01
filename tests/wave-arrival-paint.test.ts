import test from 'node:test';
import assert from 'node:assert/strict';
import {waveArrivalFrame} from '../src/view/wave-arrival.ts';

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

test('render plan keeps the signal behind bases and every actor baseline',async()=>{
 const m=await subject(),plan=m.waveArrivalRenderPlan(260);
 assert.deepEqual(plan,{x:376,y:267,depth:259,baseDepth:272,actorFrontDepth:260.5});
 assert.ok(plan.depth<plan.actorFrontDepth&&plan.depth<plan.baseDepth);
 assert.ok(Object.isFrozen(plan));
});

test('painter emits distinct banner polygons and exact role-shape primitives',async()=>{
 const m=await subject(),signatures=new Map<string,string>();
 for(const [intent,counts] of [['rush',[1,0,0]],['volley',[0,1,0]],['bulwark',[0,0,1]]] as const){
  const graphics=new Recorder(),report=m.paintWaveArrival(graphics,frame(intent,counts),{x:376,y:267});
  assert.equal(report.banner,({rush:'swallowtail',volley:'split-pennant',bulwark:'weighted-square'} as const)[intent]);
  assert.equal(report.roleShapes.length,1);assert.equal(report.knots,4);
  assert.equal(graphics.commands.filter(command=>command.name==='fillPoints').length,1,'each signal owns one cloth polygon');
  assert.equal(graphics.commands.filter(command=>command.name==='fillCircle'||command.name==='strokeCircle').length>=4,true,'countdown knots must be painted');
  signatures.set(intent,graphics.commands.map(command=>command.name+JSON.stringify(command.args)).join('|'));
 }
 assert.equal(new Set(signatures.values()).size,3,'shape-distinct waves must not collapse to one drawing');
});

test('painter uses bounded immutable frame data without changing it',async()=>{
 const m=await subject(),input=frame('volley',[2,2,1]),before=JSON.stringify(input),graphics=new Recorder();
 const report=m.paintWaveArrival(graphics,input,{x:376,y:267});
 assert.equal(JSON.stringify(input),before);assert.deepEqual(report.roleShapes,['footprints','footprints','sling-stitches','sling-stitches','block-tread']);
 const numbers=graphics.commands.flatMap(command=>command.args).flatMap(value=>typeof value==='number'?[value]:Array.isArray(value)?value.flatMap((point:any)=>[point.x,point.y]):[]);
 assert.ok(numbers.every(Number.isFinite));assert.ok(graphics.commands.length<50,'one bounded frame must not emit an unbounded command stream');
 assert.ok(Object.isFrozen(report)&&Object.isFrozen(report.roleShapes));
});
