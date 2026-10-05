import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {synthesizeSoundscape,courtyardAnswer,type SoundscapePCM} from '../src/view/soundscape.ts';
import * as score from '../src/view/chapter-score.ts';

const digest=(pcm:SoundscapePCM)=>[pcm.left,pcm.right].map(channel=>createHash('sha256').update(new Uint8Array(channel.buffer)).digest('hex'));
// Captured before this change; every other chapter must retain its exact PCM.
const unchanged={
 "8000": [
  [
   "77e3a8a9e7360fa5f0d801d3e443e9c84f9993605e607da127fed15cef7bfd08",
   "f1f1b3e4977eb566646572cfde8c70d621791fc05a48fe23d338fb4421521942"
  ],
  [
   "58920bd509bb99867d00fb98357f0a38325d66c409d2aeb86c4ce1eb828f6b53",
   "1a7fa603b65c28beb7e6b6db686f67b4fd8125d9c79b75d172f89c5461fc1b36"
  ],
  [
   "2645943a4b12cdfe61c953c8e12c92cceedc471bf34ccc2fa7fd7241def2498f",
   "74b4f94b15485b6003244d7ce7d9661ed81698404bf3dd7bed0a5111585fba85"
  ],
  [
   "74474b702ed7e91ae90a2e9aeef4202674fa2c4945b2c05d505da4e1ac2872e3",
   "088f3b8e34cc08bd6dd4dbaa4b313ab4d672ed6f78f806f655e19a2b5c4fc6c5"
  ],
  [
   "af3aeb8446fe234d4bd6b38e6d4f8d2c53d093786daacefb764789f39a03b53f",
   "300c11c6ebc5590d334cb71c8d8ec8baf15ed067bb87aa3705278c7d3591b778"
  ]
 ],
 "16000": [
  [
   "bf14cade2c909ae71e706ef1408e710a56c1b626313fcc730edb7619f6e13823",
   "d3cd71e9234a5525caf10368173c40aa829069a119d32a72a6c9a0125d72f4a5"
  ],
  [
   "c1be412854d4c0e399d45dccf7cff0a2056f401d58e986fe16ca4ec77b91fc89",
   "2f7e5f6c974d43c5f51b8e398e766fc6bce6433a03a5fa05c9a2291cfc596654"
  ],
  [
   "7902657cb2ea80f2c5ca560bb26a9a6bdfc7b747320b9b8ee9166206acc9263e",
   "fcddcb2d9eb85dc2c160b3ae76e9fed0fc4c807f5209c45b7c6efadab7cf8ad1"
  ],
  [
   "a33b0bdb300d4e50be8f93b13456829e326fd3411d7c368f8884b29d20adda9e",
   "517c1fef11dcbebe6ca21e119cbfa00da39a896d937a35ab973be02fa2bde451"
  ],
  [
   "bd2372c5b57ee86cabc77c22777cc3e73c69c78304454adb74f74ba5000501fe",
   "8d3d6248a40a24cd836c207e648533ac74bd898cd471d58f3c06271e8b0f14b2"
  ]
 ],
 "22050": [
  [
   "35cc32507d6110242294aacf3f28b0911a05c65d3aa3ce6afec93265a33a1039",
   "9c7166fb1886f77a4c562436f106e5f779081cb1d10cdeb7cd650774c7eb0b22"
  ],
  [
   "0724ea9f0910f37ee3cb4449fd4ee95880f22825f0a5355a61441108024a13a8",
   "cf991cba2319b13f22b22b9f5c41425c7a0ea266ffa3102d51b5915aa3b1aba8"
  ],
  [
   "f0a8b93e2652c0f0e975bed1fbc5397a582ce47e28ee1c6e725303a57a785b1d",
   "0366dea380f4af528c9cc74fae297b5b4a737e205bbcf0ea28bcd7c0b86dd580"
  ],
  [
   "a94e68fb696e91c7915dd3bfb1accfd81a0abcb6d6a161bf4e7fc787f64bbc90",
   "6a6eaceb5343e3b0e708f9a4c79ee3f101cae935adce0b26aa4be2bfa31435f4"
  ],
  [
   "8ae99aab860efc46f129f6e9b13dac7f3ef46d732eca22d4ec0c7abb186b9c14",
   "c55de7ed98c25eb368a2d388f31d44007bed65ba807aecc93e3abbd5dc81a2c9"
  ]
 ]
} as const;

// Two 700 Hz high-pass stages leave crackle texture while rejecting the quiet drone.
function texture(pcm:SoundscapePCM,from:number,to:number){
 const coefficient=Math.exp(-2*Math.PI*700/pcm.sampleRate),start=Math.floor(from*pcm.sampleRate),end=Math.floor(to*pcm.sampleRate);
 const previous=[0,0],first=[0,0],second=[0,0];let left=0,right=0,cross=0;
 for(let i=Math.max(0,start-Math.floor(pcm.sampleRate*.05));i<end;i++){
  const samples=[pcm.left[i],pcm.right[i]];
  for(let channel=0;channel<2;channel++){
   const before=first[channel];first[channel]=coefficient*(first[channel]+samples[channel]-previous[channel]);
   second[channel]=coefficient*(second[channel]+first[channel]-before);previous[channel]=samples[channel];
  }
  if(i>=start){left+=second[0]**2;right+=second[1]**2;cross+=second[0]*second[1];}
 }
 return {rms:Math.sqrt((left+right)/(2*(end-start))),correlation:cross/Math.sqrt(left*right),leftRight:Math.sqrt(left/right)};
}

test('First Fires authors sparse bounded hearth crackles separately from the original pitched phrase',()=>{
 const crackles=score.FIRST_FIRES_HEARTH_CRACKLES;
 assert.ok(crackles,'First Fires needs its own sparse, authored hearth schedule');
 assert.ok(crackles.length>=4&&crackles.length<=8);
 let previous=-1;
 for(const crackle of crackles){
  assert.ok(Number.isFinite(crackle.at)&&crackle.at>previous&&crackle.at>=.5&&crackle.at+crackle.duration<23.5);
  assert.ok(Number.isFinite(crackle.duration)&&crackle.duration>=.06&&crackle.duration<=.25);
  assert.ok(Number.isFinite(crackle.strength)&&crackle.strength>0&&crackle.strength<=1);previous=crackle.at;
 }
 assert.deepEqual(score.CHAPTER_SCORES[0].plucks.map(note=>[note.at,note.semitones]),[[1.2,0],[3.2,3],[5.2,2],[14,0]]);
 assert.deepEqual(score.CHAPTER_SCORES[0].answers.map(note=>[note.at,note.semitones]),[[18.5,12]]);
 assert.deepEqual(courtyardAnswer(0),[146.83,146.83*2**(3/12)]);
});

test('First Fires distant air is soft and diffuse in the exposed musical rest',()=>{
 for(const rate of [8000,16000,22050]){
  const pcm=synthesizeSoundscape(0,rate);let peakStep=0,side=0;
  for(let i=9*rate;i<10*rate;i++){
   peakStep=Math.max(peakStep,Math.abs(pcm.left[i]-pcm.left[i-1]),Math.abs(pcm.right[i]-pcm.right[i-1]));
   side+=(pcm.left[i]-pcm.right[i])**2/4;
  }
  assert.ok(peakStep<.003,'the rest must not retain full-band single-sample ember clicks');
  assert.ok(Math.sqrt(side/rate)>.001,'the valley must retain a distinct stereo bed');
  const far=texture(pcm,9,10);
  assert.ok(Math.abs(far.correlation)<.4,'distant filtered air must stay diffuse, not collapse to a central source');
 }
});

test('First Fires hearth crackles are local coherent soft transients above the far air',()=>{
 for(const rate of [8000,16000,22050]){
  const pcm=synthesizeSoundscape(0,rate),far=texture(pcm,9,10);
  // These two authored hearth events sit clear of every pluck, echo and answer.
  for(const [from,to] of [[10.8,10.95],[12.1,12.28]]){
   const near=texture(pcm,from,to);
   assert.ok(near.rms>far.rms*2,'a hearth crackle must emerge gently from the valley air');
   assert.ok(near.correlation>.7,'a near crackle must share its texture across both ears');
   assert.ok(near.leftRight>1.1&&near.leftRight<1.7,'the hearth must be slightly left of center, never hard-panned');
  }
 }
});

test('First Fires remains deterministic finite quiet stereo with seamless endpoints and the same byte cap',()=>{
 for(const rate of [8000,16000,22050]){
  const pcm=synthesizeSoundscape(0,rate);assert.deepEqual(digest(pcm),digest(synthesizeSoundscape(0,rate)));
  assert.equal(pcm.duration,24);assert.equal(pcm.sampleRate,rate);assert.equal(pcm.left.length,24*rate);
  assert.equal(pcm.left.byteLength+pcm.right.byteLength,24*rate*2*4);assert.ok(pcm.left.byteLength+pcm.right.byteLength<=4_233_600);
  assert.notEqual(digest(pcm)[0],digest(pcm)[1]);let energy=0,peak=0;
  for(const channel of [pcm.left,pcm.right]){
   assert.equal(channel[0],0);assert.equal(channel.at(-1),0);
   for(let i=0;i<32;i++){assert.ok(Math.abs(channel[i])<.0001);assert.ok(Math.abs(channel[channel.length-1-i])<.0001);}
   for(const sample of channel){assert.ok(Number.isFinite(sample));energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
  }
  const rms=Math.sqrt(energy/(pcm.left.length*2));assert.ok(rms>.005&&rms<.009);assert.ok(peak>.02&&peak<.075,'distance must not be added by making the bed louder');
 }
});

test('First Fires keeps malformed chapter/rate inputs safe and bounded',()=>{
 const baseline=digest(synthesizeSoundscape(0,16000));
 for(const input of [NaN,Infinity,-1,6,1.5,null,'0',{},Symbol('invalid'),1n]){
  assert.deepEqual(digest(synthesizeSoundscape(input as number,16000)),baseline);
 }
 for(const rate of [NaN,Infinity,-1,0,null,'16000',{},Symbol('invalid'),1n])assert.deepEqual(digest(synthesizeSoundscape(0,rate as number)),baseline);
 assert.equal(synthesizeSoundscape(0,1e12).sampleRate,22050);
 assert.equal(synthesizeSoundscape(0,.01).sampleRate,8000);
 assert.equal(synthesizeSoundscape(0,8000.6).sampleRate,8001);
});

test('all five other chapters keep byte-identical stereo PCM at supported boundary and production rates',()=>{
 for(const rate of [8000,16000,22050] as const)for(let age=1;age<6;age++)assert.deepEqual(digest(synthesizeSoundscape(age,rate)),unchanged[rate][age-1],`chapter ${age} at ${rate} Hz`);
});
