import Phaser from 'phaser';
import {campRenderProjection} from './world-camp.ts';
import {propTexture} from './visual-assets.ts';
import type {ArmyHost,ArmyLayers} from './battlefield-army.ts';
import type {ImageOrFallback} from './battlefield-types.ts';

const suppliesByScene=new WeakMap<Phaser.Scene,Phaser.GameObjects.Image>();

/** The field camp: standard and supply stall (recruit tray owns card deployment). */
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
 const tex=propTexture('supplies'),hasTex=host.scene.textures.exists(tex);
 let sprite=suppliesByScene.get(host.scene);
 if(!visible||host.game.state.stats.deployed===0){if(sprite)sprite.setVisible(false);return;}
 const basket=plan.supplies,k=1/scale,bx=basket.footX/scale,by=basket.footY/scale;
 if(hasTex){
  if(!sprite){sprite=host.scene.add.image(0,0,tex).setOrigin(.5,1);layers.armyLayer.add(sprite);suppliesByScene.set(host.scene,sprite);}
  const used=host.game.state.skillsUsed.includes('food');
  const tabletBoost=Math.max(1,Math.min(1.45,(host.scene.scale.width/host.pixelRatio)/540));
  const w=72*tabletBoost;
  g.setDepth(by+.05);
  g.fillStyle(0x1a1210,used?.18:.32);
  g.fillEllipse(bx,by-2*k,w*.88*k,13*tabletBoost*k);
  if(!used){
   const breathe=host.reduce()?1:.88+.12*Math.sin(host.clock()*2.6);
   g.lineStyle(1.3*k,0xf0ce87,.42*breathe);
   g.strokeEllipse(bx,by-2*k,w*.88*k,13*tabletBoost*k);
   const h=layers.halos,hy=by-w*.36*k;
   h.fillStyle(0xffd18a,.11*breathe);h.fillCircle(bx,hy,w*.72*k);
   h.fillStyle(0xffd18a,.18*breathe);h.fillCircle(bx,hy,w*.42*k);
  }
  sprite.setPosition(bx,by).setDepth(by+.1).setScale((w*k)/Math.max(1,sprite.width)).setAlpha(used?.48:1).setTint(used?0x9a8f7c:0xffffff).setVisible(true);
  return;
 }
 g.setDepth(by+.1);
 g.fillStyle(0x4a3529,1);g.fillEllipse(bx,by-12*k,38*k,27*k);
 g.fillStyle(0xc18f4e,1);g.fillRoundedRect(bx-18*k,by-20*k,36*k,21*k,5*k);
 g.lineStyle(2*k,0x76512f,1);for(let i=-12;i<=12;i+=8)g.lineBetween(bx+i*k,by-19*k,bx+i*k,by-2*k);
 g.fillStyle(host.game.state.skillsUsed.includes('food')?0x806c52:0xebcd8d,1);g.fillEllipse(bx-8*k,by-22*k,17*k,10*k);g.fillEllipse(bx+9*k,by-22*k,17*k,10*k);
}
