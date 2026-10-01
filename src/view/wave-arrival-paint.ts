import {WAVE_ARRIVAL_DEPTH_OFFSET,type WaveArrivalFrame,type WaveArrivalPoint,type WaveRoleShape} from './wave-arrival.ts';
import {minimumActorRenderDepth} from './lane-perspective.ts';

interface WaveArrivalGraphics {
 lineStyle(width:number,color:number,alpha?:number):this;
 lineBetween(x1:number,y1:number,x2:number,y2:number):this;
 fillStyle(color:number,alpha?:number):this;
 fillPoints(points:WaveArrivalPoint[],closeShape?:boolean):this;
 fillCircle(x:number,y:number,radius:number):this;
 strokeCircle(x:number,y:number,radius:number):this;
 fillRect(x:number,y:number,width:number,height:number):this;
 strokeRect(x:number,y:number,width:number,height:number):this;
}
export interface WaveArrivalRenderPlan {x:number;y:number;depth:number;baseDepth:number;actorFrontDepth:number}
export interface WaveArrivalPaintReport {banner:WaveArrivalFrame['banner']['shape'];roleShapes:readonly WaveRoleShape[];knots:number}

export function waveArrivalRenderPlan(groundY:number):Readonly<WaveArrivalRenderPlan> {
 const ground=Number.isFinite(groundY)?groundY:260;
 return Object.freeze({x:340,y:ground+7,depth:ground+WAVE_ARRIVAL_DEPTH_OFFSET,baseDepth:ground+12,actorFrontDepth:minimumActorRenderDepth(ground)});
}

/** Paints a bounded storybook road omen without owning timing or gameplay. */
export function paintWaveArrival(graphics:WaveArrivalGraphics,frame:Readonly<WaveArrivalFrame>,anchor:{x:number;y:number}):Readonly<WaveArrivalPaintReport> {
 const x=Number.isFinite(anchor.x)?anchor.x:340,y=Number.isFinite(anchor.y)?anchor.y:267,lift=frame.clothLift;
 const cloth=frame.banner.points.map(point=>({x:x+point.x,y:y+point.y+lift}));
 graphics.lineStyle(2.2,0x3b352b,.88).lineBetween(x,y+1,x,y-76);
 graphics.fillStyle(frame.intent==='volley'?0xb97862:frame.intent==='bulwark'?0x88664e:0xa96350,.86).fillPoints(cloth,true);
 graphics.lineStyle(1.2,0x3b352b,.92);
 for(let index=0;index<cloth.length;index++){const a=cloth[index],b=cloth[(index+1)%cloth.length];graphics.lineBetween(a.x,a.y,b.x,b.y);}
 for(const knot of frame.countdownKnots){const kx=x+knot.x,ky=y+knot.y;graphics.lineStyle(1,0x3b352b,.82).strokeCircle(kx,ky,2.5);if(knot.filled)graphics.fillStyle(0xe1bf78,.9).fillCircle(kx,ky,1.55);}
 for(const mark of frame.roleMarks){const mx=x+mark.x,my=y+mark.y;
  if(mark.shape==='footprints'){
   graphics.fillStyle(0x654d3b,mark.alpha).fillCircle(mx-1.7,my,1.8).fillCircle(mx+2,my-2.6,1.45);
  }else if(mark.shape==='sling-stitches'){
   graphics.lineStyle(1.35,0xc18467,mark.alpha).lineBetween(mx-3,my-2,mx+3,my+2).lineBetween(mx-3,my+2,mx+3,my-2);
  }else{
   graphics.fillStyle(0x5e4a3d,mark.alpha).fillRect(mx-3.5,my-2.6,7,5.2).lineStyle(1,0xd4ad78,mark.alpha).strokeRect(mx-3.5,my-2.6,7,5.2);
  }
 }
 return Object.freeze({banner:frame.banner.shape,roleShapes:Object.freeze(frame.roleMarks.map(mark=>mark.shape)),knots:frame.countdownKnots.length});
}
