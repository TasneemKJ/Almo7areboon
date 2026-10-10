import type Phaser from 'phaser';
export function frostFrame(until:number,time:number,reduced:boolean) {
 const left=until-time;if(!Number.isFinite(left)||left<=0)return null;
 const thaw=left<.55;
 return {thaw,alpha:reduced?.65:thaw?.35+.3*left/.55:.65,spread:reduced?6:thaw?6+(1-left/.55)*3:6};
}
export function paintFrost(g:Phaser.GameObjects.Graphics,x:number,y:number,until:number,time:number,reduced:boolean):void {
 const f=frostFrame(until,time,reduced);if(!f)return;const s=f.spread;
 g.lineStyle(1.2,0xbdeef1,f.alpha);g.lineBetween(x-s,y-19,x+s,y-19);g.lineBetween(x-s,y-19,x-s*.7,y-24);
 if(f.thaw){g.lineBetween(x-2,y-22,x+1,y-18);g.lineBetween(x+1,y-18,x+4,y-21);}
 else {g.lineBetween(x+s,y-19,x+s*.7,y-24);}
}
