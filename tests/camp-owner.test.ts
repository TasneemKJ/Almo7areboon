import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
const path=new URL('../src/ui/camp-owner.ts',import.meta.url);
const camp=existsSync(path)?await import('../src/ui/camp-owner.ts'):null;

test('Camp admission is ready-only and never admits a held receipt',()=>{
 assert.ok(camp,'Camp must have one explicit ready owner');const game=new Game(defaultProfile());
 assert.equal(camp.canOwnCamp(game.profile,game.state),true);
 for(const phase of ['running','won','lost'] as const){game.state.phase=phase;assert.equal(camp.canOwnCamp(game.profile,game.state),false);}
 game.state.phase='ready';game.profile.pendingVictory={timeline:1,battle:0} as any;
 assert.equal(camp.canOwnCamp(game.profile,game.state),false);
});
test('Camp input parser accepts only exact local actions belonging to the current focus',()=>{
 assert.ok(camp,'Camp actions need focus admission');
 assert.deepEqual(camp.campActionFromData('storehouse',{campAction:'food'}),{type:'upgrade',stat:'food'});
 assert.deepEqual(camp.campActionFromData('gate',{campAction:'base'}),{type:'upgrade',stat:'base'});
 assert.deepEqual(camp.campActionFromData({recruit:1},{campAction:'unlock'}),{type:'unlock',kind:1});
 assert.deepEqual(camp.campActionFromData('storehouse',{campPreparation:'bread'}),{type:'chronicle-preparation',preparation:'bread'});
 assert.deepEqual(camp.campActionFromData('gate',{campPreparation:'repair'}),{type:'chronicle-preparation',preparation:'repair'});
 for(const focus of ['storehouse','gate','company','journal',{recruit:0}] as const){
  for(const campAction of ['start','spawn','skill','claim','unlock-other','food;start'])assert.equal(camp.campActionFromData(focus,{campAction}),null);
 }
 assert.equal(camp.campActionFromData('gate',{campAction:'food'}),null);
 assert.equal(camp.campActionFromData('company',{campPreparation:'bread'}),null);
 assert.equal(camp.campActionFromData({recruit:0},{campAction:'unlock'}),null);
});
