import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import type {Skill,Unit} from '../src/game/types.ts';
import {fieldHarness} from './helpers/field-dom.ts';

function cover(){const profile=defaultProfile();profile.chronicle!.enabled=true;profile.chronicle!.route='escort';return fieldHarness(new Game(profile));}

test('intact road cover without enemies exposes the existing Meteor action at its physical target',()=>{
 const h=cover(),before=JSON.stringify([h.game.profile,h.game.state]);
 assert.equal(h.game.canUseSkill('meteor'),true);h.update();
 assert.equal(h.node('field-enemy').hidden,false);assert.match(h.node('field-enemy').getAttribute('aria-label')!,/shelter.*Meteor/);
 h.controller.select('enemy',h.game);const buttons=h.node('field-context').querySelectorAll('[data-skill]');
 assert.deepEqual(buttons.map(button=>button.dataset.skill),['meteor']);assert.equal(buttons[0].disabled,false);
 assert.equal(JSON.stringify([h.game.profile,h.game.state]),before,'selection does not use the skill');
 assert.equal(h.game.dispatch({type:'skill',skill:buttons[0].dataset.skill as Skill}),true);
 h.update();assert.equal(h.game.state.chronicle!.landmark.broken,true);assert.equal(h.node('field-context').hidden,true);
 assert.equal(h.node('field-enemy').hidden,true);assert.equal(h.game.dispatch({type:'skill',skill:'meteor'}),false);
});
test('a living enemy retains the ordinary Freeze and Meteor target before cover',()=>{
 const h=cover();h.game.state.units=[{id:9,side:'enemy',kind:0,hp:10,x:700,lane:1}] as Unit[];h.update();
 assert.equal(h.node('field-enemy').dataset.enemyId,'9');h.controller.select('enemy',h.game);
 assert.deepEqual(h.node('field-context').querySelectorAll('[data-skill]').map(button=>button.dataset.skill),['freeze','meteor']);
});
test('broken, spent, paused and non-cover landmarks never expose an unusable shelter target',()=>{
 for(const condition of ['broken','spent','paused','supply']){
  const h=cover();
  if(condition==='broken')h.game.state.chronicle!.landmark.broken=true;
  if(condition==='spent')h.game.state.skillsUsed.push('meteor');
  if(condition==='paused')h.game.state.paused=true;
  if(condition==='supply')h.game.state.chronicle!.landmark.kind='supply';
  h.update();assert.equal(h.node('field-enemy').hidden,true,condition);
 }
});

test('the visible Supplies commitment names the actual support skill for every captain',()=>{
 for(const [captain,label] of [['none','Food Drop'],['gatekeeper','Stand together'],['lantern','Borrowed dawn']] as const){
  const profile=defaultProfile();profile.chronicle!.enabled=true;profile.chronicle!.captain=captain;profile.chronicle!.choices[0]='scout';
  const h=fieldHarness(new Game(profile));h.update();h.controller.select('supplies',h.game);
  const button=h.node('field-context').querySelectorAll('[data-skill]')[0];
  assert.equal(button.textContent,label);assert.match(button.getAttribute('aria-label')!,new RegExp(label));
 }
});
