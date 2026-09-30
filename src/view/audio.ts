import {SoundscapePlayer,type SoundscapeMood} from './soundscape-player.ts';
import {createSoundscapeSynthesis} from './soundscape-worker-client.ts';
let context:AudioContext|undefined;
let voices=0;
const synthesis=createSoundscapeSynthesis();
const soundscape=new SoundscapePlayer(age=>synthesis.generate(age),{acquire:()=>{if(voices>=8)return false;voices++;return true;},release:()=>{voices=Math.max(0,voices-1);}});
let intent:{age:number;audible:boolean;mood:SoundscapeMood}={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}},permitted=false,resumeVersion=0;
/** Desired state can change before a gesture; it never creates an AudioContext. */
export function updateSoundscape(age:number,audible:boolean,mood:SoundscapeMood={alarmMix:0,alarmSerial:0}):void {
  intent={age,audible,mood};soundscape.update(context,age,permitted&&audible,mood);
}
const lastTone=new Map<string,number>();
const tones:Record<string,[number,number,number]>={spawn:[430,300,.08],hit:[130,55,.04],coin:[890,1150,.07],upgrade:[530,850,.18],win:[520,1040,.4],lose:[240,90,.5],skill:[700,120,.35],evolve:[400,1400,.55]};

/** Audio stays optional: no context before an enabled user gesture. */
export function unlockAudio(enabled=true):void {
  if(!enabled)return;
  try{
    if(!context||context.state==='closed'){context=new AudioContext();voices=0;lastTone.clear();}
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
  permitted=false;resumeVersion++;soundscape.cancelPending();synthesis.dispose();
  soundscape.update(context,intent.age,false,intent.mood);
  try{if(context&&context.state!=='closed')void context.suspend().catch(()=>{});}catch{/* Optional audio. */}
}
export function disposeAudio():void {
  const previous=context;context=undefined;lastTone.clear();
  permitted=false;resumeVersion++;intent={age:0,audible:false,mood:{alarmMix:0,alarmSerial:0}};soundscape.dispose();voices=0;synthesis.dispose();
  try{if(previous&&previous.state!=='closed')void previous.close().catch(()=>{});}catch{/* Optional audio. */}
}
export function sound(kind:string,enabled:boolean):void {
  if(!enabled||!permitted||!context||context.state!=='running')return;
  const owner=context,now=owner.currentTime;
  const interval=kind==='hit'?.07:kind==='coin'?.09:.04;
  if(now-(lastTone.get(kind)??-Infinity)<interval)return;
  if(voices>=8&&!soundscape.dropAccent())return;
  let oscillator:OscillatorNode|undefined,gain:GainNode|undefined,counted=false,cleaned=false;
  const cleanup=()=>{
    if(cleaned)return;cleaned=true;
    try{oscillator?.disconnect();gain?.disconnect();}catch{/* Already disconnected. */}
    if(counted&&context===owner)voices=Math.max(0,voices-1);
  };
  try{
    const [from,to,duration]=tones[kind]||tones.spawn;
    oscillator=owner.createOscillator();gain=owner.createGain();
    oscillator.type=kind==='hit'?'triangle':'sine';oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+duration);
    gain.gain.setValueAtTime(kind==='hit'?.025:.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    oscillator.connect(gain);gain.connect(owner.destination);oscillator.onended=cleanup;
    voices++;counted=true;lastTone.set(kind,now);oscillator.start(now);oscillator.stop(now+duration);
  }catch{cleanup();}
}
