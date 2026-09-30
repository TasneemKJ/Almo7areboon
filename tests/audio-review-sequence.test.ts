import test from 'node:test';
import assert from 'node:assert/strict';
import {crowdedAudioBatches,REVIEW_CUES} from './fixtures/audio-review.ts';
import {selectCombatCues} from '../src/view/combat-cues.ts';
test('crowded reference keeps required real metadata and coalesces exact shared-time batches',()=>{
 const batches=crowdedAudioBatches();
 assert.equal(REVIEW_CUES.length,17);assert.equal(new Set(REVIEW_CUES).size,17);
 const at=(time:number)=>batches.find(batch=>batch.at===time)!.events;
 assert.deepEqual(selectCombatCues(at(3)).map(c=>c.id),['base-player','deploy','coin']);
 assert.deepEqual(selectCombatCues(at(4)).map(c=>c.id),['freeze','hit-hollow','coin']);
 assert.deepEqual(selectCombatCues(at(9)).map(c=>c.id),['meteor','hit-flick','deploy']);
 assert.deepEqual(selectCombatCues(at(14)).map(c=>c.id),['food','hit-blunt','coin']);
 assert.deepEqual(selectCombatCues(at(19)).map(c=>c.id),['win']);
 assert.equal(batches.flatMap(b=>b.events).filter(e=>e.type==='hit'&&e.target==='unit').length,182);
 assert.equal(batches.flatMap(b=>b.events).filter(e=>e.type==='hit'&&e.target==='base'&&e.side==='enemy').length,4);
 assert.equal(batches.flatMap(b=>b.events).filter(e=>e.type==='spawn'&&e.side==='player').length,12);
 assert.ok(batches.every((b,i)=>i===0||b.at>batches[i-1].at));
});
