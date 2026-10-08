import test from 'node:test';import assert from 'node:assert/strict';
import {physicalSkillCue} from '../src/ui/field-skill-guidance.ts';
import {battleGuidance} from '../src/ui/battle-hud.ts';import {Game} from '../src/game/simulation.ts';
import type {Unit} from '../src/game/types.ts';
test('physical teaching preserves canonical Freeze/Meteor prerequisites without demanding a hidden button',()=>{
 const game=new Game(),s=game.state,p=game.profile;s.phase='running';s.food=10;s.time=30;s.stats.deployed=3;
 s.units=Array.from({length:3},()=>({side:'enemy',hp:10} as Unit));
 assert.equal(physicalSkillCue(battleGuidance(p,s)),'Select an enemy, then Freeze to hold the group.');
 s.skillsUsed.push('freeze');s.stats.skillsCast=1;assert.equal(physicalSkillCue(battleGuidance(p,s)),'Select an enemy, then Meteor to strike the group.');
 s.time=19;assert.doesNotMatch(physicalSkillCue(battleGuidance(p,s)),/^Select an enemy, then Meteor/);s.time=30;
 s.skillsUsed.push('meteor');assert.doesNotMatch(physicalSkillCue(battleGuidance(p,s)),/^Select an enemy, then Meteor/);s.skillsUsed.pop();
 p.wins=9;assert.doesNotMatch(physicalSkillCue(battleGuidance(p,s)),/^Select an enemy, then Meteor/);p.wins=0;s.units.pop();assert.doesNotMatch(physicalSkillCue(battleGuidance(p,s)),/^Select an enemy, then Meteor/);
});
