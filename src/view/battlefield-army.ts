import Phaser from 'phaser';
import {campRenderProjection,campRecruits} from './world-camp.ts';
import {storybookArt} from './storybook-art.ts';
import {troopPose} from './visual-theme.ts';
import {groundEffectDepth} from './ground-effects.ts';
import {hitReaction} from './combat-choreography.ts';
import {characterGesture} from './character-gesture.ts';
import {lanePresentation,rankStagger,troopScale} from './lane-perspective.ts';
import {unitFocusMarks} from './silhouette-focus.ts';
import {baseTexture,unitTexture} from './visual-assets.ts';
import {teamHalo} from './cinematic-grade.ts';
import {battleAftermathPose} from './battle-aftermath.ts';
import {paintWaveArrival,waveArrivalRenderPlan} from './wave-arrival-paint.ts';
import {TROOP_FRAME} from './unit-illustrations.ts';
import {drawTroop,drawBase} from './art';
import type {ChronicleView} from './chronicle-view.ts';
import type {WaveArrivalFrame} from './wave-arrival.ts';
import type {GamePort,Unit,Side} from '../game/types';
import type {createBattlefieldEffects} from './battlefield-effects.ts';
import {xAt,stillReaction,type ImageOrFallback,type Layout,type TroopView} from './battlefield-types.ts';

export interface ArmyHost {
 scene:Phaser.Scene;
 game:GamePort;
 element:HTMLElement;
 pixelRatio:number;
 canvas():HTMLCanvasElement;
 layout():Layout;
 yAt(lane:number):number;
 reduce():boolean;
 clock():number;
 aftermath():{phase:'won'|'lost';at:number}|null;
 clearAftermath():void;
 waveArrival():WaveArrivalFrame|null;
}
export interface ArmyLayers {
 shadows:Phaser.GameObjects.Graphics;halos:Phaser.GameObjects.Graphics;armyLayer:Phaser.GameObjects.Container;
 arrivalSignal:Phaser.GameObjects.Graphics;baseDamage:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[];
 campProps:Phaser.GameObjects.Graphics;chronicleView:ChronicleView;
}

/** Troop and base sprites, the idle pair, the field camp and the wave signal: creates, poses and sorts them each frame. */
export function createBattlefieldArmy(host:ArmyHost,layers:ArmyLayers,effects:ReturnType<typeof createBattlefieldEffects>){
 const units=new Map<number,TroopView>();
 let idle:ImageOrFallback[]=[],campActors:ImageOrFallback[]=[];
 let playerBase!:ImageOrFallback,enemyBase!:ImageOrFallback;
 function sprite(age:number,kind:Unit['kind'],side:Side):ImageOrFallback {
   const key=unitTexture(age,kind,side);
   if(host.scene.textures.exists(key))return host.scene.add.image(0,0,key,'0').setOrigin(.5,136/144);
   return host.scene.add.graphics();
  }
 function createBase(age:number,side:Side):ImageOrFallback {
   const key=baseTexture(age,side);
   if(host.scene.textures.exists(key)){
    const image=host.scene.add.image(0,0,key).setOrigin(.5,140/160);
    return image.setScale(.62*160/image.width).setFlipX(!!storybookArt(age)&&side==='enemy');
   }
   const graphic=host.scene.add.graphics();drawBase(graphic,age,side);return graphic;
  }
 function drawWaveArrival(groundY:number):void {
   const graphics=layers.arrivalSignal.clear();delete host.canvas().dataset.waveArrival;
   const frame=host.waveArrival();if(!frame)return;
   const plan=waveArrivalRenderPlan(groundY),report=paintWaveArrival(graphics,frame,plan);
   graphics.setDepth(plan.depth);
   host.canvas().dataset.waveArrival=JSON.stringify({number:frame.number,intent:frame.intent,counts:frame.counts,nextIn:frame.nextIn,progress:frame.progress,banner:report.banner,roleShapes:report.roleShapes,knots:report.knots,x:plan.x,y:plan.y,depth:plan.depth,baseDepth:plan.baseDepth,actorFrontDepth:plan.actorFrontDepth,reduced:host.reduce(),paused:host.game.state.paused});
 }
 function drawCamp():void {
   const visible=host.game.state.phase==='running'&&host.element.closest<HTMLElement>('#app')?.dataset.fieldMode==='field';
   const {plan,cssScale:scale}=campRenderProjection(host.scene.scale.width,host.scene.scale.height,host.pixelRatio),g=layers.campProps.clear();
   const unlocked=campRecruits(host.game.profile);
   campActors.forEach((actor,kind)=>{
    actor.setVisible(visible&&unlocked.includes(kind as 0|1|2));
    if(!visible)return;
    const target=plan.recruits[kind],x=target.footX/scale,y=target.footY/scale;
    actor.setPosition(x,y).setDepth(y);
    if(actor instanceof Phaser.GameObjects.Image)actor.setScale(48/(actor.height*scale)).setFlipX(false);
    else {actor.setScale(.75/scale);drawTroop(actor,host.game.profile.age,kind as 0|1|2,'player',0,false);}
    if(unlocked.includes(kind as 0|1|2)){layers.shadows.fillStyle(0x192c25,.3);layers.shadows.fillEllipse(x,y+2/scale,28/scale,7/scale);}
   });
   if(navigator.webdriver){
    const rendered=campActors.flatMap((actor,kind)=>{if(!actor.visible||!(actor instanceof Phaser.GameObjects.Image))return [];const b=actor.getBounds();return [{kind,bounds:{left:b.left/host.pixelRatio,top:b.top/host.pixelRatio,right:b.right/host.pixelRatio,bottom:b.bottom/host.pixelRatio,width:b.width/host.pixelRatio,height:b.height/host.pixelRatio}}];});
    const report=JSON.stringify({pixelRatio:host.pixelRatio,width:host.scene.scale.width/host.pixelRatio,height:host.scene.scale.height/host.pixelRatio,rendered});if(host.canvas().dataset.fieldCamp!==report)host.canvas().dataset.fieldCamp=report;
   }
   if(!visible||host.game.state.stats.deployed===0)return;
   // Objects are painted on the ground plane, with no button plates or card frames.
   const flag=plan.standard,basket=plan.supplies,x=flag.footX/scale,y=flag.footY/scale,k=1/scale;
   g.setDepth(Math.max(flag.footY,basket.footY)/scale+.1);
   if(host.game.state.chronicle?.enabled){
    g.lineStyle(3*k,0x765435,1);g.lineBetween(x,y,x,y-43*k);
    g.fillStyle(host.game.state.chronicle.rally?0xe2b969:0xc7d6ad,1);g.fillTriangle(x,y-42*k,x+24*k,y-35*k,x,y-23*k);
    g.fillStyle(0x243e40,.25);g.fillEllipse(x,y+2*k,24*k,6*k);
   }
   const bx=basket.footX/scale,by=basket.footY/scale;
   g.fillStyle(0x4a3529,1);g.fillEllipse(bx,by-12*k,38*k,27*k);
   g.fillStyle(0xc18f4e,1);g.fillRoundedRect(bx-18*k,by-20*k,36*k,21*k,5*k);
   g.lineStyle(2*k,0x76512f,1);for(let i=-12;i<=12;i+=8)g.lineBetween(bx+i*k,by-19*k,bx+i*k,by-2*k);
   g.fillStyle(host.game.state.skillsUsed.includes('food')?0x806c52:0xebcd8d,1);g.fillEllipse(bx-8*k,by-22*k,17*k,10*k);g.fillEllipse(bx+9*k,by-22*k,17*k,10*k);
 }
 function draw():void {
   const g=layers.shadows,h=layers.halos;g.clear();h.clear();
   const {groundY}=host.layout();
   if(host.game.state.phase==='ready'||host.game.state.phase==='running')host.clearAftermath();const aftermath=host.aftermath();
   let aftermathElapsed=aftermath?Math.max(0,host.clock()-aftermath.at):0;aftermathElapsed=Math.min(1.3,aftermathElapsed);
   const aftermathCounts={triumph:0,withdraw:0,roles:[0,0,0],maxForward:0,maxLift:0,maxAngle:0};
   // A shared ground-plane sort lets rear-lane troops pass behind buildings.
   playerBase.setPosition(39,groundY+12).setDepth(groundY+12);
   enemyBase.setPosition(411,groundY+12).setDepth(groundY+12);
   drawWaveArrival(groundY);
   layers.baseDamage.setDepth(groundY+12.1);
   for(let lane=0;lane<3;lane++)layers.groundFx[lane].clear().setDepth(groundEffectDepth(groundY,lane,host.layout().laneGap));
   const ids=new Set<number>();
   for(const unit of host.game.state.units){
    ids.add(unit.id);let view=units.get(unit.id);
    const x=xAt(unit.x),y=host.yAt(unit.lane)+rankStagger(unit.id),frozen=unit.side==='enemy'&&host.game.state.freezeUntil>host.game.state.time;
    if(!view){const body=sprite(unit.age,unit.kind,unit.side);layers.armyLayer.add(body);view={body,x,y,lane:unit.lane,side:unit.side,dustAt:0};units.set(unit.id,view);}
    const moving=Math.abs(view.x-x)>.001,perspective=lanePresentation(unit.lane,unit.kind),scale=troopScale(unit.kind,unit.lane)*(unit.storyBoss?1.35:1);
    const direction=unit.side==='player'?1:-1;
    const pose=troopPose(host.game.state.time+unit.id*.17,moving,unit.attacking,host.reduce()||frozen);
    const gesture=characterGesture(unit.kind,host.game.state.time+unit.id*.17,moving,unit.attacking,host.reduce()||frozen);
    const verdict=aftermath?.phase===host.game.state.phase?battleAftermathPose({phase:aftermath.phase,side:unit.side,kind:unit.kind,elapsed:aftermathElapsed,reduced:host.reduce()}):null;
    const facingDirection=verdict?.facing==='home'?-direction:direction;
    if(verdict){aftermathCounts[verdict.mode]++;aftermathCounts.roles[unit.kind]++;aftermathCounts.maxForward=Math.max(aftermathCounts.maxForward,verdict.forward);aftermathCounts.maxLift=Math.max(aftermathCounts.maxLift,verdict.lift);aftermathCounts.maxAngle=Math.max(aftermathCounts.maxAngle,Math.abs(verdict.angle));}
    const recoil=verdict?stillReaction:hitReaction(unit.hitFlash,unit.side,unit.kind,host.reduce()||frozen);
    for(const mark of unitFocusMarks(unit.side,unit.lane,unit.kind,unit.hitFlash,frozen)){g.fillStyle(mark.color,mark.alpha);g.fillEllipse(x+mark.x,y+mark.y,mark.width,mark.height);}
    g.fillStyle(0x243c42,perspective.shadowAlpha);g.fillEllipse(x+3,y+3,perspective.shadowWidth,perspective.shadowHeight);
    const halo=teamHalo(unit.side,unit.kind,perspective.scale,unit.hitFlash,frozen);
    h.fillStyle(halo.color,halo.alpha*.45);h.fillEllipse(x+halo.x,y+halo.y,halo.rx*2,halo.ry*2,12);
    h.fillStyle(halo.color,halo.alpha*.6);h.fillEllipse(x+halo.x,y+halo.y,halo.rx*1.2,halo.ry*1.1,10);
    g.fillStyle(0x2a4647,perspective.shadowAlpha*.82);g.fillEllipse(x+2,y+2,perspective.shadowWidth*.68,perspective.shadowHeight*.38);
    if(view.body instanceof Phaser.GameObjects.Image){
     const density=TROOP_FRAME.height/view.body.height;
     if(verdict){
      view.body.setFrame(String(verdict.frame));view.body.setAngle(verdict.angle*facingDirection+recoil.angle);view.body.setScale(scale*density*verdict.sx,scale*density*verdict.sy).setFlipX(facingDirection<0);
      view.body.setPosition(x+recoil.x+verdict.forward*facingDirection,y-verdict.lift+recoil.y);
     }else{
      if(!host.game.state.paused)view.body.setFrame(String(pose.frame));
      view.body.setAngle(pose.angle*direction+gesture.angle*direction+recoil.angle);view.body.setScale(scale*density*gesture.sx,scale*density*gesture.sy).setFlipX(direction<0);
      view.body.setPosition(x+recoil.x+gesture.forward*direction,y-(host.game.state.paused?0:pose.lift)-gesture.lift+recoil.y);
     }
     if(unit.hitFlash>0)view.body.setTintFill(0xfff9db);else if(frozen)view.body.setTint(0x91e5f0);else if(unit.storyShadow)view.body.setTint((host.game.state.chronicle?.revealUntil??0)>host.game.state.time?0xd4e3bc:0xb8b8d1);else if(storybookArt(unit.age)&&unit.side==='enemy')view.body.setTint(0xffd9b5);else view.body.clearTint();
    }else{
     view.body.setPosition(verdict?x+recoil.x+verdict.forward*facingDirection:x+recoil.x+gesture.forward*direction,verdict?y-verdict.lift+recoil.y:y-gesture.lift+recoil.y).setScale(facingDirection*perspective.scale*(verdict?verdict.sx:gesture.sx),perspective.scale*(verdict?verdict.sy:gesture.sy)).setAngle(verdict?verdict.angle*facingDirection+recoil.angle:pose.angle*direction+gesture.angle*direction+recoil.angle);
     drawTroop(view.body,unit.age,unit.kind,unit.side,verdict?verdict.frame/7:host.reduce()||frozen?0:host.game.state.time,verdict?verdict.mode==='triumph':unit.attacking,unit.hitFlash>0);
    }
    // Troops win a same-baseline tie against the building and its damage marks.
    view.body.setDepth(y+.5);
    if(moving&&!host.game.state.paused&&!frozen&&host.clock()-view.dustAt>.28){effects.emit(x,y+2,1,0xdfd4b1,true,.45,unit.lane);view.dustAt=host.clock();}
    view.x=x;view.y=y;view.lane=unit.lane;
   }
   if(aftermath?.phase===host.game.state.phase)host.canvas().dataset.battleAftermath=JSON.stringify({phase:aftermath.phase,elapsed:aftermathElapsed,triumph:aftermathCounts.triumph,withdraw:aftermathCounts.withdraw,roles:aftermathCounts.roles,maxForward:aftermathCounts.maxForward,maxLift:aftermathCounts.maxLift,maxAngle:aftermathCounts.maxAngle,reduced:host.reduce()});
   else delete host.canvas().dataset.battleAftermath;
   for(const [id,view]of units)if(!ids.has(id)){
    if(host.reduce())view.body.destroy();
    else {if(view.body instanceof Phaser.GameObjects.Image)view.body.clearTint();effects.fallen.add(view.body,view.side);}
    units.delete(id);
   }
   if(navigator.webdriver)host.canvas().dataset.battlefieldEnemyViews=String([...units.values()].filter(view=>view.side==='enemy').length);
   for(let i=0;i<idle.length;i++){
    const actor=idle[i],side=i===0?'player':'enemy',x=i===0?119:331,y=groundY+15;
    actor.setVisible(host.game.state.phase==='ready');
    if(host.game.state.phase!=='ready')continue;
    g.fillStyle(0x243e40,.2);g.fillEllipse(x,y+2,25,7);
    actor.setPosition(x,y).setDepth(y+.5);
    if(actor instanceof Phaser.GameObjects.Image){actor.setScale(.47*TROOP_FRAME.height/actor.height).setFlipX(i===1);if(i===1&&storybookArt(host.game.profile.enemyAge))actor.setTint(0xffd9b5);}
    else {actor.setScale(i===0?1:-1,1);drawTroop(actor,i===0?host.game.profile.age:host.game.profile.enemyAge,0,side,0,false);}
   }
   layers.chronicleView.update(host.game.profile,host.game.state,groundY,host.layout().laneGap,host.reduce());
   drawCamp();
   layers.armyLayer.sort('depth');
 }
 return {
  units,
  draw,
  /** Rebuilds the bases, the idle pair and the camp recruits for the current ages. */
  syncActors(p:{age:number;enemyAge:number}):void {
   playerBase?.destroy();enemyBase?.destroy();
   playerBase=createBase(p.age,'player');enemyBase=createBase(p.enemyAge,'enemy');
   layers.armyLayer.add([playerBase,enemyBase]);
   for(const actor of idle)actor.destroy();idle=[];
   for(const side of ['player','enemy'] as const){const actor=sprite(side==='player'?p.age:p.enemyAge,0,side);layers.armyLayer.add(actor);idle.push(actor);}
   for(const actor of campActors)actor.destroy();campActors=[];
   for(const kind of [0,1,2] as const){const actor=sprite(p.age,kind,'player');layers.armyLayer.add(actor);campActors.push(actor);}
  },
  /** A replacement battle: drop every troop sprite. */
  clearUnits():void {for(const view of units.values())view.body.destroy();units.clear();},
  /** Scene shutdown: forget sprites without destroying them (Phaser owns them). */
  forget():void {units.clear();idle=[];},
 };
}
