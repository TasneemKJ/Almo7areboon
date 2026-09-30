import {SoundscapePlayer,type SoundscapeMood} from './soundscape-player.ts';
import {createSoundscapeSynthesis} from './soundscape-worker-client.ts';
import {normalizeAudioMix,DEFAULT_AUDIO_MIX,type AudioMix} from '../ui/audio-preferences.ts';
let context:AudioContext|undefined;
interface Bus {node:GainNode;from:number;to:number;at:number;end:number}
let mix:AudioMix={...DEFAULT_AUDIO_MIX},buses:{effects:Bus;atmosphere:Bus}|undefined;
const busValue=(bus:Bus,now:number)=>bus.from+(bus.to-bus.from)*Math.max(0,Math.min(1,(now-bus.at)/Math.max(.0001,bus.end-bus.at)));
/** Desired percentages never create, resume or retry an audio graph. */
export function updateAudioMix(value:AudioMix):void {
 mix=normalizeAudioMix(value);if(!context||!buses)return;
 const now=context.currentTime;
 for(const family of ['effects','atmosphere'] as const){
  const bus=buses[family],to=mix[family]/100;if(bus.to===to)continue;
  const from=busValue(bus,now);
  try{bus.node.gain.cancelScheduledValues(now);bus.node.gain.setValueAtTime(from,now);bus.node.gain.linearRampToValueAtTime(to,now+.05);Object.assign(bus,{from,to,at:now,end:now+.05});}catch{/* Optional audio. */}
 }
}
function clearBuses():void {
 const owned=buses;buses=undefined;if(!owned)return;
 for(const bus of [owned.effects,owned.atmosphere])try{bus.node.disconnect();}catch{/* Optional audio. */}
}
function createContext():void {
 let owner:AudioContext|undefined;const nodes:GainNode[]=[];
 try{
  owner=new AudioContext();const now=owner.currentTime;
  const create=(level:number):Bus=>{const node=owner!.createGain();nodes.push(node);node.gain.setValueAtTime(level,now);node.connect(owner!.destination);return {node,from:level,to:level,at:now,end:now};};
  const effects=create(mix.effects/100),atmosphere=create(mix.atmosphere/100);
  context=owner;buses={effects,atmosphere};
 }catch(error){for(const node of nodes)try{node.disconnect();}catch{/* Try all partially constructed nodes. */}try{void owner?.close().catch(()=>{});}catch{/* Optional audio. */}throw error;}
}
import {selectCombatCues,type CombatCue,type CombatCueId,type CueCooldown} from './combat-cues.ts';
import type {GameEvent} from '../game/types.ts';
interface Effect {voice?:CueVoice;id:CombatCueId;critical:boolean;closed:boolean}
interface Transients {total:number;ordinary:number;effects:Set<Effect>;last:Map<CueCooldown,number>}
const freshTransients=():Transients=>({total:0,ordinary:0,effects:new Set(),last:new Map()});
let transients=freshTransients();
const synthesis=createSoundscapeSynthesis();
const soundscape=new SoundscapePlayer(age=>synthesis.generate(age),{acquire:()=>{if(transients.total>=8)return false;transients.total++;return true;},release:()=>{transients.total=Math.max(0,transients.total-1);}});
let intent:{age:number;audible:boolean;mood:SoundscapeMood}={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}},permitted=false,resumeVersion=0;
/** Desired state can change before a gesture; it never creates an AudioContext. */
export function updateSoundscape(age:number,audible:boolean,mood:SoundscapeMood={alarmMix:0,alarmSerial:0}):void {
  intent={age,audible,mood};soundscape.update(context,age,permitted&&audible,mood,buses?.atmosphere.node);
}
/** Audio stays optional: no context before an enabled user gesture. */
export function unlockAudio(enabled=true):void {
  if(!enabled)return;
  try{
    if(!context||context.state==='closed'){stopCombatAudio();soundscape.dispose();clearBuses();context=undefined;createContext();transients=freshTransients();}
    const owner=context;if(!owner)return;
    permitted=true;soundscape.retry();
    const version=++resumeVersion;
    if(owner.state!=='running')void owner.resume().then(()=>{
      if(context!==owner)return;
      // A later mute/hidden transition owns the context, even if resume resolved late.
      if(!permitted){soundscape.update(owner,intent.age,false,intent.mood,buses?.atmosphere.node);void owner.suspend().catch(()=>{});return;}
      if(version===resumeVersion)soundscape.update(owner,intent.age,intent.audible,intent.mood,buses?.atmosphere.node);
    }).catch(()=>{});
    else soundscape.update(owner,intent.age,intent.audible,intent.mood,buses?.atmosphere.node);
  }catch{/* Unsupported or disallowed browser audio must not break gameplay. */}
}
export function suspendAudio():void {
  stopCombatAudio();permitted=false;resumeVersion++;soundscape.cancelPending();synthesis.dispose();
  soundscape.update(context,intent.age,false,intent.mood,buses?.atmosphere.node);
  try{if(context&&context.state!=='closed')void context.suspend().catch(()=>{});}catch{/* Optional audio. */}
}
export function disposeAudio():void {
  stopCombatAudio();const previous=context;context=undefined;
  permitted=false;resumeVersion++;intent={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}};soundscape.dispose();clearBuses();transients=freshTransients();synthesis.dispose();
  try{if(previous&&previous.state!=='closed')void previous.close().catch(()=>{});}catch{/* Optional audio. */}
}

type Point=readonly [seconds:number,value:number];
interface CueDefinition {readonly wave:OscillatorType;readonly duration:number;readonly frequency:readonly Point[];readonly envelope:readonly Point[]}
// Original short contours; these initial levels await perceptual/device review.
const definitions:Readonly<Record<CombatCueId,CueDefinition>>={
 death:{wave:'sine',duration:.140,frequency:[[0,260],[.140,70]],envelope:[[.003,.020],[.040,.010],[.140,0]]},
 summon:{wave:'sine',duration:.320,frequency:[[0,660],[.100,990],[.260,1480]],envelope:[[.003,.035],[.090,.016],[.160,.028],[.240,.012],[.320,0]]},
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
const intervals:Readonly<Record<CueCooldown,number>>={deployment:.120,'unit-hit':.090,'base-hit':.180,coin:.250,death:.250};
function playSelectedCues(cues:readonly CombatCue[],enabled:boolean):void {
 if(!enabled||!permitted||!context||context.state!=='running'||!buses||mix.effects===0)return;
 const owner=transients,audioContext=context,now=audioContext.currentTime;
 for(const cue of cues){
  if(cue.cooldown&&now-(owner.last.get(cue.cooldown)??-Infinity)+1e-9<intervals[cue.cooldown])continue;
  if(!cue.critical&&owner.ordinary>=6)continue;
  if(owner.total>=8&&(!cue.critical||!soundscape.dropAccent()||owner.total>=8))continue;
  const effect:Effect={id:cue.id,critical:cue.critical,closed:false};owner.effects.add(effect);owner.total++;if(!cue.critical)owner.ordinary++;
  const release=()=>{
   if(effect.closed)return;effect.closed=true;owner.effects.delete(effect);owner.total--;if(!cue.critical)owner.ordinary--;
  };
  effect.voice=renderCombatCue(audioContext,buses.effects.node,cue.id,now,release);
  if(effect.voice&&!effect.closed&&cue.cooldown)owner.last.set(cue.cooldown,now);
 }
}
/** Drained summon metadata is recognized but only the direct accepted action plays it. */
export function playCombatEvents(events:readonly GameEvent[],enabled:boolean):void {
 playSelectedCues(selectCombatCues(events).filter(cue=>cue.id!=='summon'),enabled);
}
export function playSummonAudio(enabled:boolean):void {
 playSelectedCues([{id:'summon',eventIndex:0,priority:1,critical:false,cooldown:null}],enabled);
}
/** Optional finite direct-summon tail; all other stops release every effect. */
export function stopCombatAudio(preserveSummon=false):void {
 for(const effect of transients.effects)if(!preserveSummon||effect.id!=='summon')effect.voice?.dispose();transients.last.clear();
}
