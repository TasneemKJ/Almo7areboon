import {CHAPTER_SCORES,FIRST_FIRES_HEARTH_CRACKLES} from './chapter-score.ts';
/** Original fictional score: plucked strings, breath-like tones and environmental noise.
 * No sampled performances, borrowed melody, or claim of historical instrumentation. */
export interface SoundscapePCM {sampleRate:number;duration:number;left:Float32Array;right:Float32Array}
export const SOUNDSCAPE_SECONDS=24;
export const soundscapeAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const TAU=Math.PI*2;
const COURTYARD_INTERVALS=Object.freeze([[0,3],[-2,3],[-5,0],[0,5],[-3,2],[2,7]] as const);

/** A short fictional answer authored from each chapter's score root. */
export function courtyardAnswer(input:number):readonly [number,number] {
 const age=soundscapeAge(input),root=CHAPTER_SCORES[age].root,[first,second]=COURTYARD_INTERVALS[age];
 return Object.freeze([root*2**(first/12),root*2**(second/12)] as [number,number]);
}

interface Mix {age:number;scene:typeof CHAPTER_SCORES[number];sampleRate:number;length:number;valleyFilter:number;hearthFilter:number;noiseScale:number}

/** The chapter's air bed: a quiet drone with slow beating, valley wind or tide, filtered noise per ear. */
function renderBed(output:Float32Array,channel:number,m:Mix):void {
 const {age,scene,sampleRate,length,valleyFilter,noiseScale}=m;
 let seed=scene.seed+channel*1709,low=0,slow=0;
 for(let i=0;i<length;i++){
  const t=i/sampleRate;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const white=seed/0x80000000-1;
  // A quiet low tone, with slow beating, supplies tension without a loud jump cue.
  const drone=.006*Math.sin(TAU*scene.root*.5*t)+.0027*Math.sin(TAU*(scene.root*.5+.16)*t+channel*.16);
  if(age===0){
   // Two offline low-pass stages soften the valley; independent ears and slow
   // overlapping gusts give it width without anti-phase tricks or a new voice.
   low+=valleyFilter*(white-low);slow+=valleyFilter*(low-slow);
   const gust=.58+.18*Math.sin(TAU*t/24+channel*.9)+.08*Math.sin(TAU*t/12+channel*1.4);
   output[i]=drone+scene.air*5.2*noiseScale*slow*gust;
  }else{
   low+=.045*(white-low);slow+=.003*(white-slow);
   const gust=.58+.24*Math.sin(TAU*t/12+channel*.3)+.12*Math.sin(TAU*t/7.7+age);
   const tide=.45+.4*Math.sin(TAU*t/9+age)*Math.sin(TAU*t/9+age);
   output[i]=drone+scene.air*(low*4+slow*8)*gust+scene.water*low*3*tide;
  }
 }
}

/** First Fires only: seeded hearth crackles, slightly left of centre. */
function addHearthCrackles(output:Float32Array,channel:number,m:Mix):void {
 const {scene,sampleRate,length,hearthFilter,noiseScale}=m;
 for(let event=0;event<FIRST_FIRES_HEARTH_CRACKLES.length;event++){
  const crackle=FIRST_FIRES_HEARTH_CRACKLES[event],start=Math.floor(crackle.at*sampleRate),span=Math.floor(crackle.duration*sampleRate);
  // The same seeded texture reaches both ears, slightly left of centre. The
  // rounded envelope replaces isolated white-noise spikes with warm crackles.
  let emberSeed=scene.seed+event*7919,ember=0;
  for(let j=0;j<span&&start+j<length;j++){
   emberSeed=(Math.imul(emberSeed,1664525)+1013904223)>>>0;
   ember+=hearthFilter*(emberSeed/0x80000000-1-ember);
   const envelope=Math.sin(Math.PI*j/(span-1))**2*Math.exp(-j/sampleRate*12);
   output[start+j]+=.035*crackle.strength*(channel===0?1:.76)*noiseScale*ember*envelope;
  }
 }
}

/** The plucked motif with two soft echoes. */
function addPlucks(output:Float32Array,channel:number,m:Mix):void {
 const {scene,sampleRate,length}=m;
 for(let note=0;note<scene.plucks.length;note++){
  const position=scene.plucks[note],frequency=scene.root*2**(position.semitones/12);
  const start=Math.floor((position.at+channel*.0015)*sampleRate),span=Math.floor(2.9*sampleRate);
  const pan=channel===(note%2)?1:.72;
  for(let j=0;j<span&&start+j<length;j++){
   const u=j/sampleRate,envelope=(1-Math.exp(-u*105))*Math.exp(-u*position.decay);
   const phase=TAU*frequency*u;
   const tone=Math.sin(phase)+.32*Math.sin(phase*2)*Math.exp(-u*3)+.11*Math.sin(phase*3)*Math.exp(-u*5);
   const sample=scene.pluck*.64*pan*envelope*tone;
   output[start+j]+=sample;
   for(const [delay,gain] of [[.23,.16],[.51,.085]] as const){const at=start+j+Math.floor((delay+channel*.018)*sampleRate);if(at<length)output[at]+=sample*gain;}
  }
 }
}

/** A sparse breath-like answering note, intentionally not a recorded ney. */
function addAnswers(output:Float32Array,channel:number,m:Mix):void {
 const {scene,sampleRate,length}=m;
 for(const position of scene.answers){
  const start=Math.floor(position.at*sampleRate),span=Math.floor(sampleRate*position.decay);
  const f=scene.root*2**(position.semitones/12);
  for(let j=0;j<span&&start+j<length;j++){
   const u=j/sampleRate,env=Math.sin(Math.PI*j/span)**2;
   output[start+j]+=scene.breath*env*(Math.sin(TAU*f*u+.02*Math.sin(TAU*4.1*u))+.12*Math.sin(TAU*2*f*u+channel*.3));
  }
 }
}

/** Removes DC offset, fades the ends, clamps and zeroes the edge samples. */
function finishChannel(output:Float32Array,sampleRate:number,length:number):void {
 let mean=0;for(const x of output)mean+=x;mean/=length;
 for(let i=0;i<length;i++){
  const ramp=Math.min(1,i/(sampleRate*.24),(length-1-i)/(sampleRate*.24));
  const fade=.5-.5*Math.cos(Math.PI*ramp);
  output[i]=Math.max(-.27,Math.min(.27,(output[i]-mean)*fade));
 }
 output[0]=0;output[length-1]=0;
}

/** Allocation is capped at 2 × 24 × 22050 floats (4,233,600 bytes). */
export function synthesizeSoundscape(input:number,requestedRate=16000):SoundscapePCM {
 const age=soundscapeAge(input),scene=CHAPTER_SCORES[age];
 const sampleRate=Number.isFinite(requestedRate)&&requestedRate>0?Math.max(8000,Math.min(22050,Math.round(requestedRate))):16000;
 const length=SOUNDSCAPE_SECONDS*sampleRate,left=new Float32Array(length),right=new Float32Array(length);
 const m:Mix={age,scene,sampleRate,length,valleyFilter:1-Math.exp(-TAU*230/sampleRate),hearthFilter:1-Math.exp(-TAU*1100/sampleRate),noiseScale:Math.sqrt(sampleRate/16000)};
 const channels=[left,right];
 for(let channel=0;channel<2;channel++){
  const output=channels[channel];
  renderBed(output,channel,m);
  if(age===0)addHearthCrackles(output,channel,m);
  addPlucks(output,channel,m);
  addAnswers(output,channel,m);
  finishChannel(output,sampleRate,length);
 }
 return {sampleRate,duration:SOUNDSCAPE_SECONDS,left,right};
}
