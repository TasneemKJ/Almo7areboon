import type Phaser from 'phaser';
import {groundEffectLayer} from './ground-effects.ts';
import {attackCueFrame} from './combat-choreography.ts';
import {impactMaterialFrame} from './impact-material.ts';
import {lanePresentation} from './lane-perspective.ts';
import {projectileGeometry,paintProjectile,projectileStyle} from './projectile-art.ts';
import {projectileGlow} from './cinematic-grade.ts';
import {DeathVisuals} from './death-visuals.ts';
import {stackedY} from './floater-stack.ts';
import {baseDamagePalette,baseDamageStage} from './base-damage.ts';
import {compactNumber} from '../game/format.ts';
import type {GamePort,Side,Unit} from '../game/types';
import type {createBattlefieldMarks} from './battlefield-marks.ts';
import {noise,type AttackCue,type Bolt,type Flare,type Floater,type ImpactCue,type Layout,type Ring,type Spark} from './battlefield-types.ts';

export interface EffectsHost {
 scene:Phaser.Scene;
 game:GamePort;
 world():Phaser.GameObjects.Container;
 canvas():HTMLCanvasElement;
 layout():Layout;
 reduce():boolean;
 clock():number;
 /** Overrides the automation flag that gates review evidence (defaults to navigator.webdriver). */
 webdriver?():boolean;
}

/**
 * Transient combat feedback: sparks, rings, projectiles, flares, floating numbers and the
 * attack and impact cues, plus the hit-stop timer. Owns its pools; the scene feeds it events.
 */
export function createBattlefieldEffects(host:EffectsHost,layers:{fx:Phaser.GameObjects.Graphics;glow:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[]},marks:ReturnType<typeof createBattlefieldMarks>){
 const {fx,glow,groundFx}=layers;
 let sparks:Spark[]=[],bolts:Bolt[]=[],rings:Ring[]=[],attackCues:AttackCue[]=[],impactCues:ImpactCue[]=[],flares:Flare[]=[],floaters:Floater[]=[];
 let baseHit:Record<Side,number>={player:0,enemy:0};
 let stop=0,cool=0,stops=0;
 const fallen=new DeathVisuals();
 function flare(x:number,y:number,radius:number,color:number,life=.22):void {
   if(host.reduce())return;
   flares.push({x,y,radius,color,life,max:life});if(flares.length>48)flares.shift();
  }
 function baseImpact(x:number,y:number,amount:number,heavy:boolean,targetSide:Side,targetAge:number):void {
   baseHit[targetSide]=.18;
   const palette=baseDamagePalette(targetAge),state=host.game.state;
   const hp=targetSide==='player'?state.playerHp:state.enemyHp,maxHp=targetSide==='player'?state.playerMaxHp:state.enemyMaxHp;
   const critical=baseDamageStage(hp,maxHp)==='critical';
   emit(x,y,critical?(heavy?13:9):(heavy?9:6),palette.debris,true,critical?.5:.36);
   ring(x,y,targetSide==='player'?0x8fe7f0:0xffbb8b,heavy?29:18);
   flare(x,y,heavy?34:22,targetSide==='player'?0x7fdcff:0xffa060,heavy?.34:.24);
   if(amount>0)floatText(x,y-17,compactNumber(amount),'#fff1c8',false,heavy);
   if(heavy&&!host.reduce())host.scene.cameras.main.shake(55,.0012);
  }
 function drawAttackCues(dt:number):void {
   for(const cue of attackCues){
    const g=groundEffectLayer(groundFx,fx,cue.lane);
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    const perspective=lanePresentation(cue.lane,cue.kind);
    for(const mark of attackCueFrame(cue.age,cue.kind,cue.side,progress,host.reduce())){
     const x=cue.x+mark.x*perspective.scale,y=cue.y+mark.y*perspective.scale,forward=cue.side==='player'?1:-1,size=mark.size*perspective.scale;
     if(mark.kind==='slash'){
      const a0=mark.angle-.72*forward,a1=mark.angle,a2=mark.angle+.72*forward;
      const p0={x:x+Math.cos(a0)*size,y:y+Math.sin(a0)*size};
      const p1={x:x+Math.cos(a1)*size*1.22,y:y+Math.sin(a1)*size*1.22};
      const p2={x:x+Math.cos(a2)*size,y:y+Math.sin(a2)*size};
      g.lineStyle(5,mark.color,mark.alpha*.18);g.lineBetween(p0.x,p0.y,p1.x,p1.y);g.lineBetween(p1.x,p1.y,p2.x,p2.y);
      g.lineStyle(1.7,mark.color,mark.alpha);g.lineBetween(p0.x,p0.y,p1.x,p1.y);g.lineBetween(p1.x,p1.y,p2.x,p2.y);
     }else if(mark.kind==='muzzle'||mark.kind==='flash'){
      g.fillStyle(mark.color,mark.alpha*.92);g.fillTriangle(x+forward*size,y,x-forward*size*.45,y-size*.58,x-forward*size*.45,y+size*.58);
      g.lineStyle(1.1,0xfff6d0,mark.alpha);g.lineBetween(x-forward*size*.4,y,x+forward*size*1.35,y);
      if(mark.kind==='muzzle'){g.lineBetween(x,y-size*.75,x,y+size*.75);}
     }else if(mark.kind==='energy'){
      g.fillStyle(mark.color,mark.alpha*.18);g.fillCircle(x,y,size*1.35);g.lineStyle(2,mark.color,mark.alpha);g.strokeCircle(x,y,size*.72);g.fillStyle(0xf0ffff,mark.alpha);g.fillCircle(x,y,size*.24);
     }else if(mark.kind==='smoke'){
      g.fillStyle(mark.color,mark.alpha*.24);g.fillCircle(x-size*.2,y+size*.1,size*.65);g.fillCircle(x+size*.35,y-size*.25,size*.82);
     }else if(mark.kind==='dust'){
      g.fillStyle(mark.color,mark.alpha*.22);g.fillEllipse(x,y,size*2.2,size*.72);
     }else{
      const dx=Math.cos(mark.angle)*size,dy=Math.sin(mark.angle)*size;g.lineStyle(2.1,mark.color,mark.alpha*.72);g.lineBetween(x-dx,y-dy,x+dx,y+dy);
     }
    }
   }
   attackCues=attackCues.filter(cue=>cue.life>0);
  }
 function drawImpactCues(dt:number):void {
   const g=fx;
   for(const cue of impactCues){
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    if(cue.trait){
     const layer=groundEffectLayer(groundFx,g,cue.lane),alpha=host.reduce()?.85:Math.max(0,1-progress),size=host.reduce()?11:11+progress*5;
     const x=cue.x,y=cue.y;
     layer.lineStyle(2,cue.trait==='guard'?0xa8e9ef:cue.trait==='pierce'?0xffe5a2:0xf6b993,alpha);
     if(cue.trait==='guard'){
      layer.beginPath();layer.moveTo(x-size*.7,y-size);layer.lineTo(x+size*.7,y-size);layer.lineTo(x+size*.6,y+size*.2);layer.lineTo(x,y+size*.85);layer.lineTo(x-size*.6,y+size*.2);layer.closePath();layer.strokePath();
     }else if(cue.trait==='pierce'){
      layer.lineBetween(x-size,y+size*.65,x+size,y-size*.65);layer.lineBetween(x+size*.25,y-size*.65,x+size,y-size*.65);layer.lineBetween(x+size,y-size*.65,x+size,y+size*.1);
     }else{
      layer.beginPath();layer.arc(x,y,size*1.15,.15,Math.PI-.15);layer.strokePath();layer.lineBetween(x-size*.9,y+size*.2,x-size*1.2,y-size*.2);
     }
     continue;
    }
    for(const mark of impactMaterialFrame(cue.age,cue.kind,cue.side,progress,host.reduce())){
     const x=cue.x+mark.x,y=cue.y+mark.y,size=mark.size;
     if(mark.kind==='flash'){
      g.fillStyle(mark.color,mark.alpha*.18);g.fillCircle(x,y,size*1.35);
      g.fillStyle(mark.color,mark.alpha);g.fillCircle(x,y,size*.34);
     }else if(mark.kind==='pulse'){
      g.lineStyle(1.5,mark.color,mark.alpha*.72);g.strokeEllipse(x,y,size*2,size*1.15);
      g.fillStyle(mark.color,mark.alpha*.12);g.fillEllipse(x,y,size*1.45,size*.76);
     }else if(mark.kind==='dust'||mark.kind==='smoke'){
      g.fillStyle(mark.color,mark.alpha*(mark.kind==='smoke'?.34:.26));g.fillEllipse(x,y,size*2.1,size*(mark.kind==='smoke'?1.35:.68));
     }else if(mark.kind==='spark'){
      const dx=Math.cos(mark.angle)*size,dy=Math.sin(mark.angle)*size;
      g.lineStyle(1.35,mark.color,mark.alpha);g.lineBetween(x-dx*.22,y-dy*.22,x+dx,y+dy);
      g.fillStyle(mark.color,mark.alpha*.9);g.fillCircle(x,y,Math.max(.6,size*.18));
     }else{
      const c=Math.cos(mark.angle),sn=Math.sin(mark.angle),r=size;
      g.fillStyle(mark.color,mark.alpha);g.fillTriangle(x+c*r,y+sn*r,x-sn*r*.65,y+c*r*.65,x-c*r*.55+sn*r*.42,y-sn*r*.55-c*r*.42);
     }
    }
   }
   impactCues=impactCues.filter(cue=>cue.life>0);
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
   const text=host.scene.add.text(px,y,value,{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:large?'22px':heavy?'15px':'13px',fontStyle:'bold',color,stroke:'#132a33',strokeThickness:large?5:3}).setOrigin(.5).setShadow(0,2,'#08171d',large?6:3,true,true);
   const floater={text,life,max:life,startY:y,banner:large};host.world().add(text);floaters.push(floater);
   // Skill and reward banners never compete with damage numbers for the 24 recycled slots.
   const numbers=floaters.filter(f=>!f.banner);
   if(numbers.length>24){const oldest=numbers[0];oldest.text.destroy();floaters.splice(floaters.indexOf(oldest),1);}
   return floater;
  }
 function impact(x:number,y:number,amount:number,age:number,kind:Unit['kind'],side:Side,heavy=kind===2):void {
   impactCues.push({x,y,age,kind,side,life:heavy?.3:.24,max:heavy?.3:.24});if(impactCues.length>54)impactCues.shift();
   flare(x,y,heavy?22:13,side==='player'?0xbfefff:0xffc890,heavy?.26:.18);
   if(amount>0)floatText(x,y-15,compactNumber(amount),'#fff1c8',false,heavy);
  }
 function step(dt:number):void {
   const g=fx;g.clear();glow.clear();marks.step(dt);drawAttackCues(dt);drawImpactCues(dt);fallen.step(dt,host.reduce());
   baseHit.player=Math.max(0,baseHit.player-dt);baseHit.enemy=Math.max(0,baseHit.enemy-dt);
   for(const spark of sparks){spark.life-=dt;spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;spark.vy+=(spark.dust?-3:50)*dt;
    const layer=groundEffectLayer(groundFx,g,spark.lane),alpha=Math.max(0,spark.life/spark.max);layer.fillStyle(spark.color,alpha*(spark.dust?.3:1));layer.fillCircle(spark.x,spark.y,spark.size*(spark.dust?2-alpha:1));
    if(!spark.dust){glow.fillStyle(spark.color,alpha*.35);glow.fillCircle(spark.x,spark.y,spark.size*2.6);}}
   sparks=sparks.filter(p=>p.life>0);
   for(const ring of rings){ring.life-=dt;const p=1-Math.max(0,ring.life/ring.max);g.lineStyle(2-p,ring.color,(1-p)*.7);g.strokeEllipse(ring.x,ring.y,ring.radius*2*p,ring.radius*p);}
   rings=rings.filter(r=>r.life>0);
   for(const bolt of bolts){
    bolt.life-=dt;const progress=1-Math.max(0,bolt.life)/bolt.max;
    const shot=projectileGeometry(bolt.from,bolt.to,progress,bolt.arc,bolt.age,bolt.heavy,bolt.side,bolt.meteor);
    const light=projectileGlow(projectileStyle(bolt.age,bolt.heavy,bolt.meteor).shape,bolt.side);
    if(light.alpha>0){
     const back=Math.max(0,progress-.22),tail={x:bolt.from.x+(shot.tip.x-bolt.from.x)*(back/Math.max(.01,progress)),y:bolt.from.y+(shot.tip.y-bolt.from.y)*(back/Math.max(.01,progress))};
     if(light.trail>0){glow.lineStyle(light.radius*.7,light.color,light.alpha*light.trail*.35);glow.lineBetween(tail.x,tail.y,shot.tip.x,shot.tip.y);}
     glow.fillStyle(light.color,light.alpha*.3);glow.fillCircle(shot.tip.x,shot.tip.y,light.radius);
     glow.fillStyle(light.color,light.alpha*.6);glow.fillCircle(shot.tip.x,shot.tip.y,light.radius*.45);
    }
    paintProjectile(g,shot);
    if(bolt.life<=0){if(bolt.targetBase&&bolt.targetSide!==undefined&&bolt.targetAge!==undefined)baseImpact(bolt.to.x,bolt.to.y,bolt.damage,bolt.heavy,bolt.targetSide,bolt.targetAge);else impact(bolt.to.x,bolt.to.y,bolt.damage,bolt.age,bolt.kind,bolt.side,bolt.heavy);if(bolt.memory)marks.remember(bolt.memory);}
   }
   bolts=bolts.filter(b=>b.life>0);
   if(navigator.webdriver){const pending=bolts.flatMap(b=>b.memory?[b.memory.kind]:[]);if(pending.length)host.canvas().dataset.battlefieldMemoryPending=JSON.stringify(pending);else delete host.canvas().dataset.battlefieldMemoryPending;}
   for(const flare of flares){flare.life-=dt;const k=Math.max(0,flare.life/flare.max),r=flare.radius*(1.15-k*.4);
    glow.fillStyle(flare.color,k*.22);glow.fillCircle(flare.x,flare.y,r);glow.fillStyle(flare.color,k*.4);glow.fillCircle(flare.x,flare.y,r*.42);glow.fillStyle(0xffffff,k*.35);glow.fillCircle(flare.x,flare.y,r*.16);}
   flares=flares.filter(f=>f.life>0);
   for(const f of floaters){f.life-=dt;const progress=1-f.life/f.max;f.text.setY(f.startY-(host.reduce()?0:progress*22)).setAlpha(Math.max(0,Math.min(1,f.life/f.max*2)));if(f.life<=0)f.text.destroy();}
   floaters=floaters.filter(f=>f.life>0);
   marks.rewardEvidence(floaters);
 }
 function reset(reason:'motion'|'scene'='scene'):void {
  stop=0;cool=0;delete host.canvas().dataset.battleOrder;baseHit={player:0,enemy:0};
  marks.reset(reason,bolts.flatMap(b=>b.memory?[b.memory]:[]));
  delete host.canvas().dataset.battlefieldMemoryPending;
  for(const g of groundFx)g.clear();
  attackCues=[];impactCues=[];fallen.clear();for(const f of floaters)f.text.destroy();floaters=[];sparks=[];bolts=[];rings=[];flares=[];glow.clear();
 }
 return {
  fallen,emit,ring,flare,floatText,impact,baseImpact,step,reset,
  /** Seconds left on each base's hit pulse, read by the base-damage painter. */
  baseHit:(side:Side)=>baseHit[side],
  pushImpactCue(cue:ImpactCue):void {impactCues.push(cue);if(impactCues.length>54)impactCues.shift();},
  pushAttackCue(cue:AttackCue):void {attackCues.push(cue);if(attackCues.length>42)attackCues.shift();},
  /** Projectiles are capped at 70 in flight; meteors (at most six per cast) are not. */
  pushBolt(bolt:Bolt,capped=true):void {bolts.push(bolt);if(capped&&bolts.length>70)bolts.shift();},
  /** Hit-stop: a heavy blow freezes the scene for about 50 ms, at most twice a second. */
  hitStop:{
   get count():number {return stops;},
   get remaining():number {return stop;},
   get cooldown():number {return cool;},
   trigger():boolean {if(cool>0)return false;stop=.05;cool=.5;stops++;if(host.webdriver?host.webdriver():navigator.webdriver)host.canvas().dataset.hitStops=String(stops);return true;},
   cancel():void {stop=0;cool=0;},
   /** Cools the limiter and reports whether this frame is frozen. */
   frozen(dt:number):boolean {
    if(cool>0)cool=Math.max(0,cool-dt);
    if(stop>0){stop=Math.max(0,stop-dt);return true;}
    return false;
   },
  },
 };
}
