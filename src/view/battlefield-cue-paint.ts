import type Phaser from 'phaser';
import type {attackCueFrame} from './combat-choreography.ts';
import type {impactMaterialFrame} from './impact-material.ts';
import type {projectileGeometry} from './projectile-art.ts';
import type {Bolt,Flare,ImpactCue} from './battlefield-types.ts';
import {projectileGlow} from './cinematic-grade.ts';
import {projectileStyle} from './projectile-art.ts';

type G=Phaser.GameObjects.Graphics;

/** One mark of an attack cue (slash, muzzle flash, energy, smoke, dust or streak) at its projected position. */
export function paintAttackMark(g:G,mark:ReturnType<typeof attackCueFrame>[number],x:number,y:number,forward:number,size:number):void {
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

/** The small guard, pierce or sweep glyph over a trait hit. */
export function paintTraitCue(layer:G,cue:ImpactCue&{trait:NonNullable<ImpactCue['trait']>},alpha:number,size:number):void {
  const x=cue.x,y=cue.y;
  layer.lineStyle(2,cue.trait==='guard'?0xa8e9ef:cue.trait==='pierce'?0xffe5a2:0xf6b993,alpha);
  if(cue.trait==='guard'){
   layer.beginPath();layer.moveTo(x-size*.7,y-size);layer.lineTo(x+size*.7,y-size);layer.lineTo(x+size*.6,y+size*.2);layer.lineTo(x,y+size*.85);layer.lineTo(x-size*.6,y+size*.2);layer.closePath();layer.strokePath();
  }else if(cue.trait==='pierce'){
   layer.lineBetween(x-size,y+size*.65,x+size,y-size*.65);layer.lineBetween(x+size*.25,y-size*.65,x+size,y-size*.65);layer.lineBetween(x+size,y-size*.65,x+size,y+size*.1);
  }else{
   layer.beginPath();layer.arc(x,y,size*1.15,.15,Math.PI-.15);layer.strokePath();layer.lineBetween(x-size*.9,y+size*.2,x-size*1.2,y-size*.2);
  }
}

/** One mark of the material impact frame (flash, pulse, dust, smoke, spark or debris). */
export function paintImpactMark(g:G,mark:ReturnType<typeof impactMaterialFrame>[number],x:number,y:number,size:number):void {
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

/** The additive light carried by a projectile, with its trail. */
export function paintBoltLight(glow:G,bolt:Bolt,shot:ReturnType<typeof projectileGeometry>,progress:number):void {
  const light=projectileGlow(projectileStyle(bolt.age,bolt.heavy,bolt.meteor).shape,bolt.side);
  if(light.alpha>0){
   const back=Math.max(0,progress-.22),tail={x:bolt.from.x+(shot.tip.x-bolt.from.x)*(back/Math.max(.01,progress)),y:bolt.from.y+(shot.tip.y-bolt.from.y)*(back/Math.max(.01,progress))};
   if(light.trail>0){glow.lineStyle(light.radius*.7,light.color,light.alpha*light.trail*.35);glow.lineBetween(tail.x,tail.y,shot.tip.x,shot.tip.y);}
   glow.fillStyle(light.color,light.alpha*.3);glow.fillCircle(shot.tip.x,shot.tip.y,light.radius);
   glow.fillStyle(light.color,light.alpha*.6);glow.fillCircle(shot.tip.x,shot.tip.y,light.radius*.45);
  }
}

/** The glow of one flare, fading as its life runs out. */
export function paintFlare(glow:G,flare:Flare):void {
  const k=Math.max(0,flare.life/flare.max),r=flare.radius*(1.15-k*.4);
    glow.fillStyle(flare.color,k*.22);glow.fillCircle(flare.x,flare.y,r);glow.fillStyle(flare.color,k*.4);glow.fillCircle(flare.x,flare.y,r*.42);glow.fillStyle(0xffffff,k*.35);glow.fillCircle(flare.x,flare.y,r*.16);
}
