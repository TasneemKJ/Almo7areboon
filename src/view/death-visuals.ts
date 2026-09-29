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
  this.items.push({sprite,x:sprite.x,y:sprite.y,scaleX:sprite.scaleX,scaleY:sprite.scaleY,angle:sprite.angle,elapsed:0,direction:side==='player'?1:-1});
  if(this.items.length>24)this.items.shift()!.sprite.destroy();
 }
 step(dt:number,reduced:boolean):void {
  if(reduced){this.clear();return;}
  if(!Number.isFinite(dt)||dt<=0)return;
  this.items=this.items.filter(item=>{
   item.elapsed+=dt;
   if(item.elapsed>=.28){item.sprite.destroy();return false;}
   const progress=item.elapsed/.28,scale=1-progress*.16;
   item.sprite.setPosition(item.x+item.direction*5*progress,item.y+8*progress);
   item.sprite.setScale(item.scaleX*scale,item.scaleY*scale);
   item.sprite.setAngle(item.angle+item.direction*18*progress);
   item.sprite.setAlpha(Math.max(0,1-progress*progress));
   return true;
  });
 }
 clear():void {
  for(const item of this.items)item.sprite.destroy();
  this.items=[];
 }
}
