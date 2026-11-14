import test from 'node:test';import assert from 'node:assert/strict';
import {preferencesHtml} from '../src/ui/preferences-screen.ts';import {defaultProfile} from '../src/game/save.ts';
test('flat preferences retain truthful physical and keyboard discovery alongside the optional film action',()=>{
 const html=preferencesHtml(defaultProfile(),true,{effects:100,atmosphere:100},true,'');
 assert.match(html,/troop on the board/);assert.match(html,/drag the banner forward to advance or back to hold; tap your camp to gather/);assert.match(html,/<kbd>1–3<\/kbd>/);assert.match(html,/<kbd>Q\/W\/E<\/kbd>/);assert.match(html,/clears selection/);assert.equal((html.match(/<button/g)||[]).length,5);assert.doesNotMatch(html,/buttons above your army/);
});
