import Phaser from 'phaser';
import {reducedMotion,projectileForHit} from './combat-feedback.ts';
import {arenaLayout,landscapePlacement,troopPose,visualEra} from './visual-theme.ts';
import {atmosphereFrame} from './era-atmosphere.ts';
import {baseDamageFrame,baseDamagePalette,baseDamageStage} from './base-damage.ts';
import {attackCueFrame,hitReaction} from './combat-choreography.ts';
import {visualAssets,baseTexture,unitTexture,landscapeTexture} from './visual-assets.ts';
import {projectileGeometry,paintProjectile} from './projectile-art.ts';
import {DeathVisuals} from './death-visuals.ts';
import {TROOP_FRAME} from './unit-illustrations.ts';
import {compactNumber} from '../ui/battle-hud.ts';
import {drawTroop,drawBase} from './art';
import type {BattleState,GameEvent,GamePort,Unit,Side} from '../game/types';

type ImageOrFallback=Phaser.GameObjects.Image|Phaser.GameObjects.Graphics;
type TroopView={body:ImageOrFallback;x:number;y:number;side:Side;dustAt:number};
type Spark={x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:number;dust:boolean};
type Bolt={from:{x:number;y:number};to:{x:number;y:number};life:number;max:number;arc:number;age:number;side:Side;heavy:boolean;damage:number;meteor?:boolean;targetBase?:boolean;targetSide?:Side;targetAge?:number};
type Ring={x:number;y:number;life:number;max:number;radius:number;color:number};
type Floater={text:Phaser.GameObjects.Text;life:number;max:number;startY:number};
type AttackCue={x:number;y:number;age:number;kind:Unit['kind'];side:Side;life:number;max:number};
const xAt=(x:number)=>x*.45;
const noise=(n:number)=>{const value=Math.sin(n*117.13)*43758.5453;return value-Math.floor(value);};
const tint=(hex:string)=>parseInt(hex.slice(1),16);

/** Original SVG art is rasterized once; simulation remains the only gameplay owner. */
export function mountBattlefield(element:HTMLElement,game:GamePort,onFrame:()=>void,onEvents:(events:GameEvent[])=>void,options:{isVisible?:()=>boolean}={}):{destroy():void} {
 let disposed=false;
 const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
 const loading=document.createElement('div');loading.className='world-loader';loading.setAttribute('role','status');loading.textContent='Preparing the battlefield…';element.append(loading);
 class Battlefield extends Phaser.Scene {
  private world!:Phaser.GameObjects.Container;
  private sky!:Phaser.GameObjects.Image;
  private ambience!:Phaser.GameObjects.Graphics;
  private basesLayer!:Phaser.GameObjects.Container;
  private baseDamage!:Phaser.GameObjects.Graphics;
  private armyLayer!:Phaser.GameObjects.Container;
  private actionFx!:Phaser.GameObjects.Graphics;
  private shadows!:Phaser.GameObjects.Graphics;
  private fx!:Phaser.GameObjects.Graphics;
  private bars!:Phaser.GameObjects.Graphics;
  private playerBase!:ImageOrFallback;
  private enemyBase!:ImageOrFallback;
  private baseText:Phaser.GameObjects.Text[]=[];
  private units=new Map<number,TroopView>();
  private fallen=new DeathVisuals();
  private baseHit:Record<Side,number>={player:0,enemy:0};
  private idle:ImageOrFallback[]=[];
  private sparks:Spark[]=[];
  private bolts:Bolt[]=[];
  private rings:Ring[]=[];
  private attackCues:AttackCue[]=[];
  private floaters:Floater[]=[];
  private layout=arenaLayout(450,430);
  private ages='';
  private lastState:BattleState|null=null;
  private clock=0;
  private reduce=false;
  private failed=false;
  constructor(){super('battlefield');}
  preload():void {
   for(const asset of visualAssets())this.load.svg(asset.key,asset.url);
   this.load.on('loaderror',()=>{this.failed=true;});
  }
  create():void {
   if(disposed)return;
   for(const asset of visualAssets())if(asset.frames&&this.textures.exists(asset.key)){
    const texture=this.textures.get(asset.key);
    for(let frame=0;frame<asset.frames;frame++)texture.add(String(frame),0,frame*TROOP_FRAME.width,0,TROOP_FRAME.width,TROOP_FRAME.height);
   }
   this.world=this.add.container();
   this.sky=this.add.image(0,0,this.textures.exists(landscapeTexture(game.profile.age))?landscapeTexture(game.profile.age):'__WHITE').setOrigin(0);
   this.world.add(this.sky);
   this.ambience=this.add.graphics();this.world.add(this.ambience);
   this.basesLayer=this.add.container();this.world.add(this.basesLayer);
   this.baseDamage=this.add.graphics();this.world.add(this.baseDamage);
   this.shadows=this.add.graphics();this.world.add(this.shadows);
   this.armyLayer=this.add.container();this.world.add(this.armyLayer);
   this.actionFx=this.add.graphics();this.world.add(this.actionFx);
   this.bars=this.add.graphics();this.world.add(this.bars);
   this.fx=this.add.graphics();this.world.add(this.fx);
   for(let i=0;i<2;i++){
    const text=this.add.text(0,0,'',{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#fff5d8',stroke:'#203e4b',strokeThickness:2}).setOrigin(.5);
    this.baseText.push(text);this.world.add(text);
   }
   this.scale.on('resize',this.resize,this);
   this.events.once('shutdown',()=>{this.scale.off('resize',this.resize,this);this.resetEffects();this.units.clear();this.idle=[];});
   this.resize();this.syncEra();loading.remove();
   if(this.failed)element.dispatchEvent(new CustomEvent('visual-fallback',{bubbles:true}));
  }
  private resize():void {
   if(!this.world)return;
   this.layout=arenaLayout(this.scale.width,this.scale.height);
   this.world.setScale(this.layout.scale); // one scale: heads, circles and bodies never stretch
   this.placeLandscape();
   this.resetEffects();
  }
  private placeLandscape():void {
   if(!this.sky)return;
   if(this.sky.texture.key==='__WHITE'){
    this.sky.setPosition(0,0).setScale(450/Math.max(1,this.sky.width),this.layout.height/Math.max(1,this.sky.height));
    return;
   }
   const placement=landscapePlacement(450,this.layout.height,this.layout.groundY);
   this.sky.setPosition(placement.x,placement.y).setScale(placement.scale);
  }
  private yAt(lane:number):number{return this.layout.groundY+lane*this.layout.laneGap;}
  private sprite(age:number,kind:Unit['kind'],side:Side):ImageOrFallback {
   const key=unitTexture(age,kind,side);
   if(this.textures.exists(key))return this.add.image(0,0,key,'0').setOrigin(.5,136/144);
   return this.add.graphics();
  }
  private createBase(age:number,side:Side):ImageOrFallback {
   const key=baseTexture(age,side);
   if(this.textures.exists(key))return this.add.image(0,0,key).setOrigin(.5,140/160).setScale(.62);
   const graphic=this.add.graphics();drawBase(graphic,age,side);return graphic;
  }
  private syncEra():void {
   const p=game.profile,key=`${p.age}:${p.enemyAge}`;
   if(this.ages===key)return;this.ages=key;
   const backdrop=landscapeTexture(p.age);
   if(this.textures.exists(backdrop))this.sky.setTexture(backdrop).clearTint();else this.sky.setTexture('__WHITE').setTint(tint(visualEra(p.age).ground));
   this.placeLandscape();
   this.playerBase?.destroy();this.enemyBase?.destroy();
   this.playerBase=this.createBase(p.age,'player');this.enemyBase=this.createBase(p.enemyAge,'enemy');
   this.basesLayer.add([this.playerBase,this.enemyBase]);
   for(const actor of this.idle)actor.destroy();this.idle=[];
   for(const side of ['player','enemy'] as const){const actor=this.sprite(side==='player'?p.age:p.enemyAge,0,side);this.armyLayer.add(actor);this.idle.push(actor);}
   const shell=element.closest<HTMLElement>('.game-shell');
   if(shell){shell.dataset.era=String(p.age);shell.style.setProperty('--era-accent',visualEra(p.age).accent);}
  }
  private drawArmy():void {
   const g=this.shadows;g.clear();
   const {groundY}=this.layout;
   this.playerBase.setPosition(39,groundY+12);this.enemyBase.setPosition(411,groundY+12);
   const ids=new Set<number>();
   for(const unit of game.state.units){
    ids.add(unit.id);let view=this.units.get(unit.id);
    const x=xAt(unit.x),y=this.yAt(unit.lane),frozen=unit.side==='enemy'&&game.state.freezeUntil>game.state.time;
    if(!view){const body=this.sprite(unit.age,unit.kind,unit.side);this.armyLayer.add(body);view={body,x,y,side:unit.side,dustAt:0};this.units.set(unit.id,view);}
    const moving=Math.abs(view.x-x)>.001,scale=unit.kind===2?.54:.42;
    const pose=troopPose(game.state.time+unit.id*.17,moving,unit.attacking,this.reduce||frozen);
    const recoil=hitReaction(unit.hitFlash,unit.side,unit.kind,this.reduce||frozen);
    g.fillStyle(0x243c42,.14);g.fillEllipse(x+3,y+3,unit.kind===2?46:27,unit.kind===2?11:7);
    g.fillStyle(0x2a4647,.12);g.fillEllipse(x+2,y+2,unit.kind===2?31:17,4);
    if(view.body instanceof Phaser.GameObjects.Image){
     if(!game.state.paused)view.body.setFrame(String(pose.frame));
     view.body.setAngle((unit.side==='player'?pose.angle:-pose.angle)+recoil.angle);
     view.body.setScale(scale).setFlipX(unit.side==='enemy');
     if(unit.hitFlash>0)view.body.setTintFill(0xfff9db);else if(frozen)view.body.setTint(0x91e5f0);else view.body.clearTint();
     view.body.setPosition(x+recoil.x,y-(game.state.paused?0:pose.lift)+recoil.y);
    }else{
     view.body.setPosition(x+recoil.x,y+recoil.y).setScale(unit.side==='player'?1:-1,1).setAngle(recoil.angle);
     drawTroop(view.body,unit.age,unit.kind,unit.side,this.reduce||frozen?0:game.state.time,unit.attacking,unit.hitFlash>0);
    }
    view.body.setDepth(y);
    if(moving&&!game.state.paused&&!frozen&&this.clock-view.dustAt>.28){this.emit(x,y+2,1,0xdfd4b1,true,.45);view.dustAt=this.clock;}
    view.x=x;view.y=y;
   }
   for(const [id,view]of this.units)if(!ids.has(id)){
    if(this.reduce)view.body.destroy();
    else {if(view.body instanceof Phaser.GameObjects.Image)view.body.clearTint();this.fallen.add(view.body,view.side);}
    this.units.delete(id);
   }
   for(let i=0;i<this.idle.length;i++){
    const actor=this.idle[i],side=i===0?'player':'enemy',x=i===0?119:331,y=groundY+15;
    actor.setVisible(game.state.phase==='ready');
    if(game.state.phase!=='ready')continue;
    g.fillStyle(0x243e40,.2);g.fillEllipse(x,y+2,25,7);
    actor.setPosition(x,y).setDepth(y);
    if(actor instanceof Phaser.GameObjects.Image)actor.setScale(.47).setFlipX(i===1);
    else {actor.setScale(i===0?1:-1,1);drawTroop(actor,i===0?game.profile.age:game.profile.enemyAge,0,side,0,false);}
   }
   this.armyLayer.sort('depth');
  }
  private drawAtmosphere():void {
   const g=this.ambience;g.clear();
   for(const mark of atmosphereFrame(game.profile.age,this.clock,450,this.layout.groundY,this.reduce)){
    if(mark.kind==='firefly'||mark.kind==='starlight'){
     g.fillStyle(mark.color,mark.alpha*.16);g.fillCircle(mark.x,mark.y,mark.size*2.5);
     g.fillStyle(mark.color,mark.alpha);g.fillCircle(mark.x,mark.y,mark.size*.65);
     if(mark.kind==='starlight'){g.lineStyle(.8,mark.color,mark.alpha*.65);g.lineBetween(mark.x-mark.size*1.5,mark.y,mark.x+mark.size*1.5,mark.y);g.lineBetween(mark.x,mark.y-mark.size*1.5,mark.x,mark.y+mark.size*1.5);}
    }else if(mark.kind==='gull'){
     const wing=mark.size,tilt=Math.sin(mark.angle);g.lineStyle(1.35,mark.color,mark.alpha);
     g.lineBetween(mark.x-wing,mark.y+tilt*wing,mark.x,mark.y-wing*.28);g.lineBetween(mark.x,mark.y-wing*.28,mark.x+wing,mark.y-tilt*wing);
    }else if(mark.kind==='leaf'){
     const dx=Math.cos(mark.angle)*mark.size*1.7,dy=Math.sin(mark.angle)*mark.size*1.7;
     g.lineStyle(1,mark.color,mark.alpha*.65);g.lineBetween(mark.x-dx,mark.y-dy,mark.x+dx,mark.y+dy);
     g.fillStyle(mark.color,mark.alpha*.72);g.fillCircle(mark.x,mark.y,mark.size*.7);
    }else{
     const dx=Math.cos(mark.angle)*mark.size*2,dy=Math.sin(mark.angle)*mark.size*2;
     g.lineStyle(mark.kind==='ember'?1.8:1.1,mark.color,mark.alpha);g.lineBetween(mark.x-dx,mark.y-dy,mark.x+dx,mark.y+dy);
     if(mark.kind==='ember'){g.fillStyle(0xffe6a3,mark.alpha*.75);g.fillCircle(mark.x+dx*.35,mark.y+dy*.35,mark.size*.45);}
    }
   }
  }
  private drawBaseDamage():void {
   const g=this.baseDamage;g.clear();
   const state=game.state,ground=this.layout.groundY+12;
   for(const side of ['player','enemy'] as const){
    const x=side==='player'?39:411;
    const hp=side==='player'?state.playerHp:state.enemyHp,maxHp=side==='player'?state.playerMaxHp:state.enemyMaxHp;
    const age=side==='player'?game.profile.age:game.profile.enemyAge;
    for(const mark of baseDamageFrame(age,side,hp,maxHp,this.clock,this.reduce)){
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
    const hit=this.baseHit[side];
    if(hit>0&&!this.reduce){const progress=hit/.18,color=side==='player'?0x91ecf2:0xffc08e;g.lineStyle(2,color,progress*.7);g.strokeEllipse(x,ground-34,58+(1-progress)*12,72+(1-progress)*9);}
   }
  }
  private baseImpact(x:number,y:number,amount:number,heavy:boolean,targetSide:Side,targetAge:number):void {
   this.baseHit[targetSide]=.18;
   const palette=baseDamagePalette(targetAge),state=game.state;
   const hp=targetSide==='player'?state.playerHp:state.enemyHp,maxHp=targetSide==='player'?state.playerMaxHp:state.enemyMaxHp;
   const critical=baseDamageStage(hp,maxHp)==='critical';
   this.emit(x,y,critical?(heavy?13:9):(heavy?9:6),palette.debris,true,critical?.5:.36);
   this.ring(x,y,targetSide==='player'?0x8fe7f0:0xffbb8b,heavy?29:18);
   if(amount>0)this.floatText(x,y-17,compactNumber(amount));
   if(heavy&&!this.reduce)this.cameras.main.shake(55,.0012);
  }
  private drawAttackCues(dt:number):void {
   const g=this.actionFx;g.clear();
   for(const cue of this.attackCues){
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    for(const mark of attackCueFrame(cue.age,cue.kind,cue.side,progress,this.reduce)){
     const x=cue.x+mark.x,y=cue.y+mark.y,forward=cue.side==='player'?1:-1;
     if(mark.kind==='slash'){
      const a0=mark.angle-.72*forward,a1=mark.angle,a2=mark.angle+.72*forward;
      const p0={x:x+Math.cos(a0)*mark.size,y:y+Math.sin(a0)*mark.size};
      const p1={x:x+Math.cos(a1)*mark.size*1.22,y:y+Math.sin(a1)*mark.size*1.22};
      const p2={x:x+Math.cos(a2)*mark.size,y:y+Math.sin(a2)*mark.size};
      g.lineStyle(5,mark.color,mark.alpha*.18);g.lineBetween(p0.x,p0.y,p1.x,p1.y);g.lineBetween(p1.x,p1.y,p2.x,p2.y);
      g.lineStyle(1.7,mark.color,mark.alpha);g.lineBetween(p0.x,p0.y,p1.x,p1.y);g.lineBetween(p1.x,p1.y,p2.x,p2.y);
     }else if(mark.kind==='muzzle'||mark.kind==='flash'){
      g.fillStyle(mark.color,mark.alpha*.92);g.fillTriangle(x+forward*mark.size,y,x-forward*mark.size*.45,y-mark.size*.58,x-forward*mark.size*.45,y+mark.size*.58);
      g.lineStyle(1.1,0xfff6d0,mark.alpha);g.lineBetween(x-forward*mark.size*.4,y,x+forward*mark.size*1.35,y);
      if(mark.kind==='muzzle'){g.lineBetween(x,y-mark.size*.75,x,y+mark.size*.75);}
     }else if(mark.kind==='energy'){
      g.fillStyle(mark.color,mark.alpha*.18);g.fillCircle(x,y,mark.size*1.35);g.lineStyle(2,mark.color,mark.alpha);g.strokeCircle(x,y,mark.size*.72);g.fillStyle(0xf0ffff,mark.alpha);g.fillCircle(x,y,mark.size*.24);
     }else if(mark.kind==='smoke'){
      g.fillStyle(mark.color,mark.alpha*.24);g.fillCircle(x-mark.size*.2,y+mark.size*.1,mark.size*.65);g.fillCircle(x+mark.size*.35,y-mark.size*.25,mark.size*.82);
     }else if(mark.kind==='dust'){
      g.fillStyle(mark.color,mark.alpha*.22);g.fillEllipse(x,y,mark.size*2.2,mark.size*.72);
     }else{
      const dx=Math.cos(mark.angle)*mark.size,dy=Math.sin(mark.angle)*mark.size;g.lineStyle(2.1,mark.color,mark.alpha*.72);g.lineBetween(x-dx,y-dy,x+dx,y+dy);
     }
    }
   }
   this.attackCues=this.attackCues.filter(cue=>cue.life>0);
  }
  private healthBars():void {
   const g=this.bars,s=game.state;g.clear();
   for(const [i,x,hp,max,color]of [[0,39,s.playerHp,s.playerMaxHp,0x68c9ee],[1,411,s.enemyHp,s.enemyMaxHp,0xf19d75]]){
    const y=this.layout.groundY-85,fill=59*Math.max(0,Math.min(1,hp/max));
    g.fillStyle(0x132d3c,.88);g.fillRoundedRect(x-33,y-4,66,19,7);
    g.lineStyle(1,0xd2d9ba,.5);g.strokeRoundedRect(x-33,y-4,66,19,7);
    g.fillStyle(0x5a7477,1);g.fillRoundedRect(x-30,y+7,60,5,2);
    if(fill>.1){g.fillStyle(color,1);g.fillRoundedRect(x-29.5,y+7,fill,4,2);}
    this.baseText[i].setPosition(x,y+1).setText(compactNumber(hp));
   }
   for(const unit of s.units)if(unit.hp<unit.maxHp){
    const x=xAt(unit.x),y=this.yAt(unit.lane)-(unit.kind===2?78:59),w=unit.kind===2?31:22;
    g.fillStyle(0x203d43,.7);g.fillRoundedRect(x-w/2-1,y-1,w+2,5,2);
    g.fillStyle(unit.side==='player'?0x9de6ef:0xffb18a,1);const fill=w*Math.max(0,unit.hp/unit.maxHp);if(fill>.1)g.fillRoundedRect(x-w/2,y,fill,3,1);
   }
   if(s.freezeUntil>s.time){g.lineStyle(2,0xa8f8ef,.65);g.lineBetween(95,this.layout.groundY+34,355,this.layout.groundY+34);}
  }
  private emit(x:number,y:number,count:number,color:number,dust=false,life=.36):void {
   if(this.reduce)return;
   for(let i=0;i<count;i++){const a=noise(i+this.clock*39)*Math.PI*2,speed=dust?8:22+noise(i+8)*39;
    this.sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-15,life,max:life,size:dust?3:1.3+noise(i+19)*2.5,color,dust});}
   if(this.sparks.length>180)this.sparks.splice(0,this.sparks.length-180);
  }
  private ring(x:number,y:number,color:number,radius=18):void {
   if(this.reduce)return;
   this.rings.push({x,y,life:.32,max:.32,radius,color});if(this.rings.length>24)this.rings.shift();
  }
  private floatText(x:number,y:number,value:string,color='#fff1c8',large=false):void {
   const life=large?1.05:.62;
   const text=this.add.text(Math.max(22,Math.min(428,x)),y,value,{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:large?'19px':'12px',fontStyle:'bold',color,stroke:'#23404a',strokeThickness:3}).setOrigin(.5);
   this.world.add(text);this.floaters.push({text,life,max:life,startY:y});if(this.floaters.length>24)this.floaters.shift()?.text.destroy();
  }
  private impact(x:number,y:number,amount:number,heavy=false):void {
   this.emit(x,y,heavy?12:6,0xffe2a0,false,heavy?.45:.25);this.ring(x,y,0xffedc2,heavy?27:13);
   if(amount>0)this.floatText(x,y-15,compactNumber(amount));
  }
  private event(e:GameEvent):void {
   const x=xAt(e.x??500),y=this.yAt(e.lane??1);
   if(e.type==='spawn'){this.emit(x,y,5,0xdfd4b1,true,.4);this.ring(x,y,0xc9e2b3,13);}
   if(e.type==='hit'){
    if(e.source){this.attackCues.push({x:xAt(e.source.x),y:this.yAt(e.source.lane),age:e.source.age,kind:e.source.kind,side:e.source.side,life:.18,max:.18});if(this.attackCues.length>42)this.attackCues.shift();}
    const shot=projectileForHit(e),targetBase=e.target==='base',targetSide:Side=e.side==='player'?'enemy':'player';
    const targetAge=targetSide==='player'?game.profile.age:game.profile.enemyAge;
    if(shot&&!this.reduce){
     const u=shot.source,heavy=u.kind===2,direction=u.side==='player'?1:-1;
     this.bolts.push({from:{x:xAt(u.x)+direction*(heavy?27:22),y:this.yAt(u.lane)-(heavy?29:25)},to:{x:xAt(shot.targetX),y:shot.base?this.layout.groundY-22:this.yAt(shot.targetLane)-22},life:.2,max:.2,arc:u.age<3?13:0,age:u.age,side:u.side,heavy,damage:e.amount??0,targetBase:shot.base,targetSide,targetAge});
     if(this.bolts.length>70)this.bolts.shift();
    }else if(targetBase)this.baseImpact(x,this.layout.groundY-22,e.amount??0,e.source?.kind===2,targetSide,targetAge);
    else this.impact(x,y-22,e.amount??0);
   }
   if(e.type==='death')this.emit(x,y-12,9,e.side==='player'?0x82cce8:0xe6b388,true,.52);
   if(e.type==='coin'&&e.amount)this.floatText(x,y-51,`+${compactNumber(e.amount)}`,'#ffdf7f');
   if(e.type==='win'){this.emit(408,this.layout.groundY-27,40,0xffd373,false,1.25);if(!this.reduce)this.cameras.main.shake(100,.0015);}
   if(e.type==='lose')this.emit(39,this.layout.groundY-10,20,0xb6a484,true,.8);
   if(e.type==='evolve')this.ring(225,this.layout.groundY,0xd2f9d8,200);
   if(e.type==='skill'){
    if(e.skill==='food'){this.floatText(225,this.layout.groundY-85,`+${Number((e.amount??10).toFixed(1))} FOOD`,'#fff0ae',true);this.ring(119,this.layout.groundY,0xc6ef9f,55);}
    if(e.skill==='freeze'){this.floatText(225,this.layout.groundY-90,'FROZEN','#b8f9ff',true);for(const view of this.units.values())if(view.side==='enemy'){this.ring(view.x,view.y-18,0xa4efff,35);this.emit(view.x,view.y-25,8,0xb2f5f3,false,.65);}}
    if(e.skill==='meteor'){
     if(this.reduce){this.floatText(225,this.layout.groundY-85,'METEOR','#ffd6a5',true);return;}
     const targets=[...this.units.values()].filter(v=>v.side==='enemy').slice(0,6);
     for(const v of targets.length?targets:[{x:310,y:this.layout.groundY}])this.bolts.push({from:{x:v.x-70,y:v.y-150},to:{x:v.x,y:v.y-15},life:.4,max:.4,arc:0,age:0,side:'player',heavy:true,damage:0,meteor:true});
     this.cameras.main.shake(180,.0025);
    }
   }
  }
  private effects(dt:number):void {
   const g=this.fx;g.clear();this.drawAttackCues(dt);this.fallen.step(dt,this.reduce);
   this.baseHit.player=Math.max(0,this.baseHit.player-dt);this.baseHit.enemy=Math.max(0,this.baseHit.enemy-dt);
   for(const spark of this.sparks){spark.life-=dt;spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;spark.vy+=(spark.dust?-3:50)*dt;
    const alpha=Math.max(0,spark.life/spark.max);g.fillStyle(spark.color,alpha*(spark.dust?.3:1));g.fillCircle(spark.x,spark.y,spark.size*(spark.dust?2-alpha:1));}
   this.sparks=this.sparks.filter(p=>p.life>0);
   for(const ring of this.rings){ring.life-=dt;const p=1-Math.max(0,ring.life/ring.max);g.lineStyle(2-p,ring.color,(1-p)*.7);g.strokeEllipse(ring.x,ring.y,ring.radius*2*p,ring.radius*p);}
   this.rings=this.rings.filter(r=>r.life>0);
   for(const bolt of this.bolts){
    bolt.life-=dt;const progress=1-Math.max(0,bolt.life)/bolt.max;
    paintProjectile(g,projectileGeometry(bolt.from,bolt.to,progress,bolt.arc,bolt.age,bolt.heavy,bolt.side,bolt.meteor));
    if(bolt.life<=0){if(bolt.targetBase&&bolt.targetSide!==undefined&&bolt.targetAge!==undefined)this.baseImpact(bolt.to.x,bolt.to.y,bolt.damage,bolt.heavy,bolt.targetSide,bolt.targetAge);else this.impact(bolt.to.x,bolt.to.y,bolt.damage,bolt.heavy);}
   }
   this.bolts=this.bolts.filter(b=>b.life>0);
   for(const f of this.floaters){f.life-=dt;const progress=1-f.life/f.max;f.text.setY(f.startY-(this.reduce?0:progress*22)).setAlpha(Math.max(0,Math.min(1,f.life/f.max*2)));if(f.life<=0)f.text.destroy();}
   this.floaters=this.floaters.filter(f=>f.life>0);
  }
  private resetEffects():void {this.baseHit={player:0,enemy:0};this.actionFx?.clear();this.attackCues=[];this.fallen.clear();for(const f of this.floaters)f.text.destroy();this.floaters=[];this.sparks=[];this.bolts=[];this.rings=[];}
  update(_time:number,delta:number):void {
   if(disposed||!this.world)return;
   const dt=Math.min(.05,Math.max(0,delta/1000));game.step(dt);
   const events=game.drainEvents();if(events.length)onEvents(events);
   if(options.isVisible&&!options.isVisible()){onFrame();return;}
   if(this.lastState!==game.state){this.lastState=game.state;this.resetEffects();for(const view of this.units.values())view.body.destroy();this.units.clear();}
   const reduced=reducedMotion(game.profile.motion,motionQuery.matches);
   if(reduced&&!this.reduce)this.resetEffects();this.reduce=reduced;
   if(!game.state.paused&&!this.reduce)this.clock+=dt;
   this.syncEra();for(const event of events)this.event(event);
   this.drawAtmosphere();this.drawBaseDamage();this.drawArmy();this.healthBars();this.effects(game.state.paused?0:dt);onFrame();
  }
 }
 let renderer:Phaser.Game;
 try{
  renderer=new Phaser.Game({type:Phaser.AUTO,parent:element,width:element.clientWidth||450,height:element.clientHeight||430,transparent:true,antialias:true,render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.NO_CENTER},scene:[new Battlefield()],audio:{noAudio:true},fps:{target:60},banner:false});
 }catch(error){loading.textContent='The battlefield could not start. Reload or try another browser.';throw error;}
 renderer.canvas.setAttribute('role','img');renderer.canvas.setAttribute('aria-label','Illustrated battlefield. Blue warriors attack the red enemy base.');
 const observer=new ResizeObserver(()=>{if(!disposed&&element.clientWidth>0&&element.clientHeight>0)renderer.scale.resize(element.clientWidth,element.clientHeight);});observer.observe(element);
 return {destroy(){if(disposed)return;disposed=true;observer.disconnect();loading.remove();renderer.destroy(true);}};
}
