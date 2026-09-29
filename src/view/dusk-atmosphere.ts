/** Source-space atmosphere. No combat state, randomness, timers or owned game objects. */
export interface DuskMark {
 kind:'mist'|'glow'|'ripple';
 x:number;y:number;rx:number;ry:number;color:number;alpha:number;
}
interface LightAnchor {readonly x:number;readonly y:number;readonly scale:number;}
interface Placement {x:number;y:number;scale:number;}
interface DuskPainter {
 fillStyle(color:number,alpha:number):unknown;
 lineStyle(width:number,color:number,alpha:number):unknown;
 fillEllipse(x:number,y:number,width:number,height:number):unknown;
 strokeEllipse(x:number,y:number,width:number,height:number):unknown;
}
const lights:readonly (readonly LightAnchor[])[]=Object.freeze([
 [{x:425,y:540,scale:.85}],
 [{x:433,y:486,scale:.55}],
 [{x:387,y:475,scale:.5},{x:604,y:510,scale:.65}],
 [{x:404,y:426,scale:.7},{x:533,y:426,scale:.7}],
 [{x:390,y:376,scale:.65}],
 [{x:279,y:494,scale:.65},{x:594,y:494,scale:.65}],
].map(row=>Object.freeze(row.map(light=>Object.freeze(light)))));
const mistBands=[[[200,478],[710,540]],[[290,482],[640,555]],[[142,455],[757,522]],[[245,462],[660,557]],[[290,418],[650,530]],[[220,455],[735,551]]] as const;
const water:readonly (readonly [number,number,number]|null)[]=[[427,556,50],[631,549,54],[163,543,58],[450,549,29],null,[441,549,32]];
const sceneIndex=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
export function duskLightAnchors(age:number):readonly LightAnchor[] {return lights[sceneIndex(age)];}

export function duskAtmosphereFrame(age:number,time:number,reduced:boolean):DuskMark[] {
 const scene=sceneIndex(age),t=reduced?0:Number.isFinite(time)?Math.max(0,Math.min(1e7,time)):0;
 const marks:DuskMark[]=mistBands[scene].map(([x,y],i)=>({
  kind:'mist',x:x+Math.sin(t*.055+scene+i*2)*31,y:y+Math.sin(t*.041+i)*3,
  rx:155+i*14,ry:13+i*4,color:scene===5?0xa0c5c8:0xa8bdae,alpha:.072+Math.sin(t*.07+scene+i)*.012,
 }));
 lights[scene].forEach((light,i)=>{
  const strength=.135+Math.sin(t*.43+i*2+scene)*.019+Math.sin(t*1.1+i)*.005;
  marks.push({kind:'glow',x:light.x,y:light.y,rx:34*light.scale,ry:41*light.scale,color:0xffd294,alpha:strength});
  marks.push({kind:'glow',x:light.x+4,y:light.y+26*light.scale,rx:39*light.scale,ry:8*light.scale,color:0xe4c197,alpha:strength*.65});
 });
 const pool=water[scene];
 if(pool)for(let i=0;i<3;i++){
  const phase=t*.5+i*1.7;
  marks.push({kind:'ripple',x:pool[0]+Math.sin(phase*.5)*4,y:pool[1]+i*3,rx:pool[2]*(.65+i*.12)+Math.sin(phase)*2,ry:1.1+i*.35,color:scene===5?0xc6f4db:0xc9d6b4,alpha:.11+Math.sin(phase)*.022});
 }
 return marks;
}
/** Identical crop transform to the authored world: lighting never slides off the lamps. */
export function projectDuskMark(mark:DuskMark,placement:Placement):DuskMark {
 return {...mark,x:placement.x+mark.x*placement.scale,y:placement.y+mark.y*placement.scale,rx:mark.rx*placement.scale,ry:mark.ry*placement.scale};
}
/** Reuses the existing atmosphere Graphics, without shaders, textures or per-frame scene objects. */
export function paintDuskAtmosphere(graphics:DuskPainter,marks:readonly DuskMark[],placement:Placement):void {
 for(const source of marks){
  const mark=projectDuskMark(source,placement);
  if(mark.kind==='ripple'){
   graphics.lineStyle(Math.max(.5,placement.scale*.9),mark.color,mark.alpha);
   graphics.strokeEllipse(mark.x,mark.y,mark.rx*2,mark.ry*2);
  }else{
   for(const [size,opacity] of [[1,.3],[.73,.38],[.45,.44]] as const){
    graphics.fillStyle(mark.color,mark.alpha*opacity);
    graphics.fillEllipse(mark.x,mark.y,mark.rx*2*size,mark.ry*2*size);
   }
  }
 }
}
