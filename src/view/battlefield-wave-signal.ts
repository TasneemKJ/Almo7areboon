import type Phaser from 'phaser';
import {paintWaveArrival,waveArrivalRenderPlan} from './wave-arrival-paint.ts';
import type {ArmyHost} from './battlefield-army.ts';
import type {createBattlefieldEffects} from './battlefield-effects.ts';
import {tr} from '../game/locale.ts';

const announcedWave=new WeakMap<object,number>();

/** The road omen for the next wave, plus its intent beacon, callout and review evidence line. */
export function paintWaveSignal(host:ArmyHost,arrivalSignal:Phaser.GameObjects.Graphics,groundY:number,halos?:Phaser.GameObjects.Graphics,effects?:ReturnType<typeof createBattlefieldEffects>):void {
   const graphics=arrivalSignal.clear();delete host.canvas().dataset.waveArrival;
  const frame=host.waveArrival();if(!frame)return;
  const plan=waveArrivalRenderPlan(groundY),report=paintWaveArrival(graphics,frame,plan);
  graphics.setDepth(plan.depth);
  if(halos){
   const beaconColor=frame.intent==='volley'?0xffcb6b:frame.intent==='bulwark'?0x88d4e8:0xff7a52;
   const alpha=host.reduce()?.24:.18+.14*frame.progress;
   halos.fillStyle(beaconColor,alpha);
   halos.fillCircle(plan.x,plan.y-64,18+10*frame.progress);
  }
  if(effects&&frame.number>=2&&frame.nextIn<=2.5&&!host.game.state.paused&&announcedWave.get(host.game.state)!==frame.number){
   announcedWave.set(host.game.state,frame.number);
   const label=frame.intent==='volley'?tr('VOLLEY','وابل رماية'):frame.intent==='bulwark'?tr('BULWARK','طليعة ثقيلة'):tr('RUSH','غارة سريعة');
   const color=frame.intent==='volley'?'#ffe09c':frame.intent==='bulwark'?'#b8e8f5':'#ffb094';
   effects.floatText(plan.x-10,plan.y-84,label,color,false,frame.intent==='bulwark');
  }
  if(navigator.webdriver)host.canvas().dataset.waveArrival=JSON.stringify({number:frame.number,intent:frame.intent,counts:frame.counts,nextIn:frame.nextIn,progress:frame.progress,banner:report.banner,roleShapes:report.roleShapes,knots:report.knots,x:plan.x,y:plan.y,depth:plan.depth,baseDepth:plan.baseDepth,actorFrontDepth:plan.actorFrontDepth,reduced:host.reduce(),paused:host.game.state.paused});
}
