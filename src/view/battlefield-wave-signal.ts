import type Phaser from 'phaser';
import {paintWaveArrival,waveArrivalRenderPlan} from './wave-arrival-paint.ts';
import type {ArmyHost} from './battlefield-army.ts';

/** The road omen for the next wave, plus its review evidence line. */
export function paintWaveSignal(host:ArmyHost,arrivalSignal:Phaser.GameObjects.Graphics,groundY:number):void {
   const graphics=arrivalSignal.clear();delete host.canvas().dataset.waveArrival;
  const frame=host.waveArrival();if(!frame)return;
  const plan=waveArrivalRenderPlan(groundY),report=paintWaveArrival(graphics,frame,plan);
  graphics.setDepth(plan.depth);
  host.canvas().dataset.waveArrival=JSON.stringify({number:frame.number,intent:frame.intent,counts:frame.counts,nextIn:frame.nextIn,progress:frame.progress,banner:report.banner,roleShapes:report.roleShapes,knots:report.knots,x:plan.x,y:plan.y,depth:plan.depth,baseDepth:plan.baseDepth,actorFrontDepth:plan.actorFrontDepth,reduced:host.reduce(),paused:host.game.state.paused});
}
