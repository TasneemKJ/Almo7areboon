import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectCombatCues} from '../src/view/combat-cues.ts';
test('bell warning uses its own audible warning, not a fake damage hit',()=>{const cues=selectCombatCues([{type:'hit',storyCue:'bell-warning',amount:0}]);assert.equal(cues.length,1);assert.equal(cues[0].id,'story-bell');assert.equal(cues[0].critical,true);});
test('victory takes priority over story accents and cue batches remain bounded',()=>{const cues=selectCombatCues([{type:'hit',storyCue:'bell-warning'},{type:'hit',storyCue:'shatter'},{type:'win'}]);assert.deepEqual(cues.map(c=>c.id),['win']);});
test('captain replacement has a distinct cue rather than a food award sound',()=>{assert.equal(selectCombatCues([{type:'skill',skill:'food',storyCue:'captain',amount:0}])[0].id,'story-protect');});
test('guard, breach, landmark and rescue keep distinct tactical accents',()=>{
 const cases=[
  [{type:'hit',target:'unit',storyCue:'covered',amount:7,source:{id:1,x:300,lane:1,side:'enemy',age:0,kind:0}},'story-cover'],
  [{type:'hit',target:'unit',storyCue:'breach',amount:11,source:{id:2,x:400,lane:1,side:'player',age:0,kind:2}},'story-breach'],
  [{type:'hit',storyCue:'landmark',amount:0},'story-landmark'],
  [{type:'hit',storyCue:'rescued',amount:0},'story-rescue'],
 ] as const;
 for(const [event,want] of cases)assert.equal(selectCombatCues([event])[0]?.id,want);
 assert.equal(new Set(cases.map(([,want])=>want)).size,4);
});
test('tactical accents remain bounded and outcomes still silence the battle batch',()=>{
 const accents=selectCombatCues([
  {type:'hit',storyCue:'covered',target:'unit',amount:5},
  {type:'hit',storyCue:'breach',target:'unit',amount:5},
  {type:'hit',storyCue:'landmark',amount:0},
  {type:'hit',storyCue:'rescued',amount:0},
 ]);
 assert.deepEqual(accents.map(cue=>cue.id),['story-cover','story-breach','story-landmark']);
 assert.deepEqual(selectCombatCues([{type:'hit',storyCue:'story-that-does-not-exist' as any,amount:0}]),[]);
 assert.deepEqual(selectCombatCues([{type:'hit',storyCue:'story-that-does-not-exist' as any,amount:0},{type:'lose'}]).map(cue=>cue.id),['lose']);
});
