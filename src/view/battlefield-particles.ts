import type Phaser from 'phaser';
import {groundEffectLayer} from './ground-effects.ts';
import {stackedY} from './floater-stack.ts';
import {paintFlare} from './battlefield-cue-paint.ts';
import {noise,type Flare,type Floater,type Ring,type Spark} from './battlefield-types.ts';

export interface ParticleHost {
 scene:Phaser.Scene;
 world():Phaser.GameObjects.Container;
 reduce():boolean;
 clock():number;
}

/** Pools of transient decoration: sparks and dust, expanding rings, light flares and floating numbers. */
export function createParticles(host:ParticleHost,layers:{fx:Phaser.GameObjects.Graphics;glow:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[]}){
 const {fx,glow,groundFx}=layers;
 let sparks:Spark[]=[],rings:Ring[]=[],flares:Flare[]=[],floaters:Floater[]=[];
 const textPool:Phaser.GameObjects.Text[]=[];
 function recycleText(text:Phaser.GameObjects.Text):void {
  if(textPool.length<32){text.setVisible(false);textPool.push(text);}
  else text.destroy();
 }
 function flare(x:number,y:number,radius:number,color:number,life=.22):void {
   if(host.reduce())return;
   flares.push({x,y,radius,color,life,max:life});if(flares.length>48)flares.shift();
  }
 function emit(x:number,y:number,count:number,color:number,dust=false,life=.36,lane?:number):void {
   if(host.reduce())return;
   for(let i=0;i<count;i++){const a=noise(i+host.clock()*39)*Math.PI*2,speed=dust?8:22+noise(i+8)*39;
    sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-15,life,max:life,size:dust?3:1.3+noise(i+19)*2.5,color,dust,lane});}
   if(sparks.length>180)sparks.splice(0,sparks.length-180);
  }
 function ring(x:number,y:number,color:number,radius=18):void {
   if(host.reduce())return;
   rings.push({x,y,life:.32,max:.32,radius,color});if(rings.length>24)rings.shift();
  }
 function floatText(x:number,y:number,value:string,color='#fff1c8',large=false,heavy=false):Floater {
   const life=large?1.05:.62;
   const px=Math.max(22,Math.min(428,x));
   y=stackedY(floaters.map(f=>({x:f.text.x,startY:f.startY,life:f.life,max:f.max,banner:f.banner})),px,y,large);
   const text=textPool.pop();
   if(text){
    text.setPosition(px,y).setText(value).setColor(color).setFontSize(large?'22px':heavy?'15px':'13px').setStroke('#132a33',large?5:3).setShadow(0,2,'#08171d',large?6:3,true,true).setAlpha(1).setScale(1).setVisible(true);
   }else{
    const created=host.scene.add.text(px,y,value,{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:large?'22px':heavy?'15px':'13px',fontStyle:'bold',color,stroke:'#132a33',strokeThickness:large?5:3}).setOrigin(.5).setShadow(0,2,'#08171d',large?6:3,true,true);
    host.world().add(created);
    const floater={text:created,life,max:life,startY:y,heavy,banner:large};floaters.push(floater);
    const numbers=floaters.filter(f=>!f.banner);
    if(numbers.length>24){const oldest=numbers[0];recycleText(oldest.text);floaters.splice(floaters.indexOf(oldest),1);}
    const banners=floaters.filter(f=>f.banner);
    if(banners.length>6){const oldest=banners[0];recycleText(oldest.text);floaters.splice(floaters.indexOf(oldest),1);}
    return floater;
   }
   const floater={text,life,max:life,startY:y,heavy,banner:large};floaters.push(floater);
   // Skill and reward banners never compete with damage numbers for the 24 recycled slots.
   const numbers=floaters.filter(f=>!f.banner);
   if(numbers.length>24){const oldest=numbers[0];recycleText(oldest.text);floaters.splice(floaters.indexOf(oldest),1);}
   const banners=floaters.filter(f=>f.banner);
   if(banners.length>6){const oldest=banners[0];recycleText(oldest.text);floaters.splice(floaters.indexOf(oldest),1);}
   return floater;
  }

 return {
  emit,ring,flare,floatText,
  stepSparks(dt:number):void {
   const g=fx;let w=0;
   for(let i=0;i<sparks.length;i++){const spark=sparks[i];spark.life-=dt;spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;spark.vy+=(spark.dust?-3:50)*dt;
    const layer=groundEffectLayer(groundFx,g,spark.lane),alpha=Math.max(0,spark.life/spark.max);layer.fillStyle(spark.color,alpha*(spark.dust?.3:1));layer.fillCircle(spark.x,spark.y,spark.size*(spark.dust?2-alpha:1));
    if(!spark.dust){glow.fillStyle(spark.color,alpha*.35);glow.fillCircle(spark.x,spark.y,spark.size*2.6);}
    if(spark.life>0)sparks[w++]=spark;}
   sparks.length=w;
  },
  stepRings(dt:number):void {
   const g=fx;let w=0;
   for(let i=0;i<rings.length;i++){const ring=rings[i];ring.life-=dt;const p=1-Math.max(0,ring.life/ring.max);g.lineStyle(2-p,ring.color,(1-p)*.7);g.strokeEllipse(ring.x,ring.y,ring.radius*2*p,ring.radius*p);if(ring.life>0)rings[w++]=ring;}
   rings.length=w;
  },
  stepFlares(dt:number):void {
   let w=0;
   for(let i=0;i<flares.length;i++){const flare=flares[i];flare.life-=dt;paintFlare(glow,flare);if(flare.life>0)flares[w++]=flare;}
   flares.length=w;
  },
  stepFloaters(dt:number):void {
   let w=0;
   for(let i=0;i<floaters.length;i++){const f=floaters[i];f.life-=dt;const progress=1-f.life/f.max;if(!host.reduce()&&(f.banner||f.heavy)){const pop=progress<.16?1.22-.22*(progress/.16):1;f.text.setScale(pop);}f.text.setY(f.startY-(host.reduce()?0:progress*22)).setAlpha(Math.max(0,Math.min(1,f.life/f.max*2)));if(f.life<=0)recycleText(f.text);else floaters[w++]=f;}
   floaters.length=w;
  },
  floaters:():readonly Floater[]=>floaters,
  clear():void {for(const f of floaters)f.text.destroy();for(const t of textPool)t.destroy();textPool.length=0;floaters=[];sparks=[];rings=[];flares=[];},
 };
}
