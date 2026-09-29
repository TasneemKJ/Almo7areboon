import type Phaser from 'phaser';
import type {Side} from '../game/types.ts';
import {projectilePoint} from './visual-theme.ts';

export type ProjectileShape='stone'|'sling'|'arrow'|'bullet'|'cannonball'|'shell'|'energy'|'meteor';
type Point={x:number;y:number};
type Paint={color:number;alpha:number};
type Mark=Paint & (
 | {type:'line';x1:number;y1:number;x2:number;y2:number;width:number}
 | {type:'circle';x:number;y:number;radius:number}
 | {type:'triangle';x1:number;y1:number;x2:number;y2:number;x3:number;y3:number}
);
export function projectileStyle(age:number,heavy:boolean,meteor=false):{shape:ProjectileShape} {
 if(meteor)return {shape:'meteor'};
 if(age===5)return {shape:'energy'};
 if(heavy&&age===3)return {shape:'cannonball'};
 if(heavy&&age===4)return {shape:'shell'};
 if(age===2)return {shape:'arrow'};
 if(age===3||age===4)return {shape:'bullet'};
 return {shape:age===1?'sling':'stone'};
}

/** Pure glyph geometry; the presentation and standalone art review share this seam. */
export function projectileGeometry(from:Point,to:Point,progress:number,arc:number,age:number,heavy:boolean,side:Side,meteor=false):{tip:Point;marks:Mark[]} {
 const tip=projectilePoint(from,to,progress,arc);
 const previous=projectilePoint(from,to,Math.max(0,(Number.isFinite(progress)?progress:0)-.18),arc);
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
 const direction=length?{x:dx/length,y:dy/length}:{x:1,y:0};
 const at=(along:number,across=0)=>({x:tip.x+direction.x*along-direction.y*across,y:tip.y+direction.y*along+direction.x*across});
 const marks:Mark[]=[];
 const line=(a:Point,b:Point,color:number,width:number,alpha=1)=>marks.push({type:'line',x1:a.x,y1:a.y,x2:b.x,y2:b.y,color,width,alpha});
 const circle=(point:Point,radius:number,color:number,alpha=1)=>marks.push({type:'circle',...point,radius,color,alpha});
 const triangle=(a:Point,b:Point,c:Point,color:number,alpha=1)=>marks.push({type:'triangle',x1:a.x,y1:a.y,x2:b.x,y2:b.y,x3:c.x,y3:c.y,color,alpha});
 const shape=projectileStyle(age,heavy,meteor).shape;
 switch(shape){
  case 'stone':case 'sling': {
   const radius=shape==='stone'?3.7:2.5;
   circle(tip,radius,0x50666b);circle(at(-.5,-.7),radius*.75,0xafbeb0);
   triangle(at(-radius*.5,-radius*.5),at(radius*.6,-radius*.5),at(-.4,.5),0xe4e9c8);
   break;
  }
  case 'arrow':
   line(at(-14),at(-3),0x664b36,1.8);
   triangle(tip,at(-5,-2.8),at(-5,2.8),0x3c565e);
   triangle(at(-.8),at(-4.5,-1.8),at(-4.5,.6),0xe5efda);
   line(at(-13,-2.6),at(-10),0xeedbb1,1.3);line(at(-13,2.6),at(-10),0xeedbb1,1.3);
   break;
  case 'bullet':
   line(at(-9),tip,0xffd384,2.2);line(at(-5),tip,0xfff3cb,.8);
   break;
  case 'cannonball':
   line(previous,at(-2),0xc5c2a5,2,.45);circle(tip,4,0x263e47);circle(at(-1,-1),2.5,0x627977);circle(at(-1.7,-1.9),.8,0xd3debc);
   break;
  case 'shell':
   line(previous,at(-3),0xffd096,2.5,.55);
   triangle(at(1),at(-7,-2.5),at(-7,2.5),0x344e54);
   triangle(tip,at(-6,-1.6),at(-6,1.6),0xe6bd79);
   break;
  case 'energy': {
   const color=side==='player'?0x84f5ee:0xffa2ab;
   line(at(-heavyLength(heavy)),tip,color,heavy?7:4,.28);
   line(at(-heavyLength(heavy)+1),tip,color,heavy?3.5:2,1);
   line(at(-heavyLength(heavy)+2),tip,0xe8fff0,heavy?1.5:.8,1);
   break;
  }
  case 'meteor':
   line(previous,tip,0xd78b67,12,.22);line(previous,tip,0xffae62,7,.6);
   circle(tip,6.5,0xe67547);circle(at(-.8,-1),4.8,0xffd083);circle(at(-1,-1.6),2.5,0xfff4cb);
   break;
 }
 return {tip,marks};
}
const heavyLength=(heavy:boolean)=>heavy?19:13;

export function paintProjectile(graphics:Phaser.GameObjects.Graphics,geometry:ReturnType<typeof projectileGeometry>):void {
 for(const mark of geometry.marks){
  if(mark.type==='line')graphics.lineStyle(mark.width,mark.color,mark.alpha).lineBetween(mark.x1,mark.y1,mark.x2,mark.y2);
  else if(mark.type==='circle')graphics.fillStyle(mark.color,mark.alpha).fillCircle(mark.x,mark.y,mark.radius);
  else graphics.fillStyle(mark.color,mark.alpha).fillTriangle(mark.x1,mark.y1,mark.x2,mark.y2,mark.x3,mark.y3);
 }
}
