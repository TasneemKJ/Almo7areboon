import type Phaser from 'phaser';import type {GameEvent} from '../game/types.ts';
export function isProvisionDrop(event:GameEvent):boolean {return event.type==='skill'&&event.skill==='food'&&!event.storyCue&&Number.isFinite(event.amount)&&(event.amount??0)>0;}
export function provisionFrame(at:number,now:number,reduced:boolean) {
 const age=now-at;if(!Number.isFinite(age)||age<0||now>=at+.85)return null;
 return {alpha:1-age/.85,lift:reduced?0:Math.sin(Math.min(1,age/.4)*Math.PI)*7};
}
export function paintProvision(g:Phaser.GameObjects.Graphics,y:number,at:number,now:number,reduced:boolean):void {
 const f=provisionFrame(at,now,reduced);if(!f)return;
 g.fillStyle(0xe3c58c,f.alpha*.68);g.fillRoundedRect(110,y-8-f.lift,18,7,2);
 g.lineStyle(1.2,0xf6dfac,f.alpha*.7);g.lineBetween(114,y-5-f.lift,117,y-2-f.lift);g.lineBetween(120,y-5-f.lift,123,y-2-f.lift);
}
