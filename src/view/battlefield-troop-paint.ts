import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {drawTroop} from './art';
import {teamHalo} from './cinematic-grade.ts';
import {unitFocusMarks} from './silhouette-focus.ts';
import {TROOP_FRAME} from './unit-illustrations.ts';
import {troopPose} from './visual-theme.ts';
import {characterGesture} from './character-gesture.ts';
import {hitReaction} from './combat-choreography.ts';
import {battleAftermathPose} from './battle-aftermath.ts';
import {lanePresentation,rankStagger,troopScale} from './lane-perspective.ts';
import type {ArmyHost,ArmyLayers} from './battlefield-army.ts';
import type {createBattlefieldEffects} from './battlefield-effects.ts';
import type {BattleState,Profile,Side,Unit} from '../game/types';
import {stillReaction,xAt,type ImageOrFallback,type TroopView} from './battlefield-types.ts';

type G=Phaser.GameObjects.Graphics;

/** Everything a troop sprite needs to be posed for one frame. */
export interface TroopFrame {
 unit:Unit;state:BattleState;reduce:boolean;x:number;y:number;frozen:boolean;scale:number;direction:number;facingDirection:number;
 pose:ReturnType<typeof troopPose>;gesture:ReturnType<typeof characterGesture>;
 verdict:ReturnType<typeof battleAftermathPose>|null;recoil:{x:number;y:number;angle:number};
 perspective:ReturnType<typeof lanePresentation>;
}

/** Ground shadow, focus marks and team halo under a troop. */
export function paintTroopGround(g:G,h:G,f:TroopFrame):void {
 const {unit,x,y,frozen,perspective}=f;
 for(const mark of unitFocusMarks(unit.side,unit.lane,unit.kind,unit.hitFlash,frozen)){g.fillStyle(mark.color,mark.alpha);g.fillEllipse(x+mark.x,y+mark.y,mark.width,mark.height);}
 g.fillStyle(0x243c42,perspective.shadowAlpha);g.fillEllipse(x+3,y+3,perspective.shadowWidth,perspective.shadowHeight);
 const halo=teamHalo(unit.side,unit.kind,perspective.scale,unit.hitFlash,frozen);
 h.fillStyle(halo.color,halo.alpha*.45);h.fillEllipse(x+halo.x,y+halo.y,halo.rx*2,halo.ry*2,12);
 h.fillStyle(halo.color,halo.alpha*.6);h.fillEllipse(x+halo.x,y+halo.y,halo.rx*1.2,halo.ry*1.1,10);
 g.fillStyle(0x2a4647,perspective.shadowAlpha*.82);g.fillEllipse(x+2,y+2,perspective.shadowWidth*.68,perspective.shadowHeight*.38);
}

/** Poses a troop sprite (image or vector fallback) from its frame; aftermath poses override the live pose. */
export function poseTroop(body:ImageOrFallback,f:TroopFrame):void {
 const {unit,state,reduce,x,y,frozen,scale,direction,facingDirection,pose,gesture,verdict,recoil,perspective}=f;
 if(body instanceof Phaser.GameObjects.Image){
  const density=TROOP_FRAME.height/body.height;
  if(verdict){
   body.setFrame(String(verdict.frame));body.setAngle(verdict.angle*facingDirection+recoil.angle);body.setScale(scale*density*verdict.sx,scale*density*verdict.sy).setFlipX(facingDirection<0);
   body.setPosition(x+recoil.x+verdict.forward*facingDirection,y-verdict.lift+recoil.y);
  }else{
   if(!state.paused)body.setFrame(String(pose.frame));
   body.setAngle(pose.angle*direction+gesture.angle*direction+recoil.angle);body.setScale(scale*density*gesture.sx,scale*density*gesture.sy).setFlipX(direction<0);
   body.setPosition(x+recoil.x+gesture.forward*direction,y-(state.paused?0:pose.lift)-gesture.lift+recoil.y);
  }
  if(unit.hitFlash>0)body.setTintFill(0xfff9db);else if(frozen)body.setTint(0x91e5f0);else if(unit.storyShadow)body.setTint((state.chronicle?.revealUntil??0)>state.time?0xd4e3bc:0xb8b8d1);else if(storybookArt(unit.age)&&unit.side==='enemy')body.setTint(0xffd9b5);else body.clearTint();
 }else{
  body.setPosition(verdict?x+recoil.x+verdict.forward*facingDirection:x+recoil.x+gesture.forward*direction,verdict?y-verdict.lift+recoil.y:y-gesture.lift+recoil.y).setScale(facingDirection*perspective.scale*(verdict?verdict.sx:gesture.sx),perspective.scale*(verdict?verdict.sy:gesture.sy)).setAngle(verdict?verdict.angle*facingDirection+recoil.angle:pose.angle*direction+gesture.angle*direction+recoil.angle);
  drawTroop(body,unit.age,unit.kind,unit.side,verdict?verdict.frame/7:reduce||frozen?0:state.time,verdict?verdict.mode==='triumph':unit.attacking,unit.hitFlash>0);
 }
}

/** The two waiting warriors shown before a battle starts. */
export function paintIdleActors(g:G,idle:readonly ImageOrFallback[],state:BattleState,profile:Profile,groundY:number):void {
for(let i=0;i<idle.length;i++){
 const actor=idle[i],side=i===0?'player':'enemy',x=i===0?119:331,y=groundY+15;
 actor.setVisible(state.phase==='ready');
 if(state.phase!=='ready')continue;
 g.fillStyle(0x243e40,.2);g.fillEllipse(x,y+2,25,7);
 actor.setPosition(x,y).setDepth(y+.5);
 if(actor instanceof Phaser.GameObjects.Image){actor.setScale(.47*TROOP_FRAME.height/actor.height).setFlipX(i===1);if(i===1&&storybookArt(profile.enemyAge))actor.setTint(0xffd9b5);}
 else {actor.setScale(i===0?1:-1,1);drawTroop(actor,i===0?profile.age:profile.enemyAge,0,side,0,false);}
}
}

/** What one frame of troop updating needs from the army renderer. */
export interface TroopViewContext {
 host:ArmyHost;layers:ArmyLayers;effects:ReturnType<typeof createBattlefieldEffects>;units:Map<number,TroopView>;
 sprite:(age:number,kind:Unit['kind'],side:Side)=>ImageOrFallback;g:G;h:G;
 aftermath:{phase:'won'|'lost';at:number}|null;aftermathElapsed:number;
 aftermathCounts:{triumph:number;withdraw:number;roles:number[];maxForward:number;maxLift:number;maxAngle:number};
}

/** Creates, poses and retires one view per unit, accumulating aftermath evidence on the way. */
export function updateTroopViews(c:TroopViewContext):void {
 const {host,layers,effects,units,sprite,g,h,aftermath,aftermathElapsed,aftermathCounts}=c;
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
}
