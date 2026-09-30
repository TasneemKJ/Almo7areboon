import {SoundscapePlayer,type SoundscapeMood} from './soundscape-player.ts';
import {createSoundscapeSynthesis} from './soundscape-worker-client.ts';
let context:AudioContext|undefined;
import {selectCombatCues,type CombatCueId,type CueCooldown} from './combat-cues.ts';
import type {GameEvent} from '../game/types.ts';
interface Effect {voice?:CueVoice;critical:boolean;closed:boolean}
interface Transients {total:number;ordinary:number;effects:Set<Effect>;last:Map<CueCooldown,number>}
const freshTransients=():Transients=>({total:0,ordinary:0,effects:new Set(),last:new Map()});
let transients=freshTransients();
const synthesis=createSoundscapeSynthesis();
const soundscape=new SoundscapePlayer(age=>synthesis.generate(age),{acquire:()=>{if(transients.total>=8)return false;transients.total++;return true;},release:()=>{transients.total=Math.max(0,transients.total-1);}});
let intent:{age:number;audible:boolean;mood:SoundscapeMood}={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}},permitted=false,resumeVersion=0;
/** Desired state can change before a gesture; it never creates an AudioContext. */
export function updateSoundscape(age:number,audible:boolean,mood:SoundscapeMood={alarmMix:0,alarmSerial:0}):void {
  intent={age,audible,mood};soundscape.update(context,age,permitted&&audible,mood);
}
/** Audio stays optional: no context before an enabled user gesture. */
export function unlockAudio(enabled=true):void {
  if(!enabled)return;
  try{
    if(!context||context.state==='closed'){stopCombatAudio();soundscape.dispose();context=new AudioContext();transients=freshTransients();}
    permitted=true;soundscape.retry();
    const owner=context,version=++resumeVersion;
    if(owner.state!=='running')void owner.resume().then(()=>{
      if(context!==owner)return;
      // A later mute/hidden transition owns the context, even if resume resolved late.
      if(!permitted){soundscape.update(owner,intent.age,false,intent.mood);void owner.suspend().catch(()=>{});return;}
      if(version===resumeVersion)soundscape.update(owner,intent.age,intent.audible,intent.mood);
    }).catch(()=>{});
    else soundscape.update(owner,intent.age,intent.audible,intent.mood);
  }catch{/* Unsupported or disallowed browser audio must not break gameplay. */}
}
export function suspendAudio():void {
  stopCombatAudio();permitted=false;resumeVersion++;soundscape.cancelPending();synthesis.dispose();
  soundscape.update(context,intent.age,false,intent.mood);
  try{if(context&&context.state!=='closed')void context.suspend().catch(()=>{});}catch{/* Optional audio. */}
}
export function disposeAudio():void {
  stopCombatAudio();const previous=context;context=undefined;
  permitted=false;resumeVersion++;intent={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}};soundscape.dispose();transients=freshTransients();synthesis.dispose();
  try{if(previous&&previous.state!=='closed')void previous.close().catch(()=>{});}catch{/* Optional audio. */}
}

type Point=readonly [seconds:number,value:number];
interface CueDefinition {readonly wave:OscillatorType;readonly duration:number;readonly frequency:readonly Point[];readonly envelope:readonly Point[]}
// Original short contours; these initial levels await perceptual/device review.
const definitions:Readonly<Record<CombatCueId,CueDefinition>>={
 deploy:{wave:'triangle',duration:.080,frequency:[[0,330]],envelope:[[.003,.040],[.025,.026],[.080,0]]},
 'hit-neutral':{wave:'sine',duration:.065,frequency:[[0,130],[.065,80]],envelope:[[.003,.025],[.065,0]]},
 'hit-blunt':{wave:'triangle',duration:.090,frequency:[[0,150],[.090,65]],envelope:[[.003,.025],[.090,0]]},
 'hit-flick':{wave:'sawtooth',duration:.035,frequency:[[0,360],[.035,180]],envelope:[[.002,.012],[.012,.003],[.035,0]]},
 'hit-hollow':{wave:'sine',duration:.130,frequency:[[0,110],[.130,55]],envelope:[[.005,.030],[.040,.018],[.130,0]]},
 'base-player':{wave:'triangle',duration:.200,frequency:[[0,95],[.200,42]],envelope:[[.005,.040],[.035,.032],[.200,0]]},
 'base-enemy':{wave:'triangle',duration:.200,frequency:[[0,95],[.200,42]],envelope:[[.005,.040],[.035,.032],[.200,0]]},
 coin:{wave:'sine',duration:.120,frequency:[[0,880],[.065,1175]],envelope:[[.003,.030],[.045,.004],[.065,.024],[.120,0]]},
 freeze:{wave:'sine',duration:.280,frequency:[[0,1100],[.280,550]],envelope:[[.003,.040],[.055,.004],[.090,.012],[.280,0]]},
 meteor:{wave:'triangle',duration:.320,frequency:[[0,180],[.320,45]],envelope:[[.005,.045],[.070,.032],[.320,0]]},
 food:{wave:'sine',duration:.300,frequency:[[0,330],[.100,440],[.230,660]],envelope:[[.005,.040],[.100,.026],[.180,.032],[.300,0]]},
 upgrade:{wave:'triangle',duration:.180,frequency:[[0,330],[.110,440]],envelope:[[.003,.040],[.070,.024],[.180,0]]},
 evolve:{wave:'triangle',duration:.360,frequency:[[0,330],[.110,440],[.240,660]],envelope:[[.003,.040],[.110,.022],[.240,.030],[.360,0]]},
 win:{wave:'sine',duration:.600,frequency:[[0,330],[.200,440],[.400,660]],envelope:[[.005,.045],[.170,.018],[.220,.038],[.370,.018],[.420,.038],[.600,0]]},
 lose:{wave:'sine',duration:.600,frequency:[[0,330],[.200,311],[.400,294]],envelope:[[.005,.045],[.170,.018],[.220,.038],[.370,.018],[.420,.028],[.600,0]]},
};
export interface CueVoice {dispose():void}
/** Shared production renderer, including OfflineAudioContext; one budgeted voice. */
export function renderCombatCue(context:BaseAudioContext,output:AudioNode,id:CombatCueId,at:number,onRelease:()=>void):CueVoice|undefined {
 let oscillator:OscillatorNode|undefined,gain:GainNode|undefined,closed=false;
 const release=(stop:boolean)=>{
  if(closed)return;closed=true;if(oscillator)oscillator.onended=null;
  if(stop)try{oscillator?.stop();}catch{/* A partially started node remains optional. */}
  try{oscillator?.disconnect();}catch{/* Always try both partial nodes. */}
  try{gain?.disconnect();}catch{/* Optional audio. */}
  onRelease();
 };
 try{
  const definition=definitions[id];if(!definition||!Number.isFinite(at))throw Error('Invalid combat cue');
  oscillator=context.createOscillator();gain=context.createGain();oscillator.type=definition.wave;
  for(let i=0;i<definition.frequency.length;i++){
   const [time,value]=definition.frequency[i];
   if(i===0)oscillator.frequency.setValueAtTime(value,at+time);else oscillator.frequency.linearRampToValueAtTime(value,at+time);
  }
  gain.gain.setValueAtTime(0,at);for(const [time,value] of definition.envelope)gain.gain.linearRampToValueAtTime(value,at+time);
  oscillator.connect(gain);gain.connect(output);oscillator.onended=()=>release(false);
  oscillator.start(at);oscillator.stop(at+definition.duration);
  return {dispose:()=>release(true)};
 }catch{release(true);return undefined;}
}
const intervals:Readonly<Record<CueCooldown,number>>={deployment:.120,'unit-hit':.090,'base-hit':.180,coin:.250};
export function playCombatEvents(events:readonly GameEvent[],enabled:boolean):void {
 if(!enabled||!permitted||!context||context.state!=='running')return;
 const owner=transients,audioContext=context,now=audioContext.currentTime;
 for(const cue of selectCombatCues(events)){
  if(cue.cooldown&&now-(owner.last.get(cue.cooldown)??-Infinity)+1e-9<intervals[cue.cooldown])continue;
  if(!cue.critical&&owner.ordinary>=6)continue;
  if(owner.total>=8&&(!soundscape.dropAccent()||owner.total>=8))continue;
  const effect:Effect={critical:cue.critical,closed:false};owner.effects.add(effect);owner.total++;if(!cue.critical)owner.ordinary++;
  const release=()=>{
   if(effect.closed)return;effect.closed=true;owner.effects.delete(effect);owner.total--;if(!cue.critical)owner.ordinary--;
  };
  effect.voice=renderCombatCue(audioContext,audioContext.destination,cue.id,now,release);
  if(effect.voice&&!effect.closed&&cue.cooldown)owner.last.set(cue.cooldown,now);
 }
}
/** No resume/allocation/backlog: also clear audio-time history on lifecycle stops. */
export function stopCombatAudio():void {
 for(const effect of transients.effects)effect.voice?.dispose();transients.last.clear();
}
