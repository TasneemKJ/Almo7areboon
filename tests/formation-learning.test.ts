import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {battleGuidance} from '../src/ui/battle-hud.ts';
import type {DeploymentStatus,Unit} from '../src/game/types.ts';
const cue='Ranged troops need cover. Add a melee guard.';
const hint=(g:Game,status:DeploymentStatus=g.deploymentStatus(0))=>battleGuidance(g.profile,g.state,g.waveStatus().preview,status);
function rangedArmy(){const p=defaultProfile();p.coins=150;const g=new Game(p);assert.equal(g.dispatch({type:'unlock',kind:1}),true);assert.equal(g.dispatch({type:'start'}),true);assert.equal(g.dispatch({type:'spawn',kind:1}),true);for(let i=0;i<240;i++)g.step(1/60);assert.equal(g.deploymentStatus(0).allowed,true);return g;}

test('actual ranged deployment and food growth teach an available guard; adding one completes the cue',()=>{
 const g=rangedArmy(),before=JSON.stringify([g.profile,g.state]);assert.equal(hint(g),cue);assert.equal(JSON.stringify([g.profile,g.state]),before);
 assert.equal(g.dispatch({type:'spawn',kind:0}),true);assert.notEqual(hint(g),cue);assert.equal(g.state.stats.deployedByKind[0],1);
});

test('formation advice fails closed when guard deployment is unavailable and keeps urgent priorities',()=>{
 const g=rangedArmy();for(const reason of ['food','blocked','capacity','paused','ready','locked','invalid'] as const)assert.notEqual(hint(g,{allowed:false,reason,missingFood:0,waitSeconds:0}),cue);
 assert.notEqual(battleGuidance(g.profile,g.state,g.waveStatus().preview),cue);
 g.state.food=0;assert.match(hint(g),/Food Drop/);g.state.food=6;g.state.playerHp=1;assert.match(hint(g),/danger/);g.state.paused=true;assert.match(hint(g),/paused/);
 g.state.paused=false;g.state.phase='won';assert.match(hint(g),/Victory/);g.state.phase='lost';assert.match(hint(g),/coins are safe/);
});

test('only living friendly ranged troops without living melee or heavy cover prompt early players',()=>{
 const g=rangedArmy(),ranged=g.state.units.find(u=>u.side==='player'&&u.kind===1)!;
 const cover:Unit={...ranged,id:999,kind:0,hp:0};g.state.units.push(cover);assert.equal(hint(g),cue);
 cover.hp=10;assert.notEqual(hint(g),cue);cover.kind=2;assert.notEqual(hint(g),cue);cover.side='enemy';assert.equal(hint(g),cue);
 ranged.hp=0;assert.notEqual(hint(g),cue);ranged.hp=10;ranged.side='enemy';assert.notEqual(hint(g),cue);ranged.side='player';g.profile.wins=3;assert.notEqual(hint(g),cue);
});
