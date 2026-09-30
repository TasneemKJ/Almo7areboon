import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {troopControlLabel} from '../src/ui/army-screen.ts';
import type {DeploymentStatus} from '../src/game/types.ts';
const label=(g:Game,kind:0|1|2=0)=>troopControlLabel(g.profile,kind,g.deploymentStatus(kind));

test('unlock name explains actual coin shortage and changes after an accepted unlock',()=>{
 const g=new Game();assert.match(label(g,1),/^Unlock Thrower, 150 coins\. Needs 150 more coins/);g.profile.coins=149;assert.match(label(g,1),/Needs 1 more coin\./);
 g.profile.coins=150;assert.match(label(g,1),/Tap to unlock/);assert.equal(g.dispatch({type:'unlock',kind:1}),true);assert.match(label(g,1),/^Deploy Thrower, 5 food\. Start battle to deploy/);
});

test('public deployment and pause/food actions teach timing without mutating state',()=>{
 const g=new Game();g.dispatch({type:'start'});g.dispatch({type:'spawn',kind:0});g.dispatch({type:'spawn',kind:0});
 const before=JSON.stringify([g.profile,g.state]);assert.match(label(g),/^Deploy Pathkeeper, 3 food\. Ready in 4 seconds/);assert.equal(JSON.stringify([g.profile,g.state]),before);
 assert.equal(g.dispatch({type:'pause'}),true);assert.match(label(g),/Resume battle to deploy/);g.dispatch({type:'pause'});g.dispatch({type:'skill',skill:'food'});assert.match(label(g),/Tap to deploy/);assert.match(label(g),/Takes less damage from ranged enemies/);
});

test('explicit unavailable reasons and rounded food wait share truthful control wording',()=>{
 const p=defaultProfile();for(const [reason,expected] of [['blocked','Deployment area full'],['capacity','Army limit reached'],['invalid','Deployment unavailable']] as const){const s:DeploymentStatus={allowed:false,reason,missingFood:0,waitSeconds:0};assert.ok(troopControlLabel(p,0,s).includes(expected));}
 const s:DeploymentStatus={allowed:false,reason:'food',missingFood:1,waitSeconds:1.01};assert.match(troopControlLabel(p,0,s),/Ready in 2 seconds/);
});
