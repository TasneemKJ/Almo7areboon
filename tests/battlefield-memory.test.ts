import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTLEFIELD_MEMORY_CAP,
  BATTLEFIELD_MEMORY_LIFE,
  battlefieldMemoryAfterReset,
  battlefieldMemoryFrame,
  battlefieldMemoryIntentForHit,
  battlefieldMemoryNeedsHudMeasurement,
  battlefieldMemoryRegionClearOf,
  rememberBattlefieldMark,
  stepBattlefieldMemory,
  type BattlefieldMemoryMark,
} from '../src/view/battlefield-memory.ts';

const heavy=(x=180,lane=1,side:'player'|'enemy'='player')=>
  rememberBattlefieldMark([], {kind:'heavy',x,lane,side});

test('HUD geometry is measured only while battlefield memory is visible',()=>{
 assert.equal(battlefieldMemoryNeedsHudMeasurement([]),false);
 assert.equal(battlefieldMemoryNeedsHudMeasurement(heavy()),true);
});

test('motion-mode resets preserve live marks while scene resets clear them',()=>{
 const marks=heavy();
 assert.equal(battlefieldMemoryAfterReset(marks,'motion'),marks);
 assert.deepEqual(battlefieldMemoryAfterReset(marks,'scene'),[]);
});

test('motion reset commits accepted impact memory still carried by a cleared projectile',()=>{
 const after=battlefieldMemoryAfterReset([], 'motion', [{kind:'meteor',x:240,lane:2,side:'player'}]);
 assert.equal(after.length,1);
 assert.deepEqual({...after[0]},{kind:'meteor',x:240,lane:2,side:'player',age:0,life:BATTLEFIELD_MEMORY_LIFE,order:1});
});

test('a truthful impact creates one finite immutable fourteen-second road mark',()=>{
 const marks=heavy();
 assert.equal(marks.length,1);
 assert.deepEqual(marks[0],{kind:'heavy',x:180,lane:1,side:'player',age:0,life:BATTLEFIELD_MEMORY_LIFE,order:1});
 assert.equal(BATTLEFIELD_MEMORY_LIFE,14);
 assert.equal(Object.isFrozen(marks),true);
 assert.equal(Object.isFrozen(marks[0]),true);
 assert.throws(()=>{(marks as BattlefieldMemoryMark[]).push(marks[0]);},TypeError);
});

test('nearby same-lane marks refresh while distinct blows stay bounded to the newest six',()=>{
 let marks=heavy(80,0);
 marks=rememberBattlefieldMark(marks,{kind:'heavy',x:96,lane:0,side:'player'});
 assert.equal(marks.length,1);
 assert.equal(marks[0].x,96);
 assert.equal(marks[0].age,0);
 for(let index=0;index<8;index++)marks=rememberBattlefieldMark(marks,{kind:index===7?'meteor':'heavy',x:120+index*30,lane:index%3,side:index%2?'enemy':'player'});
 assert.equal(marks.length,BATTLEFIELD_MEMORY_CAP);
 assert.equal(BATTLEFIELD_MEMORY_CAP,6);
 assert.deepEqual(marks.map(mark=>mark.order),[5,6,7,8,9,10]);
});

test('pause leaves memory byte-stable and active time expires it at fourteen seconds',()=>{
 const marks=heavy();
 assert.deepEqual(stepBattlefieldMemory(marks,9,true),marks);
 const aged=stepBattlefieldMemory(marks,10,false);
 assert.equal(aged[0].age,10);
 assert.equal(stepBattlefieldMemory(aged,3.999,false).length,1);
 assert.equal(stepBattlefieldMemory(aged,4,false).length,0);
});

test('heavy and meteor scars use distinct shapes and opposing heavy sides reverse direction',()=>{
 const player=battlefieldMemoryFrame(heavy(180,1,'player')[0],false);
 const enemy=battlefieldMemoryFrame(heavy(180,1,'enemy')[0],false);
 const meteor=battlefieldMemoryFrame(rememberBattlefieldMark([],{kind:'meteor',x:180,lane:1,side:'player'})[0],false);
 assert.equal(player.lines.length,3);
 assert.equal(player.ellipses.length,0);
 assert.equal(enemy.lines.length,3);
 assert.ok(player.lines[0].to.x>player.lines[0].from.x);
 assert.ok(enemy.lines[0].to.x<enemy.lines[0].from.x);
 assert.notEqual(player.lines[0].color,enemy.lines[0].color);
 assert.equal(meteor.lines.length,4);
 assert.equal(meteor.ellipses.length,1);
 assert.deepEqual(meteor.region,{left:168,top:-8,right:192,bottom:8});
});

test('normal motion fades only during the final four seconds while reduced motion stays static',()=>{
 const source=heavy()[0];
 const before=battlefieldMemoryFrame({...source,age:9.999},false);
 const final=battlefieldMemoryFrame({...source,age:12},false);
 const reduced=battlefieldMemoryFrame({...source,age:13.999},true);
 assert.equal(before.alpha,.26);
 assert.equal(final.alpha,.13);
 assert.equal(reduced.alpha,.26);
 assert.equal(Object.isFrozen(final),true);
 assert.equal(Object.isFrozen(final.lines[0]),true);
});

test('HUD-covered road regions are excluded without treating adjacent edges as overlap',()=>{
 const region={left:40,top:100,right:64,bottom:116};
 assert.equal(battlefieldMemoryRegionClearOf(region,[{left:12,top:90,right:52,bottom:130}]),false);
 assert.equal(battlefieldMemoryRegionClearOf(region,[{left:64,top:90,right:90,bottom:130}]),true);
 assert.equal(battlefieldMemoryRegionClearOf(region,[{left:12,top:116,right:52,bottom:130}]),true);
 assert.equal(battlefieldMemoryRegionClearOf(region,[]),true);
});

test('malformed numeric input recovers to finite road bounds without mutating the source',()=>{
 const input={kind:'heavy' as const,x:Infinity,lane:99,side:'player' as const};
 const marks=rememberBattlefieldMark([],input);
 assert.deepEqual(input,{kind:'heavy',x:Infinity,lane:99,side:'player'});
 assert.equal(marks[0].x,225);
 assert.equal(marks[0].lane,1);
 const aged=stepBattlefieldMemory(marks,Infinity,false);
 assert.equal(aged[0].age,0);
 for(const value of Object.values(battlefieldMemoryFrame(marks[0],false).region))assert.equal(Number.isFinite(value),true);
});

test('only resolved positive heavy troop hits create memory intent',()=>{
 const source={id:7,x:300,lane:0,side:'player' as const,age:3,kind:2 as const};
 assert.deepEqual(battlefieldMemoryIntentForHit({type:'hit',target:'unit',x:410,lane:2,amount:9,source}),{kind:'heavy',x:184.5,lane:2,side:'player'});
 for(const event of [
  {type:'hit',target:'base',x:410,lane:2,amount:9,source},
  {type:'hit',target:'unit',x:410,lane:2,amount:0,source},
  {type:'hit',target:'unit',x:410,lane:2,amount:9,source:{...source,kind:1 as const}},
  {type:'hit',target:'unit',x:410,lane:2,amount:9},
  {type:'skill',skill:'meteor'},
 ] as const)assert.equal(battlefieldMemoryIntentForHit(event as never),null);
});
