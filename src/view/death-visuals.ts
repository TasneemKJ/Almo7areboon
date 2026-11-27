import type {Side} from '../game/types.ts';

interface FallingSprite {
 x:number;y:number;scaleX:number;scaleY:number;angle:number;
 setPosition(x:number,y:number):unknown;
 setScale(x:number,y:number):unknown;
 setAngle(angle:number):unknown;
 setAlpha(alpha:number):unknown;
 destroy():void;
}
interface Fallen {
 sprite:FallingSprite;x:number;y:number;scaleX:number;scaleY:number;angle:number;
 elapsed:number;direction:number;
}
/** View-only residues: never targets, colliders, rewards, or saved units. */
export class DeathVisuals {
 private items:Fallen[]=[];
 get size():number {return this.items.length;}
 add(sprite:FallingSprite,side:Side):void {
  this.items.push({sprite,x:sprite.x,y:sprite.y,scaleX:sprite.scaleX,scaleY:sprite.scaleY,angle:sprite.angle,elapsed:0,direction:side==='player'?-1:1});
  if(this.items.length>24)this.items.shift()!.sprite.destroy();
 }
 step(dt:number,reduced:boolean):void {
  if(reduced){this.clear();return;}
  if(!this.items.length||!Number.isFinite(dt)||dt<=0)return;
  let w=0;
  for(let i=0;i<this.items.length;i++){
   const item=this.items[i];
   item.elapsed+=dt;
   if(item.elapsed>=.36){item.sprite.destroy();continue;}
   const progress=item.elapsed/.36,scale=1-progress*.18;
   item.sprite.setPosition(item.x+item.direction*9*progress,item.y+10*progress);
   item.sprite.setScale(item.scaleX*scale,item.scaleY*scale);
   item.sprite.setAngle(item.angle+item.direction*38*progress);
   item.sprite.setAlpha(Math.max(0,1-progress*progress));
   this.items[w++]=item;
  }
  this.items.length=w;
 }
 clear():void {
  for(const item of this.items)item.sprite.destroy();
  this.items=[];
 }
}
