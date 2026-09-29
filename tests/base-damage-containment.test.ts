import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {baseDamageFrame,type BaseDamageMark} from '../src/view/base-damage.ts';

// Lossless source alpha, decoded offline so the Node suite needs no image decoder.
// The hash check prevents an updated shelter from silently using a stale silhouette.
const fixtures:readonly {path:string;sha256:string;width:number;height:number;alpha:string}[]=JSON.parse(readFileSync(new URL('./fixtures/storybook-shelter-alpha.json',import.meta.url),'utf8'));

function crackSamples(mark:BaseDamageMark):[number,number][] {
 const dx=Math.cos(mark.angle)*mark.size,dy=Math.sin(mark.angle)*mark.size;
 // These are the three authored stroke paths, including their painted widths.
 const strokes=[[-dx*.22,-dy*.22,dx,dy,2.2],[0,0,dx,dy,.9],[dx*.42,dy*.42,dx*.62-dy*.28,dy*.62+dx*.28,.9]];
 const points:[number,number][]=[];
 for(const [x0,y0,x1,y1,width]of strokes){
  const length=Math.hypot(x1-x0,y1-y0),nx=-(y1-y0)/length,ny=(x1-x0)/length;
  for(let distance=0;distance<=Math.ceil(length*8);distance++){
   const t=distance/Math.ceil(length*8);
   for(const edge of [-width/2,0,width/2])points.push([mark.x+x0+(x1-x0)*t+nx*edge,mark.y+y0+(y1-y0)*t+ny*edge]);
  }
 }
 return points;
}

test('painted shelter cracks stay inside their actual silhouettes at worn and critical health',()=>{
 const misses:string[]=[];
 for(const [age,fixture]of fixtures.entries()){
  const source=readFileSync(new URL(`../${fixture.path}`,import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),fixture.sha256,`refresh decoded alpha for ${fixture.path}`);
  const alpha=inflateSync(Buffer.from(fixture.alpha,'base64'));
  assert.equal(alpha.length,fixture.width*fixture.height);
  for(const side of ['player','enemy'] as const)for(const hp of [70,25]){
   const cracks=baseDamageFrame(age,side,hp,100,0,true).filter(mark=>mark.kind==='crack');
   assert.equal(cracks.length,hp===70?3:6,'damage retains visible structural marks');
   for(const [index,mark]of cracks.entries()){
    const points=crackSamples(mark);
    const outside=points.filter(([x,y])=>{
     // Runtime base width is 99.2 logical pixels; source is 256 with anchor (128,224).
     const sourceX=Math.round(128+x/(99.2/256)*(side==='enemy'?-1:1));
     const sourceY=Math.round(224+y/(99.2/256));
     return sourceX<0||sourceX>=256||sourceY<0||sourceY>=256||alpha[sourceY*256+sourceX]<128;
    });
    if(outside.length)misses.push(`chapter ${age+1} ${side} HP ${hp} crack ${index+1}: ${outside.length}/${points.length} samples outside`);
   }
  }
 }
 assert.deepEqual(misses,[],'structural damage must not float over sky or scenery');
});
