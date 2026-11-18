import Phaser from 'phaser';
import {campRenderProjection} from './world-camp.ts';
import type {ArmyHost,ArmyLayers} from './battlefield-army.ts';
import type {ImageOrFallback} from './battlefield-types.ts';

/** The field camp: standard and supply basket (recruit tray owns card deployment). */
export function paintFieldCamp(host:ArmyHost,layers:ArmyLayers,campActors:readonly ImageOrFallback[]):void {
 const visible=host.game.state.phase==='running'&&host.element.closest<HTMLElement>('#app')?.dataset.fieldMode==='field';
 const {plan,cssScale:scale}=campRenderProjection(host.scene.scale.width,host.scene.scale.height,host.pixelRatio),g=layers.campProps.clear();
 campActors.forEach((actor)=>{
  actor.setVisible(false);
 });
 if(navigator.webdriver){
  const rendered=campActors.flatMap((actor,kind)=>{if(!actor.visible||!(actor instanceof Phaser.GameObjects.Image))return [];const b=actor.getBounds();return [{kind,bounds:{left:b.left/host.pixelRatio,top:b.top/host.pixelRatio,right:b.right/host.pixelRatio,bottom:b.bottom/host.pixelRatio,width:b.width/host.pixelRatio,height:b.height/host.pixelRatio}}];});
  const report=JSON.stringify({pixelRatio:host.pixelRatio,width:host.scene.scale.width/host.pixelRatio,height:host.scene.scale.height/host.pixelRatio,rendered});if(host.canvas().dataset.fieldCamp!==report)host.canvas().dataset.fieldCamp=report;
 }
 if(!visible||host.game.state.stats.deployed===0)return;
 // Objects are painted on the ground plane, with no button plates or card frames.
 const basket=plan.supplies,k=1/scale;
 g.setDepth(basket.footY/scale+.1);
 const bx=basket.footX/scale,by=basket.footY/scale;
 g.fillStyle(0x4a3529,1);g.fillEllipse(bx,by-12*k,38*k,27*k);
 g.fillStyle(0xc18f4e,1);g.fillRoundedRect(bx-18*k,by-20*k,36*k,21*k,5*k);
 g.lineStyle(2*k,0x76512f,1);for(let i=-12;i<=12;i+=8)g.lineBetween(bx+i*k,by-19*k,bx+i*k,by-2*k);
 g.fillStyle(host.game.state.skillsUsed.includes('food')?0x806c52:0xebcd8d,1);g.fillEllipse(bx-8*k,by-22*k,17*k,10*k);g.fillEllipse(bx+9*k,by-22*k,17*k,10*k);
}
