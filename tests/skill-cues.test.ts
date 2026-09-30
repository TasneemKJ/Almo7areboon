import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
async function subject(){return import('../src/ui/skill-cues.ts');}
function group(){const p=defaultProfile();p.enemyAge=5;p.furthestBattle=5;const g=new Game(p);g.dispatch({type:'start'});for(let i=0;i<301;i++)g.step(1/60);return g;}

test('live group cue reflects actual targets and never promises kills',async()=>{
 const {skillCue}=await subject(),g=group(),before=JSON.stringify(g);
 const enemies=g.state.units.filter(u=>u.side==='enemy'&&u.hp>0);assert.equal(enemies.length,3);
 for(const skill of ['freeze','meteor'] as const){const cue=skillCue(g.profile,g.state,skill,g.canUseSkill(skill));assert.equal(cue.badge,'3');assert.equal(cue.opportunity,true);assert.match(cue.label,/3 living enemies/);assert.doesNotMatch(cue.label,/kill|defeat/i);}
 assert.equal(JSON.stringify(g),before);
 g.dispatch({type:'pause'});assert.equal(skillCue(g.profile,g.state,'meteor',g.canUseSkill('meteor')).opportunity,false);
});
test('empty Freeze explains immediate use and active clock stays fixed while paused',async()=>{
 const {skillCue}=await subject(),g=new Game(defaultProfile());g.dispatch({type:'start'});
 const empty=skillCue(g.profile,g.state,'freeze',g.canUseSkill('freeze'));
 assert.equal(empty.badge,'0');assert.equal(empty.opportunity,false);assert.match(empty.label,/starts immediately/i);
 assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);
 assert.equal(skillCue(g.profile,g.state,'freeze',false).badge,'7s');
 assert.equal(skillCue(g.profile,g.state,'freeze',false).activeEffect,true);
 for(let i=0;i<60;i++)g.step(1/60);
 assert.equal(skillCue(g.profile,g.state,'freeze',false).badge,'6s');
 g.dispatch({type:'pause'});for(let i=0;i<120;i++)g.step(1/60);
 assert.equal(skillCue(g.profile,g.state,'freeze',false).badge,'6s');
});
test('legacy duration, spent state and food capacity have truthful cues',async()=>{
 const {skillCue}=await subject(),p=defaultProfile();p.legacy={rank:2,selected:'stillness'};const g=new Game(p);g.dispatch({type:'start'});g.dispatch({type:'skill',skill:'freeze'});
 assert.equal(skillCue(g.profile,g.state,'freeze',false).badge,'9s');
 for(let i=0;i<541;i++)g.step(1/60);assert.equal(skillCue(g.profile,g.state,'freeze',false).badge,'✓');
 assert.match(skillCue(g.profile,g.state,'freeze',false).label,/used this battle/i);
 g.state.food=99;const food=skillCue(g.profile,g.state,'food',g.canUseSkill('food'));assert.equal(food.opportunity,false);assert.match(food.label,/storage full/i);
 g.state.phase='lost';assert.equal(skillCue(g.profile,g.state,'meteor',false).opportunity,false);
 assert.match(skillCue(g.profile,g.state,'meteor',false).label,/battle complete/i);
});
test('dead enemies and friendly warriors are excluded from target badges',async()=>{
 const {skillCue}=await subject(),g=group(),enemy=g.state.units[0];
 g.state.units.push({...enemy,id:999,side:'player'},{...enemy,id:1000,hp:0});
 const cue=skillCue(g.profile,g.state,'meteor',true);assert.equal(cue.badge,'3');
 assert.equal(skillCue(g.profile,g.state,'meteor',false).opportunity,false,'caller availability remains authoritative');
});
