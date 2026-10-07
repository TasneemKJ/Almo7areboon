import Phaser from 'phaser';


import {groundEffectDepth} from './ground-effects.ts';







import {createBaseSprite,createTroopSprite} from './battlefield-sprites.ts';
import {paintWaveSignal} from './battlefield-wave-signal.ts';
import {paintFieldCamp} from './battlefield-camp.ts';
import { paintIdleActors, updateTroopViews } from './battlefield-troop-paint.ts';
import type {ChronicleView} from './chronicle-view.ts';
import type {WaveArrivalFrame} from './wave-arrival.ts';
import type {GamePort,Unit,Side} from '../game/types';
import type {createBattlefieldEffects} from './battlefield-effects.ts';
import { type ImageOrFallback, type Layout, type TroopView } from './battlefield-types.ts';

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
 const sprite=(age:number,kind:Unit['kind'],side:Side):ImageOrFallback=>createTroopSprite(host.scene,age,kind,side);
 const createBase=(age:number,side:Side):ImageOrFallback=>createBaseSprite(host.scene,age,side);
 function draw():void {
   const g=layers.shadows,h=layers.halos;g.clear();h.clear();
   const {groundY}=host.layout();
   if(host.game.state.phase==='ready'||host.game.state.phase==='running')host.clearAftermath();const aftermath=host.aftermath();
   let aftermathElapsed=aftermath?Math.max(0,host.clock()-aftermath.at):0;aftermathElapsed=Math.min(1.3,aftermathElapsed);
   const aftermathCounts={triumph:0,withdraw:0,roles:[0,0,0],maxForward:0,maxLift:0,maxAngle:0};
   // A shared ground-plane sort lets rear-lane troops pass behind buildings.
   playerBase.setPosition(39,groundY+12).setDepth(groundY+12);
   enemyBase.setPosition(411,groundY+12).setDepth(groundY+12);
   paintWaveSignal(host,layers.arrivalSignal,groundY);
   layers.baseDamage.setDepth(groundY+12.1);
   for(let lane=0;lane<3;lane++)layers.groundFx[lane].clear().setDepth(groundEffectDepth(groundY,lane,host.layout().laneGap));
   updateTroopViews({host,layers,effects,units,sprite,g,h,aftermath,aftermathElapsed,aftermathCounts});
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
