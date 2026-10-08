import type Phaser from 'phaser';
import type {GameEvent,GamePort,Unit} from '../game/types.ts';
import {RecruitArrivals} from './recruit-arrival.ts';
import {paintRecruitFootprints} from './recruit-footprints.ts';
import {isProvisionDrop,paintProvision} from './camp-provision.ts';
import {paintMeteorLanding} from './meteor-landing.ts';
interface EchoHost {game:GamePort;clock():number;reduce():boolean;layout():{groundY:number;laneGap:number};camera:Phaser.Cameras.Scene2D.Camera}
interface EchoLayers {fx:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[]}
export function createActionEchoes(host:EchoHost,layers:EchoLayers) {
 const arrivals=new RecruitArrivals();let provisionAt:number|null=null;let meteors:{x:number;y:number;at:number}[]=[];
 return {
  recordArrival(event:GameEvent,units:readonly Unit[]):void {if(host.game.state.phase==='running'&&!host.game.state.paused)arrivals.record(event,units,host.game.state.time);},
  meteorLanding(x:number,y:number):void {if(host.game.state.phase!=='running')return;meteors.push({x,y,at:host.game.state.time});if(meteors.length>6)meteors.shift();},
  recordProvision(event:GameEvent):void {if(host.game.state.phase==='running'&&isProvisionDrop(event))provisionAt=host.game.state.time;},
  arrivalFor:(id:number)=>host.game.state.phase==='running'?arrivals.pose(id,host.game.state.time,host.reduce()):{sx:1,sy:1,lift:0,forward:0},
  step(_dt:number):void {if(host.game.state.phase!=='running'){arrivals.clear();provisionAt=null;meteors=[];return;}const l=host.layout();paintRecruitFootprints(layers.groundFx,arrivals.entries(host.game.state.time),host.game.state.time,l.groundY,l.laneGap,host.reduce());for(const m of meteors)paintMeteorLanding(layers.fx,m.x,m.y,host.game.state.time-m.at,host.reduce());meteors=meteors.filter(m=>host.game.state.time-m.at<.5);if(provisionAt!==null){paintProvision(layers.fx,l.groundY,provisionAt,host.game.state.time,host.reduce());if(host.game.state.time-provisionAt>=.85)provisionAt=null;}},
  reset():void {arrivals.clear();provisionAt=null;meteors=[];},
 };
}
