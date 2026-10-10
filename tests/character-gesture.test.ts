import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
async function gesture(){const path='../src/view/character-gesture.ts';const m=await import(path).catch(e=>{if((e as NodeJS.ErrnoException).code==='ERR_MODULE_NOT_FOUND')return null;throw e;});assert.ok(m,'character gesture model must exist');return m;}

test('reduced motion makes every role a neutral transform',async()=>{
 const m=await gesture(),neutral={forward:0,lift:0,angle:0,sx:1,sy:1};
 for(const kind of [0,1,2])for(const moving of [false,true])for(const attacking of [false,true])assert.deepEqual(m.characterGesture(kind,12,moving,attacking,true),neutral);
});

test('attack line of action distinguishes melee commitment, ranged recoil and heavy compression',async()=>{
 const m=await gesture(),time=.1;
 const melee=m.characterGesture(0,time,false,true,false),ranged=m.characterGesture(1,time,false,true,false),heavy=m.characterGesture(2,time,false,true,false);
 assert.ok(melee.forward>1.5&&melee.angle>1);
 assert.ok(ranged.forward<0&&Math.abs(ranged.angle)<Math.abs(melee.angle));
 assert.ok(heavy.forward<=0&&heavy.sy<1&&heavy.sx>1);
});

test('movement gesture is role-specific but remains subordinate to existing sprite animation',async()=>{
 const m=await gesture();
 for(const t of [0,.1,1,100]){
  const melee=m.characterGesture(0,t,true,false,false),ranged=m.characterGesture(1,t,true,false,false),heavy=m.characterGesture(2,t,true,false,false);
  assert.ok(Math.abs(melee.forward)>=Math.abs(ranged.forward));
  assert.ok(Math.abs(ranged.forward)>=Math.abs(heavy.forward));
  for(const pose of [melee,ranged,heavy]){
   assert.ok(Math.abs(pose.forward)<=3&&pose.lift>=0&&pose.lift<=1);
   assert.ok(Math.abs(pose.angle)<=3&&pose.sx>=.97&&pose.sx<=1.03&&pose.sy>=.97&&pose.sy<=1.03);
  }
 }
});

test('invalid role/time inputs recover to finite melee presentation',async()=>{
 const m=await gesture(),fallback=m.characterGesture(0,0,true,false,false);
 for(const kind of [-1,3,NaN,Infinity])assert.deepEqual(m.characterGesture(kind,0,true,false,false),fallback);
 for(const time of [-1,NaN,Infinity,1e300])for(const value of Object.values(m.characterGesture(0,time,true,false,false)))assert.ok(Number.isFinite(value as number));
});

test('battlefield mirrors gesture forward/lean by faction direction and keeps simulation coordinates untouched',()=>{
 const source=battlefieldSource();
 assert.match(source,/characterGesture\(unit\.kind,host\.game\.state\.time\+unit\.id\*\.17,moving,unit\.attacking,host\.reduce\(\)\|\|frozen\)/);
 assert.match(source,/direction=unit\.side==='player'\?1:-1/);
 assert.match(source,/x\+recoil\.x\+\(gesture\.forward\+arrival\.forward\)\*direction/);
 assert.match(source,/pose\.angle\*direction\+gesture\.angle\*direction\+recoil\.angle/);
 assert.match(source,/scale\*density\*gesture\.sx\*arrival\.sx,scale\*density\*gesture\.sy\*arrival\.sy/);
 assert.equal((source.match(/x\+recoil\.x\+\(gesture\.forward\+arrival\.forward\)\*direction/g)??[]).length,2,'image and vector fallback use the same faction transform');
 assert.ok(source.includes('facingDirection*perspective.scale*(verdict?verdict.sx:gesture.sx*arrival.sx),perspective.scale*(verdict?verdict.sy:gesture.sy*arrival.sy)'),'vector fallback also composes both scale responses');
 assert.doesNotMatch(source,/unit\.(?:x|y|lane)\s*(?:[+*\/-]?=(?!=)|\+\+|--)/,'posing must never write simulation coordinates');
});
