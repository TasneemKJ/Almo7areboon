import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';

async function atmosphere() {
  const path='../src/view/era-atmosphere.ts';
  const module=await import(path).catch(()=>null);
  assert.ok(module,'era atmosphere must be implemented as a bounded presentation model');
  return module;
}

test('all six eras have distinct atmospheric identities',async()=>{
  const m=await atmosphere();
  assert.equal(m.ERA_ATMOSPHERE.length,6);
  assert.equal(new Set(m.ERA_ATMOSPHERE.map((entry:any)=>entry.kind)).size,6);
  assert.equal(new Set(m.ERA_ATMOSPHERE.map((entry:any)=>entry.color)).size,6);
});

test('ambient frames stay finite, bounded and clear of the deployment controls',async()=>{
  const m=await atmosphere();
  for(let age=0;age<6;age++)for(const time of [0,.5,10,999,NaN,Infinity]){
    const marks=m.atmosphereFrame(age,time,450,285,false);
    assert.ok(marks.length>0&&marks.length<=24,`age ${age} mark budget`);
    for(const mark of marks){
      for(const value of Object.values(mark))if(typeof value==='number')assert.ok(Number.isFinite(value),`age ${age} finite ${JSON.stringify(mark)}`);
      assert.ok(mark.x>=-20&&mark.x<=470,`age ${age} x ${mark.x}`);
      assert.ok(mark.y>=18&&mark.y<=310,`age ${age} y ${mark.y}`);
      assert.ok(mark.alpha>=0&&mark.alpha<=1,`age ${age} alpha ${mark.alpha}`);
      assert.ok(mark.size>0&&mark.size<=12,`age ${age} size ${mark.size}`);
    }
  }
});

test('reduced motion freezes ambient positions without removing era identity',async()=>{
  const m=await atmosphere();
  for(let age=0;age<6;age++){
    const a=m.atmosphereFrame(age,0,450,285,true);
    const b=m.atmosphereFrame(age,123,450,285,true);
    assert.deepEqual(a,b,`age ${age} reduced-motion frame must be static`);
    assert.ok(a.length>=2);
  }
});

test('invalid ages and viewport values fail soft into the Stone Age composition',async()=>{
  const m=await atmosphere();
  const reference=m.atmosphereFrame(0,1,450,285,false);
  assert.deepEqual(m.atmosphereFrame(-1,1,450,285,false),reference);
  assert.deepEqual(m.atmosphereFrame(99,1,450,285,false),reference);
  const malformed=m.atmosphereFrame(0,1,NaN,Infinity,false);
  assert.ok(malformed.length>0);
  assert.ok(malformed.every((mark:any)=>Number.isFinite(mark.x)&&Number.isFinite(mark.y)));
});

test('battlefield renders ambience behind actors from the presentation-only model',async()=>{
  const source=battlefieldSource();
  assert.match(source,/from '.\/era-atmosphere\.ts'/);
  assert.match(source,/private ambience!:/);
  assert.match(source,/this\.world\.add\(this\.ambience\)/);
  assert.ok(source.indexOf('this.world.add(this.ambience)')<source.indexOf('this.world.add(this.armyLayer)'),'ambience belongs behind bases and troops');
  assert.match(source,/atmosphereFrame\(host\.game\.profile\.age/);
  assert.match(source,/atmosphere\.draw\(\)/);
  assert.doesNotMatch(source,/game\.(?:profile|state)\.[A-Za-z0-9_]+\s*=(?!=)/,'renderer must not mutate simulation state');
});

test('fireflies and starlight remain accent-sized rather than becoming foreground blobs',async()=>{
  const m=await atmosphere();
  for(const age of [0,5])for(const time of [0,3,12,60]){
    const marks=m.atmosphereFrame(age,time,450,285,false);
    assert.ok(Math.max(...marks.map((mark:any)=>mark.size))<=2.5,`age ${age} particle cap`);
    assert.ok(Math.max(...marks.map((mark:any)=>mark.alpha))<=.72,`age ${age} alpha cap`);
  }
});
