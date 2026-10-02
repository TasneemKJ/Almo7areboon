import type {Phase} from '../game/types.ts';
import type {RouteId} from '../game/chronicle.ts';
import {chronicleActorDepth} from './chronicle-presentation.ts';

export type ChronicleCatMode='waiting'|'leading'|'watching'|'home';
export interface ChronicleCatPaw {x:number;y:number;alpha:number}
export interface ChronicleCatFrame {mode:ChronicleCatMode;x:number;facing:-1|1;gait:0|1;tailAngle:number;paws:readonly ChronicleCatPaw[]}
export interface ChronicleCatInput {
 discoveries:number;route:RouteId|string;phase:Phase|string;rescued:boolean;travellerX:number;time:number;paused:boolean;reduced:boolean;
}
export interface ChronicleCatRenderPlan {footY:number;groundDepth:number;catDepth:number;endpointDepth:number}

const HOME_X=78,CAGE_WATCH_X=249,HOME_BOUND=56;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;

/** View-only guide for the saved missing-page route. It never owns mission progress or movement. */
export function chronicleCatFrame(input:Readonly<ChronicleCatInput>):ChronicleCatFrame|null {
 if(!Number.isInteger(input.discoveries)||(input.discoveries&4)===0||input.route!=='whisper')return null;
 const reduced=input.reduced===true,time=Math.max(0,finite(input.time));
 let mode:ChronicleCatMode='leading',x=HOME_X,facing:-1|1=1;
 if(input.phase==='ready'){mode='waiting';x=HOME_X;}
 else if(input.rescued===true){
  mode='home';facing=-1;
  x=reduced?HOME_BOUND:clamp(finite(input.travellerX,620)*.45-22,HOME_BOUND,CAGE_WATCH_X);
 }else if(reduced||time>=5.5){mode='watching';x=CAGE_WATCH_X;}
 else x=HOME_X+(CAGE_WATCH_X-HOME_X)*clamp(time/5.5,0,1);
 const moving=!reduced&&(mode==='leading'||mode==='home')&&x>HOME_BOUND&&x<CAGE_WATCH_X;
 const motionTime=time%60;
 const gait:0|1=moving?Math.floor(motionTime*6)%2 as 0|1:0;
 const tailAngle=moving?Math.sin(motionTime*5.2)*.32:0;
 const paws:ChronicleCatPaw[]=moving?[0,1,2].map(index=>({x:clamp(x-facing*(10+index*8),HOME_BOUND,CAGE_WATCH_X),y:index%2?2:-1,alpha:.62-index*.13})):[];
 return {mode,x,facing,gait,tailAngle,paws};
}

export function chronicleCatRenderPlan(groundY:number,_frame:Readonly<ChronicleCatFrame>):ChronicleCatRenderPlan {
 const footY=finite(groundY)+8;
 return {footY,groundDepth:chronicleActorDepth(footY,-6),catDepth:chronicleActorDepth(footY,-1),endpointDepth:chronicleActorDepth(footY)};
}
