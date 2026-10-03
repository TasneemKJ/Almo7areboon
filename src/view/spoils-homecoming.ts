import type {GameEvent} from '../game/types.ts';

export const SPOILS_HOMECOMING_CAP=6;
export const SPOILS_HOMECOMING_LIFE=.9;
export const SPOILS_HOMECOMING_TRAVEL=.72;
export const SPOILS_HOME_X=58;

export interface SpoilsHomecomingInput {readonly x:number;readonly y?:number;readonly amount:number}
export interface SpoilsHomecomingMark extends SpoilsHomecomingInput {readonly age:number;readonly life:number;readonly order:number}
export interface SpoilsHomecomingFrame {readonly x:number;readonly y:number;readonly alpha:number;readonly size:number;readonly angle:number}

const freeze=<T>(value:T):T=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const finite=(value:number,fallback:number)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

/** Adapts only an already-credited simulation reward into logical battlefield space. */
export function spoilsHomecomingIntentForEvent(event:Readonly<GameEvent>):SpoilsHomecomingInput|null {
 if(event.type!=='coin'||!Number.isFinite(event.x)||!Number.isFinite(event.amount)||event.amount!<=0)return null;
 return freeze({x:clamp(event.x!*0.45,24,426),amount:event.amount!});
}

export function rememberSpoilsHomecoming(previous:readonly Readonly<SpoilsHomecomingMark>[],input:Readonly<SpoilsHomecomingInput>,requestedOrder?:number):readonly Readonly<SpoilsHomecomingMark>[] {
 const largest=previous.reduce((value,mark)=>Math.max(value,Number.isSafeInteger(mark.order)?mark.order:0),0);
 const order=Number.isSafeInteger(requestedOrder)&&requestedOrder!>largest?requestedOrder!:largest+1;
 const mark:SpoilsHomecomingMark={
  x:clamp(finite(input.x,225),24,426),
  ...(Number.isFinite(input.y)?{y:clamp(input.y!,0,500)}:{}),
  amount:Math.max(1,finite(input.amount,1)),
  age:0,
  life:SPOILS_HOMECOMING_LIFE,
  order,
 };
 return freeze([...previous,freeze(mark)].slice(-SPOILS_HOMECOMING_CAP));
}

export function stepSpoilsHomecoming(previous:readonly Readonly<SpoilsHomecomingMark>[],dt:number,paused:boolean):readonly Readonly<SpoilsHomecomingMark>[] {
 if(paused||!Number.isFinite(dt)||dt<=0)return previous;
 return freeze(previous.map(mark=>freeze({...mark,age:mark.age+dt})).filter(mark=>mark.age<mark.life));
}

export function spoilsHomecomingFrame(mark:Readonly<SpoilsHomecomingMark>,groundY:number,reduced:boolean):Readonly<SpoilsHomecomingFrame>|null {
 if(reduced)return null;
 const safeGround=finite(groundY,300),fromX=clamp(finite(mark.x,225),24,426),age=clamp(finite(mark.age,0),0,SPOILS_HOMECOMING_LIFE);
 const progress=clamp(age/SPOILS_HOMECOMING_TRAVEL,0,1),fromY=finite(mark.y??NaN,safeGround-51),toY=safeGround-72;
 const frame:SpoilsHomecomingFrame={
  x:fromX+(SPOILS_HOME_X-fromX)*progress,
  y:fromY+(toY-fromY)*progress-176*progress*(1-progress),
  alpha:age<=SPOILS_HOMECOMING_TRAVEL?1:clamp((SPOILS_HOMECOMING_LIFE-age)/(SPOILS_HOMECOMING_LIFE-SPOILS_HOMECOMING_TRAVEL),0,1),
  size:16+2*Math.sin(Math.PI*progress),
  angle:720*progress,
 };
 return freeze(frame);
}
