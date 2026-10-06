import {hasPriorPlay,entrySecondary} from '../src/ui/entry-screen.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile,decodeSave} from '../src/game/save.ts';
import {exportBackup,importBackup} from '../src/game/backup.ts';
import {startOverProfile} from '../src/game/reset.ts';

test('only an accepted Start records optional actual play, preserved by reload and backup',()=>{
 const g=new Game(defaultProfile());assert.equal((g.profile as any).played,undefined);
 assert.equal(g.dispatch({type:'retreat'}),false);assert.equal((g.profile as any).played,undefined);
 assert.equal(g.dispatch({type:'start'}),true);assert.equal((g.profile as any).played,true);
 assert.equal((decodeSave(JSON.stringify(g.profile)).profile as any).played,true);
 const backup=importBackup(exportBackup(g.profile));assert.equal(backup.ok,true);if(backup.ok)assert.equal((backup.profile as any).played,true);
});
test('play history accepts only true and a full restart removes it',()=>{
 for(const played of [false,1,'true',null])assert.equal((decodeSave(JSON.stringify({...defaultProfile(),played})).profile as any).played,undefined);
 const g=new Game(defaultProfile());g.dispatch({type:'start'});assert.equal((startOverProfile(g.profile) as any).played,undefined);
});

test('older battle histories unlock ready Camp but preference-only saves do not',()=>{
 const p=defaultProfile();p.sound=false;p.motion='reduced';p.marks=true;p.dailyDay=20000;p.dailyStreak=3;
 assert.equal(hasPriorPlay(p),false);assert.equal(entrySecondary(p,new Game(p).state),null);
 for(const field of ['deployed','wins','kills'] as const){const old=defaultProfile();old[field]=1;assert.equal(hasPriorPlay(old),true);assert.equal(entrySecondary(old,new Game(old).state),'camp');}
});
test('rejected Start cannot forge prior-play history',()=>{
 const g=new Game(defaultProfile());g.state.phase='lost';assert.equal(g.dispatch({type:'start'}),false);assert.equal(g.profile.played,undefined);
});
