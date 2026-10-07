import type Phaser from 'phaser';
import {BATTLEFIELD_MEMORY_CAP,battlefieldMemoryAfterReset,battlefieldMemoryFrame,battlefieldMemoryNeedsHudMeasurement,battlefieldMemoryRegionClearOf,rememberBattlefieldMark,stepBattlefieldMemory,type BattlefieldMemoryInput,type BattlefieldMemoryMark,type BattlefieldMemoryRegion} from './battlefield-memory.ts';
import {SPOILS_HOMECOMING_CAP,rememberSpoilsHomecoming,spoilsHomecomingFrame,spoilsHomecomingIntentForEvent,spoilsRewardEvidence,stepSpoilsHomecoming,type SpoilsHomecomingMark} from './spoils-homecoming.ts';
import type {GameEvent} from '../game/types';
import type {Floater,Layout} from './battlefield-types.ts';

/** Small painted medallion on the existing transient FX plane: no texture or scene-object allocation. */
const paintSpoilsToken=(g:Phaser.GameObjects.Graphics,frame:{x:number;y:number;size:number;angle:number;alpha:number}):void=>{
 const {x,y,size,alpha}=frame,r=size/2,angle=frame.angle*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),rotate=(dx:number,dy:number)=>({x:x+dx*c-dy*s,y:y+dx*s+dy*c});
 g.fillStyle(0x291d19,alpha*.32);g.fillEllipse(x+1,y+2,size,size*.79);
 g.fillStyle(0xc98a32,alpha);g.fillEllipse(x,y,size*.92,size*.83);
 g.lineStyle(Math.max(1,size/12),0x553621,alpha*.95);g.strokeEllipse(x,y,size*.92,size*.83);
 const glint=rotate(-r*.18,-r*.18);g.fillStyle(0xf2cb69,alpha);g.fillCircle(glint.x,glint.y,r*.27);
 const a=rotate(r*.08,-r*.31),b=rotate(r*.34,-r*.13),d=rotate(r*.29,r*.2),e=rotate(r*.04,r*.32);
 g.lineStyle(Math.max(1,size/16),0xffe6a0,alpha*.85);g.lineBetween(a.x,a.y,b.x,b.y);
 g.lineStyle(Math.max(1,size/18),0x8e5928,alpha*.85);g.lineBetween(b.x,b.y,d.x,d.y);g.lineBetween(d.x,d.y,e.x,e.y);
};


export interface MarksHost {
 ambience():Phaser.GameObjects.Graphics;
 fx():Phaser.GameObjects.Graphics;
 canvas():HTMLCanvasElement;
 layout():Layout;
 yAt(lane:number):number;
 reduce():boolean;
 paused():boolean;
 measureHud():BattlefieldMemoryRegion[];
}

/** Lasting battlefield marks (where blows landed) and the coins carried home; owns their state and their painting. */
export function createBattlefieldMarks(host:MarksHost){
 let memory:readonly BattlefieldMemoryMark[]=[];
 let hudBounds:BattlefieldMemoryRegion[]=[];
 let spoils:readonly SpoilsHomecomingMark[]=[];
 let spoilsReward:Floater|null=null;
 let spoilsOrder=0;
 const drawMemory=():void=>{
   if(!battlefieldMemoryNeedsHudMeasurement(memory)){if(navigator.webdriver)delete host.canvas().dataset.battlefieldMemory;return;}
   hudBounds=host.measureHud();
   const regions:BattlefieldMemoryRegion[]=[],kinds:BattlefieldMemoryMark['kind'][]=[],ages:number[]=[],alphas:number[]=[];
   for(const mark of memory){
    const frame=battlefieldMemoryFrame(mark,host.reduce()),y=host.yAt(mark.lane)+4,layer=host.ambience();
    const region={left:frame.region.left,top:y+frame.region.top,right:frame.region.right,bottom:y+frame.region.bottom};
    if(!battlefieldMemoryRegionClearOf(region,hudBounds))continue;
    for(const stroke of frame.lines){layer.lineStyle(stroke.width,stroke.color,frame.alpha);layer.lineBetween(stroke.from.x,y+stroke.from.y,stroke.to.x,y+stroke.to.y);}
    for(const ellipse of frame.ellipses){layer.fillStyle(ellipse.color,frame.alpha*.14);layer.fillEllipse(ellipse.x,y+ellipse.y,ellipse.width,ellipse.height);layer.lineStyle(ellipse.lineWidth,ellipse.color,frame.alpha);layer.strokeEllipse(ellipse.x,y+ellipse.y,ellipse.width,ellipse.height);}
    regions.push(region);kinds.push(mark.kind);ages.push(mark.age);alphas.push(frame.alpha);
   }
   if(navigator.webdriver&&regions.length)host.canvas().dataset.battlefieldMemory=JSON.stringify({count:regions.length,total:memory.length,cap:BATTLEFIELD_MEMORY_CAP,kinds,regions,ages,alphas,reduced:host.reduce(),paused:host.paused()});
   else if(navigator.webdriver)delete host.canvas().dataset.battlefieldMemory;
 };
 const drawSpoils=():void=>{
   const diagnostics:{order:number;amount:number;age:number;x:number;y:number;alpha:number}[]=[];
   for(const mark of spoils.slice(0,SPOILS_HOMECOMING_CAP)){
    const frame=spoilsHomecomingFrame(mark,host.layout().groundY,host.reduce());if(!frame)continue;
    paintSpoilsToken(host.fx(),frame);
    diagnostics.push({order:mark.order,amount:mark.amount,age:mark.age,x:frame.x,y:frame.y,alpha:frame.alpha});
   }
   if(navigator.webdriver&&diagnostics.length)host.canvas().dataset.spoilsHomecoming=JSON.stringify({count:diagnostics.length,cap:SPOILS_HOMECOMING_CAP,height:host.layout().height,marks:diagnostics,reduced:host.reduce(),paused:host.paused()});
   else if(navigator.webdriver)delete host.canvas().dataset.spoilsHomecoming;
 };
 return {
  remember(input:BattlefieldMemoryInput):void {memory=rememberBattlefieldMark(memory,input);},
  setHudBounds(bounds:BattlefieldMemoryRegion[]):void {hudBounds=bounds;},
  /** Ages both mark sets by dt, then paints them. */
  step(dt:number):void {
   memory=stepBattlefieldMemory(memory,dt,host.paused());drawMemory();
   spoils=stepSpoilsHomecoming(spoils,dt,host.paused());drawSpoils();
  },
  /** A coin floater was raised: remember it as the reward to track and, unless reduced, as a token carried home. */
  recordCoin(event:GameEvent,floater:Floater):void {
   spoilsReward=floater;floater.reward=event.amount;
   const intent=spoilsHomecomingIntentForEvent(event);
   if(intent&&!host.reduce())spoils=rememberSpoilsHomecoming(spoils,{...intent,x:floater.text.x,y:floater.startY},++spoilsOrder,host.layout().height);
  },
  /** Evidence line for the review harness; drops the tracked reward once its floater is gone. */
  rewardEvidence(floaters:readonly Floater[]):void {
   const evidence=navigator.webdriver?spoilsRewardEvidence(spoilsReward,floaters,host.reduce()):null;
   if(evidence)host.canvas().dataset.spoilsReward=JSON.stringify(evidence);
   else {spoilsReward=null;if(navigator.webdriver)delete host.canvas().dataset.spoilsReward;}
  },
  /** A replacement battle starts the homecoming order again. */
  restartOrder():void {spoilsOrder=0;},
  reset(reason:'motion'|'scene',pending:readonly BattlefieldMemoryInput[]):void {
   memory=battlefieldMemoryAfterReset(memory,reason,pending);spoils=[];spoilsReward=null;
   delete host.canvas().dataset.battlefieldMemory;delete host.canvas().dataset.spoilsHomecoming;delete host.canvas().dataset.spoilsReward;
  },
 };
}
