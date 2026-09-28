import Phaser from 'phaser';
import { reducedMotion, projectileForHit } from './combat-feedback.ts';
import { compactNumber } from '../ui/battle-hud.ts';
import type { BattleState, GameEvent, GamePort, Unit } from '../game/types';
import { circle, drawBase, drawTroop, ellipse, line, poly } from './art';

const W=450,H=430;
const worldX=(x:number)=>x*.45;
const worldY=(lane:number)=>276+lane*13;
type Particle={x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:number;kind:'dust'|'spark'|'coin'|'ice'};
type Bolt={x:number;y:number;tx:number;ty:number;life:number;max:number;side:'player'|'enemy';age:number;kind:Unit['kind']};
type Floater={text:Phaser.GameObjects.Text;life:number;max:number;startY:number};
type UnitView={body:Phaser.GameObjects.Graphics;shadow:Phaser.GameObjects.Graphics;lastDust:number};

function noise(n:number):number { const s=Math.sin(n*127.1+3.18)*43758.5453;return s-Math.floor(s); }
function tuft(g:Phaser.GameObjects.Graphics,x:number,y:number,s=1,c=0x78ad40):void {
  line(g,[x-4*s,y,x-6*s,y-5*s,x-2*s,y-2*s,x,y-9*s,x+1*s,y-3*s,x+5*s,y-6*s,x+4*s,y],c,1.35*s);
}
function rock(g:Phaser.GameObjects.Graphics,x:number,y:number,s=1):void {
  ellipse(g,x,y+2,15*s,5*s,0x506c3c,.16);
  poly(g,[x-7*s,y,x-5*s,y-6*s,x+2*s,y-8*s,x+7*s,y-3*s,x+6*s,y+1*s],0xafb39a,0x8b987a,.7);
  poly(g,[x-5*s,y-6*s,x+2*s,y-8*s,x+4*s,y-3*s,x-2*s,y-2*s],0xc8c7a9,0xc8c7a9,0);
}
function tree(g:Phaser.GameObjects.Graphics,x:number,y:number,s=1):void {
  ellipse(g,x+4*s,y+4*s,64*s,20*s,0x557f35,.16);
  poly(g,[x-5*s,y,x-4*s,y-35*s,x-12*s,y-47*s,x-7*s,y-49*s,x+1*s,y-39*s,x+8*s,y-54*s,x+12*s,y-51*s,x+4*s,y-30*s,x+5*s,y],0x967a4b,0x776239,1.2);
  line(g,[x,y-3*s,x-1*s,y-34*s],0xb1955a,2*s);
  const crowns=[[-20,-51,21],[-5,-65,24],[20,-52,22],[4,-47,25],[-22,-38,17],[24,-36,18]];
  for(const [dx,dy,r] of crowns)circle(g,x+dx*s,y+dy*s,r*s,0x73a644,0x688f3b,1);
  for(const [dx,dy,r] of [[-15,-57,14],[2,-70,15],[22,-57,13],[4,-52,16]])ellipse(g,x+dx*s,y+dy*s,r*2*s,r*1.7*s,0x91bb54,.88);
}

/** Phaser is a presentation adapter; the deterministic game owns every rule. */
export function mountBattlefield(element:HTMLElement,game:GamePort,onFrame:()=>void,onEvents:(events:GameEvent[])=>void,options:{isVisible?:()=>boolean}={}):{destroy():void} {
  let disposed=false;
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  class Battlefield extends Phaser.Scene {
    private world!:Phaser.GameObjects.Container;
    private terrain!:Phaser.GameObjects.Graphics;
    private decor!:Phaser.GameObjects.Graphics;
    private ui!:Phaser.GameObjects.Graphics;
    private fx!:Phaser.GameObjects.Graphics;
    private playerBase!:Phaser.GameObjects.Graphics;
    private enemyBase!:Phaser.GameObjects.Graphics;
    private pLabel!:Phaser.GameObjects.Text;
    private eLabel!:Phaser.GameObjects.Text;
    private pHp!:Phaser.GameObjects.Text;
    private eHp!:Phaser.GameObjects.Text;
    private unitViews=new Map<number,UnitView>();
    private idle:Phaser.GameObjects.Graphics[]=[];
    private particles:Particle[]=[];
    private bolts:Bolt[]=[];
    private floaters:Floater[]=[];
    private ageKey='';
    private elapsed=0;
    private freezeAlpha=0;
    private meteorAlpha=0;
    private reduced=false;
    private lastState:BattleState|null=null;

    constructor(){super('battlefield');}
    create():void {
      if(disposed)return;
      this.world=this.add.container(0,0);
      this.terrain=this.add.graphics();this.world.add(this.terrain);
      this.drawGround();
      this.playerBase=this.add.graphics().setPosition(36,294);this.world.add(this.playerBase);
      this.enemyBase=this.add.graphics().setPosition(414,294);this.world.add(this.enemyBase);
      this.decor=this.add.graphics();this.world.add(this.decor);
      this.ui=this.add.graphics();this.world.add(this.ui);
      this.fx=this.add.graphics();this.world.add(this.fx);
      const style={fontFamily:'Nunito, Arial, sans-serif',fontSize:'9px',fontStyle:'bold',color:'#697c49',align:'center'};
      this.pLabel=this.add.text(36,312,'YOUR BASE',style).setOrigin(.5);this.world.add(this.pLabel);
      this.eLabel=this.add.text(414,312,'ENEMY BASE',style).setOrigin(.5);this.world.add(this.eLabel);
      const hpStyle={fontFamily:'Nunito, Arial, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#ffffff',stroke:'#334932',strokeThickness:2};
      this.pHp=this.add.text(36,218,'',hpStyle).setOrigin(.5);this.world.add(this.pHp);
      this.eHp=this.add.text(414,218,'',hpStyle).setOrigin(.5);this.world.add(this.eHp);
      for(let i=0;i<4;i++){const g=this.add.graphics();this.idle.push(g);this.world.add(g);}
      this.scale.on('resize',this.resize,this);this.resize();
      this.events.once('shutdown',()=>this.scale.off('resize',this.resize,this));
    }
    private resize():void {
      if(!this.world)return;
      this.world.setScale(this.scale.width/W,this.scale.height/H);
    }
    private drawGround():void {
      const g=this.terrain;g.clear();
      // A warm, open field, composed as a continuous landscape under the HUD.
      g.fillStyle(0xb5d978,1);g.fillRect(0,0,W,H);
      g.fillStyle(0xb1d775,.75);g.fillEllipse(230,310,660,460);
      ellipse(g,106,176,248,180,0xbcdf80,.58);ellipse(g,350,136,255,185,0xbfdf85,.35);
      ellipse(g,356,395,280,103,0x97c668,.25);ellipse(g,35,402,270,117,0xa2d16b,.35);
      // Soft painted paths with irregular edges instead of a flat UI strip.
      poly(g,[-20,263,32,252,75,259,115,253,166,256,211,250,261,256,307,251,359,258,400,251,475,265,473,320,421,313,376,318,329,311,271,318,228,312,172,320,117,313,74,319,19,311,-20,320],0x9abb64,0x9abb64,0);
      poly(g,[-20,270,33,260,78,265,123,260,168,264,212,258,263,263,311,258,360,265,402,258,475,273,475,313,423,307,378,313,329,305,272,311,228,307,171,313,118,307,73,313,20,304,-20,313],0xe4cfa0,0xe4cfa0,0);
      poly(g,[-20,279,31,270,80,274,119,267,169,273,214,266,266,272,310,267,362,272,403,266,475,281,475,301,419,298,376,305,328,296,271,303,228,298,171,306,117,297,76,306,19,297,-20,302],0xebd8b0,0xebd8b0,0);
      // Sand pebbles and barely visible crossing tracks.
      for(let i=0;i<73;i++){
        const x=noise(i+23)*450,y=270+noise(i+60)*32;
        ellipse(g,x,y,1.2+noise(i+90)*2.5,1,0xc2ae82,.45);
      }
      for(let i=0;i<26;i++){
        const x=70+i*12.5,y=286+Math.sin(i*1.7)*7;
        ellipse(g,x,y,2.6,1.3,0xd2bc8c,.55);ellipse(g,x+3,y+4,2.6,1.3,0xd2bc8c,.55);
      }
      for(let i=0;i<110;i++){
        const x=noise(i+200)*450,y=32+noise(i+500)*394;
        if(y>233&&y<329)continue;
        if(y<155&&x>47&&x<398)continue;
        const s=.4+noise(i+920)*.5;
        tuft(g,x,y,s,i%3===0?0x89b550:0x93be5e);
      }
      for(let i=0;i<33;i++){
        const x=noise(i+1800)*450,y=i%2===0?243+noise(i+23)*13:322+noise(i+49)*14;
        if(x<69||x>382)continue;
        tuft(g,x,y,.55+noise(i+4)*.35,0x83ac48);
      }
      for(const [x,y,s] of [[63,182,.8],[344,181,.5],[385,351,.7],[79,347,.5],[173,222,.38],[229,372,.45],[20,367,.65],[297,341,.38]])rock(g,x,y,s);
      // White daisies and golden buttercups, restrained at the lane edges.
      for(const [x,y] of [[88,196],[322,213],[126,360],[353,378],[50,344],[405,175],[223,232]]){
        line(g,[x,y+5,x,y],0x739344,1);
        for(let a=0;a<5;a++){const t=a*Math.PI*2/5;ellipse(g,x+Math.cos(t)*2,y+Math.sin(t)*2,2.5,2.5,0xf8f4d8);}
        circle(g,x,y,1.2,0xeabd4f,0xeabd4f,0);
      }
      // Corners frame the field without covering status or battle space.
      tree(g,-4,171,.92);tree(g,459,157,1.12);tree(g,464,404,.7);
      circle(g,5,413,25,0x90b74f,0x90b74f,0);circle(g,22,424,27,0xa2c85f,0xa2c85f,0);circle(g,-10,395,22,0xa0c360,0xa0c360,0);
      // Half-buried animal bones, a tiny environmental detail.
      line(g,[314,366,326,373,336,374],0x91b165,3);line(g,[314,364,326,371,336,372],0xe9e3bc,2.4);
      for(let i=0;i<4;i++)line(g,[320+i*3,363+i*1.5,318+i*3,367+i*1.5,319+i*3,371+i*1.5],0xeee9c7,1.5);
      ellipse(g,339,372,8,5,0xe6e0ba);circle(g,340,371,1.1,0x85945d,0x85945d,0);
    }
    private bases():void {
      const key=`${game.profile.age}:${game.profile.enemyAge}`;
      if(key===this.ageKey)return;this.ageKey=key;
      drawBase(this.playerBase,game.profile.age,'player');drawBase(this.enemyBase,game.profile.enemyAge,'enemy');
    }
    private ambient():void {
      const g=this.decor;g.clear();
      // Flags ripple independently of combat, while trunks and buildings stay solid.
      for(const [x,side] of [[74,'player'],[376,'enemy']] as const){
        line(g,[x,285,x,226],0x68543a,2.3);circle(g,x,226,2.2,0xdac891,0x806b44,.8);
        const flap=Math.sin(this.elapsed*3+(side==='enemy'?2:0))*2;
        poly(g,[x+1,230,x+21,231+flap,x+17,239+flap,x+23,247+flap,x+1,245],side==='player'?0x3b92e5:0xdf5a49,0x635a41,1);
        line(g,[x+3,233,x+16,234+flap],side==='player'?0x78b9f5:0xf59879,1.5);
        ellipse(g,x,286,11,3,0x7b7c52,.25);
      }
      if(game.profile.age===0){
        const x=90,y=326,t=this.elapsed;
        ellipse(g,x,y+1,18,6,0x857d48,.24);
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5;circle(g,x+Math.cos(a)*7,y+Math.sin(a)*2,2.5,0x9b9f88,0x7d876d,.8);}
        line(g,[x-5,y+1,x+5,y-2],0x7e5934,2);line(g,[x-4,y-2,x+4,y+1],0x946d40,2);
        poly(g,[x-4,y,x-5,y-5,x-1,y-12-Math.sin(t*7)*2,x+1,y-7,x+4,y-11,x+5,y-4,x+3,y+1],0xe79042,0xe79042,0);
        poly(g,[x-2,y,x-2,y-4,x+1,y-8,x+3,y-1],0xffd779,0xffd779,0);
        for(let i=0;i<3;i++){const p=(t*.35+i*.32)%1;ellipse(g,x+Math.sin(p*5)*3,y-12-p*20,3+p*5,3+p*4,0x71845c,(1-p)*.15);}
      }
      // Small drifting specks convey a living environment without constant movement.
      for(let i=0;i<6;i++){
        const p=(this.elapsed*.025+i*.17)%1,x=80+p*290,y=188+Math.sin(this.elapsed*.7+i*3)*7+i*8;
        circle(g,x,y,.8,0xf7ebad,0xf7ebad,0);
      }
    }
    private healthBars():void {
      const g=this.ui;g.clear();
      const s=game.state;
      for(const [x,hp,max,color] of [[36,s.playerHp,s.playerMaxHp,0x3c99ec],[414,s.enemyHp,s.enemyMaxHp,0xe46452]]){
        g.fillStyle(0x4d6743,.65);g.fillRoundedRect(x-30,211,60,13,5);
        g.fillStyle(0xf4f2d6,1);g.fillRoundedRect(x-29,212,58,11,4);
        const fill=56*Math.max(0,Math.min(1,hp/max));if(fill>0){g.fillStyle(color,1);g.fillRoundedRect(x-28,213,fill,9,3);g.fillStyle(0xffffff,.2);g.fillRoundedRect(x-27,213,Math.max(1,fill-2),3,2);}
      }
      this.pHp.setText(compactNumber(s.playerHp));this.eHp.setText(compactNumber(s.enemyHp));
      for(const u of s.units){
        if(u.hp>=u.maxHp)continue;
        const x=worldX(u.x),y=worldY(u.lane)-(u.kind===2?(u.age===1?70:59):49),width=u.kind===2?27:22;
        g.fillStyle(0x4b4e38,.4);g.fillRoundedRect(x-width/2-1,y-1,width+2,5,2);
        g.fillStyle(0xf0e7cf,1);g.fillRoundedRect(x-width/2,y,width,3,1);
        const fill=width*Math.max(0,u.hp/u.maxHp);if(fill>0){g.fillStyle(u.side==='player'?0x419aef:0xe66650,1);g.fillRoundedRect(x-width/2,y,fill,3,1);}
      }
      if(s.freezeUntil>s.time){g.fillStyle(0x92e5ed,.08+Math.sin(this.elapsed*4)*.015);g.fillRect(0,240,450,84);}
    }
    private updateUnits():void {
      const ids=new Set<number>();
      const units=[...game.state.units].sort((a,b)=>a.lane-b.lane||a.x-b.x);
      for(const u of units){
        ids.add(u.id);let v=this.unitViews.get(u.id);
        if(!v){
          const shadow=this.add.graphics();this.world.add(shadow);
          const body=this.add.graphics();this.world.add(body);v={body,shadow,lastDust:0};this.unitViews.set(u.id,v);
        }
        const x=worldX(u.x),y=worldY(u.lane),frozen=u.side==='enemy'&&game.state.freezeUntil>game.state.time;
        const scythe=u.age===1&&u.kind===2,size=scythe?1.22:1;
        v.shadow.clear();ellipse(v.shadow,x,y+2,u.kind===2?(scythe?28:43):20,u.kind===2?10:6,0x796b44,.23);
        v.body.setPosition(x,y+(this.reduced||u.attacking||frozen?0:Math.abs(Math.sin(game.state.time*11+u.id))*.7));v.body.setScale((u.side==='player'?1:-1)*size,size);
        drawTroop(v.body,u.age,u.kind,u.side,this.reduced||frozen?0:game.state.time+u.id*.2,u.attacking,u.hitFlash>0);
        v.body.setAlpha(frozen?.72:1);
        // Simple scene ordering follows the three ground lanes.
        this.world.bringToTop(v.shadow);this.world.bringToTop(v.body);
        if(!game.state.paused&&game.state.phase==='running'&&!frozen){
          if(!u.attacking&&game.state.time-v.lastDust>.48){v.lastDust=game.state.time;if(!(u.age===5&&u.kind===2))this.emit(x,y,1,0xd6c69a,'dust',.35);}
        }
      }
      for(const [id,v] of this.unitViews){if(!ids.has(id)){v.body.destroy();v.shadow.destroy();this.unitViews.delete(id);}}
      const ready=game.state.phase==='ready';
      for(let i=0;i<this.idle.length;i++){
        const g=this.idle[i];g.setVisible(ready);if(!ready)continue;
        const side=i<2?'player':'enemy';g.setPosition(i<2?97+i*25:353-(i-2)*25,282+i%2*17);g.setScale(side==='player'?1:-1,1);
        drawTroop(g,side==='player'?game.profile.age:game.profile.enemyAge,i%2===0?0:1,side,0,false);
        this.world.bringToTop(g);
      }
      this.world.bringToTop(this.ui);this.world.bringToTop(this.fx);this.world.bringToTop(this.pHp);this.world.bringToTop(this.eHp);
      for(const f of this.floaters)this.world.bringToTop(f.text);
    }
    private shoot(shot:NonNullable<ReturnType<typeof projectileForHit>>):void {
      const u=shot.source;
      const tx=worldX(shot.targetX),ty=shot.base?270:worldY(shot.targetLane)-19;
      const heavy=u.kind===2,muzzle=heavy?33:u.age>=3?36:18;
      const x=worldX(u.x)+(u.side==='player'?muzzle:-muzzle),y=worldY(u.lane)-(heavy?(u.age===5?14:u.age===4?29:24):25);
      const duration=u.age===5?.16:u.age>=3?.22:.34;
      this.bolts.push({x,y,tx,ty,life:duration,max:duration,side:u.side,age:u.age,kind:u.kind});
      if(this.bolts.length>80)this.bolts.shift();
      if(u.age>=3)this.emit(x,y,heavy?5:2,u.age===5?0xa1f7ff:0xffd481,'spark',.15);
    }
    private emit(x:number,y:number,count:number,color:number,kind:Particle['kind']='spark',life=.5):void {
      if(this.reduced)return;
      for(let i=0;i<count;i++){
        const angle=noise(this.elapsed*55+i*13)*Math.PI*2,speed=kind==='dust'?8:kind==='coin'?27:28+noise(i+this.elapsed)*30;
        this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(kind==='coin'?40:10),life:life*(.7+noise(i+6)*.6),max:life,size:kind==='coin'?3:kind==='dust'?3.5:1.3+noise(i+7)*2,color,kind});
      }
      if(this.particles.length>260)this.particles.splice(0,this.particles.length-260);
    }
    private event(e:GameEvent):void {
      const x=worldX(e.x??500),y=worldY(e.lane??1);
      if(e.type==='spawn')this.emit(x,y,6,0xd6c598,'dust',.6);
      if(e.type==='hit'){
        const shot=projectileForHit(e);if(shot&&!this.reduced)this.shoot(shot);
        this.emit(x,y-20,5,0xffefb2,'spark',.28);
        if(e.amount)this.floatText(x+(noise(this.elapsed)*14-7),y-48,compactNumber(e.amount),'#fff8e6',.62,12);
      }
      if(e.type==='death'){this.emit(x,y-12,8,0xe5d3a8,'dust',.6);if(e.side==='enemy')this.emit(x,y-13,4,0xffd468,'coin',.65);}
      if(e.type==='coin'&&e.amount)this.floatText(x,y-34,`+${compactNumber(e.amount)}`,'#ffe174',.85,12);
      if(e.type==='win'){for(let i=0;i<50;i++)this.emit(400,245,1,i%2?0xffdc76:0xffffff,'spark',1.4);}
      if(e.type==='lose')this.emit(37,267,25,0x9f977f,'dust',1.1);
      if(e.type==='skill'){
        if(e.skill==='freeze'){this.freezeAlpha=.6;for(let i=0;i<22;i++)this.emit(150+noise(i+9)*270,250+noise(i+72)*65,1,0xc9f7ff,'ice',1.1);}
        if(e.skill==='meteor'){this.meteorAlpha=.85;if(!this.reduced)this.cameras.main.shake(170,.0025);for(let i=0;i<32;i++)this.emit(280+noise(i+34)*110,275+noise(i+64)*30,1,i%2?0xffa14b:0xffe39b,'spark',1);}
        if(e.skill==='food')this.floatText(225,201,`+${Number((e.amount??10).toFixed(1))} FOOD`,'#fff1ba',1,21);
      }
    }
    private floatText(x:number,y:number,value:string,color:string,life:number,size:number):void {
      const text=this.add.text(x,y,value,{fontFamily:'Nunito, Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#61513b',strokeThickness:2}).setOrigin(.5);
      this.world.add(text);this.floaters.push({text,life,max:life,startY:y});
      if(this.floaters.length>30)this.floaters.shift()?.text.destroy();
    }
    private effects(dt:number):void {
      const g=this.fx;g.clear();
      for(const p of this.particles){
        p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='coin'?65:p.kind==='dust'?-3:45)*dt;
        const a=Math.max(0,p.life/p.max);
        if(p.kind==='coin'){g.fillStyle(0xf0b940,a);g.fillCircle(p.x,p.y,p.size);g.lineStyle(1,0xffe290,a);g.strokeCircle(p.x,p.y,p.size-1);}
        else if(p.kind==='ice'){g.lineStyle(1,0xe5fbff,a);g.lineBetween(p.x-3,p.y,p.x+3,p.y);g.lineBetween(p.x,p.y-3,p.x,p.y+3);}
        else{g.fillStyle(p.color,a*(p.kind==='dust'?.4:1));g.fillCircle(p.x,p.y,p.size*(p.kind==='dust'?2-a:1));}
      }
      this.particles=this.particles.filter(p=>p.life>0);
      for(const b of this.bolts){
        b.life-=dt;const progress=1-Math.max(0,b.life)/b.max,x=b.x+(b.tx-b.x)*progress,y=b.y+(b.ty-b.y)*progress-Math.sin(progress*Math.PI)*(b.age<=2?13:b.kind===2&&b.age===3?5:1);
        const direction=b.tx>b.x?1:-1;
        if(b.age<=1){
          const radius=b.age===0?3.3:2.2;
          poly(g,[x-radius,y-1,x-radius*.4,y-radius,x+radius*.6,y-radius*.7,x+radius,y+1,x,y+radius],0xa9aba0,0x696d61,.8);
        }else if(b.age===2){
          line(g,[x-8*direction,y+1,x+3*direction,y],0x66533a,1.2);
          poly(g,[x+4*direction,y,x,y-2,x,y+2],0xd9ddd0,0x66533a,.6);
        }else if(b.age===5){
          line(g,[x-13*direction,y,x+4*direction,y],b.side==='player'?0x54d9f3:0xfa737e,b.kind===2?5:3.5);
          line(g,[x-11*direction,y,x+3*direction,y],0xe0ffff,b.kind===2?2.2:1.4);
        }else if(b.kind===2){
          line(g,[x-7*direction,y,x,y],0xffca68,2);
          circle(g,x,y,b.age===3?3.5:2.7,b.age===3?0x424740:0xbcad67,0x33392e,1);
        }else{
          line(g,[x-7*direction,y+1,x+3*direction,y],b.age===3?0xd4bf92:0xffe28b,1.7);
        }
      }
      this.bolts=this.bolts.filter(b=>b.life>0);
      for(const f of this.floaters){f.life-=dt;const p=1-f.life/f.max;f.text.setY(f.startY-(this.reduced?0:p*24)).setAlpha(Math.min(1,Math.max(0,f.life/f.max*2)));if(f.life<=0)f.text.destroy();}
      this.floaters=this.floaters.filter(f=>f.life>0);
      this.freezeAlpha=Math.max(0,this.freezeAlpha-dt*.8);if(this.freezeAlpha>0){g.fillStyle(0xb4f0fc,this.freezeAlpha*.18);g.fillRect(0,0,W,H);}
      this.meteorAlpha=Math.max(0,this.meteorAlpha-dt*1.9);if(this.meteorAlpha>0){g.fillStyle(0xffdc94,this.meteorAlpha*.2);g.fillRect(0,0,W,H);}
    }
    private resetEffects():void {
      for(const floater of this.floaters)floater.text.destroy();
      this.floaters=[];this.particles=[];this.bolts=[];this.freezeAlpha=0;this.meteorAlpha=0;
    }
    update(_time:number,delta:number):void {
      if(disposed||!this.world)return;
      const dt=Math.min(.05,Math.max(0,delta/1000));
      game.step(dt);
      const events=game.drainEvents();
      if(events.length)onEvents(events);
      if(options.isVisible&&!options.isVisible()){onFrame();return;}
      if(this.lastState!==game.state){
        this.lastState=game.state;this.resetEffects();
        for(const view of this.unitViews.values()){view.body.destroy();view.shadow.destroy();}
        this.unitViews.clear();
      }
      const reduce=reducedMotion(game.profile.motion,motionQuery.matches);
      if(reduce&&!this.reduced)this.resetEffects();this.reduced=reduce;
      if(!game.state.paused&&!this.reduced)this.elapsed+=dt;
      for(const event of events)this.event(event);
      this.bases();this.ambient();this.updateUnits();this.healthBars();this.effects(game.state.paused?0:dt);onFrame();
    }
  }
  const scene=new Battlefield();
  const renderer=new Phaser.Game({type:Phaser.AUTO,parent:element,width:element.clientWidth||450,height:element.clientHeight||430,transparent:true,antialias:true,roundPixels:false,render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER},scene:[scene],audio:{noAudio:true},fps:{target:60,forceSetTimeOut:false},banner:false});
  renderer.canvas.setAttribute('aria-label','Battlefield: your warriors march from the blue base toward the enemy red base.');
  renderer.canvas.setAttribute('role','img');
  const observer=new ResizeObserver(()=>{if(!disposed&&element.clientWidth>0&&element.clientHeight>0)renderer.scale.resize(element.clientWidth,element.clientHeight);});observer.observe(element);
  return {destroy(){if(disposed)return;disposed=true;observer.disconnect();renderer.destroy(true);}};
}
