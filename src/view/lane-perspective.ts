import type {UnitKind} from '../game/types.ts';

export interface LanePresentation {
  scale:number;
  shadowWidth:number;
  shadowHeight:number;
  shadowAlpha:number;
}

const LANE_SCALE=[.93,1,1.07] as const;
const clampLane=(lane:number)=>Number.isFinite(lane)&&lane>=0&&lane<=2?Math.round(lane):1;
const clampKind=(kind:number)=>([0,1,2].includes(kind)?kind:0) as UnitKind;
export const rankStagger=(id:number)=>((id*7)%5-2)*1.1;

/** Shared actor sort depth, including the five-position crowded-rank stagger. */
export function actorRenderDepth(groundY:number,lane:number,laneGap:number,id:number):number {
  return groundY+lane*laneGap+rankStagger(id)+.5;
}

export function minimumActorRenderDepth(groundY:number):number {
  return Math.min(...Array.from({length:5},(_,id)=>actorRenderDepth(groundY,0,0,id)));
}

/**
 * View-only lane perspective. Simulation positions and collision distances stay unchanged;
 * the back lane recedes slightly while the front lane reads closer to the camera.
 */
export function lanePresentation(lane:number,kind:number):LanePresentation {
  const actualLane=clampLane(lane),actualKind=clampKind(kind),scale=LANE_SCALE[actualLane];
  const heavy=actualKind===2;
  return {
    scale,
    shadowWidth:(heavy?46:27)*scale,
    shadowHeight:(heavy?11:7)*(.92+(scale-.93)*.75),
    shadowAlpha:.11+actualLane*.035,
  };
}

export function troopScale(kind:number,lane:number):number {
  const actualKind=clampKind(kind);
  return (actualKind===2?.6:.46)*lanePresentation(lane,actualKind).scale;
}

export function healthOffset(kind:number,lane:number):number {
  const actualKind=clampKind(kind);
  return (actualKind===2?85:65)*lanePresentation(lane,actualKind).scale;
}

export function projectileLift(kind:number,lane:number):number {
  const actualKind=clampKind(kind);
  return (actualKind===2?29:25)*lanePresentation(lane,actualKind).scale;
}
