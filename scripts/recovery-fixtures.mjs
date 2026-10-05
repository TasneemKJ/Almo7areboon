/** Recovery-only initial fixtures. Never used by the fresh first-play case. */
import assert from 'node:assert/strict';
export function rendererFailureFixture(defaultProfile,decodeSave){
  const profile=defaultProfile();Object.assign(profile,{coins:37,deployed:2});const raw=JSON.stringify(profile);
  assert.equal(decodeSave(raw).problem,null);assert.deepEqual(decodeSave(raw).profile,profile);
  return [raw,raw];
}
export function futureSaveFixture(defaultProfile,decodeSave){
  const primary=JSON.stringify({version:99,qaSentinel:'future-save-must-remain-byte-identical'}),backup=JSON.stringify(defaultProfile());
  assert.equal(decodeSave(primary).problem,'unsupported');assert.equal(decodeSave(backup).problem,null);
  return [primary,backup];
}
