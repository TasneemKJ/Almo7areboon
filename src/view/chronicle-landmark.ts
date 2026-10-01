import type {ChronicleLandmarkStatus} from '../game/chronicle-combat.ts';
import {chronicleActorDepth} from './chronicle-presentation.ts';

export type ChronicleLandmarkMarkShape='knot'|'stitch'|'cross'|'gap';
export interface ChronicleLandmarkMark {x:number;y:number;angle:number;shape:ChronicleLandmarkMarkShape;side:'player'|'enemy'|'neutral';active:boolean;}

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/** Static, bounded local geometry. The authoritative status owns all semantics. */
export function chronicleLandmarkFrame(status:ChronicleLandmarkStatus){
  const progress=clamp(finite(status.progress),0,1);
  const count=Math.round(progress*8);
  const phase=status.phase;
  const pressure=phase==='claiming-player'||phase==='held-player'?'player':phase==='claiming-enemy'||phase==='held-enemy'?'enemy':'neutral';
  const shape:ChronicleLandmarkMarkShape=phase==='broken'?'gap':phase==='contested'?'cross':pressure==='player'?'knot':pressure==='enemy'?'stitch':'gap';
  const marks:ChronicleLandmarkMark[]=Array.from({length:8},(_,index)=>{
    const angle=-Math.PI+index*Math.PI*2/8;
    return {x:Math.cos(angle)*22,y:Math.sin(angle)*5,angle,shape,side:pressure,active:(phase!=='broken'&&phase!=='contested'&&pressure!=='neutral')&&(pressure==='enemy'?index>=8-count:index<count)};
  });
  return {phase,progress,marks};
}

export function chronicleLandmarkRenderPlan(groundY:number,frame:ReturnType<typeof chronicleLandmarkFrame>,worldX=500){
  const footY=finite(groundY)-5;
  return {x:clamp(finite(worldX,500),0,1000)*.45,y:footY,groundDepth:chronicleActorDepth(finite(groundY)-8,-5),propDepth:chronicleActorDepth(finite(groundY)-8),actorFrontDepth:chronicleActorDepth(finite(groundY),1),frame};
}
