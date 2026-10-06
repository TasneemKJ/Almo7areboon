import test from 'node:test';import assert from 'node:assert/strict';
import {preferencesHtml} from '../src/ui/preferences-screen.ts';import {defaultProfile} from '../src/game/save.ts';
test('flat preferences retain truthful physical and keyboard discovery without more buttons',()=>{
 const html=preferencesHtml(defaultProfile(),true,{effects:100,atmosphere:100},true,'');
 assert.match(html,/waiting defender/);assert.match(html,/<kbd>1–3<\/kbd>/);assert.match(html,/<kbd>Q\/W\/E<\/kbd>/);assert.match(html,/clears selection/);assert.equal((html.match(/<button/g)||[]).length,3);assert.doesNotMatch(html,/buttons above your army/);
});
