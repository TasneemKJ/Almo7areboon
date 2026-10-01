import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectCombatCues} from '../src/view/combat-cues.ts';
test('bell warning uses its own audible warning, not a fake damage hit',()=>{const cues=selectCombatCues([{type:'hit',storyCue:'bell-warning',amount:0}]);assert.equal(cues.length,1);assert.equal(cues[0].id,'story-bell');assert.equal(cues[0].critical,true);});
test('victory takes priority over story accents and cue batches remain bounded',()=>{const cues=selectCombatCues([{type:'hit',storyCue:'bell-warning'},{type:'hit',storyCue:'shatter'},{type:'win'}]);assert.deepEqual(cues.map(c=>c.id),['win']);});
test('captain replacement has a distinct cue rather than a food award sound',()=>{assert.equal(selectCombatCues([{type:'skill',skill:'food',storyCue:'captain',amount:0}])[0].id,'story-protect');});
