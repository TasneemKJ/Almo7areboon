import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultProfile } from '../src/game/save.ts';
import { entryCopy, entryScreenHtml } from '../src/ui/entry-screen.ts';

test('Home presents only Play and Settings, with the actual chapter artwork',()=>{
 const p=defaultProfile(),before=JSON.stringify(p),html=entryScreenHtml(p);
 assert.equal((html.match(/<button\b(?![^>]*\bhidden)/g)||[]).length,2);
 assert.match(html,/data-command="enter-world"/);
 assert.match(html,/data-command="settings"/);
 assert.doesNotMatch(html,/data-unit|data-order|data-skill|data-tab|data-command="reset"/);
 assert.match(html,/id="entry-art"/);
 assert.equal(JSON.stringify(p),before);
});
test('Home copy distinguishes Play from Continue without promising an automatic reset',()=>{
 const p=defaultProfile();
 assert.equal(entryCopy(p,false).action,'Play');
 assert.equal(entryCopy(p,true).action,'Continue');
 p.enemyAge=3;
 assert.equal(entryCopy(p,true).action,'Continue');
 assert.ok(entryCopy(p,true).chapter.length>0);
 assert.doesNotMatch(entryCopy(p,true).subtitle,/reward|claim|upgrade|new game/i);
});
