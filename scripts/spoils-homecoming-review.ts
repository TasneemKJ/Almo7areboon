import assert from 'node:assert/strict';

interface SpoilsEvidenceMark {order:number;amount:number;age:number;x:number;y:number;alpha:number}
interface SpoilsEvidence {count:number;cap:number;height:number;marks:readonly SpoilsEvidenceMark[];reduced:boolean;paused:boolean}
interface SpoilsStaticReward {amount:number;text:string;alpha:number;reduced:boolean}

export function validateSpoilsHomecomingSnapshot(state:SpoilsEvidence,reduced=false,paused=false):void {
 assert.ok(state&&Number.isInteger(state.count)&&state.count>=1&&state.count<=state.cap);
 assert.equal(state.cap,6);assert.equal(state.marks.length,state.count);
 assert.ok(Number.isFinite(state.height)&&state.height>0&&state.height<=10000);
 assert.equal(state.reduced,reduced);assert.equal(state.paused,paused);
 const orders=new Set<number>();
 for(const mark of state.marks){
  assert.ok(Number.isInteger(mark.order)&&mark.order>0&&!orders.has(mark.order));orders.add(mark.order);
  assert.ok(Number.isFinite(mark.amount)&&mark.amount>0);
  assert.ok(Number.isFinite(mark.age)&&mark.age>=0&&mark.age<.9);
  assert.ok(Number.isFinite(mark.x)&&mark.x>=24&&mark.x<=426);
  assert.ok(Number.isFinite(mark.y)&&mark.y>=0&&mark.y<=state.height);
  assert.ok(Number.isFinite(mark.alpha)&&mark.alpha>=0&&mark.alpha<=1);
 }
 assert.ok(state.marks.some(mark=>mark.alpha>=.35),'accepted evidence must contain a meaningfully visible token');
}

export function assertSpoilsHomecomingProgress(before:SpoilsEvidence,after:SpoilsEvidence):void {
 validateSpoilsHomecomingSnapshot(before,false,false);validateSpoilsHomecomingSnapshot(after,false,false);
 const progressed=before.marks.some(start=>{
  if(start.alpha<.35)return false;const current=after.marks.find(mark=>mark.order===start.order);if(!current||current.alpha<.35)return false;
  return current.age>=start.age+.04&&Math.abs(current.x-58)<Math.abs(start.x-58)-1;
 });
 assert.equal(progressed,true,'the same visible token must advance toward the shelter across active frames');
}

export function assertSpoilsHomecomingPaused(before:SpoilsEvidence,paused:SpoilsEvidence):void {
 validateSpoilsHomecomingSnapshot(before,false,false);validateSpoilsHomecomingSnapshot(paused,false,true);
 assert.deepEqual(paused,{...before,paused:true},'public pause must freeze the observed homeward reward');
}

export function validateSpoilsStaticReward(cue:SpoilsStaticReward,reduced:boolean):void {
 assert.ok(cue&&Number.isFinite(cue.amount)&&cue.amount>0);
 assert.equal(cue.text.startsWith('+'),true);assert.ok(cue.text.length>1);
 assert.ok(Number.isFinite(cue.alpha)&&cue.alpha>=.35&&cue.alpha<=1);
 assert.equal(cue.reduced,reduced);
}
