import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=()=>readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');

test('resolved heavy unit hits carry one truthful mark to the real visual impact',()=>{
 const code=source();
 assert.match(code,/battlefieldMemoryIntentForHit\(e\)/);
 assert.match(code,/memory\?:BattlefieldMemoryInput/);
 assert.match(code,/memory:intent\?\?undefined/);
 assert.match(code,/this\.rememberImpact\(bolt\.memory\)/);
 assert.match(code,/else\{this\.impact\([^;]+;if\(intent\)this\.rememberImpact\(intent\);\}/);
});

test('accepted Meteor lands only on real current enemy views and survives reduced motion',()=>{
 const code=source();
 assert.match(code,/type TroopView=\{[^}]*lane:number/);
 assert.match(code,/view\.lane=unit\.lane/);
 assert.match(code,/const targets=\[\.\.\.this\.units\.values\(\)\]\.filter\(v=>v\.side==='enemy'\)\.slice\(0,6\)/);
 assert.match(code,/kind:'meteor',x:v\.x,lane:v\.lane,side:'player'/);
 assert.match(code,/if\(this\.reduce\)\{[^}]*for\(const v of targets\)this\.rememberImpact/);
 assert.match(code,/memory:targets\.length\?memory:undefined/,'the no-target fallback meteor must not leave a false scar');
});

test('memory reuses the three ground layers and clears every renderer lifecycle boundary',()=>{
 const code=source();
 assert.match(code,/private battlefieldMemory:readonly BattlefieldMemoryMark\[\]=\[\]/);
 assert.match(code,/battlefieldMemoryFrame\(mark,this\.reduce\)/);
 assert.match(code,/groundEffectLayer\(this\.groundFx,this\.fx,mark\.lane\)/);
 assert.match(code,/this\.battlefieldMemory=stepBattlefieldMemory\(this\.battlefieldMemory,dt,game\.state\.paused\)/);
 assert.match(code,/dataset\.battlefieldMemory=JSON\.stringify/);
 assert.match(code,/delete this\.game\.canvas\.dataset\.battlefieldMemory/);
 assert.match(code,/this\.battlefieldMemory=\[\]/);
 const allocations=code.match(/this\.add\.graphics\(\)/g)??[];
 assert.equal(allocations.length,12,'battlefield memory must not allocate another scene-lifetime graphics object');
});
