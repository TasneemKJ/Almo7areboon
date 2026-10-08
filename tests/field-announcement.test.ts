import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldHarness} from './helpers/field-dom.ts';
import {fieldControlsHtml} from '../src/ui/field-controls.ts';
import {createChronicle} from '../src/game/chronicle.ts';
import {createChronicleBattle} from '../src/game/chronicle-combat.ts';

function spoken(h:ReturnType<typeof fieldHarness>){
 const node=h.node('field-guidance-status'),changes:string[]=[];let current='';
 Object.defineProperty(node,'textContent',{get:()=>current,set:(value:string)=>{current=value;changes.push(value);}});
 return changes;
}

test('visible field countdowns remain inspectable without a live role and have a separate polite decision status',()=>{
 const html=fieldControlsHtml(),cue=html.match(/<p id="field-cue"[^>]*>/)![0];
 assert.doesNotMatch(cue,/role="status"|aria-live/);
 assert.match(html,/<p id="field-guidance-status"[^>]*class="sr-only"[^>]*role="status"[^>]*aria-live="polite"/);
});
test('actual controller speaks a food decision once while its visible seconds count down, then announces danger',()=>{
 const h=fieldHarness(),changes=spoken(h);h.game.profile.wins=0;h.game.state.time=1;
 for(const food of [0,.8,1.6,2.4]){h.game.state.food=food;h.update();}
 assert.match(h.node('field-cue').textContent,/wait 1s/);
 assert.equal(changes.length,1);assert.match(changes[0],/Supplies.*Food Drop.*10.*once per battle/);
 h.game.state.playerHp=h.game.state.playerMaxHp*.2;h.update();h.update();
 assert.equal(changes.length,2);assert.match(changes[1],/^Your base is in danger/);
 h.game.state.phase='won';h.update();assert.equal(changes.at(-1),'');
});
test('actual controller preserves the authored hold objective but does not announce each passing second',()=>{
 const h=fieldHarness(),changes=spoken(h);h.game.profile.wins=7;h.game.state.food=10;
 h.game.profile.chronicle={...createChronicle(),enabled:true,route:'watch'};h.game.state.chronicle=createChronicleBattle(h.game.profile);
 for(const time of [30,31,32,33]){h.game.state.time=time;h.update();}
 assert.equal(h.node('field-cue').textContent,'Keep the courtyard safe · 42 seconds left');
 assert.deepEqual(changes,['Keep the courtyard safe']);
 h.game.state.paused=true;h.update();h.update();assert.equal(changes.at(-1),'Battle paused. Resume to deploy your army.');
});

test('a progressed road company sees and hears each imminent wave counter before generic Chronicle formation advice',()=>{
 const h=fieldHarness(),changes=spoken(h);h.game.profile.wins=7;h.game.profile.unlocked=[true,true,true];h.game.state.food=10;
 h.game.profile.chronicle={...createChronicle(),enabled:true,route:'road',tutorial:4};h.game.state.chronicle=createChronicleBattle(h.game.profile);
 h.game.state.stats.deployedByKind=[1,1,0];const original=h.game.waveStatus();
 for(const [intent,message] of [
  ['volley','Ranged enemies are coming. Melee guards take less damage from them.'],
  ['bulwark','A heavy enemy is coming. Ranged troops deal extra damage to it.'],
  ['rush','A rush is coming. A heavy warrior can hit two enemies.'],
 ] as const){
  h.game.waveStatus=()=>({...original,preview:{...original.preview!,nextIn:2,intent}});
  h.update();h.update();assert.equal(h.node('field-cue').textContent,message);assert.equal(changes.at(-1),message);
 }
 assert.equal(changes.length,3);
});
