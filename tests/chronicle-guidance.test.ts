import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {skillCue} from '../src/ui/skill-cues.ts';
import {battleGuidance} from '../src/ui/battle-hud.ts';
test('captain skill presentation describes the replacement, not the removed Food Drop',()=>{const g=new Game(defaultProfile());g.dispatch({type:'chronicle-captain',captain:'gatekeeper'});g.dispatch({type:'start'});g.state.food=99;const cue=skillCue(g.profile,g.state,'food',true);assert.match(cue.label,/Stand together/);assert.doesNotMatch(cue.label,/Food Drop|storage full|gain up to 10/);assert.equal(cue.badge,'GUARD');g.dispatch({type:'skill',skill:'food'});assert.match(skillCue(g.profile,g.state,'food',false).label,/used this battle/);});
test('low-food teaching does not promise food from the captain replacement skill',()=>{const g=new Game(defaultProfile());g.dispatch({type:'chronicle-captain',captain:'gatekeeper'});g.dispatch({type:'start'});g.state.food=0;g.state.stats.deployed=1;assert.doesNotMatch(battleGuidance(g.profile,g.state),/Food Drop/);});
import {waveLabel,waveAccessibleLabel} from '../src/ui/battle-hud.ts';
import {waveInspectionHtml} from '../src/ui/wave-inspection.ts';
import {createArmyUpdater} from '../src/ui/army-screen.ts';
test('cleared waves do not direct escort players to the irrelevant enemy base',()=>{const status={spawned:5,total:5,nextIn:null,enemiesRemaining:0,pendingEnemies:0,cleared:true,preview:null};assert.match(waveLabel(status,'escort'),/ESCORT THE CART/);assert.match(waveAccessibleLabel(status,'hold'),/courtyard/i);assert.doesNotMatch(waveInspectionHtml(status,'rescue'),/attack the enemy base/);});
test('the replacement skill has a guard icon, not the food icon, and refreshes on selection changes',()=>{const p=defaultProfile(),units={innerHTML:''},skills={innerHTML:''},stages={innerHTML:''},update=createArmyUpdater({units,skills,stages},()=>'/portrait');update(p);const before=skills.innerHTML;p.chronicle!.captain='gatekeeper';update(p);assert.notEqual(skills.innerHTML,before);assert.match(skills.innerHTML,/Stand together/);p.chronicle!.captain='none';update(p);assert.equal(skills.innerHTML,before);});


test('completed chronicle outcomes keep their victory or regroup guidance',()=>{
 for(const phase of ['won','lost'] as const){
  const g=new Game(defaultProfile());
  g.dispatch({type:'chronicle-route',route:'escort',battle:0});
  g.state.phase=phase;
  const text=battleGuidance(g.profile,g.state);
  if(phase==='won')assert.match(text,/Victory!/);
  else assert.match(text,/coins are safe/i);
  assert.doesNotMatch(text,/Flour cart/);
 }
});
