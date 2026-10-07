import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {cloudFrame,shootingStar,starFrame} from './living-sky.ts';
import {foregroundMist,stageGlow,type GlowMark} from './cinematic-grade.ts';
import type {AtmosphereHost,AtmosphereLayers} from './battlefield-atmosphere.ts';

/** The painted-sky light layers (stars, clouds, mist, stage glow) as pooled soft quads of one cached radial falloff. */
export function createStageLight(host:AtmosphereHost,layers:AtmosphereLayers):()=>void {
 function softTexture():string {
   const key='soft-light';
   if(!host.scene.textures.exists(key)){
    const texture=host.scene.textures.createCanvas(key,128,128),ctx=texture?.getContext();
    if(texture&&ctx){const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);texture.refresh();}
   }
   return key;
  }
 function paintSoft(pool:Phaser.GameObjects.Container,marks:readonly GlowMark[],blend:Phaser.BlendModes):void {
   const key=softTexture();
   while(pool.length<marks.length)pool.add(host.scene.add.image(0,0,key).setBlendMode(blend));
   pool.list.forEach((child,i)=>{
    const image=child as Phaser.GameObjects.Image,mark=marks[i];
    if(!mark){image.setVisible(false);return;}
    image.setVisible(true).setPosition(mark.x,mark.y).setDisplaySize(mark.rx*2,mark.ry*2).setTint(mark.color).setAlpha(Math.min(1,mark.alpha));
   });
  }
 function drawStageLight():void {
   const s=host.game.state,age=host.game.profile.age,st=layers.streak;st.clear();
   // Painted plates already contain sky, lamps and foreground shading. Procedural
   // clouds cannot be masked by their baked rooftops and would float over the walls.
   if(storybookArt(age)){
    for(const pool of [layers.stars,layers.clouds,layers.mist,layers.stageLight])pool.setVisible(false);
    return;
   }
   for(const pool of [layers.stars,layers.clouds,layers.mist,layers.stageLight])pool.setVisible(true);
   // Stars are pooled soft quads: tessellating 60 circles a frame cost ~12% fps at 2x density.
   paintSoft(layers.stars,starFrame(age,host.clock(),host.layout().groundY,host.reduce()).map(star=>({x:star.x,y:star.y,rx:star.size*2.2,ry:star.size*2.2,color:0xfff6e0,alpha:star.alpha})),Phaser.BlendModes.ADD);
   const streak=shootingStar(age,host.clock(),host.layout().groundY,host.reduce());
   if(streak){st.lineStyle(2.2,0xfff4d6,streak.alpha*.3);st.lineBetween(streak.x1,streak.y1,streak.x2,streak.y2);st.lineStyle(.9,0xffffff,streak.alpha);st.lineBetween(streak.x1+(streak.x2-streak.x1)*.4,streak.y1+(streak.y2-streak.y1)*.4,streak.x2,streak.y2);st.fillStyle(0xffffff,streak.alpha);st.fillCircle(streak.x2,streak.y2,1.1);}
   paintSoft(layers.clouds,cloudFrame(age,host.clock(),host.layout().groundY,host.reduce()),Phaser.BlendModes.NORMAL);
   paintSoft(layers.mist,foregroundMist(age,host.layout().groundY,host.layout().height,host.clock(),host.reduce()).map(m=>({...m,alpha:m.alpha*1.1})),Phaser.BlendModes.NORMAL);
   paintSoft(layers.stageLight,stageGlow(age,host.layout().groundY,host.clock(),host.reduce(),s.playerHp/Math.max(1,s.playerMaxHp),s.enemyHp/Math.max(1,s.enemyMaxHp)).map(m=>({...m,alpha:m.alpha*1.1})),Phaser.BlendModes.ADD);
  }
 return drawStageLight;
}
