export interface ChronicleRescueFrameInput {
  rescued: boolean;
  rescueProgress: number;
  travellerX: number;
  previousScoutX?: number;
  time: number;
  paused: boolean;
  reduced: boolean;
}

export interface RescueKnot {
  x: number;
  fill: number;
}

export interface RescueScout {
  x: number;
  frame: number;
}

export interface RescueFootprint {
  x: number;
  y: number;
  alpha: number;
}

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function chronicleRescueFrame(input:ChronicleRescueFrameInput) {
  const progress=clamp(finite(input.rescueProgress),0,4);
  const rescued=input.rescued===true;
  const scoutX=clamp(finite(input.travellerX,620),150,620)*.45;
  const previousScoutX=input.previousScoutX===undefined?undefined:finite(input.previousScoutX,scoutX);
  const time=Math.max(0,finite(input.time));
  const moving=previousScoutX===undefined||Math.abs(previousScoutX-scoutX)>.001;
  const motionSafe=Number.isFinite(input.time)&&input.time>=0&&input.time<=1_000_000&&Number.isFinite(input.travellerX)&&(input.previousScoutX===undefined||Number.isFinite(input.previousScoutX));
  const scout:RescueScout|null=rescued?{x:scoutX,frame:input.paused||input.reduced||!motionSafe||!moving?0:Math.floor(time*5)%4}:null;
  const footprints:RescueFootprint[]=rescued?[12,22,32].map((offset,index)=>({x:scoutX+offset,y:index%2?1:-1,alpha:[.78,.6,.44][index]!})).filter(mark=>mark.x<620*.45):[];
  return {
    cage:{x:620*.45,open:rescued,alpha:rescued?.45:1},
    scout,
    knots:rescued?[]:Array.from({length:4},(_,index)=>({x:258+index*14,fill:clamp(progress-index,0,1)} as RescueKnot)),
    footprints,
  };
}

export function chronicleRescueRenderPlan(age:number,groundY:number,frame:ReturnType<typeof chronicleRescueFrame>,textureExists:(key:string)=>boolean=()=>true) {
  const safeAge=Number.isInteger(age)&&age>=0&&age<6?age:0;
  const footY=finite(groundY)+8;
  const scoutTexture=unitTexture(safeAge,1,'player');
  return {
    cageTexture:`chronicle-cage${frame.cage.open?'-open':''}-ink-v1`,
    scoutTexture,
    scoutMode:textureExists(scoutTexture)?'painted' as const:'fallback' as const,
    cageDepth:chronicleActorDepth(footY),
    scoutDepth:chronicleActorDepth(footY,1),
    groundDepth:chronicleActorDepth(footY,-5),
  };
}
import {chronicleActorDepth} from './chronicle-presentation.ts';
import {unitTexture} from './visual-assets.ts';
