import type {GameEvent} from '../game/types.ts';

export const BATTLEFIELD_MEMORY_CAP=6;
export const BATTLEFIELD_MEMORY_LIFE=14;
const MERGE_DISTANCE=18;

export type BattlefieldMemoryKind='heavy'|'meteor';
export type BattlefieldMemorySide='player'|'enemy';
export type BattlefieldMemoryInput=Readonly<{kind:BattlefieldMemoryKind;x:number;lane:number;side:BattlefieldMemorySide}>;

export type BattlefieldMemoryMark=Readonly<{
 kind:BattlefieldMemoryKind;
 x:number;
 lane:number;
 side:BattlefieldMemorySide;
 age:number;
 life:number;
 order:number;
}>;

export type BattlefieldMemoryLine=Readonly<{
 from:Readonly<{x:number;y:number}>;
 to:Readonly<{x:number;y:number}>;
 color:number;
 width:number;
}>;

export type BattlefieldMemoryEllipse=Readonly<{
 x:number;
 y:number;
 width:number;
 height:number;
 color:number;
 lineWidth:number;
}>;

export type BattlefieldMemoryFrame=Readonly<{
 alpha:number;
 lines:readonly BattlefieldMemoryLine[];
 ellipses:readonly BattlefieldMemoryEllipse[];
 region:Readonly<{left:number;top:number;right:number;bottom:number}>;
}>;

export type BattlefieldMemoryRegion=Readonly<{left:number;top:number;right:number;bottom:number}>;

export function battlefieldMemoryNeedsHudMeasurement(marks:readonly BattlefieldMemoryMark[]):boolean {
 return marks.length>0;
}

export function battlefieldMemoryAfterReset(marks:readonly BattlefieldMemoryMark[],reason:'motion'|'scene'):readonly BattlefieldMemoryMark[] {
 return reason==='motion'?marks:Object.freeze([]);
}

const finite=(value:number,fallback:number)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const point=(x:number,y:number)=>Object.freeze({x,y});
const line=(x1:number,y1:number,x2:number,y2:number,color:number,width:number):BattlefieldMemoryLine=>Object.freeze({from:point(x1,y1),to:point(x2,y2),color,width});
const freezeMarks=(marks:readonly BattlefieldMemoryMark[])=>Object.freeze(marks.map(mark=>Object.freeze({...mark})));

/** Resolved damage owns this intent; the view never searches for a replacement target after a kill. */
export function battlefieldMemoryIntentForHit(event:GameEvent):{kind:'heavy';x:number;lane:number;side:BattlefieldMemorySide}|null {
 if(event.type!=='hit'||event.target!=='unit'||!event.source||event.source.kind!==2||!Number.isFinite(event.amount)||(event.amount??0)<=0||!Number.isFinite(event.x)||!Number.isFinite(event.lane))return null;
 return {kind:'heavy',x:event.x!*.45,lane:event.lane!,side:event.source.side};
}

export function rememberBattlefieldMark(
 marks:readonly BattlefieldMemoryMark[],
 input:BattlefieldMemoryInput,
):readonly BattlefieldMemoryMark[] {
 const kind:BattlefieldMemoryKind=input.kind==='meteor'?'meteor':'heavy';
 const side:BattlefieldMemorySide=input.side==='enemy'?'enemy':'player';
 const x=clamp(finite(input.x,225),52,398);
 const lane=Number.isFinite(input.lane)&&input.lane>=0&&input.lane<=2?Math.round(input.lane):1;
 const order=marks.reduce((latest,mark)=>Math.max(latest,finite(mark.order,0)),0)+1;
 const index=marks.findIndex(mark=>mark.kind===kind&&mark.side===side&&mark.lane===lane&&Math.abs(mark.x-x)<=MERGE_DISTANCE);
 const next=index<0?[...marks,{kind,x,lane,side,age:0,life:BATTLEFIELD_MEMORY_LIFE,order}]:marks.map((mark,at)=>at===index?{kind,x,lane,side,age:0,life:BATTLEFIELD_MEMORY_LIFE,order}:mark);
 return freezeMarks(next.sort((a,b)=>a.order-b.order).slice(-BATTLEFIELD_MEMORY_CAP));
}

export function stepBattlefieldMemory(marks:readonly BattlefieldMemoryMark[],dt:number,paused=false):readonly BattlefieldMemoryMark[] {
 if(paused||!Number.isFinite(dt)||dt<=0)return marks;
 return freezeMarks(marks.map(mark=>({...mark,age:mark.age+dt})).filter(mark=>mark.age<mark.life));
}

export function battlefieldMemoryFrame(mark:BattlefieldMemoryMark,reduced=false):BattlefieldMemoryFrame {
 const x=clamp(finite(mark.x,225),52,398),age=clamp(finite(mark.age,0),0,BATTLEFIELD_MEMORY_LIFE);
 const fade=reduced||age<=BATTLEFIELD_MEMORY_LIFE-4?1:clamp((BATTLEFIELD_MEMORY_LIFE-age)/4,0,1);
 const alpha=Math.round(.26*fade*1000)/1000;
 const player=mark.side!=='enemy',color=player?0x496f71:0x765347;
 let lines:BattlefieldMemoryLine[],ellipses:BattlefieldMemoryEllipse[];
 if(mark.kind==='meteor'){
  lines=[line(x-10,0,x-4,0,color,1.1),line(x+4,0,x+10,0,color,1.1),line(x, -7,x,-3,color,1.1),line(x,3,x,7,color,1.1)];
  ellipses=[Object.freeze({x,y:0,width:11,height:5,color:0x6c5540,lineWidth:1.25})];
 }else{
  const direction=player?1:-1;
  lines=[
   line(x-direction*9,2,x+direction*9,-2,color,1.35),
   line(x+direction*1,0,x+direction*7,-7,color,1.05),
   line(x+direction*2,0,x+direction*8,6,color,1.05),
  ];
  ellipses=[];
 }
 const frame={alpha,lines:Object.freeze(lines),ellipses:Object.freeze(ellipses),region:Object.freeze({left:x-12,top:-8,right:x+12,bottom:8})};
 return Object.freeze(frame);
}

/** Road scars remain presentation-only and are omitted when DOM controls cover their readable shape. */
export function battlefieldMemoryRegionClearOf(
 region:BattlefieldMemoryRegion,
 hudBounds:readonly BattlefieldMemoryRegion[],
):boolean {
 return !hudBounds.some(hud=>region.left<hud.right&&region.right>hud.left&&region.top<hud.bottom&&region.bottom>hud.top);
}
