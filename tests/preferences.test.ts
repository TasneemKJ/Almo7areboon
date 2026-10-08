import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile,decodeSave} from '../src/game/save.ts';

const game=()=>{const p=defaultProfile();p.sound=false;return new Game(p);};

test('preferences change through Game.dispatch with validated values',()=>{
 const g=game();
 assert.equal(g.dispatch({type:'preference',preference:'speed',value:2}),true);assert.equal(g.profile.speed,2);
 assert.equal(g.dispatch({type:'preference',preference:'speed',value:2}),false,'an unchanged value reports no change');
 assert.equal(g.dispatch({type:'preference',preference:'motion',value:'reduced'}),true);assert.equal(g.profile.motion,'reduced');
 assert.equal(g.dispatch({type:'preference',preference:'sound',value:true}),true);assert.equal(g.profile.sound,true);
 assert.equal(g.dispatch({type:'preference',preference:'marks',value:true}),true);assert.equal(g.profile.marks,true);
 assert.equal(g.dispatch({type:'preference',preference:'marks',value:false}),true);assert.equal('marks' in g.profile,false,'marks is optional and omitted when off');
});

test('invalid preference input never reaches the save',()=>{
 const g=game(),before=JSON.stringify(g.profile);
 for(const action of [{preference:'speed',value:3},{preference:'speed',value:'2'},{preference:'motion',value:'fast'},{preference:'sound',value:'yes'},{preference:'coins',value:1e9},{preference:'marks',value:1}])
  assert.equal(g.dispatch({type:'preference',...action} as never),false,JSON.stringify(action));
 assert.equal(JSON.stringify(g.profile),before);
 assert.deepEqual(decodeSave(JSON.stringify(g.profile)).profile,g.profile,'the save format is unchanged');
});

test('preferences change nothing about the battle',()=>{
 const g=game();g.dispatch({type:'start'});const state=JSON.stringify(g.state);
 g.dispatch({type:'preference',preference:'speed',value:2});g.dispatch({type:'preference',preference:'motion',value:'reduced'});
 assert.equal(JSON.stringify(g.state),state);
});
