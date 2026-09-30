import {synthesizeSoundscape,soundscapeAge,type SoundscapePCM} from './soundscape.ts';
import type {VillageMoodSnapshot} from './village-mood.ts';
export type SoundscapeMood=Readonly<Pick<VillageMoodSnapshot,'alarmMix'|'alarmSerial'>>;
interface AccentBudget {acquire():boolean;release():void}
interface Accent {owner:AudioContext;source:OscillatorNode;gain:GainNode;end:number;closed:boolean}
interface Ramp {from:number;to:number;at:number;end:number}
const calm:SoundscapeMood={alarmMix:0,alarmSerial:0};
const normalized=(mood:SoundscapeMood):SoundscapeMood=>({alarmMix:Number.isFinite(mood.alarmMix)?Math.max(0,Math.min(1,mood.alarmMix)):0,alarmSerial:Number.isFinite(mood.alarmSerial)?Math.max(0,Math.floor(mood.alarmSerial)):0});
interface Voice {owner:AudioContext;source:AudioBufferSourceNode;gain:GainNode;filter?:BiquadFilterNode;mix:number;volume:Ramp;cutoff:Ramp;age:number;stopped:boolean;closed:boolean}

/** One live voice, at most one 60ms retiring fade, and only the current scene buffer. */
export class SoundscapePlayer {
 private owner?:AudioContext;
 private output?:AudioNode;
 private cached?:{age:number;buffer:AudioBuffer};
 private active?:Voice;
 private retiring?:Voice;
 private failedAge?:number;
 private pendingAge?:number;
 private request=0;
 private wanted={age:0,audible:false,mood:calm};
 private accents=new Set<Accent>();
 private lastKnock=-Infinity;
 private lastPulse=0;
 private serial=0;
 private audible=false;
 private readonly synthesize:(age:number)=>SoundscapePCM|Promise<SoundscapePCM>;
 private readonly budget?:AccentBudget;
 constructor(synthesize:(age:number)=>SoundscapePCM|Promise<SoundscapePCM>=synthesizeSoundscape,budget?:AccentBudget){this.synthesize=synthesize;this.budget=budget;}
 retry():void {this.failedAge=undefined;}
 cancelPending():void {this.request++;this.pendingAge=undefined;this.clearAccents();}
 update(context:AudioContext|undefined,input:number,audible:boolean,mood:SoundscapeMood=calm,output?:AudioNode):void {
  const destination=output??context?.destination;
  if(this.owner!==context||this.output!==destination){this.dispose();this.owner=context;this.output=destination;}
  const age=soundscapeAge(input),mix=normalized(mood);this.wanted={age,audible,mood:mix};
  if(!context||context.state!=='running'||!audible){this.clearAccents();this.serial=mix.alarmSerial;this.audible=false;this.retire(context?.state==='running');return;}
  const continuing=this.audible&&this.active?.age===age;
  if(!continuing){this.clearAccents();this.lastPulse=context.currentTime;}
  if(this.active?.age===age){
   this.smooth(this.active,mix.alarmMix);
   if(continuing)this.watch(context,mix);
   this.serial=mix.alarmSerial;this.audible=true;return;
  }
  this.serial=mix.alarmSerial;this.audible=true;
  if(this.failedAge===age||this.pendingAge===age)return;
  this.retire(true);
  if(this.cached?.age===age){this.start(context,age);return;}
  this.cached=undefined;this.pendingAge=age;const request=++this.request;
  const fail=()=>{if(this.request===request){this.pendingAge=undefined;this.failedAge=age;this.clearAccents();}};
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
  let source:AudioBufferSourceNode|undefined,gain:GainNode|undefined,filter:BiquadFilterNode|undefined;
  try{
   source=context.createBufferSource();gain=context.createGain();
   source.buffer=this.cached.buffer;source.loop=true;
   if(typeof context.createBiquadFilter==='function'){filter=context.createBiquadFilter();filter.type='lowpass';filter.Q.setValueAtTime(.7,context.currentTime);source.connect(filter);filter.connect(gain);}else source.connect(gain);
   gain.connect(this.output??context.destination);
   const now=context.currentTime,mix=this.wanted.mood.alarmMix,volume=.35-.13*mix,cutoff=5000-3300*mix;
   const voice:Voice={owner:context,source,gain,filter,mix,volume:{from:0,to:volume,at:now,end:now+.6},cutoff:{from:cutoff,to:cutoff,at:now,end:now},age,stopped:false,closed:false};source.onended=()=>this.release(voice);
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.6);filter?.frequency.setValueAtTime(cutoff,now);
   source.start();this.active=voice;this.failedAge=undefined;
  }catch{
   if(source)source.onended=null;
   try{source?.stop();}catch{/* A source may not have started. */}
   for(const node of [source,gain,filter])try{node?.disconnect();}catch{/* Try every allocated node. */}
   this.failedAge=age;
  }
 }
 private release(voice:Voice):void {
  if(voice.closed)return;voice.closed=true;voice.source.onended=null;
  if(!voice.stopped){voice.stopped=true;try{voice.source.stop();}catch{/* Already ended. */}}
  for(const node of [voice.source,voice.gain,voice.filter])try{node?.disconnect();}catch{/* Try every owned node. */}
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
   voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(this.value(voice.volume,now),now);
   voice.gain.gain.linearRampToValueAtTime(0,now+.04);
   voice.stopped=true;voice.source.stop(now+.06);
  }catch{this.release(voice);}
 }
 private value(ramp:Ramp,now:number):number {return ramp.from+(ramp.to-ramp.from)*Math.max(0,Math.min(1,(now-ramp.at)/Math.max(.0001,ramp.end-ramp.at)));}
 private smooth(voice:Voice,mix:number):void {
  if(voice.mix===mix)return;
  const now=voice.owner.currentTime,volume=.35-.13*mix,cutoff=5000-3300*mix;
  const ramp=(parameter:AudioParam,previous:Ramp,to:number):Ramp=>{
   const from=this.value(previous,now);parameter.cancelScheduledValues(now);parameter.setValueAtTime(from,now);parameter.linearRampToValueAtTime(to,now+.6);return {from,to,at:now,end:now+.6};
  };
  try{voice.volume=ramp(voice.gain.gain,voice.volume,volume);if(voice.filter)voice.cutoff=ramp(voice.filter.frequency,voice.cutoff,cutoff);voice.mix=mix;}catch{/* Optional audio. */}
 }
 private watch(context:AudioContext,mood:SoundscapeMood):void {
  const now=context.currentTime;
  for(const accent of this.accents)if(accent.end<=now)this.releaseAccent(accent);
  if(mood.alarmSerial>this.serial){
   this.lastPulse=now;
   if(now-this.lastKnock+1e-9>=8){this.lastKnock=now;this.accent(context,false);}
  }else if(mood.alarmMix>=.99&&now-this.lastPulse+1e-9>=1.8){this.lastPulse=now;this.accent(context,true);}
  // Recovery uses the same serial; mixing below full alarm stops its pulses.
  if(mood.alarmMix<.99)this.lastPulse=now;
 }
 private accent(context:AudioContext,pulse:boolean):void {
  if(this.accents.size>=2||!context.createOscillator)return;
  if(this.budget&&!this.budget.acquire())return;
  let source:OscillatorNode|undefined,gain:GainNode|undefined,accent:Accent|undefined;
  try{
   const now=context.currentTime,duration=pulse?.25:.12;
   source=context.createOscillator();gain=context.createGain();source.type=pulse?'sine':'triangle';
   source.frequency.setValueAtTime(pulse?55:180,now);source.frequency.exponentialRampToValueAtTime(pulse?50:80,now+duration);
   gain.gain.setValueAtTime(pulse?.012:.015,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
   source.connect(gain);gain.connect(this.output??context.destination);accent={owner:context,source,gain,end:now+duration,closed:false};
   const owned=accent;source.onended=()=>this.releaseAccent(owned);this.accents.add(accent);source.start(now);source.stop(now+duration);
  }catch{
   if(accent)this.releaseAccent(accent);else{for(const node of [source,gain])try{node?.disconnect();}catch{/* Try every partial node. */}this.budget?.release();}
  }
 }
 private releaseAccent(accent:Accent):void {
  if(accent.closed)return;accent.closed=true;accent.source.onended=null;
  try{accent.source.stop();}catch{/* Already stopped. */}
  for(const node of [accent.source,accent.gain])try{node.disconnect();}catch{/* Try both owned nodes. */}
  this.accents.delete(accent);this.budget?.release();
 }
 private clearAccents():void {for(const accent of this.accents)this.releaseAccent(accent);}
 /** Combat may reclaim one of the shared eight slots. */
 dropAccent():boolean {const accent=this.accents.values().next().value;if(!accent)return false;this.releaseAccent(accent);return true;}
 dispose():void {
  this.cancelPending();this.wanted={age:0,audible:false,mood:calm};this.audible=false;this.serial=0;this.lastKnock=-Infinity;this.lastPulse=0;
  if(this.active)this.release(this.active);if(this.retiring)this.release(this.retiring);
  this.owner=undefined;this.output=undefined;this.cached=undefined;this.failedAge=undefined;
 }
}
