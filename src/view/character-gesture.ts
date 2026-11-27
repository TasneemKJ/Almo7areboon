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
    const phase=.5+.5*Math.sin(t*Math.PI*3);
    if(kind===0)return {forward:3.2*phase,lift:.35*phase,angle:3.0*phase,sx:1-.015*phase,sy:1+.015*phase};
    if(kind===1)return {forward:-1.8*phase,lift:.15*phase,angle:-.9*phase,sx:1+.01*phase,sy:1-.008*phase};
    return {forward:-.8*phase,lift:.05*phase,angle:-.4*phase,sx:1+.022*phase,sy:1-.024*phase};
  }
  if(moving){
    const cycle=Math.sin(t*Math.PI*3.25),rise=Math.abs(cycle);
    if(kind===0)return {forward:.65+.22*cycle,lift:.65*rise,angle:1.2*cycle,sx:1+.012*rise,sy:1-.012*rise};
    if(kind===1)return {forward:.34+.12*cycle,lift:.35*rise,angle:.6*cycle,sx:1+.008*rise,sy:1-.008*rise};
    return {forward:.14+.05*cycle,lift:.16*rise,angle:.25*cycle,sx:1+.005*rise,sy:1-.005*rise};
  }
  const breath=.5+.5*Math.sin(t*2.2);
  return {forward:0,lift:0,angle:0,sx:1-.008*breath,sy:1+.018*breath};
}
