/** Source-space atmosphere. No combat state, randomness, timers or owned game objects. */
export interface DuskMark {
 kind:'mist'|'glow'|'ripple'|'depth';
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
const depthPalette:readonly (readonly [number,number])[]=[
 [0x7f9a8f,0x3e5148],[0x8d8296,0x493f57],[0x6d91a1,0x314d58],
 [0x8f856d,0x4d4537],[0x879579,0x3f5040],[0x73959a,0x354d53],
];
const sceneIndex=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
export function duskLightAnchors(age:number):readonly LightAnchor[] {return lights[sceneIndex(age)];}

export function duskAtmosphereFrame(age:number,time:number,reduced:boolean):DuskMark[] {
 const scene=sceneIndex(age),t=reduced?0:Number.isFinite(time)?Math.max(0,Math.min(1e7,time)):0;
 const marks:DuskMark[]=mistBands[scene].map(([x,y],i)=>({
  kind:'mist',x:x+Math.sin(t*.055+scene+i*2)*31,y:y+Math.sin(t*.041+i)*3,
  rx:155+i*14,ry:13+i*4,color:scene===5?0xa0c5c8:0xa8bdae,alpha:.072+Math.sin(t*.07+scene+i)*.012,
 }));
 // Two chapter-tinted depth planes make the authored settlement recede before
 // the army is drawn. They stay above the battle road and move more slowly than mist.
 const drift=reduced?0:Math.sin(t*.025+scene)*12,[farColor,nearColor]=depthPalette[scene];
 marks.push({kind:'depth',x:450+drift,y:388+scene%2*10,rx:178,ry:27,color:farColor,alpha:.052});
 marks.push({kind:'depth',x:450-drift*.35,y:528-scene%3*4,rx:166,ry:17,color:nearColor,alpha:.068});
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
   const layers=mark.kind==='depth'?[[1,.34],[.62,.42]] as const:[[1,.3],[.73,.38],[.45,.44]] as const;
   for(const [size,opacity] of layers){
    graphics.fillStyle(mark.color,mark.alpha*opacity);
    graphics.fillEllipse(mark.x,mark.y,mark.rx*2*size,mark.ry*2*size);
   }
  }
 }
}

/** The eight reviewable batches of the forty-pass refinement (docs/visual-40), five passes each. */
export const DUSK_REFINEMENT_GROUPS=Object.freeze(['depth','light','materials','air','motion','grounding','mobile','signature'] as const);
export type DuskRefinementGroup=typeof DUSK_REFINEMENT_GROUPS[number];
export type DuskRefinement=Readonly<Record<DuskRefinementGroup,readonly number[]>>;
const refinementBase:Readonly<Record<DuskRefinementGroup,readonly number[]>>=Object.freeze({
 depth:[.052,.068,.4,.6,.35],light:[.135,.09,.5,.3,.2],materials:[.25,.2,.15,.3,.1],
 air:[.07,.06,.04,.05,.03],motion:[.025,.055,.5,.0,.1],grounding:[.3,.25,.2,.15,.1],
 mobile:[.5,.4,.3,.2,.1],signature:[.6,.5,.4,.3,.2],
});
/**
 * Bounded strengths (each 0..1) for the forty passes of the refinement, derived only from chapter, time and
 * motion preference. Pure data: it paints nothing and adds no objects. Under reduced motion the `motion` group
 * is constant, so decorative drift stays frozen. Invalid input collapses to chapter 0 and time 0.
 */
export function duskRefinement40(age:number,time:number,reduced:boolean):DuskRefinement {
 const scene=sceneIndex(age),t=reduced?0:Number.isFinite(time)?Math.max(0,Math.min(1e7,time)):0;
 const out={} as Record<DuskRefinementGroup,number[]>;
 DUSK_REFINEMENT_GROUPS.forEach((group,g)=>{
  out[group]=refinementBase[group].map((base,i)=>{
   const chapter=1+(scene-2.5)*.02*(g%3-1);
   const breathe=group==='motion'?0:reduced?0:Math.sin(t*.03+g+i)*.01;
   return Math.max(0,Math.min(1,base*chapter+breathe));
  });
 });
 // Reduced motion keeps the motion group at its resting values, whatever the clock says.
 if(reduced)out.motion=refinementBase.motion.slice();
 else out.motion=refinementBase.motion.map((base,i)=>Math.max(0,Math.min(1,base+Math.sin(t*.02+i)*.01)));
 return out;
}
