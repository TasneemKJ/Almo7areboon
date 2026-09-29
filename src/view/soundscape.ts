/** Original fictional score: plucked strings, breath-like tones and environmental noise.
 * No sampled performances, borrowed melody, or claim of historical instrumentation. */
export interface SoundscapePCM {sampleRate:number;duration:number;left:Float32Array;right:Float32Array}
export const SOUNDSCAPE_SECONDS=24;
export const soundscapeAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const chapters=[
 {root:146.83,air:.012,water:0,pluck:.073,breath:.011,seed:319},
 {root:130.81,air:.011,water:.009,pluck:.069,breath:.014,seed:887},
 {root:146.83,air:.019,water:.019,pluck:.055,breath:.010,seed:1319},
 {root:130.81,air:.007,water:.012,pluck:.085,breath:.016,seed:2039},
 {root:110,air:.016,water:0,pluck:.059,breath:.009,seed:3251},
 {root:146.83,air:.009,water:.006,pluck:.061,breath:.023,seed:4441},
] as const;
const TAU=Math.PI*2;

/** Allocation is capped at 2 × 24 × 22050 floats (4,233,600 bytes). */
export function synthesizeSoundscape(input:number,requestedRate=16000):SoundscapePCM {
 const age=soundscapeAge(input),scene=chapters[age];
 const sampleRate=Number.isFinite(requestedRate)&&requestedRate>0?Math.max(8000,Math.min(22050,Math.round(requestedRate))):16000;
 const length=SOUNDSCAPE_SECONDS*sampleRate,left=new Float32Array(length),right=new Float32Array(length);
 const channels=[left,right];
 for(let channel=0;channel<2;channel++){
  const output=channels[channel];let seed=scene.seed+channel*1709,low=0,slow=0;
  for(let i=0;i<length;i++){
   const t=i/sampleRate;
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const white=seed/0x80000000-1;
   low+=.045*(white-low);slow+=.003*(white-slow);
   const gust=.58+.24*Math.sin(TAU*t/12+channel*.3)+.12*Math.sin(TAU*t/7.7+age);
   const tide=.45+.4*Math.sin(TAU*t/9+age)*Math.sin(TAU*t/9+age);
   // A quiet low tone, with slow beating, supplies tension without a loud jump cue.
   const drone=.006*Math.sin(TAU*scene.root*.5*t)+.0027*Math.sin(TAU*(scene.root*.5+.16)*t+channel*.16);
   output[i]=drone+scene.air*(low*4+slow*8)*gust+scene.water*low*3*tide;
   if(age===0){const ember=Math.max(0,white-.995);output[i]+=ember*2.5;}
  }
  const semitones=[0,3,2,7,5,2],times=[1.15,4.3,8.65,12.9,17.2,20.7];
  for(let note=0;note<times.length;note++){
   const frequency=scene.root*2**((semitones[(note+age%2)%6]+(note===4?12:0))/12);
   const start=Math.floor((times[note]+channel*.0015)*sampleRate),span=Math.floor(2.9*sampleRate);
   const pan=channel===(note%2)?1:.72;
   for(let j=0;j<span&&start+j<length;j++){
    const u=j/sampleRate,envelope=(1-Math.exp(-u*105))*Math.exp(-u*(age===5?1.7:2.4));
    const phase=TAU*frequency*u;
    const tone=Math.sin(phase)+.32*Math.sin(phase*2)*Math.exp(-u*3)+.11*Math.sin(phase*3)*Math.exp(-u*5);
    const sample=scene.pluck*.64*pan*envelope*tone;
    output[start+j]+=sample;
    for(const [delay,gain] of [[.23,.16],[.51,.085]] as const){const at=start+j+Math.floor((delay+channel*.018)*sampleRate);if(at<length)output[at]+=sample*gain;}
   }
  }
  // A sparse breath-like answering note, intentionally not a recorded ney.
  for(const startTime of [6.4,15]){
   const start=Math.floor(startTime*sampleRate),span=sampleRate*3;
   const f=scene.root*(startTime<10?2:1.5);
   for(let j=0;j<span&&start+j<length;j++){
    const u=j/sampleRate,env=Math.sin(Math.PI*j/span)**2;
    output[start+j]+=scene.breath*env*(Math.sin(TAU*f*u+.02*Math.sin(TAU*4.1*u))+.12*Math.sin(TAU*2*f*u+channel*.3));
   }
  }
  let mean=0;for(const x of output)mean+=x;mean/=length;
  for(let i=0;i<length;i++){
   const ramp=Math.min(1,i/(sampleRate*.24),(length-1-i)/(sampleRate*.24));
   const fade=.5-.5*Math.cos(Math.PI*ramp);
   output[i]=Math.max(-.27,Math.min(.27,(output[i]-mean)*fade));
  }
  output[0]=0;output[length-1]=0;
 }
 return {sampleRate,duration:SOUNDSCAPE_SECONDS,left,right};
}
