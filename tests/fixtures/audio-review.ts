import {selectCombatCues,type CombatCueId} from '../../src/view/combat-cues.ts';
import {renderCombatCue,type CueVoice} from '../../src/view/audio.ts';
import {synthesizeSoundscape} from '../../src/view/soundscape.ts';
import type {GameEvent} from '../../src/game/types.ts';
export const REVIEW_CUES:readonly CombatCueId[]=['story-rally','story-bell','story-shatter','story-protect','story-cover','story-breach','story-landmark','story-rescue','deploy','hit-neutral','hit-blunt','hit-flick','hit-hollow','base-player','base-enemy','coin','freeze','meteor','food','upgrade','evolve','win','lose','death','summon'];
interface Batch {at:number;events:GameEvent[]}
/** Fixed integer-millisecond timeline avoids accidental near-equal batch keys. */
export function crowdedAudioBatches():Batch[]{
 const batches=new Map<number,GameEvent[]>();
 const add=(ms:number,event:GameEvent)=>{const events=batches.get(ms)??[];events.push(event);batches.set(ms,events);};
 for(let ms=500,index=0;ms<=18500;ms+=100,index++)add(ms,{type:'hit',target:'unit',side:'player',source:{id:index+1,x:500,lane:index%3,side:'player',age:0,kind:(index%3) as 0|1|2}});
 for(let ms=500;ms<=18500;ms+=500)add(ms,{type:'coin',amount:1});
 for(let ms=1500;ms<=18000;ms+=1500)add(ms,{type:'spawn',side:'player'});
 for(const ms of [3000,8000,13000,18000])add(ms,{type:'hit',target:'base',side:'enemy'});
 for(const [ms,skill] of [[4000,'freeze'],[9000,'meteor'],[14000,'food']] as const)add(ms,{type:'skill',skill});
 add(2500,{type:'hit',target:'unit',storyCue:'covered',amount:8});
 add(6500,{type:'hit',target:'unit',storyCue:'breach',amount:8});
 add(10500,{type:'hit',storyCue:'landmark',amount:0});
 add(16500,{type:'hit',storyCue:'rescued',amount:0});
 add(19000,{type:'win'});add(19000,{type:'coin',amount:10});add(19000,{type:'hit',target:'unit',side:'player'});
 return [...batches.entries()].sort(([a],[b])=>a-b).map(([ms,events])=>({at:ms/1000,events}));
}
interface Onset {id:CombatCueId;at:number;end:number;wave:OscillatorType}
export async function renderAudioReview(id:CombatCueId|'crowded'){
 if(typeof OfflineAudioContext!=='function')throw Error('Native OfflineAudioContext unavailable');
 const isolated=id!=='crowded',duration=isolated?1:20,sampleRate=16000;
 if(isolated&&!REVIEW_CUES.includes(id))throw Error('Unknown isolated review cue');
 const context=new OfflineAudioContext(2,duration*sampleRate,sampleRate),onsets:Onset[]=[],voices:CueVoice[]=[];
 let pendingId:CombatCueId='deploy',released=0,oscillators=0;
 const nativeCreate=context.createOscillator.bind(context);
 // Transparent observation: native oscillator DSP and scheduling are untouched.
 context.createOscillator=()=>{
  const oscillator=nativeCreate(),start=oscillator.start.bind(oscillator),stop=oscillator.stop.bind(oscillator);
  const onset:Onset={id:pendingId,at:NaN,end:NaN,wave:'sine'};onsets.push(onset);oscillators++;
  oscillator.start=(at=0)=>{onset.at=at;onset.wave=oscillator.type;start(at);};
  oscillator.stop=(at?:number)=>{if(at!==undefined&&!Number.isFinite(onset.end))onset.end=at;if(at===undefined)stop();else stop(at);};
  return oscillator;
 };
 const schedule=(cue:CombatCueId,at:number)=>{
  pendingId=cue;const voice=renderCombatCue(context,context.destination,cue,at,()=>released++);
  if(!voice)throw Error(`Production cue scheduling failed: ${cue}`);voices.push(voice);
 };
 const batches=isolated?[]:crowdedAudioBatches();
 let bedPCMBytes=0;
 if(isolated)schedule(id,.05);
 else{
  const pcm=synthesizeSoundscape(0),buffer=context.createBuffer(2,pcm.left.length,pcm.sampleRate);
  buffer.getChannelData(0).set(pcm.left);buffer.getChannelData(1).set(pcm.right);bedPCMBytes=pcm.left.byteLength+pcm.right.byteLength;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.setValueAtTime(.35,0);
  source.connect(gain);gain.connect(context.destination);source.start(0);
  for(const batch of batches)for(const cue of selectCombatCues(batch.events))schedule(cue.id,batch.at);
 }
 const rendered=await context.startRendering();
 // Explicit cleanup after rendering also covers delayed browser onended delivery.
 for(const voice of voices)voice.dispose();
 if(released!==voices.length||oscillators!==voices.length)throw Error('Production voice allocation/release mismatch');
 return {name:id,sampleRate:rendered.sampleRate,duration:rendered.duration,channels:rendered.numberOfChannels,
  left:Array.from(rendered.getChannelData(0)),right:Array.from(rendered.getChannelData(1)),onsets,
  parameters:{nativeOffline:true,isolated,bedChapter:isolated?null:0,bedMixGain:isolated?0:.35,bedPCMBytes,
   batchCount:batches.length,eventCount:batches.reduce((n,b)=>n+b.events.length,0),scheduledVoices:voices.length,releasedVoices:released,
   batches:batches.map(batch=>({at:batch.at,events:batch.events,selected:selectCombatCues(batch.events)}))}};
}
declare global {interface Window {audioReview:{cues:readonly CombatCueId[];render:typeof renderAudioReview}}}
if(typeof window!=='undefined'){
 window.audioReview={cues:REVIEW_CUES,render:renderAudioReview};document.body.dataset.ready='true';
}
