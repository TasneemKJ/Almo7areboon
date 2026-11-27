import {SoundscapePlayer,type SoundscapeMood} from './soundscape-player.ts';
import {synthesizeSoundscape} from './soundscape.ts';
import {createSoundscapeSynthesis} from './soundscape-worker-client.ts';
import {normalizeAudioMix,DEFAULT_AUDIO_MIX,type AudioMix} from '../game/audio-mix.ts';
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
  const created=owner;
  created.onstatechange=()=>{
   if(context!==created)return;
   if(created.state==='running'&&permitted){soundscape.retry();soundscape.update(created,intent.age,intent.audible,intent.mood,buses?.atmosphere.node);}
   else if((created.state as string)==='interrupted'&&permitted){void created.resume().catch(()=>{});}
  };
 }catch(error){for(const node of nodes)try{node.disconnect();}catch{/* Try all partially constructed nodes. */}try{void owner?.close().catch(()=>{});}catch{/* Optional audio. */}throw error;}
}
import {SCORE_BED,SCORE_BEATS,SCORE_RESOLVE,BED_FADE_IN,RESOLVE_FADE,SKIP_FADE,noteAttack,type IntroBeatId,type ScoreNote} from './intro-score.ts';
import {selectCombatCues,type CombatCue,type CombatCueId,type CueCooldown} from './combat-cues.ts';
import type {GameEvent} from '../game/types.ts';
interface Effect {voice?:CueVoice;id:CombatCueId;critical:boolean;closed:boolean}
interface Transients {total:number;ordinary:number;effects:Set<Effect>;last:Map<CueCooldown,number>}
const freshTransients=():Transients=>({total:0,ordinary:0,effects:new Set(),last:new Map()});
let transients=freshTransients();
const synthesis=createSoundscapeSynthesis();
const soundscape=new SoundscapePlayer(age=>typeof Worker==='function'?synthesis.generate(age):Promise.resolve(synthesizeSoundscape(age)),{acquire:()=>{if(transients.total>=8)return false;transients.total++;return true;},release:()=>{transients.total=Math.max(0,transients.total-1);}});
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
interface RetiringScore {effects:GainNode;atmosphere:GainNode|null;voices:Set<OscillatorNode>;timer:ReturnType<typeof setTimeout>}
const retiringScores=new Set<RetiringScore>();
function stopRetiringScores():void {
 for(const item of retiringScores){
  clearTimeout(item.timer);
  for(const osc of item.voices)try{osc.stop();osc.disconnect();}catch{/* Already stopped. */}
  try{item.effects.disconnect();}catch{/* Optional. */}
  try{item.atmosphere?.disconnect();}catch{/* Optional. */}
 }
 retiringScores.clear();
}
export function suspendAudio():void {
  endIntroScore('skip');stopRetiringScores();stopCombatAudio();permitted=false;resumeVersion++;soundscape.cancelPending();synthesis.dispose();
  soundscape.update(context,intent.age,false,intent.mood,buses?.atmosphere.node);
  try{if(context&&context.state!=='closed')void context.suspend().catch(()=>{});}catch{/* Optional audio. */}
}
export function disposeAudio():void {
  endIntroScore('skip');stopRetiringScores();stopCombatAudio();const previous=context;context=undefined;
  permitted=false;resumeVersion++;intent={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}};soundscape.dispose();clearBuses();transients=freshTransients();synthesis.dispose();
  try{if(previous&&previous.state!=='closed')void previous.close().catch(()=>{});}catch{/* Optional audio. */}
}

type Point=readonly [seconds:number,value:number];
interface CueDefinition {readonly wave:OscillatorType;readonly duration:number;readonly frequency:readonly Point[];readonly envelope:readonly Point[]}
// Original short contours; these initial levels await perceptual/device review.
const definitions:Readonly<Record<CombatCueId,CueDefinition>>={
 // A press: a soft, dry wooden tick, quieter than any combat cue.
 // The far hill's horn before a stronger wave (first-battle.ts): a low, breathy two-note call.
 horn:{wave:'triangle',duration:1.2,frequency:[[0,174.6],[.28,196],[.85,196],[1.2,174.6]],envelope:[[.09,.05],[.3,.04],[.85,.038],[1.2,0]]},
 press:{wave:'triangle',duration:.06,frequency:[[0,520],[.06,380]],envelope:[[.002,.028],[.02,.008],[.06,0]]},
 // A dry gate tap / muted brass rise, softened by a short cloth-like tail.
 'order-hold':{wave:'triangle',duration:.24,frequency:[[0,180],[.035,90],[.09,150],[.24,110]],envelope:[[.003,.028],[.035,.006],[.075,.016],[.12,.008],[.16,.012],[.24,0]]},
 'order-advance':{wave:'triangle',duration:.30,frequency:[[0,165],[.035,120],[.08,262],[.19,349],[.30,392]],envelope:[[.003,.026],[.04,.006],[.085,.028],[.15,.014],[.21,.022],[.30,0]]},
 'story-rally':{wave:'triangle',duration:.28,frequency:[[0,240],[.10,320],[.2,400]],envelope:[[.005,.055],[.08,.022],[.14,.045],[.28,0]]},
 'story-bell':{wave:'sine',duration:.65,frequency:[[0,392],[.3,390],[.65,388]],envelope:[[.005,.068],[.12,.038],[.38,.02],[.65,0]]},
 'story-shatter':{wave:'triangle',duration:.16,frequency:[[0,1550],[.035,890],[.16,310]],envelope:[[.003,.048],[.04,.018],[.065,.032],[.16,0]]},
 'story-protect':{wave:'sine',duration:.36,frequency:[[0,294],[.14,392],[.36,440]],envelope:[[.005,.052],[.12,.032],[.2,.042],[.36,0]]},
 'story-cover':{wave:'sine',duration:.22,frequency:[[0,220],[.08,277],[.22,247]],envelope:[[.003,.048],[.07,.022],[.12,.038],[.22,0]]},
 'story-breach':{wave:'sawtooth',duration:.18,frequency:[[0,620],[.05,310],[.18,130]],envelope:[[.002,.038],[.045,.016],[.08,.028],[.18,0]]},
 'story-landmark':{wave:'triangle',duration:.34,frequency:[[0,262],[.12,349],[.26,523]],envelope:[[.004,.048],[.1,.022],[.18,.04],[.34,0]]},
 'story-rescue':{wave:'sine',duration:.4,frequency:[[0,330],[.13,440],[.27,587]],envelope:[[.003,.045],[.11,.018],[.2,.044],[.31,.025],[.4,0]]},
 death:{wave:'sine',duration:.140,frequency:[[0,260],[.140,70]],envelope:[[.003,.044],[.040,.022],[.140,0]]},
 summon:{wave:'sine',duration:.320,frequency:[[0,660],[.100,990],[.260,1480]],envelope:[[.003,.068],[.090,.032],[.160,.054],[.240,.024],[.320,0]]},
 deploy:{wave:'triangle',duration:.085,frequency:[[0,310],[.085,390]],envelope:[[.003,.076],[.025,.046],[.085,0]]},
 'hit-neutral':{wave:'sine',duration:.065,frequency:[[0,140],[.065,82]],envelope:[[.003,.055],[.065,0]]},
 'hit-blunt':{wave:'triangle',duration:.090,frequency:[[0,160],[.090,62]],envelope:[[.003,.058],[.090,0]]},
 'hit-flick':{wave:'sawtooth',duration:.035,frequency:[[0,390],[.035,190]],envelope:[[.002,.028],[.012,.008],[.035,0]]},
 'hit-hollow':{wave:'sine',duration:.130,frequency:[[0,115],[.130,52]],envelope:[[.005,.062],[.040,.036],[.130,0]]},
 'base-player':{wave:'triangle',duration:.220,frequency:[[0,92],[.220,38]],envelope:[[.005,.082],[.040,.062],[.220,0]]},
 'base-enemy':{wave:'triangle',duration:.185,frequency:[[0,158],[.055,112],[.185,72]],envelope:[[.004,.078],[.040,.048],[.185,0]]},
 coin:{wave:'sine',duration:.120,frequency:[[0,880],[.065,1175]],envelope:[[.003,.058],[.045,.009],[.065,.046],[.120,0]]},
 freeze:{wave:'sine',duration:.280,frequency:[[0,1100],[.280,550]],envelope:[[.003,.072],[.055,.010],[.090,.026],[.280,0]]},
 meteor:{wave:'triangle',duration:.320,frequency:[[0,180],[.320,45]],envelope:[[.005,.088],[.070,.062],[.320,0]]},
 food:{wave:'sine',duration:.300,frequency:[[0,330],[.100,440],[.230,660]],envelope:[[.005,.074],[.100,.048],[.180,.058],[.300,0]]},
 upgrade:{wave:'triangle',duration:.180,frequency:[[0,330],[.110,440]],envelope:[[.003,.076],[.070,.046],[.180,0]]},
 evolve:{wave:'triangle',duration:.360,frequency:[[0,330],[.110,440],[.240,660]],envelope:[[.003,.080],[.110,.044],[.240,.060],[.360,0]]},
 win:{wave:'sine',duration:.600,frequency:[[0,330],[.200,440],[.400,660]],envelope:[[.005,.082],[.170,.034],[.220,.072],[.370,.034],[.420,.072],[.600,0]]},
 lose:{wave:'sine',duration:.600,frequency:[[0,330],[.200,311],[.400,294]],envelope:[[.005,.082],[.170,.034],[.220,.072],[.370,.034],[.420,.054],[.600,0]]},
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
export function playPressAudio(enabled:boolean):void {
 playSelectedCues([{id:'press',eventIndex:0,priority:0,critical:false,cooldown:null}],enabled);
}
/** The horn from the far hill: a stronger wave is near (the first battle's world teaching). */
export function playHornAudio(enabled:boolean):void {
 playSelectedCues([{id:'horn',eventIndex:0,priority:2,critical:false,cooldown:null}],enabled);
}
export function playSummonAudio(enabled:boolean):void {
 playSelectedCues([{id:'summon',eventIndex:0,priority:1,critical:false,cooldown:null}],enabled);
}
/** Optional finite direct-summon tail; all other stops release every effect. */
export function stopCombatAudio(preserveSummon=false):void {
 for(const effect of transients.effects)if(!preserveSummon||effect.id!=='summon')effect.voice?.dispose();transients.last.clear();
}
/**
 * The opening tale's score. It plays only after a gesture has already unlocked audio (the tap on Play or
 * Watch intro), only with Sound on, and through the same effects and atmosphere buses, so the volume
 * sliders apply; the music parts need Atmosphere. Every voice ends with a ramp, never a cut.
 */
interface IntroScore {context:AudioContext;effects:GainNode;atmosphere:GainNode|null;voices:Set<OscillatorNode>;bed:GainNode[]}
let introScore:IntroScore|null=null;
function scoreVoice(score:IntroScore,note:ScoreNote,at:number,hold=false):GainNode|null {
 const out=note.bus==='effects'?score.effects:score.atmosphere;if(!out)return null;
 const osc=score.context.createOscillator(),gain=score.context.createGain();
 osc.type=note.wave;osc.frequency.setValueAtTime(note.hz,at);if(note.to)osc.frequency.exponentialRampToValueAtTime(note.to,at+note.dur);
 gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(note.peak,at+(hold?BED_FADE_IN:noteAttack(note)));
 if(!hold){gain.gain.exponentialRampToValueAtTime(.0001,at+note.dur);osc.stop(at+note.dur+.02);}
 osc.connect(gain);gain.connect(out);score.voices.add(osc);
 osc.onended=()=>{score.voices.delete(osc);try{osc.disconnect();gain.disconnect();}catch{/* Optional audio. */}};
 osc.start(at);return gain;
}
/** Starts the bed. Returns false, and stays silent, when no gesture has unlocked audio or Sound is off. */
export function beginIntroScore(enabled:boolean,atmosphere:boolean):boolean {
 endIntroScore('skip');
 if(!enabled||!permitted||!context||context.state==='closed'||!buses)return false;
 let score:IntroScore|undefined;
 try{
  const owner=context,effects=owner.createGain();effects.connect(buses.effects.node);
  let music:GainNode|null=null;if(atmosphere){music=owner.createGain();music.connect(buses.atmosphere.node);}
  score={context:owner,effects,atmosphere:music,voices:new Set(),bed:[]};introScore=score;
  for(const note of SCORE_BED){const gain=scoreVoice(score,note,owner.currentTime,true);if(gain)score.bed.push(gain);}
  return true;
 }catch{
  introScore=null;
  if(score){for(const osc of score.voices)try{osc.stop();osc.disconnect();}catch{/* Optional. */}try{score.effects.disconnect();}catch{/* Optional. */}try{score.atmosphere?.disconnect();}catch{/* Optional. */}}
  return false;
 }
}
/** One beat's accents and motif, scheduled from the moment the picture changes. */
export function introScoreBeat(id:IntroBeatId):void {
 const score=introScore;if(!score)return;
 try{const now=score.context.currentTime;for(const note of SCORE_BEATS[id])scoreVoice(score,note,now+note.at);}catch{/* Optional audio. */}
}
/** 'resolve' swells the closing chord while the bed fades with the picture; 'skip' fades everything in 0.2s. */
export function endIntroScore(mode:'resolve'|'skip'):void {
 const score=introScore;if(!score)return;introScore=null;
 try{
  const now=score.context.currentTime,fade=mode==='resolve'?RESOLVE_FADE:SKIP_FADE;
  const existing=[...score.voices];
  if(mode==='resolve')for(const note of SCORE_RESOLVE)scoreVoice(score,note,now+note.at);
  const ramp=(gain:AudioParam,seconds:number)=>{gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);gain.linearRampToValueAtTime(0,now+seconds);};
  if(mode==='skip'){ramp(score.effects.gain,fade);if(score.atmosphere)ramp(score.atmosphere.gain,fade);}
  else for(const bed of score.bed)ramp(bed.gain,fade);
  const end=now+fade+.05;
  for(const osc of existing)try{osc.stop(end);}catch{/* Already stopped. */}
  const cleanupMs=Math.ceil(((mode==='resolve'?Math.max(fade,...SCORE_RESOLVE.map(note=>note.at+note.dur)):fade)+.12)*1000);
  const retired:RetiringScore={effects:score.effects,atmosphere:score.atmosphere,voices:score.voices,timer:0 as unknown as ReturnType<typeof setTimeout>};
  retired.timer=setTimeout(()=>{retiringScores.delete(retired);try{score.effects.disconnect();}catch{/* Optional. */}try{score.atmosphere?.disconnect();}catch{/* Optional. */}},cleanupMs);
  retiringScores.add(retired);
 }catch{/* Optional audio. */}
}
