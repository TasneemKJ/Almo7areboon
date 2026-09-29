import {duskLightAnchors} from './dusk-atmosphere.ts';

export interface HierarchyLightMark {
  temperature:'warm'|'cool';
  x:number;
  y:number;
  rx:number;
  ry:number;
  color:number;
  alpha:number;
}
interface Placement {x:number;y:number;scale:number}
interface Painter {fillStyle(color:number,alpha:number):unknown;fillEllipse(x:number,y:number,width:number,height:number):unknown}

const coolFields=[
 [[242,338,92,22],[676,370,74,18]],
 [[288,350,88,21],[657,385,78,18]],
 [[205,337,95,23],[731,377,69,18]],
 [[278,329,88,20],[651,369,73,18]],
 [[250,317,82,20],[690,355,76,18]],
 [[229,325,90,21],[699,360,78,18]],
] as const;
const sceneIndex=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const timeValue=(time:number,reduced:boolean)=>reduced||!Number.isFinite(time)||time<0?0:Math.min(1e6,time);

/** Warm practical-light hierarchy near authored lamps plus weaker cool distance fields. */
export function lightingHierarchyFrame(input:number,time:number,reduced:boolean):readonly HierarchyLightMark[] {
  const age=sceneIndex(input),t=timeValue(time,reduced),marks:HierarchyLightMark[]=[];
  for(const [i,anchor] of duskLightAnchors(age).entries()){
    const pulse=1+Math.sin(t*.18+age+i*1.7)*.08;
    marks.push({temperature:'warm',x:anchor.x-5*anchor.scale,y:anchor.y-12*anchor.scale,rx:52*anchor.scale,ry:38*anchor.scale,color:0xf3c183,alpha:.074*pulse});
    marks.push({temperature:'warm',x:anchor.x+8*anchor.scale,y:anchor.y+14*anchor.scale,rx:72*anchor.scale,ry:15*anchor.scale,color:0xd8ae78,alpha:.045*pulse});
  }
  for(const [i,[x,y,rx,ry]] of coolFields[age].entries()){
    const drift=reduced?0:Math.sin(t*.035+i*2+age)*6;
    marks.push({temperature:'cool',x:x+drift,y,rx,ry,color:age===5?0x7599a8:0x728c98,alpha:.026+Math.sin(t*.04+i+age)*.004});
  }
  return marks;
}

export function projectHierarchyMark(mark:HierarchyLightMark,placement:Placement):HierarchyLightMark {
  return {...mark,x:placement.x+mark.x*placement.scale,y:placement.y+mark.y*placement.scale,rx:mark.rx*placement.scale,ry:mark.ry*placement.scale};
}

/** Three soft nested fields create local contrast without bloom/shader state. */
export function paintLightingHierarchy(graphics:Painter,marks:readonly HierarchyLightMark[],placement:Placement):void {
  for(const source of marks){
    const mark=projectHierarchyMark(source,placement);
    for(const [scale,opacity] of [[1,.24],[.7,.34],[.42,.42]] as const){
      graphics.fillStyle(mark.color,mark.alpha*opacity);
      graphics.fillEllipse(mark.x,mark.y,mark.rx*2*scale,mark.ry*2*scale);
    }
  }
}
