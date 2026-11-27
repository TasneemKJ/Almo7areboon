import type Phaser from 'phaser';
import {baseDamageFrame} from './base-damage.ts';
import {healthOffset,lanePresentation} from './lane-perspective.ts';
import {storybookArt} from './storybook-art.ts';
import {compactNumber} from '../game/format.ts';
import {lang} from '../game/locale.ts';
import type {orderPresentationFrame} from './order-presentation.ts';
import type {GamePort,Side} from '../game/types';
import {xAt,type Layout} from './battlefield-types.ts';

/** Pure painters for the base and troop overlays: wounds on the bases, health bars, role marks and the order pennant. */

/** Smoke, cracks, rubble and sparks on each base by remaining health, plus the brief hit ring. */
export function paintBaseDamage(g:Phaser.GameObjects.Graphics,game:GamePort,layout:Layout,clock:number,reduce:boolean,baseHit:(side:Side)=>number):void {
   g.clear();
   const state=game.state,ground=layout.groundY+12;
   for(const side of ['player','enemy'] as const){
    const x=side==='player'?54:396;
    const hp=side==='player'?state.playerHp:state.enemyHp,maxHp=side==='player'?state.playerMaxHp:state.enemyMaxHp;
    const age=side==='player'?game.profile.age:game.profile.enemyAge;
    for(const mark of baseDamageFrame(age,side,hp,maxHp,clock,reduce)){
     const px=x+mark.x,py=ground+mark.y;
     if(mark.kind==='smoke'){
      g.fillStyle(mark.color,mark.alpha*.28);g.fillCircle(px-mark.size*.16,py+mark.size*.12,mark.size*.72);
      g.fillStyle(mark.color,mark.alpha*.18);g.fillCircle(px+mark.size*.36,py-mark.size*.28,mark.size*.9);
      g.fillStyle(mark.color,mark.alpha*.12);g.fillCircle(px-mark.size*.28,py-mark.size*.62,mark.size*1.08);
     }else if(mark.kind==='crack'){
      const dx=Math.cos(mark.angle)*mark.size,dy=Math.sin(mark.angle)*mark.size;
      g.lineStyle(2.2,0x20363b,mark.alpha*.8);g.lineBetween(px-dx*.22,py-dy*.22,px+dx,py+dy);
      g.lineStyle(.9,mark.color,mark.alpha);g.lineBetween(px,py,px+dx,py+dy);
      g.lineBetween(px+dx*.42,py+dy*.42,px+dx*.62-dy*.28,py+dy*.62+dx*.28);
     }else if(mark.kind==='rubble'){
      const c=Math.cos(mark.angle),s=Math.sin(mark.angle),r=mark.size;
      g.fillStyle(mark.color,mark.alpha);g.fillTriangle(px+c*r,py+s*r,px-s*r*.65,py+c*r*.65,px-c*r*.72+s*r*.42,py-s*r*.72-c*r*.42);
      g.lineStyle(.7,0x31494d,mark.alpha*.65);g.strokeTriangle(px+c*r,py+s*r,px-s*r*.65,py+c*r*.65,px-c*r*.72+s*r*.42,py-s*r*.72-c*r*.42);
     }else{
      const dx=Math.cos(mark.angle)*mark.size*2.6,dy=Math.sin(mark.angle)*mark.size*2.6;
      g.lineStyle(1.2,mark.color,mark.alpha);g.lineBetween(px-dx,py-dy,px+dx,py+dy);
      g.fillStyle(mark.color,mark.alpha*.9);g.fillCircle(px,py,mark.size*.55);
     }
    }
    const hit=baseHit(side);
    if(hit>0&&!reduce){const progress=hit/.18,color=side==='player'?0x91ecf2:0xffc08e;g.lineStyle(2,color,progress*.7);g.strokeEllipse(x,ground-34,58+(1-progress)*12,72+(1-progress)*9);}
   }
}

const ghostBaseRatio=[1,1],lastBaseHp=[-1,-1];
let ghostLastState:unknown=null,lastBaseLang='';

/** Base and troop health bars, optional role marks, and the freeze band. */
export function paintHealthBars(bars:Phaser.GameObjects.Graphics,baseText:Phaser.GameObjects.Text[],game:GamePort,layout:Layout,yAt:(lane:number)=>number,dt=1/60):void {
   const g=bars,s=game.state,locale=lang();g.clear();
   if(ghostLastState!==s){ghostLastState=s;ghostBaseRatio[0]=1;ghostBaseRatio[1]=1;lastBaseHp[0]=-1;lastBaseHp[1]=-1;lastBaseLang=locale;}
   else if(lastBaseLang!==locale){lastBaseHp[0]=-1;lastBaseHp[1]=-1;lastBaseLang=locale;}
   const decay=s.paused||dt<=0?0:1-Math.exp(-dt*7.5);
   for(const [i,x,hp,max,color]of [[0,70,s.playerHp,s.playerMaxHp,0x68c9ee],[1,380,s.enemyHp,s.enemyMaxHp,0xf19d75]]){
    const age=i===0?game.profile.age:game.profile.enemyAge;
    const ratio=Math.max(0,Math.min(1,hp/Math.max(1,max)));
    if(ratio>ghostBaseRatio[i])ghostBaseRatio[i]=ratio;else if(decay>0)ghostBaseRatio[i]+=(ratio-ghostBaseRatio[i])*decay;
    const roofLift=([94,102,98,108,100,102] as const)[age]??98;
    const y=storybookArt(age)?Math.max(46,layout.groundY-roofLift):layout.groundY-85,fill=65*ratio,ghostFill=65*ghostBaseRatio[i];
    g.fillStyle(0x12232f,.92);g.fillRoundedRect(x-38,y-6,76,22,7);
    g.lineStyle(1.15,ratio<.3?0xf19d75:0xd8b46c,.78);g.strokeRoundedRect(x-38,y-6,76,22,7);
    g.fillStyle(0x283e47,1);g.fillRoundedRect(x-33,y+8,66,5,2);
    if(ghostFill>fill+.4){g.fillStyle(0xf8edd0,.75);g.fillRoundedRect(x-32.5,y+8,ghostFill,4,2);}
    if(fill>.1){g.fillStyle(color,1);g.fillRoundedRect(x-32.5,y+8,fill,4,2);}
    baseText[i].setPosition(x,y+1);
    const whole=Math.ceil(hp);
    if(lastBaseHp[i]!==whole){lastBaseHp[i]=whole;baseText[i].setText(compactNumber(hp));}
   }
   for(const unit of s.units)if(unit.hp<unit.maxHp){
    const perspective=lanePresentation(unit.lane,unit.kind),x=xAt(unit.x),y=yAt(unit.lane)-healthOffset(unit.kind,unit.lane),w=(unit.kind===2?31:22)*perspective.scale;
    g.fillStyle(0x203d43,.7);g.fillRoundedRect(x-w/2-1,y-1,w+2,5,2);
    g.fillStyle(unit.side==='player'?0x9de6ef:0xffb18a,1);const fill=w*Math.max(0,unit.hp/unit.maxHp);if(fill>.1)g.fillRoundedRect(x-w/2,y,fill,3,1);
   }
   if(game.profile.marks)for(const unit of s.units){
    // Colour-independent roles and sides: circle melee, triangle ranged, square heavy; filled = yours, outlined = enemy.
    const perspective=lanePresentation(unit.lane,unit.kind),x=xAt(unit.x),y=yAt(unit.lane)-healthOffset(unit.kind,unit.lane)-7*perspective.scale,r=3.6*perspective.scale+1.4;
    const mine=unit.side==='player';
    g.fillStyle(0x10242f,.85);g.lineStyle(1.6,mine?0xf4f0d2:0xffd9a8,1);
    if(unit.kind===1){g.fillTriangle(x,y-r-.6,x-r-.4,y+r*.8,x+r+.4,y+r*.8);}
    else if(unit.kind===2){g.fillRect(x-r,y-r,r*2,r*2);}else{g.fillCircle(x,y,r);}
    if(mine){g.fillStyle(0xf4f0d2,1);const q=r-1.6;if(unit.kind===1)g.fillTriangle(x,y-q-.4,x-q-.3,y+q*.7,x+q+.3,y+q*.7);else if(unit.kind===2)g.fillRect(x-q,y-q,q*2,q*2);else g.fillCircle(x,y,q);}
    if(unit.kind===1)g.strokeTriangle(x,y-r-.6,x-r-.4,y+r*.8,x+r+.4,y+r*.8);else if(unit.kind===2)g.strokeRect(x-r,y-r,r*2,r*2);else g.strokeCircle(x,y,r);
   }
   if(s.freezeUntil>s.time){const y=layout.groundY+12;g.fillStyle(0xbff6ff,.1);g.fillEllipse(300,y,260,34,24);g.lineStyle(2.4,0x10242f,.25);g.strokeEllipse(300,y,252,31,24);g.lineStyle(1.4,0xd6fbff,.48);g.strokeEllipse(300,y,250,30,24);}
}

/** The advance/hold marks on the ground and the pennant; clears its review evidence when no order is shown. */
export function paintOrders(shadows:Phaser.GameObjects.Graphics,orderFrame:ReturnType<typeof orderPresentationFrame>,canvas:()=>HTMLCanvasElement,reduce:boolean):void {
   const g=shadows;const frame=orderFrame;
   if(!frame){delete canvas().dataset.battleOrder;return;}
   for(const mark of frame.marks){
    g.fillStyle(frame.color,.11*frame.pulse);g.fillEllipse(mark.x,mark.y,mark.radius*2.6,9);
    g.lineStyle(1.5,frame.color,.65*frame.pulse);g.strokeEllipse(mark.x,mark.y,mark.radius*2.4,8);
    if(frame.order==='advance'){g.lineStyle(1.5,frame.color,.85);g.beginPath();g.moveTo(mark.x-4,mark.y-2);g.lineTo(mark.x+2,mark.y);g.lineTo(mark.x-4,mark.y+2);g.strokePath();}
   }
   // In the field the company banner carries the order; the old gate pennant would be a second flag.
   if(canvas().closest<HTMLElement>('#app')?.dataset.fieldMode!=='field'){const {x,y,width,alpha,tipOffset}=frame.pennant;g.lineStyle(2,0xb7955f,frame.ready?.6:1);g.lineBetween(x,y,x,y+44);
   g.fillStyle(frame.color,alpha);g.fillTriangle(x+1,y,x+width,y+5+tipOffset,x+1,y+13);
   g.lineStyle(1,0x16394b,frame.ready?.7:1);g.lineBetween(x+4,y+5,x+11,y+8);}
   if(navigator.webdriver)canvas().dataset.battleOrder=JSON.stringify({order:frame.order,ready:frame.ready,count:frame.marks.length,reduced:reduce,pulse:frame.pulse});
}
