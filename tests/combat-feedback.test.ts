import test from 'node:test';
import assert from 'node:assert/strict';
import * as feedback from '../src/view/combat-feedback.ts';
import type {GameEvent} from '../src/game/types.ts';
const {projectileForHit}=feedback;
const hit:GameEvent={type:'hit',target:'unit',x:400,lane:2,amount:4,source:{id:1,kind:2,age:3,side:'player',x:300,lane:0}};
test('resolved trait cues use actual positive unit hits and resolved coordinates',()=>{
 assert.equal(typeof feedback.traitCueForHit,'function','resolved trait cue validation must exist');
 const {traitCueForHit}=feedback;
 for(const trait of ['guard','pierce','sweep'] as const)assert.deepEqual(traitCueForHit({...hit,trait}),{trait,x:400,lane:2});
 for(const event of [hit,{...hit,trait:'unknown'},{...hit,trait:'guard',target:'base'},{...hit,trait:'guard',target:undefined},{...hit,trait:'guard',amount:0},{...hit,trait:'guard',amount:-1},{...hit,trait:'guard',amount:Infinity},{...hit,trait:'guard',x:NaN},{...hit,trait:'guard',lane:undefined},{...hit,trait:'guard',lane:Infinity},{...hit,trait:'guard',x:undefined},{...hit,trait:'guard',type:'coin'}])assert.equal(traitCueForHit(event as GameEvent),null);
});
test('secondary sweep never creates a duplicate cannon projectile',()=>{
 assert.equal(projectileForHit({...hit,trait:'sweep'}),null);
 for(const trait of [undefined,'guard','pierce'] as const)assert.ok(projectileForHit({...hit,trait}));
 assert.ok(projectileForHit({...hit,target:'base'}));
});
