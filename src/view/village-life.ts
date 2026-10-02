import type {VillageMoodSnapshot} from './village-mood.ts';
import type {VillageVerdictFrame} from './village-verdict.ts';

export type Bounds=readonly [number,number,number,number];
export interface Point {x:number;y:number}
export interface PaintedPolygon {points:readonly Point[];color:number;alpha:number}
export interface VillageHalo {center:Point;rx:number;ry:number;color:number;alpha:number}
export interface VillageStroke {from:Point;to:Point;width:number;color:number;alpha:number}
export interface VillageViewport {placement:{x:number;y:number;scale:number};cssWorldScale:number;visibleSource:Bounds;hudSourceBounds:readonly Bounds[];skyPath?:Bounds|null}
export interface VillageFrameInput {age:number;time:number;reduced:boolean;restoration?:number;mood:Readonly<VillageMoodSnapshot>;viewport:VillageViewport;verdict?:Readonly<VillageVerdictFrame>|null}
export interface VillageFrame {residents:readonly {apertureId:string;panes:readonly PaintedPolygon[]}[];lamps:readonly VillageHalo[];restorationLights:readonly VillageHalo[];verdictStrokes:readonly VillageStroke[];water:readonly VillageStroke[];bird:readonly PaintedPolygon[]|null}
interface Aperture {id:string;bounds:Bounds;framing:readonly Bounds[];panes:readonly (readonly Point[])[];dark:boolean}
type Lamp=readonly [number,number,number,number];
interface Plate {path:string;sha256:string;width:900;height:1000;windows:readonly Aperture[];lamps:readonly Lamp[];sky:Bounds}
const rectangle=([l,t,r,b]:Bounds):Point[]=>[{x:l,y:t},{x:r,y:t},{x:r,y:b},{x:l,y:b}];

/** Sutherland–Hodgman clipping against a convex pane, with zero coverage on masonry. */
function clip(subject:readonly Point[],pane:readonly Point[]):Point[] {
 let output=subject.slice();
 for(let i=0;i<pane.length&&output.length;i++){
  const a=pane[i],b=pane[(i+1)%pane.length],input=output;output=[];
  const cross=(p:Point)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  let previous=input[input.length-1],previousSide=cross(previous);
  for(const current of input){
   const side=cross(current);
   if((side>=0)!==(previousSide>=0)){
    const fraction=previousSide/(previousSide-side);
    output.push({x:previous.x+(current.x-previous.x)*fraction,y:previous.y+(current.y-previous.y)*fraction});
   }
   if(side>=0)output.push(current);
   previous=current;previousSide=side;
  }
 }
 return output;
}
function subtract(region:Bounds,cut:Bounds):Bounds[] {
 const [l,t,r,b]=region,[cl,ct,cr,cb]=cut,x1=Math.max(l,cl),y1=Math.max(t,ct),x2=Math.min(r,cr),y2=Math.min(b,cb);
 if(x1>=x2||y1>=y2)return [region];
 const pieces:Bounds[]=[];
 if(t<y1)pieces.push([l,t,r,y1]);if(y2<b)pieces.push([l,y2,r,b]);
 if(l<x1)pieces.push([l,y1,x1,y2]);if(x2<r)pieces.push([x2,y1,r,y2]);
 return pieces;
}
function aperture(id:string,bounds:Bounds,framing:readonly Bounds[]=[],rectangular=false,dark=false):Aperture {
 const [l,t,r,b]=bounds,w=r-l,h=b-t;
 const arch=rectangular?rectangle(bounds):[{x:l,y:t+.35*h},{x:l+.35*w,y:t+.10*h},{x:l+.65*w,y:t+.10*h},{x:r,y:t+.35*h},{x:r,y:b},{x:l,y:b}];
 let regions:Bounds[]=[bounds];
 for(const frame of framing)regions=regions.flatMap(region=>subtract(region,frame));
 const panes=regions.map(region=>clip(arch,rectangle(region))).filter(pane=>pane.length>=3);
 return {id,bounds,framing,panes,dark};
}
const plates:Plate[]=[
 {path:'public/art/storybook/village.webp',sha256:'325061301c965463fa5b2221f82ed5a52001e1b2ecea1bf9e6fcfcc8a1f98d5b',width:900,height:1000,
 windows:[aperture('left-hearth',[227,349,247,377],[[234,349,238,377],[227,359,247,363]]),aperture('right-hearth',[729,465,748,489],[[737,465,740,489],[729,475,748,478]])],lamps:[[202,487,10,14],[786,525,8,11]],sky:[240,106,660,180]},
 {path:'public/art/storybook/olive/village.webp',sha256:'f131d361d334fea2302a50941f9f1e16310b7471ed4f764bcae81ea2c964f54a',width:900,height:1000,
 windows:[aperture('lower-farmhouse',[109,283,122,300],[[114,283,117,300],[109,290,122,293]]),aperture('press-house',[177,298,187,313],[[180,298,183,313],[177,303,187,306]])],lamps:[[217,309,5,8],[313,342,5,8]],sky:[235,102,655,190]},
 {path:'public/art/storybook/harbor/village.webp',sha256:'2faa105a4f91d46809bb084678118592b9149d97b2d10bf385b037c156043b88',width:900,height:1000,
 windows:[aperture('left-quay-room',[86,286,107,325],[[94,286,98,325],[86,303,107,308]]),aperture('center-quay-room',[193,319,207,348],[[198,319,202,348],[193,331,207,335]])],lamps:[[46,409,11,15],[322,393,9,13],[759,427,6,9]],sky:[250,90,660,190]},
 {path:'public/art/storybook/lantern/village.webp',sha256:'ffcb2b4dd41edaf8813acb26751bb6e5df3d934eb984231cf7544f9eb8d6bac8',width:900,height:1000,
 windows:[aperture('left-balcony',[221,282,236,310]),aperture('open-shutters',[695,354,713,391],[[702,354,706,391],[695,369,713,375]])],lamps:[[104,454,12,17],[287,484,10,14],[599,489,10,14],[795,492,13,18]],sky:[290,80,660,184]},
 {path:'public/art/storybook/hillside/village.webp',sha256:'e1e523aa400e2a9b36a2c5f3160c56b64d5ad99a5199c8be10998aad92ba8679',width:900,height:1000,
 windows:[aperture('upper-warm-room',[434,287,451,307],[[440,287,444,307],[434,297,451,300]],true),aperture('right-dark-balcony',[807,333,824,359],[[815,333,819,359],[807,345,824,349]],false,true)],lamps:[[252,461,9,13],[766,498,7,10],[574,452,5,8]],sky:[300,72,675,142]},
 {path:'public/art/storybook/courtyards/village.webp',sha256:'487b0d66f9b0171e2c59c46f0cbf84955542411af0a71af06fe6d396fda8925c',width:900,height:1000,
 windows:[aperture('left-balcony',[186,271,198,292]),aperture('right-balcony',[782,324,800,349],[[789,324,793,349],[782,335,800,339]])],lamps:[[44,372,9,13],[276,434,9,13],[634,448,10,15],[871,365,9,14]],sky:[330,52,662,133]},
];
function freeze<T>(value:T):T {if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export const VILLAGE_PLATES:readonly Plate[]=freeze(plates);
export const VILLAGE_LIGHT={key:'village-light',size:64,decodedBytes:16_384} as const;
interface LightTextures {exists(key:string):boolean;createCanvas(key:string,width:number,height:number):{getContext():CanvasRenderingContext2D;refresh():unknown}|null}
/** One texture-manager resource, shared across chapters and scene replacements. */
export function ensureVillageLight(textures:LightTextures):string {
 const {key,size}=VILLAGE_LIGHT;
 if(!textures.exists(key)){
  const texture=textures.createCanvas(key,size,size),ctx=texture?.getContext();
  if(texture&&ctx){const radial=ctx.createRadialGradient(32,32,0,32,32,32);radial.addColorStop(0,'rgba(255,255,255,1)');radial.addColorStop(.45,'rgba(255,255,255,.55)');radial.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=radial;ctx.fillRect(0,0,size,size);texture.refresh();}
 }
 return key;
}
const INK=0x17252a;

// A single rounded outline, triangulated once. Joined head/neck/shoulders, no face or eye dots.
const residentOutline:Point[]=[];
for(let i=0;i<=12;i++){const angle=(140+i*260/12)*Math.PI/180;residentOutline.push({x:.5+.19*Math.cos(angle),y:.29+.19*Math.sin(angle)});}
residentOutline.push({x:.65,y:.46},{x:.82,y:.51},{x:.91,y:.64},{x:.88,y:.83},{x:.12,y:.83},{x:.09,y:.64},{x:.18,y:.51},{x:.35,y:.46});
function tessellate(outline:readonly Point[]):readonly (readonly Point[])[] {
 const remaining=outline.slice(),triangles:Point[][]=[];
 const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 while(remaining.length>3){
  let ear=false;
  for(let i=0;i<remaining.length;i++){
   const a=remaining[(i+remaining.length-1)%remaining.length],b=remaining[i],c=remaining[(i+1)%remaining.length];
   if(cross(a,b,c)<=0)continue;
   if(remaining.some(p=>p!==a&&p!==b&&p!==c&&cross(a,b,p)>=0&&cross(b,c,p)>=0&&cross(c,a,p)>=0))continue;
   triangles.push([a,b,c]);remaining.splice(i,1);ear=true;break;
  }
  if(!ear)throw new Error('Invalid village silhouette');
 }
 triangles.push(remaining);return freeze(triangles);
}
const RESIDENT=tessellate(residentOutline);
const BIRDS=freeze([
 [{x:-21,y:-6},{x:-12,y:-9},{x:-3,y:-1},{x:0,y:0},{x:5,y:-2},{x:15,y:-8},{x:21,y:-5},{x:11,y:-3},{x:3,y:3},{x:-2,y:2},{x:-11,y:-2}],
 [{x:-21,y:2},{x:-13,y:-2},{x:-3,y:-1},{x:0,y:0},{x:5,y:-2},{x:15,y:-3},{x:21,y:1},{x:12,y:1},{x:3,y:3},{x:-2,y:2},{x:-11,y:1}],
 [{x:-21,y:7},{x:-13,y:3},{x:-3,y:-1},{x:0,y:0},{x:5,y:-2},{x:15,y:2},{x:21,y:6},{x:12,y:5},{x:3,y:3},{x:-2,y:2},{x:-11,y:5}],
].map(points=>tessellate(points)));

/** Cache this on layout/resize; complete bird extents use the same crop as the painting. */
export function villageSkyPath(age:number,viewport:VillageViewport):Bounds|null {
 const plate=VILLAGE_PLATES[Number.isInteger(age)&&age>=0&&age<6?age:0],s=viewport.placement.scale*viewport.cssWorldScale;
 if(!(s>0)||42*s<8)return null;
 const sky=plate.sky,crop=viewport.visibleSource;
 const region:Bounds=[Math.max(sky[0],crop[0]),Math.max(sky[1],crop[1]),Math.min(sky[2],crop[2]),Math.min(sky[3],crop[3])];
 if(region[0]>=region[2]||region[1]>=region[3])return null;
 let free:Bounds[]=[region];
 const padding=4/s;
 for(const hud of viewport.hudSourceBounds.slice(0,32))free=free.flatMap(part=>subtract(part,[hud[0]-padding,hud[1]-padding,hud[2]+padding,hud[3]+padding]));
 return free.filter(part=>part[2]-part[0]>=142&&part[3]-part[1]>=20).sort((a,b)=>(b[2]-b[0])-(a[2]-a[0]))[0]??null;
}

/** Bounded geometry in world coordinates, registered exclusively from measured source anchors. */
export function villageFrame(input:VillageFrameInput):VillageFrame {
 const age=Number.isInteger(input.age)&&input.age>=0&&input.age<6?input.age:0,plate=VILLAGE_PLATES[age];
 const restoration=Number.isInteger(input.restoration)&&input.restoration!>=0&&input.restoration!<=7?input.restoration!:0;
 const time=input.reduced?0:Number.isFinite(input.time)?Math.max(0,input.time):0;
 const sharedMix=Number.isFinite(input.mood.alarmMix)?Math.max(0,Math.min(1,input.mood.alarmMix)):0;
 const verdict=input.verdict&&(input.verdict.mode==='celebrate'||input.verdict.mode==='shelter')&&Number.isFinite(input.verdict.progress)?{mode:input.verdict.mode,progress:Math.max(0,Math.min(1,input.verdict.progress))}:null;
 // Reduced motion uses discrete visual states; the shared long ramp remains intact for audio.
 const mix=input.reduced?(input.mood.mood==='alarmed'?1:0):sharedMix;
 const {placement}=input.viewport;
 const project=(p:Point):Point=>({x:placement.x+p.x*placement.scale,y:placement.y+p.y*placement.scale});
 const paint=(points:readonly Point[],alpha:number):PaintedPolygon=>({points:points.map(project),color:INK,alpha});
 const residents:VillageFrame['residents'][number][]=[];
 const interval=12+age*.8,visit=Math.floor(time/interval),phase=time%interval,duration=6+(age%3)*.5;
 const occupied=input.reduced||phase<duration;
 const courtyard=(restoration&2)!==0;
 const returning=input.mood.mood==='quiet'||input.mood.mood==='recovering'&&sharedMix<=.375;
 for(let index=0;index<plate.windows.length;index++){
  const room=plate.windows[index],panes:PaintedPolygon[]=[];
  // Darkening shares the exact panes; the baked framing and hanging shadow remain intact.
  if(verdict?.mode!=='shelter'&&mix>0)for(const pane of room.panes)panes.push(paint(pane,.10*mix));
  if(verdict?.mode==='celebrate'&&verdict.progress>0){
   const [l,t,r,b]=room.bounds,w=r-l,h=b-t,alpha=(room.dark?.28:.40)*verdict.progress;
   for(const triangle of RESIDENT){
    const shape=triangle.map(p=>({x:l+p.x*w,y:t+p.y*h}));
    for(const pane of room.panes){const clipped=clip(shape,pane);if(clipped.length>=3)panes.push(paint(clipped,alpha));}
   }
  }else if(!verdict&&returning&&(courtyard||occupied&&index===(input.reduced?0:visit%2))){
   const [l,t,r,b]=room.bounds,w=r-l,h=b-t,small=w*placement.scale*input.viewport.cssWorldScale<6||h*placement.scale*input.viewport.cssWorldScale<8;
   const envelope=input.reduced||courtyard?1:Math.min(1,phase/.7,(duration-phase)/.7);
   const warmth=!input.reduced&&input.mood.mood==='recovering'?1-sharedMix/.375:1;
   const alpha=(room.dark?.28:.40)*Math.max(0,envelope)*warmth;
   const travel=small||input.reduced?0:.14*w*Math.sin(phase/duration*Math.PI*2);
   const rise=small||input.reduced||courtyard?0:(1-Math.max(0,envelope))*.20*h;
   if(alpha>0)for(const triangle of RESIDENT){
    const shape=triangle.map(p=>({x:l+p.x*w+travel,y:t+p.y*h+rise}));
    for(const pane of room.panes){const clipped=clip(shape,pane);if(clipped.length>=3)panes.push(paint(clipped,alpha));}
   }
  }
  if(panes.length)residents.push({apertureId:room.id,panes});
 }
 const verdictStrokes:VillageStroke[]=[];
 if(verdict?.mode==='celebrate')for(const room of plate.windows){
  const [l,t,r]=room.bounds,w=r-l;
  for(let index=0;index<3;index++){
   const x=l+(index+1)*w/4;
   verdictStrokes.push({from:project({x,y:t+2}),to:project({x:x+(index-1)*4,y:t-6}),width:Math.max(.75,1.1*placement.scale),color:0xf2cf79,alpha:.62*verdict.progress});
  }
 }else if(verdict?.mode==='shelter')for(const room of plate.windows){
  const [l,t,r,b]=room.bounds,inset=Math.min(2,(r-l)/5,(b-t)/5);
  verdictStrokes.push({from:project({x:l+inset,y:t+inset}),to:project({x:r-inset,y:b-inset}),width:Math.max(.9,1.4*placement.scale),color:INK,alpha:.58*verdict.progress});
  verdictStrokes.push({from:project({x:r-inset,y:t+inset}),to:project({x:l+inset,y:b-inset}),width:Math.max(.9,1.4*placement.scale),color:INK,alpha:.58*verdict.progress});
 }
 const lightFactor=verdict?.mode==='celebrate'?1+.35*verdict.progress:verdict?.mode==='shelter'?1-.75*verdict.progress:1;
 const lamps=plate.lamps.map(([x,y,rx,ry],index)=>({center:project({x,y}),rx:rx*placement.scale,ry:ry*placement.scale,color:age===5&&index>=2?0x8edfc9:0xffd08a,
 alpha:Math.min(1,(.12+index*.008+(input.reduced?0:.018*Math.sin(time*2*Math.PI/(3.7+index*.9)+age+index*2)))*(1-.55*mix)*lightFactor)}));
 const restorationLights:VillageHalo[]=[];
 const restoredLight=(index:number,color:number,alpha:number)=>{
  const [l,t,r,b]=plate.windows[index].bounds;
  restorationLights.push({center:project({x:(l+r)/2,y:(t+b)/2}),rx:Math.max(16,(r-l)*.95)*placement.scale,ry:Math.max(18,(b-t)*.9)*placement.scale,color,alpha:Math.min(1,alpha*(1-.65*mix)*lightFactor)});
 };
 if((restoration&1)!==0)restoredLight(0,0xffb36d,.18);
 if((restoration&4)!==0)restoredLight(1,0xf2cf79,.14+(input.reduced?0:.025*Math.sin(time*1.7+age*.8)));
 const water:VillageStroke[]=age===2?[0,1,2].map(index=>{
  const x=495+index*29,y=482+index*15+(input.reduced?0:2*Math.sin(time*.7+index*2));
  return {from:project({x,y}),to:project({x:x+14+index*3,y}),width:.9*placement.scale,color:0xffd08a,alpha:.10+index*.015};
 }):[];
 let bird:VillageFrame['bird']=null;
 if(!input.reduced){
  const period=28+age*1.4,offset=8+age*.7,flight=7.5;
  const cycle=Math.floor((time-offset)/period),start=offset+cycle*period,progress=(time-start)/flight;
  const startedDuringCurrentAlarm=input.mood.mood==='alarmed'&&input.mood.alarmEnteredAt!==null&&start+1e-9>=input.mood.alarmEnteredAt;
  const startedDuringClosedAlarm=input.mood.alarmHistory?.some(alarm=>start+1e-9>=alarm.enteredAt&&start<alarm.endedAt-1e-9)??false;
  if(cycle>=0&&progress>=0&&progress<=1&&!startedDuringCurrentAlarm&&!startedDuringClosedAlarm){
   const path=input.viewport.skyPath===undefined?villageSkyPath(age,input.viewport):input.viewport.skyPath;
   if(path){const x=path[0]+21+(path[2]-path[0]-42)*progress,y=(path[1]+path[3])/2;const pose=Math.min(2,Math.floor(progress*3));bird=BIRDS[pose].map(triangle=>paint(triangle.map(p=>({x:x+p.x,y:y+p.y})),.54));}
  }
 }
 return {residents,lamps,restorationLights,verdictStrokes,water,bird};
}
