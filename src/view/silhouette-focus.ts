import type {Side,UnitKind} from '../game/types.ts';
import {lanePresentation} from './lane-perspective.ts';

export interface UnitFocusMark {
  kind:'ellipse';
  x:number;
  y:number;
  width:number;
  height:number;
  alpha:number;
  color:number;
}

const validLane=(lane:number)=>Number.isInteger(lane)&&lane>=0&&lane<=2?lane:1;
const validKind=(kind:number)=>(Number.isInteger(kind)&&kind>=0&&kind<3?kind:0) as UnitKind;

/**
 * A low-energy local contrast field behind each actor. It is intentionally
 * softer than a rim light: the character still reads as painted into the
 * world, while its silhouette survives increasingly detailed scenery.
 */
export function unitFocusMarks(side:Side,lane:number,kind:number,hitFlash:number,frozen:boolean):readonly UnitFocusMark[] {
  const actualLane=validLane(lane),actualKind=validKind(kind);
  const scale=lanePresentation(actualLane,actualKind).scale;
  const heavy=actualKind===2,ranged=actualKind===1;
  const color=frozen?0x9feef2:side==='player'?0x88d7e8:0xf0a286;
  const hit=Number.isFinite(hitFlash)?Math.max(0,Math.min(1,hitFlash)):0;
  const boost=Math.min(.04,hit*.2);
  const width=(heavy?54:ranged?43:46)*scale;
  const height=(heavy?66:ranged?55:59)*scale;
  const y=(heavy?-31:ranged?-29:-30)*scale;
  return [
    {kind:'ellipse',x:0,y,width,height,alpha:Math.min(.13,.058+actualLane*.006+boost),color},
    {kind:'ellipse',x:0,y:y+1.5*scale,width:width*.7,height:height*.72,alpha:Math.min(.13,.032+actualLane*.004+boost*.55),color},
  ] as const;
}
