import test from 'node:test';
import assert from 'node:assert/strict';

async function subject(){
 const module=await import('../src/view/spoils-homecoming.ts').catch(error=>{
  if((error as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;
  throw error;
 });
 assert.ok(module,'the spoils homecoming presentation model is missing');
 return module;
}

test('only a truthful positive credited coin event starts a homeward token',async()=>{
 const m=await subject();
 const event={type:'coin' as const,x:800,amount:37};
 assert.deepEqual(m.spoilsHomecomingIntentForEvent(event),{x:360,amount:37});
 assert.deepEqual(event,{type:'coin',x:800,amount:37});
 for(const malformed of [
  {type:'hit',x:800,amount:37},
  {type:'coin',x:800,amount:0},
  {type:'coin',x:800,amount:-1},
  {type:'coin',x:800,amount:Infinity},
  {type:'coin',x:Infinity,amount:37},
 ])assert.equal(m.spoilsHomecomingIntentForEvent(malformed as never),null);
});

test('homeward tokens are immutable and capped to the newest six rewards',async()=>{
 const m=await subject();let marks=m.rememberSpoilsHomecoming([],{x:100,amount:1});
 for(let index=1;index<8;index++)marks=m.rememberSpoilsHomecoming(marks,{x:100+index*20,amount:index+1});
 assert.equal(m.SPOILS_HOMECOMING_CAP,6);
 assert.equal(marks.length,6);
 assert.deepEqual(marks.map((mark:any)=>mark.order),[3,4,5,6,7,8]);
 assert.equal(Object.isFrozen(marks),true);
 assert.equal(Object.isFrozen(marks[0]),true);
 assert.throws(()=>{(marks as unknown[]).push({});},TypeError);
});

test('renderer-supplied identity stays unique after the active list becomes empty',async()=>{
 const m=await subject();const [first]=m.rememberSpoilsHomecoming([],{x:100,amount:1},7);
 assert.equal(first.order,7);
 const [later]=m.rememberSpoilsHomecoming([],{x:120,amount:2},8);
 assert.equal(later.order,8);
});

test('pause is byte-stable and active presentation time expires at nine tenths of a second',async()=>{
 const m=await subject();const marks=m.rememberSpoilsHomecoming([],{x:300,amount:9});
 assert.equal(m.SPOILS_HOMECOMING_LIFE,.9);
 assert.equal(m.stepSpoilsHomecoming(marks,.5,true),marks);
 const aged=m.stepSpoilsHomecoming(marks,.899,false);
 assert.equal(aged.length,1);assert.equal(aged[0].age,.899);
 assert.deepEqual(m.stepSpoilsHomecoming(aged,NaN,false),aged);
 assert.deepEqual(m.stepSpoilsHomecoming(aged,.001,false),[]);
});

test('normal motion follows a finite bounded arc from reward to shelter while reduced motion adds no travel',async()=>{
 const m=await subject();const [mark]=m.rememberSpoilsHomecoming([],{x:360,y:261,amount:37});
 const first=m.spoilsHomecomingFrame(mark,300,false),middle=m.spoilsHomecomingFrame({...mark,age:.36},300,false),arrival=m.spoilsHomecomingFrame({...mark,age:.72},300,false),fade=m.spoilsHomecomingFrame({...mark,age:.81},300,false);
 assert.ok(first&&middle&&arrival&&fade);
 assert.deepEqual({x:first.x,y:first.y},{x:360,y:261});
 assert.deepEqual({x:arrival.x,y:arrival.y},{x:58,y:228});
 assert.ok(middle.x>58&&middle.x<360);
 assert.ok(middle.y<Math.min(first.y,arrival.y)-20,'the token must visibly arc above its straight path');
 for(const frame of [first,middle,arrival,fade])for(const value of [frame.x,frame.y,frame.alpha,frame.size,frame.angle])assert.equal(Number.isFinite(value),true);
 assert.equal(arrival.alpha,1,'the token must visibly reach the shelter before its arrival dwell fades');
 assert.deepEqual({x:fade.x,y:fade.y},{x:58,y:228},'the token must dwell at the shelter while fading');
 assert.ok(fade.alpha>0&&fade.alpha<1);
 assert.ok(middle.size>=14&&middle.size<=20);
 assert.equal(m.spoilsHomecomingFrame(mark,300,true),null);
 assert.equal(Object.isFrozen(middle),true);
});

test('the token starts at the exact authoritative numeric reward origin',async()=>{
 const m=await subject();const [mark]=m.rememberSpoilsHomecoming([],{x:360,y:261,amount:37});
 const frame=m.spoilsHomecomingFrame(mark,300,false);assert.ok(frame);
 assert.equal(frame.y,261);
});

test('direct malformed input fails finite without mutating caller data',async()=>{
 const m=await subject(),input={x:Infinity,amount:NaN},before={...input};
 const [mark]=m.rememberSpoilsHomecoming([],input);
 assert.deepEqual(input,before);
 assert.deepEqual(mark,{x:225,amount:1,age:0,life:.9,order:1});
 const frame=m.spoilsHomecomingFrame(mark,Infinity,false);
 assert.ok(frame);
 for(const value of [frame.x,frame.y,frame.alpha,frame.size,frame.angle])assert.equal(Number.isFinite(value),true);
 const [offstage]=m.rememberSpoilsHomecoming([],{x:300,y:10000,amount:1});
 assert.equal(offstage.y,500);
 assert.equal(m.spoilsHomecomingFrame(offstage,300,false)?.y,500);
});
