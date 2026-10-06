import test from 'node:test';import assert from 'node:assert/strict';
import {physicalSkillCue} from '../src/ui/field-skill-guidance.ts';
import {battleGuidance} from '../src/ui/battle-hud.ts';import {Game} from '../src/game/simulation.ts';
import type {Unit} from '../src/game/types.ts';
test('physical teaching preserves canonical Freeze/Meteor prerequisites without demanding a hidden button',()=>{
 const game=new Game(),s=game.state,p=game.profile;s.phase='running';s.food=50;s.time=30;s.stats.deployed=3;
 s.units=Array.from({length:3},()=>({side:'enemy',hp:10} as Unit));
 assert.equal(physicalSkillCue(battleGuidance(p,s)),'Select an enemy, then Freeze to hold the group.');
 s.skillsUsed.push('freeze');s.stats.skillsCast=1;assert.equal(physicalSkillCue(battleGuidance(p,s)),'Select an enemy, then Meteor to strike the group.');
 s.time=19;assert.equal(physicalSkillCue(battleGuidance(p,s)),'');s.time=30;
 s.skillsUsed.push('meteor');assert.equal(physicalSkillCue(battleGuidance(p,s)),'');s.skillsUsed.pop();
 p.wins=9;assert.equal(physicalSkillCue(battleGuidance(p,s)),'');p.wins=0;s.units.pop();assert.equal(physicalSkillCue(battleGuidance(p,s)),'');
});
