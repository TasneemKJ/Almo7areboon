import {projectilePoint} from './visual-theme.ts';
/** Trail samples the actual ballistic path; interpolating toward the tip cuts through its arc. */
export function projectileTrailPoint(from:{x:number;y:number},to:{x:number;y:number},progress:number,arc:number) {
 return projectilePoint(from,to,Math.max(0,progress-.22),arc);
}
