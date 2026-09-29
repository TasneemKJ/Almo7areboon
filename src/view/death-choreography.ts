import type {Side,UnitKind} from '../game/types.ts';

export type DeathStyle='collapse'|'settle'|'dissolve';
export interface DeathProfile {
 style:DeathStyle;
 duration:number;
 maxAngle:number;
 endScaleX:number;
 endScaleY:number;
 travelX:number;
 travelY:number;
}
export interface DeathPose {dx:number;dy:number;angle:number;sx:number;sy:number;alpha:number}
const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const validKind=(kind:number)=>(Number.isInteger(kind)&&kind>=0&&kind<3?kind:0) as UnitKind;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function deathProfile(inputAge:number,inputKind:number):DeathProfile {
 const age=validAge(inputAge),kind=validKind(inputKind);
 if(age===5){
  if(kind===2)return {style:'dissolve',duration:.34,maxAngle:2.5,endScaleX:1.04,endScaleY:.82,travelX:1.2,travelY:-7};
  return {style:'dissolve',duration:.27,maxAngle:4,endScaleX:1.03,endScaleY:.88,travelX:1.8,travelY:-8};
 }
 if(kind===2)return {style:'settle',duration:.36,maxAngle:6,endScaleX:1.035,endScaleY:.78,travelX:2.5,travelY:5};
 if(kind===1)return {style:'collapse',duration:.29,maxAngle:14,endScaleX:.91,endScaleY:.84,travelX:4,travelY:7};
 return {style:'collapse',duration:.30,maxAngle:22,endScaleX:.88,endScaleY:.82,travelX:6,travelY:9};
}

/** View-only exit pose. Side mirrors direction; role/era own weight and timing. */
export function deathPose(inputAge:number,inputKind:number,side:Side,progress:number):DeathPose {
 const age=validAge(inputAge),kind=validKind(inputKind),profile=deathProfile(age,kind);
 const p=Number.isFinite(progress)&&progress>=0&&progress<=1?progress:0;
 const sign=side==='player'?1:-1;
 const ease=1-(1-p)*(1-p);
 const settle=profile.style==='dissolve'?p:ease;
 const alpha=profile.style==='dissolve'?1-p**1.25:1-p*p;
 return {
  dx:sign*profile.travelX*settle,
  dy:profile.travelY*settle,
  angle:sign*profile.maxAngle*Math.sin(p*Math.PI*.5),
  sx:1+(profile.endScaleX-1)*ease,
  sy:1+(profile.endScaleY-1)*ease,
  alpha:clamp(alpha,0,1),
 };
}
