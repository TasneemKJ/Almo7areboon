import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {troopPose} from './visual-theme.ts';
import {groundEffectDepth} from './ground-effects.ts';
import {hitReaction} from './combat-choreography.ts';
import {characterGesture} from './character-gesture.ts';
import {lanePresentation,rankStagger,troopScale} from './lane-perspective.ts';
import {baseTexture,unitTexture} from './visual-assets.ts';
import {battleAftermathPose} from './battle-aftermath.ts';
import {paintWaveArrival,waveArrivalRenderPlan} from './wave-arrival-paint.ts';
import {drawBase} from './art';
import {paintFieldCamp} from './battlefield-camp.ts';
import {paintIdleActors,paintTroopGround,poseTroop,type TroopFrame} from './battlefield-troop-paint.ts';
import type {ChronicleView} from './chronicle-view.ts';
import type {WaveArrivalFrame} from './wave-arrival.ts';
import type {GamePort,Unit,Side} from '../game/types';
import type {createBattlefieldEffects} from './battlefield-effects.ts';
import {xAt,stillReaction,type ImageOrFallback,type Layout,type TroopView} from './battlefield-types.ts';

export interface ArmyHost {
 scene:Phaser.Scene;
 game:GamePort;
 element:HTMLElement;
 pixelRatio:number;
 canvas():HTMLCanvasElement;
 layout():Layout;
 yAt(lane:number):number;
 reduce():boolean;
 clock():number;
 aftermath():{phase:'won'|'lost';at:number}|null;
 clearAftermath():void;
 waveArrival():WaveArrivalFrame|null;
}
export interface ArmyLayers {
 shadows:Phaser.GameObjects.Graphics;halos:Phaser.GameObjects.Graphics;armyLayer:Phaser.GameObjects.Container;
 arrivalSignal:Phaser.GameObjects.Graphics;baseDamage:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[];
 campProps:Phaser.GameObjects.Graphics;chronicleView:ChronicleView;
}

/** Troop and base sprites, the idle pair, the field camp and the wave signal: creates, poses and sorts them each frame. */
export function createBattlefieldArmy(host:ArmyHost,layers:ArmyLayers,effects:ReturnType<typeof createBattlefieldEffects>){
 const units=new Map<number,TroopView>();
 let idle:ImageOrFallback[]=[],campActors:ImageOrFallback[]=[];
 let playerBase!:ImageOrFallback,enemyBase!:ImageOrFallback;
 function sprite(age:number,kind:Unit['kind'],side:Side):ImageOrFallback {
   const key=unitTexture(age,kind,side);
   if(host.scene.textures.exists(key))return host.scene.add.image(0,0,key,'0').setOrigin(.5,136/144);
   return host.scene.add.graphics();
  }
 function createBase(age:number,side:Side):ImageOrFallback {
   const key=baseTexture(age,side);
   if(host.scene.textures.exists(key)){
    const image=host.scene.add.image(0,0,key).setOrigin(.5,140/160);
    return image.setScale(.62*160/image.width).setFlipX(!!storybookArt(age)&&side==='enemy');
   }
   const graphic=host.scene.add.graphics();drawBase(graphic,age,side);return graphic;
  }
 function drawWaveArrival(groundY:number):void {
   const graphics=layers.arrivalSignal.clear();delete host.canvas().dataset.waveArrival;
   const frame=host.waveArrival();if(!frame)return;
   const plan=waveArrivalRenderPlan(groundY),report=paintWaveArrival(graphics,frame,plan);
   graphics.setDepth(plan.depth);
   host.canvas().dataset.waveArrival=JSON.stringify({number:frame.number,intent:frame.intent,counts:frame.counts,nextIn:frame.nextIn,progress:frame.progress,banner:report.banner,roleShapes:report.roleShapes,knots:report.knots,x:plan.x,y:plan.y,depth:plan.depth,baseDepth:plan.baseDepth,actorFrontDepth:plan.actorFrontDepth,reduced:host.reduce(),paused:host.game.state.paused});
 }
 function draw():void {
   const g=layers.shadows,h=layers.halos;g.clear();h.clear();
   const {groundY}=host.layout();
   if(host.game.state.phase==='ready'||host.game.state.phase==='running')host.clearAftermath();const aftermath=host.aftermath();
   let aftermathElapsed=aftermath?Math.max(0,host.clock()-aftermath.at):0;aftermathElapsed=Math.min(1.3,aftermathElapsed);
   const aftermathCounts={triumph:0,withdraw:0,roles:[0,0,0],maxForward:0,maxLift:0,maxAngle:0};
   // A shared ground-plane sort lets rear-lane troops pass behind buildings.
   playerBase.setPosition(39,groundY+12).setDepth(groundY+12);
   enemyBase.setPosition(411,groundY+12).setDepth(groundY+12);
   drawWaveArrival(groundY);
   layers.baseDamage.setDepth(groundY+12.1);
   for(let lane=0;lane<3;lane++)layers.groundFx[lane].clear().setDepth(groundEffectDepth(groundY,lane,host.layout().laneGap));
   const ids=new Set<number>();
   for(const unit of host.game.state.units){
    ids.add(unit.id);let view=units.get(unit.id);
    const x=xAt(unit.x),y=host.yAt(unit.lane)+rankStagger(unit.id),frozen=unit.side==='enemy'&&host.game.state.freezeUntil>host.game.state.time;
    if(!view){const body=sprite(unit.age,unit.kind,unit.side);layers.armyLayer.add(body);view={body,x,y,lane:unit.lane,side:unit.side,dustAt:0};units.set(unit.id,view);}
    const moving=Math.abs(view.x-x)>.001,perspective=lanePresentation(unit.lane,unit.kind),scale=troopScale(unit.kind,unit.lane)*(unit.storyBoss?1.35:1);
    const direction=unit.side==='player'?1:-1;
    const pose=troopPose(host.game.state.time+unit.id*.17,moving,unit.attacking,host.reduce()||frozen);
    const gesture=characterGesture(unit.kind,host.game.state.time+unit.id*.17,moving,unit.attacking,host.reduce()||frozen);
    const verdict=aftermath?.phase===host.game.state.phase?battleAftermathPose({phase:aftermath.phase,side:unit.side,kind:unit.kind,elapsed:aftermathElapsed,reduced:host.reduce()}):null;
    const facingDirection=verdict?.facing==='home'?-direction:direction;
    if(verdict){aftermathCounts[verdict.mode]++;aftermathCounts.roles[unit.kind]++;aftermathCounts.maxForward=Math.max(aftermathCounts.maxForward,verdict.forward);aftermathCounts.maxLift=Math.max(aftermathCounts.maxLift,verdict.lift);aftermathCounts.maxAngle=Math.max(aftermathCounts.maxAngle,Math.abs(verdict.angle));}
    const recoil=verdict?stillReaction:hitReaction(unit.hitFlash,unit.side,unit.kind,host.reduce()||frozen);
    const frame:TroopFrame={unit,state:host.game.state,reduce:host.reduce(),x,y,frozen,scale,direction,facingDirection,pose,gesture,verdict,recoil,perspective};
    paintTroopGround(g,h,frame);
    poseTroop(view.body,frame);
    // Troops win a same-baseline tie against the building and its damage marks.
    view.body.setDepth(y+.5);
    if(moving&&!host.game.state.paused&&!frozen&&host.clock()-view.dustAt>.28){effects.emit(x,y+2,1,0xdfd4b1,true,.45,unit.lane);view.dustAt=host.clock();}
    view.x=x;view.y=y;view.lane=unit.lane;
   }
   if(aftermath?.phase===host.game.state.phase)host.canvas().dataset.battleAftermath=JSON.stringify({phase:aftermath.phase,elapsed:aftermathElapsed,triumph:aftermathCounts.triumph,withdraw:aftermathCounts.withdraw,roles:aftermathCounts.roles,maxForward:aftermathCounts.maxForward,maxLift:aftermathCounts.maxLift,maxAngle:aftermathCounts.maxAngle,reduced:host.reduce()});
   else delete host.canvas().dataset.battleAftermath;
   for(const [id,view]of units)if(!ids.has(id)){
    if(host.reduce())view.body.destroy();
    else {if(view.body instanceof Phaser.GameObjects.Image)view.body.clearTint();effects.fallen.add(view.body,view.side);}
    units.delete(id);
   }
   if(navigator.webdriver)host.canvas().dataset.battlefieldEnemyViews=String([...units.values()].filter(view=>view.side==='enemy').length);
   paintIdleActors(g,idle,host.game.state,host.game.profile,groundY);
   layers.chronicleView.update(host.game.profile,host.game.state,groundY,host.layout().laneGap,host.reduce());
   paintFieldCamp(host,layers,campActors);
   layers.armyLayer.sort('depth');
 }
 return {
  units,
  draw,
  /** Rebuilds the bases, the idle pair and the camp recruits for the current ages. */
  syncActors(p:{age:number;enemyAge:number}):void {
   playerBase?.destroy();enemyBase?.destroy();
   playerBase=createBase(p.age,'player');enemyBase=createBase(p.enemyAge,'enemy');
   layers.armyLayer.add([playerBase,enemyBase]);
   for(const actor of idle)actor.destroy();idle=[];
   for(const side of ['player','enemy'] as const){const actor=sprite(side==='player'?p.age:p.enemyAge,0,side);layers.armyLayer.add(actor);idle.push(actor);}
   for(const actor of campActors)actor.destroy();campActors=[];
   for(const kind of [0,1,2] as const){const actor=sprite(p.age,kind,'player');layers.armyLayer.add(actor);campActors.push(actor);}
  },
  /** A replacement battle: drop every troop sprite. */
  clearUnits():void {for(const view of units.values())view.body.destroy();units.clear();},
  /** Scene shutdown: forget sprites without destroying them (Phaser owns them). */
  forget():void {units.clear();idle=[];},
 };
}
