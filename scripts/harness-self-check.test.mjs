/** Pure/offline checks: no server, browser, network, product writes or runtime acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {inside,overlaps,assertReachable,assertTroopLabels} from './review-geometry.mjs';
import {ordinaryFixture,laterFixture,chronicleFixture,assertFixture} from './review-fixtures.mjs';
const sourceRoot=process.env.PRODUCT_ROOT;
assert(sourceRoot,'PRODUCT_ROOT must identify the read-only product files');
const {defaultProfile,decodeSave}=await import(pathToFileURL(resolve(sourceRoot,'src/game/save.ts')));
const {unlockCost}=await import(pathToFileURL(resolve(sourceRoot,'src/game/data.ts')));
const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const valid=()=>({key:'test',visible:true,name:'Battle',box:rect(0,0,44,44),effective:rect(0,0,44,44),viewport:rect(0,0,390,844),hits:[{accepted:true}]});
test('acceptance refuses undersized or clipped 44px controls',()=>{
  assert.doesNotThrow(()=>assertReachable(valid()));
  for(const mutate of [r=>r.box.width=43,r=>r.effective.height=43,r=>r.hits[0].accepted=false,r=>r.visible=false,r=>r.name='',r=>r.box.bottom=845.1]){
    const row=valid();mutate(row);assert.throws(()=>assertReachable(row));
  }
});
test('navigation and notice intersection guard detects former 28px intrusion',()=>{
  const nav=rect(0,800,390,44),notice=rect(0,772,390,28),fixed=rect(0,0,390,772),old=rect(0,0,390,800);
  assert(!overlaps(fixed,notice));assert(!overlaps(notice,nav));assert(overlaps(old,notice));
  assert(inside(rect(0,0,390,844),nav));
});
test('all initial fixtures survive real save normalization and carry true expensive locks',()=>{
  assertFixture(ordinaryFixture(defaultProfile),decodeSave);assertFixture(chronicleFixture(defaultProfile),decodeSave);
  for(let age=1;age<=5;age++){
    const fixture=assertFixture(laterFixture(defaultProfile,age),decodeSave);
    assert.equal(fixture.age,age);assert.equal(fixture.enemyAge,age);assert.deepEqual(fixture.unlocked,[true,false,false]);assert.equal(fixture.coins,0);
    assert.equal(unlockCost(2,fixture),400*8**age);
  }
  assert.equal(unlockCost(2,laterFixture(defaultProfile,5)),13107200);
});
test('label guards reject clipping and name/role overlap',()=>{
  const cards=[0,1,2].map(unit=>({unit,name:'named control',box:rect(0,0,100,88),labels:[{selector:'.unit-name',text:'Sky Skimmer',box:rect(2,4,96,14),fragments:[rect(3,4,75,14)],clipped:false},{selector:'.unit-role',text:'Heavy · Sweep',box:rect(2,18,96,12),fragments:[rect(3,18,80,12)],clipped:false},{selector:'.unit-price',text:'13.1m',box:rect(0,64,100,24),fragments:[rect(20,65,60,20)],clipped:false}]}));
  assert.doesNotThrow(()=>assertTroopLabels(cards));
  const clipped=structuredClone(cards);clipped[0].labels[0].fragments[0].right=150;assert.throws(()=>assertTroopLabels(clipped));
  const crossed=structuredClone(cards);crossed[0].labels[1].box.top=8;assert.throws(()=>assertTroopLabels(crossed));
});
test('canonical script uses genuine keyboard and has no diagnostic style mutation',()=>{
  const source=readFileSync(new URL('./capture-review.mjs',import.meta.url),'utf8');
  assert.match(source,/keyboard\.press\('Tab'\)/);assert.match(source,/keyboard\.press\('Enter'\)/);
  assert(!/\.focus\(\)|addStyleTag|\.style\.|document\.hidden\s*=|\.step\(/.test(source));
  assert(!/battlefieldReviewArm|battlefieldReviewSnapshot|clock\.(install|pause)/.test(source));
});
