import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCues} from '../src/view/battlefield-cues.ts';

test('the cue collaborator exposes a read-only snapshot of live cues',()=>{
 const cues=createCues({reduce:()=>false,canvas:()=>({dataset:{}}) as unknown as HTMLCanvasElement},{fx:{} as never,glow:{} as never,groundFx:[]});
 cues.pushImpactCue({x:1,y:2,age:3,kind:1,side:'player',life:.3,max:.3,trait:'guard',lane:1});
 const snapshot=cues.snapshot();
 assert.equal(snapshot.impactCues.length,1);assert.equal(snapshot.impactCues[0].trait,'guard');
 (snapshot.impactCues as unknown[]).length=0;
 assert.equal(cues.snapshot().impactCues.length,1,'changing the snapshot cannot drop a painted cue');
 cues.clear();assert.deepEqual(cues.snapshot(),{attackCues:[],impactCues:[],bolts:[]});
});

test('the battlefield scene keeps the review diagnostics the layering fixture reads',()=>{
 // The battlefield split moved cues into a collaborator; the trait review read undefined and saw no accents.
 const scene=readFileSync(new URL('../src/view/battlefield-scene.ts',import.meta.url),'utf8');
 for(const name of ['attackCues','impactCues','bolts'])assert.match(scene,new RegExp(`get ${name}\\(\\)\\{return this\\.effects\\?\\.cueSnapshot\\(\\)\\.${name};\\}`));
});
