import type Phaser from 'phaser';
export function meteorLandingFrame(elapsed:number,reduced:boolean) {
 if(!Number.isFinite(elapsed)||elapsed<0||elapsed>=.5)return null;
 return {radius:reduced?17:6+28*(1-(1-elapsed/.5)**3),alpha:(1-elapsed/.5)*.5};
}
export function paintMeteorLanding(g:Phaser.GameObjects.Graphics,x:number,y:number,elapsed:number,reduced:boolean):void {
 const f=meteorLandingFrame(elapsed,reduced);if(!f)return;
 g.lineStyle(1.5,0xeab886,f.alpha);g.strokeEllipse(x,y+8,f.radius*2,f.radius*.5);
 g.lineStyle(1,0xffd9a1,f.alpha*.55);g.strokeEllipse(x,y+8,f.radius*1.6,f.radius*.36);
}
