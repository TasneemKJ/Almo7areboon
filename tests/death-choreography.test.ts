import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

async function choreography(){
 const path='../src/view/death-choreography.ts';
 const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});
 assert.ok(m,'death choreography model must exist');return m;
}

test('role profiles give infantry more fall rotation while heavy units settle with compression',async()=>{
 const m=await choreography();
 const melee=m.deathProfile(2,0),ranged=m.deathProfile(2,1),heavy=m.deathProfile(2,2);
 assert.ok(melee.maxAngle>ranged.maxAngle&&ranged.maxAngle>heavy.maxAngle);
 assert.ok(heavy.duration>=melee.duration&&heavy.endScaleY<melee.endScaleY);
 assert.equal(melee.style,'collapse');assert.equal(heavy.style,'settle');
});

test('future deaths dissolve upward with minimal rotation instead of falling like cloth',async()=>{
 const m=await choreography(),profile=m.deathProfile(5,0);
 assert.equal(profile.style,'dissolve');assert.ok(profile.maxAngle<=6);
 const start=m.deathPose(5,0,'player',0),late=m.deathPose(5,0,'player',.8);
 assert.ok(late.dy<start.dy);assert.ok(late.alpha<start.alpha);assert.ok(Math.abs(late.angle)<=6);
});

test('faction direction mirrors displacement and lean without changing timing or scale',async()=>{
 const m=await choreography();
 for(let age=0;age<6;age++)for(const kind of [0,1,2] as const)for(const p of [0,.25,.75,1]){
  const a=m.deathPose(age,kind,'player',p),b=m.deathPose(age,kind,'enemy',p);
  assert.equal(a.dx,-b.dx);assert.equal(a.dy,b.dy);assert.equal(a.angle,-b.angle);
  assert.equal(a.sx,b.sx);assert.equal(a.sy,b.sy);assert.equal(a.alpha,b.alpha);
 }
});

test('death poses remain bounded, finite and monotonic in opacity',async()=>{
 const m=await choreography();
 for(let age=0;age<6;age++)for(const kind of [0,1,2] as const){
  let previous=1;
  for(const p of [0,.2,.4,.6,.8,1]){
   const pose=m.deathPose(age,kind,'player',p);
   for(const value of Object.values(pose))assert.ok(Number.isFinite(value as number));
   assert.ok(Math.abs(pose.dx)<=10&&Math.abs(pose.dy)<=12&&Math.abs(pose.angle)<=24);
   assert.ok(pose.sx>=.82&&pose.sx<=1.08&&pose.sy>=.72&&pose.sy<=1.05);
   assert.ok(pose.alpha>=0&&pose.alpha<=previous);previous=pose.alpha;
  }
 }
});

test('invalid death inputs fall back to finite first-chapter melee behavior',async()=>{
 const m=await choreography(),profile=m.deathProfile(0,0),pose=m.deathPose(0,0,'player',0);
 for(const age of [-1,6,1.5,NaN,Infinity]){assert.deepEqual(m.deathProfile(age,0),profile);assert.deepEqual(m.deathPose(age,0,'player',0),pose);}
 for(const kind of [-1,3,NaN,Infinity]){assert.deepEqual(m.deathProfile(0,kind),profile);assert.deepEqual(m.deathPose(0,kind,'player',0),pose);}
 for(const progress of [-1,NaN,Infinity,1e300])for(const value of Object.values(m.deathPose(3,1,'player',progress)))assert.ok(Number.isFinite(value as number));
});

test('DeathVisuals uses age/role choreography and still clears immediately for reduced motion',()=>{
 const source=readFileSync(new URL('../src/view/death-visuals.ts',import.meta.url),'utf8');
 assert.match(source,/deathProfile\(age,kind\)/);assert.match(source,/deathPose\(item\.age,item\.kind,item\.side,progress\)/);
 assert.match(source,/add\(sprite:FallingSprite,side:Side,age:number,kind:UnitKind\)/);
 assert.match(source,/if\(reduced\)\{this\.clear\(\);return;\}/);
});

test('battlefield hands age and role to the short-lived death visual instead of retaining a game unit',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/type TroopView=\{[^}]*age:number;kind:Unit\['kind'\]/);
 assert.match(source,/this\.fallen\.add\(view\.body,view\.side,view\.age,view\.kind\)/);
 assert.doesNotMatch(source,/state\.units\.push\([^)]*dead/i);
});
