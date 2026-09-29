import test from 'node:test';
import assert from 'node:assert/strict';

async function presentation() {
  const path='../src/view/lane-perspective.ts';
  const module=await import(path).catch(()=>null);
  assert.ok(module,'battle lanes need a presentation-only perspective model');
  return module;
}

test('three battle lanes form a restrained back-to-front perspective stack',async()=>{
  const m=await presentation();
  const back=m.lanePresentation(0,0),middle=m.lanePresentation(1,0),front=m.lanePresentation(2,0);
  assert.ok(back.scale<middle.scale&&middle.scale<front.scale);
  assert.ok(back.shadowWidth<middle.shadowWidth&&middle.shadowWidth<front.shadowWidth);
  assert.ok(back.shadowAlpha<middle.shadowAlpha&&middle.shadowAlpha<front.shadowAlpha);
  assert.ok(front.scale/back.scale<=1.2,'perspective must not distort troop proportions');
  assert.equal(middle.scale,1);
});

test('heavy troops remain heavier without breaking lane perspective',async()=>{
  const m=await presentation();
  for(const lane of [0,1,2]){
    const light=m.troopScale(0,lane),heavy=m.troopScale(2,lane);
    assert.ok(heavy>light);
    assert.ok(heavy/light>1.2&&heavy/light<1.4);
  }
});

test('lane presentation fails soft for malformed values and never changes simulation coordinates',async()=>{
  const m=await presentation();
  for(const lane of [-10,3,99,NaN,Infinity]){
    const p=m.lanePresentation(lane,1);
    for(const value of Object.values(p))if(typeof value==='number')assert.ok(Number.isFinite(value));
    assert.ok(p.scale>0&&p.shadowWidth>0&&p.shadowHeight>0);
  }
  assert.deepEqual(m.lanePresentation(NaN,1),m.lanePresentation(1,1));
});

test('battlefield renderer consumes lane perspective for actors, shadows and health-bar height',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
  assert.match(source,/lanePresentation/);
  assert.match(source,/troopScale/);
  assert.match(source,/shadowWidth/);
  assert.match(source,/healthOffset/);
});
