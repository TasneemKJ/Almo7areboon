import test from 'node:test';
import assert from 'node:assert/strict';
import {arenaLayout,landscapePlacement} from '../src/view/visual-theme.ts';

const SOURCE={width:900,height:1000,laneY:660};

test('landscape keeps one uniform scale instead of squashing scenic art to viewport height',()=>{
  for(const [screenWidth,screenHeight] of [[320,282],[390,430],[450,500],[480,560]]){
    const arena=arenaLayout(screenWidth,screenHeight);
    const placement=landscapePlacement(arena.width,arena.height,arena.groundY);
    assert.ok(placement.scale>0);
    assert.equal(placement.scaleX,placement.scaleY);
    assert.equal(placement.width,SOURCE.width*placement.scale);
    assert.equal(placement.height,SOURCE.height*placement.scale);
  }
});

test('landscape cover crop keeps the illustrated battle lane under the actors at every tested aspect',()=>{
  for(const logicalHeight of [300,360,430,500,620]){
    const groundY=logicalHeight*.66;
    const placement=landscapePlacement(450,logicalHeight,groundY);
    const mappedLane=placement.y+SOURCE.laneY*placement.scale;
    assert.ok(Math.abs(mappedLane-groundY)<1e-9,`${logicalHeight} lane ${mappedLane} != ${groundY}`);
    assert.ok(placement.x<=0&&placement.y<=0,`${logicalHeight} must crop rather than expose empty top/left`);
    assert.ok(placement.x+placement.width>=450,`${logicalHeight} width coverage`);
    assert.ok(placement.y+placement.height>=logicalHeight,`${logicalHeight} height coverage`);
  }
});

test('landscape placement remains finite for malformed viewport inputs',()=>{
  for(const [width,height,ground] of [[NaN,NaN,NaN],[-1,0,-20],[Infinity,Infinity,Infinity]] as const){
    const placement=landscapePlacement(width,height,ground);
    for(const value of Object.values(placement))if(typeof value==='number')assert.ok(Number.isFinite(value));
    assert.ok(placement.scale>0&&placement.width>0&&placement.height>0);
  }
});

test('battlefield renderer uses uniform placement and no longer calls setDisplaySize on the landscape',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
  assert.match(source,/landscapePlacement/);
  assert.match(source,/private placeLandscape\(\):void/);
  assert.doesNotMatch(source,/this\.sky\.setDisplaySize\(/);
});
