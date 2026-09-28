let context:AudioContext|undefined;
export function unlockAudio() {try {context??=new AudioContext(); if(context.state==='suspended') void context.resume();}catch{/* Audio is optional. */}}
export function sound(kind:string,enabled:boolean) {
  if(!enabled||!context||context.state!=='running')return;
  const tones:Record<string,[number,number,number]> = {spawn:[430,300,.08],hit:[130,55,.04],coin:[890,1150,.07],upgrade:[530,850,.18],win:[520,1040,.4],lose:[240,90,.5],skill:[700,120,.35],evolve:[400,1400,.55]};
  const [from,to,duration]=tones[kind]||tones.spawn;
  const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
  oscillator.type=kind==='hit'?'triangle':'sine';oscillator.frequency.setValueAtTime(from,now);oscillator.frequency.exponentialRampToValueAtTime(to,now+duration);
  gain.gain.setValueAtTime(kind==='hit'?.025:.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  oscillator.connect(gain);gain.connect(context.destination);oscillator.start(now);oscillator.stop(now+duration);
}
