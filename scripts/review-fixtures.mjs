/** Initial save fixtures only; all subsequent changes use the built game's public controls. */
import assert from 'node:assert/strict';
export function ordinaryFixture(defaultProfile) {
  const profile=defaultProfile();
  Object.assign(profile,{sound:false,motion:'system',foodLevel:20,kills:10});
  profile.chronicle.enabled=false;
  return profile;
}
export function laterFixture(defaultProfile,age) {
  assert(Number.isInteger(age)&&age>=1&&age<=5);
  const profile=ordinaryFixture(defaultProfile);
  Object.assign(profile,{age,enemyAge:age,furthestBattle:age,coins:0});
  profile.chronicle.chapter=age;
  return profile;
}
export function chronicleFixture(defaultProfile) {
  const profile=defaultProfile();
  Object.assign(profile,{sound:false,motion:'system'});
  return profile;
}
export function assertFixture(profile,decodeSave) {
  assert.deepEqual(decodeSave(JSON.stringify(profile)).profile,profile,'fixture must round-trip through the production decoder');
  return profile;
}
