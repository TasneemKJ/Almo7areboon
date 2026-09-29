import test from 'node:test';
import assert from 'node:assert/strict';

async function module() {
 const path='../src/view/death-visuals.ts';
 const m=await import(path).catch(()=>null);
 assert.ok(m,'defeated sprites need a short, bounded presentation lifetime');
 return m;
}
function sprite(){return {
 x:100,y:120,scaleX:.5,scaleY:.5,angle:0,alpha:1,destroyed:0,
 setPosition(x:number,y:number){this.x=x;this.y=y;return this;},
 setScale(x:number,y:number){this.scaleX=x;this.scaleY=y;return this;},
 setAngle(angle:number){this.angle=angle;return this;},
 setAlpha(alpha:number){this.alpha=alpha;return this;},
 destroy(){this.destroyed++;},
};}
test('defeated actors remain briefly for projectile impacts, then dispose exactly once',async()=>{
 const m=await module(),visuals=new m.DeathVisuals(),actor=sprite();
 visuals.add(actor,'enemy');visuals.step(.2,false);
 assert.equal(actor.destroyed,0);assert.ok(actor.alpha>0&&actor.alpha<1);assert.ok(actor.y>120);
 visuals.step(.2,false);assert.equal(actor.destroyed,1);assert.equal(visuals.size,0);
 visuals.clear();assert.equal(actor.destroyed,1);
});
test('paused or invalid presentation deltas do not advance a death animation',async()=>{
 const m=await module(),visuals=new m.DeathVisuals(),actor=sprite();visuals.add(actor,'player');
 const before={x:actor.x,y:actor.y,angle:actor.angle,alpha:actor.alpha};
 for(const dt of [0,-1,NaN,Infinity])visuals.step(dt,false);
 assert.deepEqual({x:actor.x,y:actor.y,angle:actor.angle,alpha:actor.alpha},before);
});
test('bounded corpse visuals dispose evictions and reduced motion removes motion immediately',async()=>{
 const m=await module(),visuals=new m.DeathVisuals(),actors=Array.from({length:40},sprite);
 for(const actor of actors)visuals.add(actor,'enemy');
 assert.equal(visuals.size,24);assert.equal(actors.filter(a=>a.destroyed===1).length,16);
 visuals.step(0,true);assert.equal(visuals.size,0);assert.ok(actors.every(a=>a.destroyed===1));
});
test('battle transitions clear old sprites without moving or sharing simulation objects',async()=>{
 const m=await module(),visuals=new m.DeathVisuals(),actor=sprite();
 visuals.add(actor,'player');visuals.clear();visuals.step(1,false);
 assert.equal(actor.destroyed,1);assert.equal(actor.x,100);assert.equal(actor.y,120);assert.equal(visuals.size,0);
});
