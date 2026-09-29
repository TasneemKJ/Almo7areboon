export interface CharacterGesture {
  forward:number;
  lift:number;
  angle:number;
  sx:number;
  sy:number;
}
const neutral=():CharacterGesture=>({forward:0,lift:0,angle:0,sx:1,sy:1});
const validKind=(kind:number)=>Number.isInteger(kind)&&kind>=0&&kind<3?kind:0;
const safeTime=(time:number)=>Number.isFinite(time)&&time>=0?Math.min(1e6,time):0;

/**
 * View-only line-of-action accents layered over the existing six sprite frames.
 * Values stay intentionally small so animation frames remain the primary motion.
 */
export function characterGesture(input:number,time:number,moving:boolean,attacking:boolean,reduced:boolean):CharacterGesture {
  if(reduced)return neutral();
  const kind=validKind(input),t=safeTime(time);
  if(attacking){
    const phase=.5+.5*Math.sin(t*14);
    if(kind===0)return {forward:2.4*phase,lift:.18*phase,angle:2.2*phase,sx:1-.006*phase,sy:1+.006*phase};
    if(kind===1)return {forward:-1.3*phase,lift:.06*phase,angle:-.52*phase,sx:1+.004*phase,sy:1-.003*phase};
    return {forward:-.55*phase,lift:0,angle:-.22*phase,sx:1+.018*phase,sy:1-.024*phase};
  }
  if(moving){
    const cycle=Math.sin(t*9),rise=Math.abs(cycle);
    if(kind===0)return {forward:.55+.18*cycle,lift:.3*rise,angle:.9*cycle,sx:1+.005*rise,sy:1-.005*rise};
    if(kind===1)return {forward:.26+.08*cycle,lift:.12*rise,angle:.35*cycle,sx:1+.003*rise,sy:1-.003*rise};
    return {forward:.09+.03*cycle,lift:.05*rise,angle:.12*cycle,sx:1+.002*rise,sy:1-.002*rise};
  }
  return neutral();
}
