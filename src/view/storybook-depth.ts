import type {Bounds,Point,VillageViewport} from './village-life.ts';

export interface StorybookDepthTriangle {
 readonly region:string;
 readonly kind:'depth'|'reflection';
 readonly points:readonly [Readonly<Point>,Readonly<Point>,Readonly<Point>];
 readonly alpha:number;
 readonly lamp:number;
}
type Polygon=readonly Point[];
interface Region {id:string;kind:StorybookDepthTriangle['kind'];outline:Polygon;center:Point;lamp:number}
const EMPTY:readonly StorybookDepthTriangle[]=Object.freeze([]);
const LIMIT=120;
// Traced against the 900×1000 village.webp, sha256 32506130…8d5b.
// These sit within the two hill faces and beneath the practicals at (202,487)
// and (786,525). They are not anchors from the legacy vector landscape.
const regions:readonly Region[]=[
 {id:'far-ridge',kind:'depth',outline:[{x:463,y:282},{x:497,y:279},{x:558,y:298},{x:629,y:318},{x:584,y:336},{x:502,y:318}],center:{x:535,y:309},lamp:-1},
 {id:'valley-fold',kind:'depth',outline:[{x:640,y:339},{x:674,y:329},{x:714,y:330},{x:754,y:321},{x:719,y:361},{x:677,y:374}],center:{x:695,y:350},lamp:-1},
 {id:'hearth-masonry',kind:'reflection',outline:[{x:205,y:497},{x:223,y:499},{x:231,y:514},{x:226,y:533},{x:210,y:528},{x:203,y:510}],center:{x:219,y:513},lamp:0},
 {id:'gate-masonry',kind:'reflection',outline:[{x:780,y:535},{x:793,y:533},{x:803,y:546},{x:797,y:567},{x:778,y:563},{x:775,y:546}],center:{x:788,y:550},lamp:1},
];
// Source ink, cypress silhouettes, distant homes, roof ridges and doorways.
const protectedInk:readonly Bounds[]=[
 [333,246,364,376],[432,284,448,320],[450,301,461,332],[678,267,696,316],
 [798,319,824,408],[840,226,875,400],[584,338,608,356],[753,241,811,299],
 [590,366,622,376],[645,382,667,391],[715,391,735,400],[453,350,486,383],
 [720,356,786,390],[229,350,245,376],[730,466,748,489],[233,489,279,558],[722,515,768,579],
];
function bounds(value:unknown):value is Bounds {
 return Array.isArray(value)&&value.length===4&&value.every(Number.isFinite)&&value[0]<value[2]&&value[1]<value[3];
}
function half(polygon:Polygon,axis:'x'|'y',value:number,sign:number):Point[] {
 const result:Point[]=[];
 if(!polygon.length)return result;
 let a=polygon[polygon.length-1],aa=(a[axis]-value)*sign;
 for(const b of polygon){
  const bb=(b[axis]-value)*sign;
  if((aa>=0)!==(bb>=0)){const t=aa/(aa-bb);result.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
  if(bb>=0)result.push(b);
  a=b;aa=bb;
 }
 return result;
}
function clip(polygon:Polygon,[l,t,r,b]:Bounds):Point[] {
 return half(half(half(half(polygon,'x',l,1),'x',r,-1),'y',t,1),'y',b,-1);
}
function subtract(polygon:Polygon,[l,t,r,b]:Bounds):Polygon[] {
 // Disjoint strips partition the outside of the rectangle, including cuts
 // crossing the canvas edge. Never drop an out-of-crop HUD rectangle.
 if(!polygon.some(p=>p.x>l)||!polygon.some(p=>p.x<r)||!polygon.some(p=>p.y>t)||!polygon.some(p=>p.y<b))return [polygon];
 const middle=half(half(polygon,'y',t,1),'y',b,-1);
 return [half(polygon,'y',t,-1),half(polygon,'y',b,1),half(middle,'x',l,-1),half(middle,'x',r,1)].filter(p=>p.length>=3);
}
const area2=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);

/** Call only on the existing chapter/layout/HUD cache boundary. No frame work. */
export function cacheStorybookDepth(age:number,viewport:VillageViewport):readonly StorybookDepthTriangle[] {
 if(age!==0||!viewport)return EMPTY;
 const {placement:p,cssWorldScale,visibleSource:crop,hudSourceBounds:hud}=viewport;
 if(!p||![p.x,p.y,p.scale,cssWorldScale].every(Number.isFinite)||Math.abs(p.x)>2048||Math.abs(p.y)>2048||p.scale<=0||p.scale>4||cssWorldScale<=0||cssWorldScale>4||!bounds(crop)||crop[0]<0||crop[1]<0||crop[2]>900||crop[3]>1000||!Array.isArray(hud)||hud.length>64)return EMPTY;
 for(const rect of hud)if(!bounds(rect))return EMPTY;
 const padding=2/(p.scale*cssWorldScale),cuts:Bounds[]=[...protectedInk,...hud.map(([l,t,r,b]):Bounds=>[l-padding,t-padding,r+padding,b+padding])];
 const triangles:StorybookDepthTriangle[]=[];
 const project=(point:Point)=>Object.freeze({x:p.x+point.x*p.scale,y:p.y+point.y*p.scale});
 const add=(points:Polygon,region:Region,alpha:number):boolean=>{
  let pieces:Polygon[]=[clip(points,crop)];
  for(const cut of cuts){pieces=pieces.flatMap(piece=>subtract(piece,cut));if(pieces.length>LIMIT)return false;}
  for(const polygon of pieces)for(let i=1;i<polygon.length-1;i++){
   if(Math.abs(area2(polygon[0],polygon[i],polygon[i+1]))<1e-7)continue;
   if(triangles.length>=LIMIT)return false;
   triangles.push(Object.freeze({region:region.id,kind:region.kind,points:Object.freeze([project(polygon[0]),project(polygon[i]),project(polygon[i+1])]) as StorybookDepthTriangle['points'],alpha,lamp:region.lamp}));
  }
  return true;
 };
 for(const region of regions){
  const {outline,center}=region,inner=outline.map(point=>({x:center.x+(point.x-center.x)*.57,y:center.y+(point.y-center.y)*.57}));
  // Adjacent triangles never overlap: a low-opacity feather ring surrounds
  // a stronger interior, keeping paper texture and authored strokes visible.
  for(let i=0;i<outline.length;i++){
   const j=(i+1)%outline.length;
   if(!add([outline[i],outline[j],inner[j]],region,.055)||!add([outline[i],inner[j],inner[i]],region,.055)||!add([center,inner[i],inner[j]],region,region.kind==='depth'?.14:.18))return EMPTY;
  }
 }
 return Object.freeze(triangles);
}

interface DepthGraphics {fillStyle(color:number,alpha:number):unknown;fillTriangle(x1:number,y1:number,x2:number,y2:number,x3:number,y3:number):unknown}
/** Geometry is immutable and reused. Only the existing village clock/light mix changes. */
export function paintStorybookDepth(graphics:DepthGraphics,mesh:readonly StorybookDepthTriangle[],time:number,reduced:boolean,lampAlphas:readonly number[]):void {
 const t=reduced||!Number.isFinite(time)?0:Math.max(0,Math.min(1_000_000,time)),breath=reduced?1:1+.08*Math.sin(t*Math.PI/19);
 for(let i=0;i<mesh.length&&i<LIMIT;i++){
  const mark=mesh[i],a=mark.points[0],b=mark.points[1],c=mark.points[2],lamp=lampAlphas[mark.lamp];
  const intensity=mark.kind==='depth'?breath:Number.isFinite(lamp)?Math.max(0,Math.min(1.35,lamp/.14)):1;
  const alpha=Math.min(.25,mark.alpha*intensity);
  if(alpha<=0)continue;
  graphics.fillStyle(mark.kind==='depth'?0x92b9c6:0xffd28a,alpha);graphics.fillTriangle(a.x,a.y,b.x,b.y,c.x,c.y);
 }
}
