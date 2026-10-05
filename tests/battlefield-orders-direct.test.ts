import test from 'node:test';
import assert from 'node:assert/strict';
import { battlefieldOrderFromGesture, DIRECT_ORDER_MAX_TRAVEL } from '../src/ui/battlefield-orders.ts';

const gesture=(x:number,y:number,endX=x,endY=y)=>({startX:x,startY:y,endX,endY});
const bounds=(width:number,height=300,left=10,top=20)=>({left,top,width,height});

test('battlefield edge taps map home to Hold and enemy road to Advance across supported widths',()=>{
 for(const width of [320,360,390,844,1024]){
  const b=bounds(width);
  assert.equal(battlefieldOrderFromGesture(gesture(b.left+width*.12,b.top+heightOf(b)*.55),b),'hold');
  assert.equal(battlefieldOrderFromGesture(gesture(b.left+width*.88,b.top+heightOf(b)*.55),b),'advance');
 }
});

test('the center band is deliberately neutral and never spends a command',()=>{
 const b=bounds(390,430);
 for(const fraction of [.31,.4,.5,.6,.69])assert.equal(battlefieldOrderFromGesture(gesture(b.left+b.width*fraction,b.top+210),b),null);
});

test('drag, outside release and malformed geometry are rejected',()=>{
 const b=bounds(320,180);
 assert.equal(battlefieldOrderFromGesture(gesture(40,80,40+DIRECT_ORDER_MAX_TRAVEL+1,80),b),null);
 assert.equal(battlefieldOrderFromGesture(gesture(40,80,b.left-1,80),b),null);
 assert.equal(battlefieldOrderFromGesture(gesture(300,80,300,b.top+b.height+1),b),null);
 assert.equal(battlefieldOrderFromGesture(gesture(40,80),{...b,width:0}),null);
 assert.equal(battlefieldOrderFromGesture({startX:NaN,startY:80,endX:40,endY:80},b),null);
});

test('tap threshold accepts small touch jitter but rejects diagonal travel at the boundary',()=>{
 const b=bounds(360,568);
 assert.equal(battlefieldOrderFromGesture(gesture(45,180,45+DIRECT_ORDER_MAX_TRAVEL/2,180+DIRECT_ORDER_MAX_TRAVEL/2),b),'hold');
 const delta=DIRECT_ORDER_MAX_TRAVEL/Math.sqrt(2)+.1;
 assert.equal(battlefieldOrderFromGesture(gesture(45,180,45+delta,180+delta),b),null);
});

function heightOf(value:{height:number}){return value.height;}
