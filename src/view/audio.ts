let context:AudioContext|undefined;
let voices=0;
const lastTone=new Map<string,number>();
const tones:Record<string,[number,number,number]>={spawn:[430,300,.08],hit:[130,55,.04],coin:[890,1150,.07],upgrade:[530,850,.18],win:[520,1040,.4],lose:[240,90,.5],skill:[700,120,.35],evolve:[400,1400,.55]};

/** Audio stays optional: no context before an enabled user gesture. */
export function unlockAudio(enabled=true):void {
  if(!enabled)return;
  try{
    if(!context||context.state==='closed'){context=new AudioContext();voices=0;lastTone.clear();}
    if(context.state==='suspended')void context.resume().catch(()=>{});
  }catch{/* Unsupported or disallowed browser audio must not break gameplay. */}
}
export function suspendAudio():void {
  try{if(context&&context.state!=='closed')void context.suspend().catch(()=>{});}catch{/* Optional audio. */}
}
export function disposeAudio():void {
  const previous=context;context=undefined;voices=0;lastTone.clear();
  try{if(previous&&previous.state!=='closed')void previous.close().catch(()=>{});}catch{/* Optional audio. */}
}
export function sound(kind:string,enabled:boolean):void {
  if(!enabled||!context||context.state!=='running'||voices>=8)return;
  const owner=context,now=owner.currentTime;
  const interval=kind==='hit'?.07:kind==='coin'?.09:.04;
  if(now-(lastTone.get(kind)??-Infinity)<interval)return;
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
