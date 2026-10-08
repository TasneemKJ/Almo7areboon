import type Phaser from 'phaser';
import type {GameEvent,GamePort,Unit} from '../game/types.ts';
import {RecruitArrivals} from './recruit-arrival.ts';
import {paintRecruitFootprints} from './recruit-footprints.ts';
interface EchoHost {game:GamePort;clock():number;reduce():boolean;layout():{groundY:number;laneGap:number};camera:Phaser.Cameras.Scene2D.Camera}
interface EchoLayers {fx:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[]}
export function createActionEchoes(host:EchoHost,layers:EchoLayers) {
 const arrivals=new RecruitArrivals();
 return {
  recordArrival(event:GameEvent,units:readonly Unit[]):void {if(host.game.state.phase==='running'&&!host.game.state.paused)arrivals.record(event,units,host.game.state.time);},
  arrivalFor:(id:number)=>host.game.state.phase==='running'?arrivals.pose(id,host.game.state.time,host.reduce()):{sx:1,sy:1,lift:0,forward:0},
  step(_dt:number):void {if(host.game.state.phase!=='running'){arrivals.clear();return;}const l=host.layout();paintRecruitFootprints(layers.groundFx,arrivals.entries(host.game.state.time),host.game.state.time,l.groundY,l.laneGap,host.reduce());},
  reset():void {arrivals.clear();},
 };
}
