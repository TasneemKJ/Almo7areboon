import type {Side,UnitKind} from '../game/types.ts';

/**
 * Presentation-only camera grade. Earlier batches stayed deliberately low
 * energy; this layer supplies the value range they lacked: a per-chapter
 * colour matrix, a stage vignette that frames the lane, additive practical
 * light and team beacons. Nothing here reads combat rules or saves.
 */
export interface EraGrade {
  saturation:number;
  contrast:number;
  /** Per-channel highlight gain, near 1. */
  gain:readonly [number,number,number];
  /** Per-channel shadow lift in 0..255 space, small. */
  lift:readonly [number,number,number];
  vignette:{inner:number;outer:number;alpha:number;floor:number;color:number};
  /** Key light in world space: x across the 450-wide arena, y as an offset above groundY. */
  key:{x:number;rise:number;color:number;rays:number;alpha:number};
  stage:{color:number;alpha:number};
}
export interface GlowMark {x:number;y:number;rx:number;ry:number;color:number;alpha:number}
export interface RayMark {x1:number;y1:number;x2:number;y2:number;x3:number;y3:number;color:number;alpha:number}

const GRADES:readonly EraGrade[]=Object.freeze(([
  {saturation:1.32,contrast:1.2,gain:[1.05,1.02,.95],lift:[4,6,12],vignette:{inner:.34,outer:.86,alpha:.58,floor:.5,color:0x0d1a1f},key:{x:196,rise:34,color:0xffb866,rays:5,alpha:.04},stage:{color:0xffc987,alpha:.07}},
  {saturation:1.3,contrast:1.18,gain:[1.07,1.02,.93],lift:[5,5,12],vignette:{inner:.34,outer:.86,alpha:.55,floor:.5,color:0x151a1c},key:{x:214,rise:58,color:0xffbe70,rays:5,alpha:.04},stage:{color:0xffd08c,alpha:.07}},
  {saturation:1.26,contrast:1.18,gain:[1.04,1.02,.97],lift:[3,6,13],vignette:{inner:.36,outer:.88,alpha:.52,floor:.46,color:0x0e1a22},key:{x:236,rise:62,color:0xffcf8a,rays:4,alpha:.04},stage:{color:0xffd49a,alpha:.07}},
  {saturation:1.34,contrast:1.22,gain:[1.08,1,.94],lift:[6,4,12],vignette:{inner:.33,outer:.85,alpha:.6,floor:.52,color:0x160f1c},key:{x:226,rise:86,color:0xffae6c,rays:6,alpha:.04},stage:{color:0xffbf85,alpha:.07}},
  {saturation:1.22,contrast:1.2,gain:[1.03,1.02,.98],lift:[3,6,12],vignette:{inner:.35,outer:.87,alpha:.56,floor:.5,color:0x0c1719},key:{x:208,rise:106,color:0xffc98a,rays:4,alpha:.04},stage:{color:0xffd9a3,alpha:.07}},
  {saturation:1.3,contrast:1.24,gain:[.98,1.02,1.08],lift:[4,6,16],vignette:{inner:.32,outer:.84,alpha:.62,floor:.54,color:0x080c1e},key:{x:225,rise:70,color:0x9fe9ff,rays:5,alpha:.04},stage:{color:0xa9eaff,alpha:.07}},
] as EraGrade[]).map(grade=>Object.freeze(grade)));

const scene=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const clock=(time:number,reduced:boolean)=>reduced||!Number.isFinite(time)||time<0?0:Math.min(1e6,time);
export function eraGrade(age:number):EraGrade {return GRADES[scene(age)];}

/**
 * 5×4 row-major matrix in Phaser's ColorMatrix layout (offsets in 0..255):
 * saturation about Rec.709 luma, then contrast about mid-grey, then split tone.
 */
export function gradeMatrix(grade:EraGrade):number[] {
  const s=grade.saturation,c=grade.contrast,lr=.2126,lg=.7152,lb=.0722;
  const sat=[
    [lr*(1-s)+s,lg*(1-s),lb*(1-s)],
    [lr*(1-s),lg*(1-s)+s,lb*(1-s)],
    [lr*(1-s),lg*(1-s),lb*(1-s)+s],
  ];
  const out:number[]=[];
  for(let row=0;row<3;row++){
    const gain=grade.gain[row]*c;
    out.push(sat[row][0]*gain,sat[row][1]*gain,sat[row][2]*gain,0,(1-c)*127.5*grade.gain[row]+grade.lift[row]);
  }
  out.push(0,0,0,1,0);
  return out;
}

/** Applies the matrix to one 0..255 colour; tests use it to check the grade keeps highlights and blacks sane. */
export function applyGrade(matrix:readonly number[],rgb:readonly [number,number,number]):[number,number,number] {
  const [r,g,b]=rgb,clamp=(v:number)=>Math.max(0,Math.min(255,v));
  return [0,1,2].map(i=>clamp(matrix[i*5]*r+matrix[i*5+1]*g+matrix[i*5+2]*b+matrix[i*5+4])) as [number,number,number];
}

/** Radial stops for the stage vignette. The lane is the brightest band; edges and the empty foreground recede. */
export function vignetteStops(age:number):{center:{x:number;y:number};stops:readonly [number,number][];floor:number;color:number} {
  const v=eraGrade(age).vignette;
  return {center:{x:.5,y:.6},stops:[[0,0],[v.inner,0],[(v.inner+v.outer)/2,v.alpha*.42],[v.outer,v.alpha*.82],[1,v.alpha]],floor:v.floor,color:v.color};
}

/** God rays from the chapter key light, fanning down across the lane. Additive, low alpha, slow breathing. */
export function keyLightRays(age:number,groundY:number,time:number,reduced:boolean):readonly RayMark[] {
  const {key}=eraGrade(age),t=clock(time,reduced),rays:RayMark[]=[];
  const top=groundY-key.rise-120;
  for(let i=0;i<key.rays;i++){
    const spread=(i-(key.rays-1)/2)*38,sway=Math.sin(t*.09+i*1.9)*6,width=14+(i%3)*7;
    const breathe=1+Math.sin(t*.23+i*2.4)*.22,foot=key.x+spread*1.9+sway;
    rays.push({x1:key.x+spread*.08,y1:top,x2:foot-width,y2:groundY+26,x3:foot+width,y3:groundY+26,color:key.color,alpha:key.alpha*breathe*(1-Math.abs(spread)/260)});
  }
  return rays;
}

/** Warm stage pool along the lane plus a cool player beacon and an ember enemy beacon for instant side reading. */
export function stageGlow(age:number,groundY:number,time:number,reduced:boolean,playerHpRatio=1,enemyHpRatio=1):readonly GlowMark[] {
  const grade=eraGrade(age),t=clock(time,reduced),marks:GlowMark[]=[];
  const pulse=(phase:number)=>1+Math.sin(t*1.6+phase)*.12;
  marks.push({x:225,y:groundY+14,rx:210,ry:34,color:grade.stage.color,alpha:grade.stage.alpha});
  marks.push({x:grade.key.x,y:groundY+10,rx:120,ry:20,color:grade.key.color,alpha:grade.stage.alpha*.9});
  const beacon=(x:number,color:number,ratio:number,phase:number)=>{
    const danger=Number.isFinite(ratio)?Math.max(0,Math.min(1,ratio)):1,strength=(.16+(1-danger)*.1)*pulse(phase);
    marks.push({x,y:groundY-30,rx:58,ry:66,color,alpha:strength*.55});
    marks.push({x,y:groundY+12,rx:62,ry:15,color,alpha:strength});
  };
  beacon(39,0x4fc8ff,playerHpRatio,0);
  beacon(411,0xff7a45,enemyHpRatio,1.7);
  return marks;
}

/** Additive team halo at a troop's feet. Bigger for heavies, brighter on hit, iced when frozen. */
export function teamHalo(side:Side,kind:UnitKind,scale:number,hitFlash:number,frozen:boolean):GlowMark {
  const hit=Number.isFinite(hitFlash)?Math.max(0,Math.min(1,hitFlash)):0,size=kind===2?1.3:1;
  const s=Number.isFinite(scale)&&scale>0?scale:1;
  return {x:0,y:1,rx:22*size*s,ry:6*size*s,color:frozen?0x9ff6ff:side==='player'?0x46c6ff:0xff6d3a,alpha:Math.min(.6,.26+hit*1.4)};
}

/** Additive light for a projectile tip, keyed by its drawn shape. Stones stay unlit so bright shots remain rare and legible. */
export function projectileGlow(shape:string,side:Side):{radius:number;color:number;alpha:number;trail:number} {
  switch(shape){
    case 'meteor':return {radius:26,color:0xff8a3a,alpha:.55,trail:1};
    case 'energy':return {radius:14,color:side==='player'?0x6ff4ff:0xff5e9a,alpha:.55,trail:.8};
    case 'shell':case 'cannonball':return {radius:12,color:0xffa24a,alpha:.35,trail:.5};
    case 'bullet':return {radius:8,color:0xffd07a,alpha:.4,trail:.6};
    case 'arrow':return {radius:5,color:0xfff0c8,alpha:.14,trail:.3};
    default:return {radius:0,color:0xffffff,alpha:0,trail:0};
  }
}

/** Slow foreground mist in the empty strip below the lane; gives the lower frame depth without covering troops' feet. */
export function foregroundMist(age:number,groundY:number,height:number,time:number,reduced:boolean):readonly GlowMark[] {
  const t=clock(time,reduced),a=scene(age),color=a===5?0x9cc6e8:a===3?0xd6b3a8:0xc8d6c4;
  const top=groundY+34,depth=Math.max(0,(Number.isFinite(height)?height:groundY*1.5)-top);
  if(depth<12)return [];
  return [0,1,2,3].map(i=>({
    x:((i*151+t*(7+i*2.5))%640)-95,
    y:top+depth*(.2+i*.2)+Math.sin(t*.3+i)*2,
    rx:120+i*18,ry:9+i*3,color,alpha:.085+i*.012,
  }));
}
