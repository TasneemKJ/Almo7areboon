import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';

async function choreography() {
  const path='../src/view/combat-choreography.ts';
  const module=await import(path).catch(()=>null);
  assert.ok(module,'combat body language needs a bounded presentation model');
  return module;
}

test('all six eras and roles map to readable attack families',async()=>{
  const m=await choreography();
  const expected=[
    ['melee','thrown','mounted'],
    ['melee','thrown','melee'],
    ['melee','bow','mounted'],
    ['melee','firearm','artillery'],
    ['firearm','firearm','artillery'],
    ['energy-melee','energy','artillery'],
  ];
  for(let age=0;age<6;age++)for(let kind=0;kind<3;kind++)assert.equal(m.attackFamily(age,kind),expected[age][kind]);
  assert.equal(m.attackFamily(-1,9),'melee');
});

test('hit reactions recoil away from the attacker without moving heavy units too far',async()=>{
  const m=await choreography();
  const player=m.hitReaction(.16,'player',0,false),enemy=m.hitReaction(.16,'enemy',0,false),heavy=m.hitReaction(.16,'player',2,false);
  assert.ok(player.x<0&&enemy.x>0);
  assert.equal(player.x,-enemy.x);
  assert.equal(player.angle,-enemy.angle);
  assert.ok(Math.abs(heavy.x)<Math.abs(player.x));
  assert.ok(Math.abs(player.x)<=4&&Math.abs(player.angle)<=4&&player.y>=0&&player.y<=2);
});

test('reduced motion and invalid hit timers disable body recoil',async()=>{
  const m=await choreography();
  assert.deepEqual(m.hitReaction(.16,'player',0,true),{x:0,y:0,angle:0});
  for(const value of [0,-1,NaN,Infinity])assert.deepEqual(m.hitReaction(value,'enemy',1,false),{x:0,y:0,angle:0});
});

test('actual attack cues are distinct, bounded and mirror between factions',async()=>{
  const m=await choreography();
  for(let age=0;age<6;age++)for(let kind=0;kind<3;kind++){
    const player=m.attackCueFrame(age,kind,'player',.45,false),enemy=m.attackCueFrame(age,kind,'enemy',.45,false);
    assert.ok(player.length>=1&&player.length<=5,`${age}:${kind} cue budget`);
    assert.equal(player.length,enemy.length);
    assert.ok(player.some((mark:any)=>mark.kind!=='dust'),`${age}:${kind} visible cue`);
    for(let i=0;i<player.length;i++){
      const a=player[i],b=enemy[i];
      for(const value of Object.values(a))if(typeof value==='number')assert.ok(Number.isFinite(value),JSON.stringify(a));
      assert.ok(a.x>=-48&&a.x<=48);assert.ok(a.y>=-64&&a.y<=8);assert.ok(a.size>=.5&&a.size<=22);assert.ok(a.alpha>=0&&a.alpha<=1);
      assert.equal(b.kind,a.kind);assert.equal(b.x,-a.x);assert.equal(b.y,a.y);assert.equal(b.angle,-a.angle);
    }
  }
});

test('attack cue fades over its short lifetime and reduced motion removes trails but keeps a readable flash',async()=>{
  const m=await choreography();
  const early=m.attackCueFrame(4,2,'player',.1,false),late=m.attackCueFrame(4,2,'player',.9,false);
  assert.ok(early.reduce((s:number,x:any)=>s+x.alpha,0)>late.reduce((s:number,x:any)=>s+x.alpha,0));
  const reduced=m.attackCueFrame(5,1,'player',.4,true);
  assert.ok(reduced.length>=1);
  assert.ok(reduced.every((mark:any)=>mark.kind!=='trail'&&mark.kind!=='dust'));
});

test('battlefield applies hit recoil and attack choreography only in presentation',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=battlefieldSource();
  assert.match(source,/from '.\/combat-choreography\.ts'/);
  assert.match(source,/attackCues:/);
  assert.match(source,/hitReaction\(unit\.hitFlash/);
  assert.match(source,/attackCueFrame\(/);
  assert.doesNotMatch(source,/game\.(?:profile|state)\.[A-Za-z0-9_]+\s*=(?!=)/,'presentation must not mutate simulation state');
});
