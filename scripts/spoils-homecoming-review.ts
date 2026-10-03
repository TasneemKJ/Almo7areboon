import assert from 'node:assert/strict';

interface SpoilsEvidenceMark {amount:number;age:number;x:number;y:number;alpha:number}
interface SpoilsEvidence {count:number;cap:number;marks:readonly SpoilsEvidenceMark[];reduced:boolean;paused:boolean}

export function validateSpoilsHomecomingSnapshot(state:SpoilsEvidence,reduced=false,paused=false):void {
 assert.ok(state&&Number.isInteger(state.count)&&state.count>=1&&state.count<=state.cap);
 assert.equal(state.cap,6);assert.equal(state.marks.length,state.count);
 assert.equal(state.reduced,reduced);assert.equal(state.paused,paused);
 for(const mark of state.marks){
  assert.ok(Number.isFinite(mark.amount)&&mark.amount>0);
  assert.ok(Number.isFinite(mark.age)&&mark.age>=0&&mark.age<.9);
  assert.ok(Number.isFinite(mark.x)&&mark.x>=0&&mark.x<=450);
  assert.ok(Number.isFinite(mark.y)&&mark.y>=0&&mark.y<=500);
  assert.ok(Number.isFinite(mark.alpha)&&mark.alpha>=0&&mark.alpha<=1);
 }
}

export function assertSpoilsHomecomingPaused(before:SpoilsEvidence,paused:SpoilsEvidence):void {
 validateSpoilsHomecomingSnapshot(before,false,false);validateSpoilsHomecomingSnapshot(paused,false,true);
 assert.deepEqual(paused,{...before,paused:true},'public pause must freeze the observed homeward reward');
}
