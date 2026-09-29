import test from 'node:test';
import assert from 'node:assert/strict';

async function damage() {
  const path='../src/view/base-damage.ts';
  const module=await import(path).catch(()=>null);
  assert.ok(module,'base destruction needs a bounded presentation model');
  return module;
}

test('base damage has three readable health stages and invalid health fails soft',async()=>{
  const m=await damage();
  assert.equal(m.baseDamageStage(100,100),'intact');
  assert.equal(m.baseDamageStage(73,100),'intact');
  assert.equal(m.baseDamageStage(72,100),'worn');
  assert.equal(m.baseDamageStage(36,100),'worn');
  assert.equal(m.baseDamageStage(35,100),'critical');
  assert.equal(m.baseDamageStage(0,100),'critical');
  for(const pair of [[NaN,100],[50,NaN],[50,0],[50,-1]] as const)assert.equal(m.baseDamageStage(pair[0],pair[1]),'intact');
});

test('all six eras have distinct damage material palettes',async()=>{
  const m=await damage();
  assert.equal(m.BASE_DAMAGE_PALETTES.length,6);
  assert.equal(new Set(m.BASE_DAMAGE_PALETTES.map((entry:any)=>entry.debris)).size,6);
  assert.equal(new Set(m.BASE_DAMAGE_PALETTES.map((entry:any)=>entry.accent)).size,6);
});

test('worn and critical bases gain bounded cracks, rubble and atmosphere without hiding the army lane',async()=>{
  const m=await damage();
  for(let age=0;age<6;age++)for(const side of ['player','enemy'] as const)for(const hp of [60,25]){
    const marks=m.baseDamageFrame(age,side,hp,100,4,false);
    assert.ok(marks.length>=4&&marks.length<=22,`${age} ${side} ${hp} mark budget`);
    assert.ok(marks.some((mark:any)=>mark.kind==='crack'));
    assert.ok(marks.some((mark:any)=>mark.kind==='rubble'));
    if(hp===25)assert.ok(marks.some((mark:any)=>mark.kind==='smoke'||mark.kind==='spark'));
    for(const mark of marks){
      for(const value of Object.values(mark))if(typeof value==='number')assert.ok(Number.isFinite(value),JSON.stringify(mark));
      assert.ok(mark.x>=-42&&mark.x<=42,`x ${mark.x}`);
      assert.ok(mark.y>=-82&&mark.y<=8,`y ${mark.y}`);
      assert.ok(mark.size>=.5&&mark.size<=16,`size ${mark.size}`);
      assert.ok(mark.alpha>=0&&mark.alpha<=.82,`alpha ${mark.alpha}`);
    }
  }
});

test('intact bases have no damage overlay and reduced motion freezes damaged-base atmosphere',async()=>{
  const m=await damage();
  assert.deepEqual(m.baseDamageFrame(0,'player',100,100,50,false),[]);
  for(let age=0;age<6;age++)for(const side of ['player','enemy'] as const){
    const a=m.baseDamageFrame(age,side,25,100,0,true);
    const b=m.baseDamageFrame(age,side,25,100,999,true);
    assert.deepEqual(a,b,`age ${age} ${side}`);
  }
});

test('player and enemy damage compositions mirror structural marks rather than reusing one orientation',async()=>{
  const m=await damage();
  const player=m.baseDamageFrame(3,'player',25,100,0,true).filter((mark:any)=>mark.kind==='crack'||mark.kind==='rubble');
  const enemy=m.baseDamageFrame(3,'enemy',25,100,0,true).filter((mark:any)=>mark.kind==='crack'||mark.kind==='rubble');
  assert.equal(player.length,enemy.length);
  for(let i=0;i<player.length;i++){
    assert.equal(enemy[i].x,-player[i].x);
    assert.equal(enemy[i].y,player[i].y);
    assert.equal(enemy[i].angle,-player[i].angle);
  }
});

test('battlefield sorts base damage with buildings and troops and routes base hits through delayed projectile impact',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
  assert.match(source,/from '.\/base-damage\.ts'/);
  assert.match(source,/private baseDamage!:/);
  assert.ok(source.includes('this.armyLayer.add(this.baseDamage)'));
  assert.ok(source.includes('this.armyLayer.add([this.playerBase,this.enemyBase])'));
  assert.ok(source.includes('this.baseDamage.setDepth(groundY+12.1)'));
  assert.ok(source.includes('view.body.setDepth(y+.5)'));
  assert.ok(source.includes("this.armyLayer.sort('depth')"));
  assert.match(source,/baseDamageFrame\(/);
  assert.match(source,/targetBase:/);
  assert.match(source,/baseImpact\(/);
  assert.match(source,/if\(hit>0&&!this\.reduce\)/,'reduced motion must suppress the animated base-hit ring');
  assert.doesNotMatch(source,/game\.(?:profile|state)\.[A-Za-z0-9_]+\s*=(?!=)/,'presentation must not mutate simulation state');
});
