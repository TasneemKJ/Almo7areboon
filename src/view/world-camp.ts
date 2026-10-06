import type {Profile,UnitKind} from '../game/types.ts';
export interface CampTarget {x:number;y:number;width:number;height:number;footX:number;footY:number}
/** CSS-pixel anchors shared by painted actors and their native hit regions.
 * The camp keeps human-sized figures on a wide viewport instead of stretching
 * the former card deck across the scene. No gameplay state is mutated here. */
export function campLayout(width:number,height:number){
 const w=Number.isFinite(width)&&width>0?width:390,h=Number.isFinite(height)&&height>0?height:844;
 const span=Math.min(w,480),size=48;
 const target=(x:number,y:number,width=size,height=size,belowFoot=0):CampTarget=>{
  const left=Math.max(0,Math.min(w-width,x-width/2)),top=Math.max(0,Math.min(h-height,y-height+belowFoot));
  return {x:left,y:top,width,height,footX:left+width/2,footY:top+height-belowFoot};
 };
 // The widest authored idle frame is256×192. At48 CSS-pixel height it
 // spans64px and extends2.67px below its136/144 origin.
 const recruit=(x:number,y:number)=>target(x,y,64,52,4);
 if(w>h){const foot=h-28;return {recruits:[recruit(span*.16,foot),recruit(span*.39,foot),recruit(span*.62,foot)],standard:target(span*.79,foot),supplies:target(span*.94,foot)};}
 return {recruits:[recruit(span*.16,h*.86),recruit(span*.39,h*.92),recruit(span*.62,h*.86)],standard:target(span*.86,h*.79),supplies:target(span*.86,h*.96)};
}
export function campRecruits(profile:Readonly<Profile>):UnitKind[]{return ([0,1,2] as const).filter(kind=>profile.unlocked[kind]);}
/** Phaser's backing store is DPR-scaled; DOM targets and camp art are CSS-sized. */
export function campRenderProjection(renderWidth:number,renderHeight:number,pixelRatio:number){
 const ratio=Number.isFinite(pixelRatio)&&pixelRatio>0?pixelRatio:1;
 const width=renderWidth/ratio,height=renderHeight/ratio;
 return {plan:campLayout(width,height),cssScale:width/450};
}
