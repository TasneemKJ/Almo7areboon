import test from 'node:test';
import assert from 'node:assert/strict';
import { encounterForAge, scheduledSpawns, wavePreview } from '../src/game/encounters.ts';

// Literal authored arrivals catch a misplaced delay, wrong roster, or player-age selection.
const arrivals = [
  [[3,0],[14,0],[14.4,0],[24,0],[25.2,1],[38,0],[38.6,0],[52,2]],
  [[4,0],[15,0],[15.6,0],[27,0],[28.4,1],[41,0],[42.2,1],[43.4,1],[56,2],[57,0]],
  [[3,0],[13,0],[13.5,0],[14,0],[26,2],[27.2,0],[40,0],[40.4,0],[54,1],[55.4,1]],
  [[4,0],[16,0],[17.4,1],[28,0],[29.2,1],[30.4,1],[42,2],[43.2,1],[57,0],[57.5,0]],
  [[3,0],[14,0],[15.2,0],[28,1],[29,1],[43,0],[43.5,1],[44,1],[58,2],[59.4,1]],
  [[4,0],[4.5,0],[5,0],[15,0],[29,0],[30.2,1],[31.4,1],[44,2],[45.2,1],[60,2],[61,0]],
];
test('six encounters expose exact distinct authored arrivals without mutable tables', () => {
  const serialized = new Set<string>();
  for (let age=0; age<6; age++) {
    const encounter=encounterForAge(age);
    assert.equal(encounter.age, age); assert.equal(encounter.waves.length, 5);
    assert.deepEqual(scheduledSpawns(encounter).map(s=>[s.time,s.kind]), arrivals[age]);
    serialized.add(JSON.stringify(encounter.waves));
    assert.ok(Object.isFrozen(encounter)); assert.ok(Object.isFrozen(encounter.waves));
    for(const wave of encounter.waves) { assert.ok(Object.isFrozen(wave)); assert.ok(Object.isFrozen(wave.members)); for(const member of wave.members) assert.ok(Object.isFrozen(member)); }
  }
  assert.equal(serialized.size,6);
  for(const age of [-1,6,0.5,NaN,Infinity]) assert.equal(encounterForAge(age),encounterForAge(0));
});
test('preview counts complete next waves and sanitizes timing and launch counts', () => {
  const e=encounterForAge(0);
  assert.deepEqual(wavePreview(e,23,2),{number:3,total:5,intent:'volley',counts:[1,1,0],nextIn:1});
  assert.equal(wavePreview(e,100,2)?.nextIn,0);
  for(const count of [NaN,Infinity,-1]) assert.equal(wavePreview(e,NaN,count)?.nextIn,3);
  assert.equal(wavePreview(e,0,1.9)?.number,2);
  assert.equal(wavePreview(e,0,100),null);
});
test('equal-time members sort by wave and member index without changing inputs', () => {
  const e={age:0,waves:[{time:2,intent:'rush' as const,members:[{kind:0 as const,delay:1},{kind:1 as const,delay:0}]},{time:2,intent:'bulwark' as const,members:[{kind:2 as const,delay:0}]}]};
  const before=JSON.stringify(e);
  assert.deepEqual(scheduledSpawns(e),[{time:2,waveIndex:0,memberIndex:1,kind:1},{time:2,waveIndex:1,memberIndex:0,kind:2},{time:3,waveIndex:0,memberIndex:0,kind:0}]);
  assert.equal(JSON.stringify(e),before);
});
