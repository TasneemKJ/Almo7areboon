import type {Profile,UnitKind} from '../game/types.ts';
export interface CampTarget {x:number;y:number;width:number;height:number;footX:number;footY:number}
/** CSS-pixel anchors shared by painted actors and their native hit regions.
 * The camp keeps human-sized figures on a wide viewport instead of stretching
 * the former card deck across the scene. No gameplay state is mutated here. */
export function campLayout(width:number,height:number){
 const w=Number.isFinite(width)&&width>0?width:390,h=Number.isFinite(height)&&height>0?height:844;
 const span=Math.min(w,480),size=48;
 const target=(x:number,y:number):CampTarget=>{
  const left=Math.max(0,Math.min(w-size,x-size/2)),top=Math.max(0,Math.min(h-size,y-size));
  return {x:left,y:top,width:size,height:size,footX:left+size/2,footY:top+size};
 };
 if(w>h){const foot=h-28;return {recruits:[target(span*.16,foot),target(span*.39,foot),target(span*.62,foot)],standard:target(span*.79,foot),supplies:target(span*.94,foot)};}
 return {recruits:[target(span*.16,h*.86),target(span*.39,h*.92),target(span*.62,h*.86)],standard:target(span*.86,h*.79),supplies:target(span*.86,h*.96)};
}
export function campRecruits(profile:Readonly<Profile>):UnitKind[]{return ([0,1,2] as const).filter(kind=>profile.unlocked[kind]);}
