import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import type {Unit} from '../src/game/types.ts';
import {defaultProfile} from '../src/game/save.ts';
import {createChronicle,type RouteId} from '../src/game/chronicle.ts';
import {chronicleGuidance} from '../src/game/chronicle-combat.ts';
import {createFieldController} from '../src/ui/field-controller.ts';
import {fieldControlsHtml} from '../src/ui/field-controls.ts';
import {battleGuidance} from '../src/ui/battle-hud.ts';
import {masteryAdvice} from '../src/ui/mastery-presentation.ts';
import {compactResultsHtml} from '../src/ui/results-screen.ts';
import {fieldDom} from './helpers/field-dom.ts';

function harness(route?:RouteId){
 const p=defaultProfile();if(route){p.chronicle=createChronicle(1,0);p.chronicle.route=route;}
 const game=new Game(p);game.dispatch({type:'start'});
 const dom=fieldDom(),controller=createFieldController(dom.root as any);
 return {...dom,game,controller,update:()=>controller.update(game)};
}
test('a native cover target makes the canonical enemy-free Meteor action reachable and expires after use',()=>{
 const h=harness('escort'),s=h.game.state;
 assert.equal(s.units.filter(u=>u.side==='enemy').length,0);assert.equal(h.game.canUseSkill('meteor'),true);
 assert.match(fieldControlsHtml(),/data-field-context="cover"/);
 h.update();const cover=h.node('field-cover');assert.equal(cover.hidden,false);assert.match(cover.getAttribute('style')!,/width:\d/);
 h.controller.select('cover',h.game);const choices=h.node('field-context').querySelectorAll('[data-skill]');
 assert.deepEqual(choices.map(n=>n.dataset.skill),['meteor']);assert.equal(choices[0].disabled,false);
 assert.equal(h.game.dispatch({type:'skill',skill:choices[0].dataset.skill as 'meteor'}),true);
 assert.equal(s.chronicle!.landmark.broken,true);h.update();assert.equal(cover.hidden,true);assert.equal(h.node('field-context').hidden,true);
});
test('cover selection follows pause, broken and used guards rather than opening a stale context',()=>{
 for(const condition of ['paused','broken','used']){
  const h=harness('escort');if(condition==='paused')h.game.state.paused=true;
  if(condition==='broken')h.game.state.chronicle!.landmark.broken=true;
  if(condition==='used')h.game.state.skillsUsed.push('meteor');
  h.update();h.controller.select('cover',h.game);assert.equal(h.node('field-cover').hidden,true,condition);assert.equal(h.node('field-context').hidden,true,condition);
 }
});
test('a living enemy owns the tactical target while its menu keeps Meteor reachable',()=>{
 const h=harness('escort');h.update();h.controller.select('cover',h.game);
 h.game.state.units.push({id:901,side:'enemy',hp:10,x:500,lane:0,kind:0} as Unit);
 h.update();assert.equal(h.node('field-cover').hidden,true,'cover cannot intercept the enemy hit region');
 assert.equal(h.node('field-context').hidden,true);assert.equal(h.node('field-enemy').hidden,false);
 h.controller.select('enemy',h.game);const skills=h.node('field-context').querySelectorAll('[data-skill]');
 assert.deepEqual(skills.map(node=>node.dataset.skill),['freeze','meteor']);assert.equal(skills[1].disabled,false);
});
for(const owner of ['origin','choice','blurred-origin','new-dialog'])test(`enemy arrival safely releases ${owner} focus from the cover choice`,()=>{
 const h=harness('escort');h.update();h.controller.select('cover',h.game);
 const cover=h.node('field-cover'),choice=h.node('field-context').querySelectorAll('[data-skill]')[0],document=h.root.ownerDocument,modal=h.node('test-modal');
 (owner==='choice'?choice:cover).focus();
 if(owner==='blurred-origin'||owner==='new-dialog'){
  let hidden=cover.hidden;
  Object.defineProperty(cover,'hidden',{get:()=>hidden,set(value:boolean){hidden=value;if(value&&document.activeElement===cover){if(owner==='new-dialog')modal.focus();else document.activeElement=null;}}});
 }
 h.game.state.units.push({id:901,side:'enemy',hp:10,x:500,lane:0,kind:0} as Unit);h.update();
 const pause=h.root.querySelector('[data-command="field-pause"]');
 assert.equal(document.activeElement,owner==='new-dialog'?modal:pause);
 assert.equal(h.node('field-context').hidden,true);
});
test('the physical field retains canonical danger even before the first deployment',()=>{
 const h=harness('escort');h.game.state.playerHp=h.game.state.playerMaxHp*.2;
 const message=battleGuidance(h.game.profile,h.game.state);h.update();assert.equal(h.node('field-cue').textContent,message);
});
test('authored mission progress reaches the quiet field cue without state mutation',()=>{
 const h=harness('watch');h.game.state.stats.deployed=3;h.game.state.time=12;h.game.state.food=10;
 const before=JSON.stringify([h.game.profile,h.game.state]),message=chronicleGuidance(h.game.profile,h.game.state);
 assert.match(message,/courtyard.*seconds left/);h.update();assert.equal(h.node('field-cue').textContent,message);
 assert.equal(JSON.stringify([h.game.profile,h.game.state]),before);
});
test('supplies choices visibly name Food Drop and each authored captain replacement',()=>{
 for(const [captain,name]of [['none','Food Drop'],['gatekeeper','Stand together'],['lantern','Borrowed dawn']]as const){
  const h=harness('escort');h.game.profile.chronicle!.captain=captain;h.game.state.stats.deployed=1;
  h.update();h.controller.select('supplies',h.game);const button=h.node('field-context').querySelectorAll('[data-skill]')[0];
  assert.equal(button?.textContent,name,captain);assert.match(button.getAttribute('aria-label')!,new RegExp(name));
 }
});
test('the canonical Food Drop lesson points to the physical supplies target',()=>{
 const h=harness();h.game.state.stats.deployed=1;h.game.state.food=0;
 assert.match(battleGuidance(h.game.profile,h.game.state),/^Food Drop/);h.update();
 assert.match(h.node('field-cue').textContent,/Select supplies.*Food Drop/);
});
test('visual food countdown changes without repeatedly rewriting the spoken instruction',()=>{
 const h=harness();h.game.profile.wins=6;h.game.state.stats.deployed=3;h.game.state.food=0;
 h.update();const visual=h.node('field-cue').textContent,spoken=h.node('field-announcement'),first=spoken.textContent,writes=spoken.writes;
 assert.ok(first);h.game.state.food=1;h.update();assert.notEqual(h.node('field-cue').textContent,visual);
 assert.equal(spoken.textContent,first);assert.equal(spoken.writes,writes);
 h.game.state.playerHp=1;h.update();assert.match(spoken.textContent,/danger/);assert.equal(spoken.writes,writes+1);
 const html=fieldControlsHtml(),visualTag=html.match(/<p id="field-cue"[^>]*>/)![0];
 assert.doesNotMatch(visualTag,/role="status"|aria-live|aria-hidden/,'progress remains readable on demand without announcing each tick');
 assert.match(html,/id="field-announcement"[^>]*role="status"/);
});
test('Chronicle countdown announces the task once while the visible remaining seconds advance',()=>{
 const h=harness('watch');h.game.state.stats.deployed=3;h.game.state.time=12;h.update();
 const spoken=h.node('field-announcement'),text=spoken.textContent,writes=spoken.writes,visual=h.node('field-cue').textContent;
 assert.ok(text);h.game.state.time=13;h.update();assert.notEqual(h.node('field-cue').textContent,visual);
 assert.equal(spoken.textContent,text);assert.equal(spoken.writes,writes);
});
test('compact Regroup keeps its three choices and includes the supported next-attempt fact',()=>{
 const h=harness();h.game.state.phase='lost';
 const html=compactResultsHtml(h.game.profile,h.game.state),advice=masteryAdvice(h.game.profile,h.game.state);
 assert.ok(html.includes(advice));assert.equal((html.match(/<button\b/g)||[]).length,3);assert.match(html,/Your earned coins stay/);
});
