const sourceLane=(lane:number)=>Number.isFinite(lane)&&lane>=0&&lane<=2?Math.round(lane):1;

/** Source-attached cues sit over their troop, but behind every nearer ground plane. */
export function groundEffectDepth(groundY:number,lane:number,laneGap:number):number {
 return groundY+sourceLane(lane)*laneGap+3;
}

/** Undefined lane deliberately retains the aerial/readability overlay. Never sort by particle height. */
export function groundEffectLayer<T>(lanes:readonly T[],overlay:T,lane:number|undefined):T {
 return lane===undefined?overlay:lanes[sourceLane(lane)];
}
