import Phaser from 'phaser';
import {campRenderProjection,campRecruits} from './world-camp.ts';
import {drawTroop} from './art';
import type {ArmyHost,ArmyLayers} from './battlefield-army.ts';
import type {ImageOrFallback} from './battlefield-types.ts';

/** The field camp: recruit actors at their projected feet, the standard and the supply basket (and review evidence). */
export function paintFieldCamp(host:ArmyHost,layers:ArmyLayers,campActors:readonly ImageOrFallback[]):void {
 const visible=host.game.state.phase==='running'&&host.element.closest<HTMLElement>('#app')?.dataset.fieldMode==='field';
 const {plan,cssScale:scale}=campRenderProjection(host.scene.scale.width,host.scene.scale.height,host.pixelRatio),g=layers.campProps.clear();
 const unlocked=campRecruits(host.game.profile);
 campActors.forEach((actor,kind)=>{
  actor.setVisible(visible&&unlocked.includes(kind as 0|1|2));
  if(!visible)return;
  const target=plan.recruits[kind],x=target.footX/scale,y=target.footY/scale;
  actor.setPosition(x,y).setDepth(y);
  if(actor instanceof Phaser.GameObjects.Image)actor.setScale(48/(actor.height*scale)).setFlipX(false);
  else {actor.setScale(.75/scale);drawTroop(actor,host.game.profile.age,kind as 0|1|2,'player',0,false);}
  if(unlocked.includes(kind as 0|1|2)){layers.shadows.fillStyle(0x192c25,.3);layers.shadows.fillEllipse(x,y+2/scale,28/scale,7/scale);}
 });
 if(navigator.webdriver){
  const rendered=campActors.flatMap((actor,kind)=>{if(!actor.visible||!(actor instanceof Phaser.GameObjects.Image))return [];const b=actor.getBounds();return [{kind,bounds:{left:b.left/host.pixelRatio,top:b.top/host.pixelRatio,right:b.right/host.pixelRatio,bottom:b.bottom/host.pixelRatio,width:b.width/host.pixelRatio,height:b.height/host.pixelRatio}}];});
  const report=JSON.stringify({pixelRatio:host.pixelRatio,width:host.scene.scale.width/host.pixelRatio,height:host.scene.scale.height/host.pixelRatio,rendered});if(host.canvas().dataset.fieldCamp!==report)host.canvas().dataset.fieldCamp=report;
 }
 if(!visible||host.game.state.stats.deployed===0)return;
 // Objects are painted on the ground plane, with no button plates or card frames.
 const flag=plan.standard,basket=plan.supplies,x=flag.footX/scale,y=flag.footY/scale,k=1/scale;
 g.setDepth(Math.max(flag.footY,basket.footY)/scale+.1);
 if(host.game.state.chronicle?.enabled){
  g.lineStyle(3*k,0x765435,1);g.lineBetween(x,y,x,y-43*k);
  g.fillStyle(host.game.state.chronicle.rally?0xe2b969:0xc7d6ad,1);g.fillTriangle(x,y-42*k,x+24*k,y-35*k,x,y-23*k);
  g.fillStyle(0x243e40,.25);g.fillEllipse(x,y+2*k,24*k,6*k);
 }
 const bx=basket.footX/scale,by=basket.footY/scale;
 g.fillStyle(0x4a3529,1);g.fillEllipse(bx,by-12*k,38*k,27*k);
 g.fillStyle(0xc18f4e,1);g.fillRoundedRect(bx-18*k,by-20*k,36*k,21*k,5*k);
 g.lineStyle(2*k,0x76512f,1);for(let i=-12;i<=12;i+=8)g.lineBetween(bx+i*k,by-19*k,bx+i*k,by-2*k);
 g.fillStyle(host.game.state.skillsUsed.includes('food')?0x806c52:0xebcd8d,1);g.fillEllipse(bx-8*k,by-22*k,17*k,10*k);g.fillEllipse(bx+9*k,by-22*k,17*k,10*k);
}
