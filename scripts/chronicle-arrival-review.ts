import assert from 'node:assert/strict';
import type {RouteId} from '../src/game/chronicle.ts';
import type {WaveIntent} from '../src/game/encounters.ts';

export interface ArrivalReviewFixture {name:string;width:number;height:number;route:RouteId;intent:WaveIntent;age:number;reducedMotion:'reduce'|'no-preference'}
export interface ArrivalSnapshot {
 intent:WaveIntent;counts:readonly [number,number,number];nextIn:number;progress:number;
 banner:'swallowtail'|'split-pennant'|'weighted-square';roleShapes:readonly string[];knots:number;
 x:number;y:number;depth:number;baseDepth:number;actorFrontDepth:number;reduced:boolean;paused:boolean;
}
const fixtures:readonly ArrivalReviewFixture[]=Object.freeze([
 Object.freeze({name:'320-wave-rush',width:320,height:568,route:'escort',intent:'rush',age:0,reducedMotion:'reduce'}),
 Object.freeze({name:'390-wave-volley',width:390,height:844,route:'scout',intent:'volley',age:2,reducedMotion:'no-preference'}),
 Object.freeze({name:'1024-wave-bulwark',width:1024,height:768,route:'bell',intent:'bulwark',age:5,reducedMotion:'reduce'}),
]);
export const arrivalReviewFixtures=()=>fixtures;

export function validateArrivalSnapshot(value:unknown,expected:WaveIntent):ArrivalSnapshot {
 assert.ok(value&&typeof value==='object'&&!Array.isArray(value));const state=value as Record<string,unknown>;
 assert.equal(state.intent,expected);assert.ok(Array.isArray(state.counts)&&state.counts.length===3);
 const counts=(state.counts as unknown[]).map(count=>{assert.ok(typeof count==='number'&&Number.isInteger(count)&&count>=0);return count;});
 const total=counts.reduce((sum,count)=>sum+count,0);assert.ok(total>0&&total<=5);
 assert.ok(typeof state.nextIn==='number'&&Number.isFinite(state.nextIn)&&state.nextIn>=0&&state.nextIn<=4);
 assert.ok(typeof state.progress==='number'&&Number.isFinite(state.progress)&&state.progress>=0&&state.progress<=1);
 assert.equal(state.knots,4);
 const banner={rush:'swallowtail',volley:'split-pennant',bulwark:'weighted-square'}[expected];assert.equal(state.banner,banner);
 assert.ok(Array.isArray(state.roleShapes));
 const expectedRoles=counts.flatMap((count,role)=>Array(count).fill(['footprints','sling-stitches','block-tread'][role]));
 assert.deepEqual(state.roleShapes,expectedRoles);
 for(const key of ['x','y','depth','baseDepth','actorFrontDepth'])assert.ok(typeof state[key]==='number'&&Number.isFinite(state[key] as number));
 assert.ok((state.depth as number)<(state.baseDepth as number)&&(state.depth as number)<(state.actorFrontDepth as number));
 assert.equal(typeof state.reduced,'boolean');assert.equal(typeof state.paused,'boolean');
 return value as ArrivalSnapshot;
}

export function assertArrivalPaused(before:ArrivalSnapshot,after:ArrivalSnapshot):void {
 assert.equal(before.paused,false);assert.deepEqual(after,{...before,paused:true});
}
