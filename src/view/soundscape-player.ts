import {synthesizeSoundscape,soundscapeAge,type SoundscapePCM} from './soundscape.ts';
interface Voice {owner:AudioContext;source:AudioBufferSourceNode;gain:GainNode;age:number;stopped:boolean;closed:boolean}

/** One live voice, at most one 60ms retiring fade, and only the current scene buffer. */
export class SoundscapePlayer {
 private owner?:AudioContext;
 private cached?:{age:number;buffer:AudioBuffer};
 private active?:Voice;
 private retiring?:Voice;
 private failedAge?:number;
 private pendingAge?:number;
 private request=0;
 private wanted={age:0,audible:false};
 private readonly synthesize:(age:number)=>SoundscapePCM|Promise<SoundscapePCM>;
 constructor(synthesize:(age:number)=>SoundscapePCM|Promise<SoundscapePCM>=synthesizeSoundscape){this.synthesize=synthesize;}
 retry():void {this.failedAge=undefined;}
 cancelPending():void {this.request++;this.pendingAge=undefined;}
 update(context:AudioContext|undefined,input:number,audible:boolean):void {
  if(this.owner!==context){this.dispose();this.owner=context;}
  const age=soundscapeAge(input);this.wanted={age,audible};
  if(!context||context.state!=='running'||!audible){this.retire(context?.state==='running');return;}
  if(this.active?.age===age||this.failedAge===age||this.pendingAge===age)return;
  this.retire(true);
  if(this.cached?.age===age){this.start(context,age);return;}
  this.cached=undefined;this.pendingAge=age;const request=++this.request;
  const fail=()=>{if(this.request===request){this.pendingAge=undefined;this.failedAge=age;}};
  const ready=(pcm:SoundscapePCM)=>{
   if(this.request!==request||this.owner!==context)return;
   this.pendingAge=undefined;if(this.wanted.age!==age)return;
   try{
    const buffer=context.createBuffer(2,pcm.left.length,pcm.sampleRate);
    buffer.getChannelData(0).set(pcm.left);buffer.getChannelData(1).set(pcm.right);this.cached={age,buffer};
    if(this.wanted.audible&&context.state==='running')this.start(context,age);
   }catch{fail();}
  };
  try{const result=this.synthesize(age);if(result instanceof Promise)void result.then(ready).catch(fail);else ready(result);}catch{fail();}
 }
 private start(context:AudioContext,age:number):void {
  if(this.cached?.age!==age)return;
  let source:AudioBufferSourceNode|undefined,gain:GainNode|undefined;
  try{
   source=context.createBufferSource();gain=context.createGain();
   source.buffer=this.cached.buffer;source.loop=true;source.connect(gain);gain.connect(context.destination);
   const voice:Voice={owner:context,source,gain,age,stopped:false,closed:false};source.onended=()=>this.release(voice);
   gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(.35,context.currentTime+.18);
   source.start();this.active=voice;this.failedAge=undefined;
  }catch{
   if(source)source.onended=null;
   try{source?.stop();}catch{/* A source may not have started. */}
   try{source?.disconnect();gain?.disconnect();}catch{/* Optional audio. */}
   this.failedAge=age;
  }
 }
 private release(voice:Voice):void {
  if(voice.closed)return;voice.closed=true;voice.source.onended=null;
  if(!voice.stopped){voice.stopped=true;try{voice.source.stop();}catch{/* Already ended. */}}
  try{voice.source.disconnect();voice.gain.disconnect();}catch{/* Already disconnected. */}
  if(this.active===voice)this.active=undefined;
  if(this.retiring===voice)this.retiring=undefined;
 }
 private retire(fade:boolean):void {
  if(!this.active){if(!fade&&this.retiring)this.release(this.retiring);return;}
  if(this.retiring)this.release(this.retiring);
  const voice=this.active;this.active=undefined;
  if(!fade){this.release(voice);return;}
  this.retiring=voice;
  try{
   const now=voice.owner.currentTime;
   voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);
   voice.gain.gain.linearRampToValueAtTime(0,now+.04);
   voice.stopped=true;voice.source.stop(now+.06);
  }catch{this.release(voice);}
 }
 dispose():void {
  this.cancelPending();this.wanted={age:0,audible:false};
  if(this.active)this.release(this.active);if(this.retiring)this.release(this.retiring);
  this.owner=undefined;this.cached=undefined;this.failedAge=undefined;
 }
}
