import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {drawTroop} from './art';
import {teamHalo} from './cinematic-grade.ts';
import {unitFocusMarks} from './silhouette-focus.ts';
import {TROOP_FRAME} from './unit-illustrations.ts';
import type {troopPose} from './visual-theme.ts';
import type {characterGesture} from './character-gesture.ts';
import type {battleAftermathPose} from './battle-aftermath.ts';
import type {lanePresentation} from './lane-perspective.ts';
import type {BattleState,Profile,Unit} from '../game/types';
import type {ImageOrFallback} from './battlefield-types.ts';

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
