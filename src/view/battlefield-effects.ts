import type Phaser from 'phaser';
import {DeathVisuals} from './death-visuals.ts';
import {createActionEchoes} from './action-echoes.ts';
import {baseDamagePalette,baseDamageStage} from './base-damage.ts';
import {compactNumber} from '../game/format.ts';
import type {GamePort,Side,Unit} from '../game/types';
import type {createBattlefieldMarks} from './battlefield-marks.ts';
import {createCues} from './battlefield-cues.ts';
import {createParticles} from './battlefield-particles.ts';
import type {Layout} from './battlefield-types.ts';

export interface EffectsHost {
 scene:Phaser.Scene;
 game:GamePort;
 world():Phaser.GameObjects.Container;
 canvas():HTMLCanvasElement;
 layout():Layout;
 reduce():boolean;
 clock():number;
 /** Overrides the automation flag that gates review evidence (defaults to navigator.webdriver). */
 webdriver?():boolean;
}

/**
 * Transient combat feedback: sparks, rings, projectiles, flares, floating numbers and the
 * attack and impact cues, plus the hit-stop timer. Owns its pools; the scene feeds it events.
 */
export function createBattlefieldEffects(host:EffectsHost,layers:{fx:Phaser.GameObjects.Graphics;glow:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[]},marks:ReturnType<typeof createBattlefieldMarks>){
 const {fx,glow,groundFx}=layers;
 const answers=createActionEchoes({...host,camera:host.scene.cameras.main},layers);
 const particles=createParticles(host,layers);
 const cues=createCues(host,layers);
 const {emit,ring,flare,floatText}=particles;
 let baseHit:Record<Side,number>={player:0,enemy:0};
 let stop=0,cool=0,stops=0;
 const fallen=new DeathVisuals();
 function baseImpact(x:number,y:number,amount:number,heavy:boolean,targetSide:Side,targetAge:number):void {
   baseHit[targetSide]=.18;
   const palette=baseDamagePalette(targetAge),state=host.game.state;
   const hp=targetSide==='player'?state.playerHp:state.enemyHp,maxHp=targetSide==='player'?state.playerMaxHp:state.enemyMaxHp;
   const critical=baseDamageStage(hp,maxHp)==='critical';
   emit(x,y,critical?(heavy?13:9):(heavy?9:6),palette.debris,true,critical?.5:.36);
   ring(x,y,targetSide==='player'?0x8fe7f0:0xffbb8b,heavy?29:18);
   flare(x,y,heavy?34:22,targetSide==='player'?0x7fdcff:0xffa060,heavy?.34:.24);
   if(amount>0)floatText(x,y-17,compactNumber(amount),'#fff1c8',false,heavy);
   if(heavy)answers.cameraKick(55,.0012,1);
  }
 function impact(x:number,y:number,amount:number,age:number,kind:Unit['kind'],side:Side,heavy=kind===2):void {
   cues.pushImpactCue({x,y,age,kind,side,life:heavy?.3:.24,max:heavy?.3:.24});
   flare(x,y,heavy?22:13,side==='player'?0xbfefff:0xffc890,heavy?.26:.18);
   if(amount>0)floatText(x,y-15,compactNumber(amount),'#fff1c8',false,heavy);
  }
 function step(dt:number):void {
   fx.clear();glow.clear();marks.step(dt);cues.drawAttackCues(dt);cues.drawImpactCues(dt);fallen.step(dt,host.reduce());
   baseHit.player=Math.max(0,baseHit.player-dt);baseHit.enemy=Math.max(0,baseHit.enemy-dt);
   particles.stepSparks(dt);particles.stepRings(dt);
   cues.stepBolts(dt,bolt=>{
    if(bolt.meteor)answers.meteorLanding(bolt.to.x,bolt.to.y);
    if(bolt.targetBase&&bolt.targetSide!==undefined&&bolt.targetAge!==undefined)baseImpact(bolt.to.x,bolt.to.y,bolt.damage,bolt.heavy,bolt.targetSide,bolt.targetAge);
    else impact(bolt.to.x,bolt.to.y,bolt.damage,bolt.age,bolt.kind,bolt.side,bolt.heavy);
    if(bolt.memory)marks.remember(bolt.memory);
   });
   particles.stepFlares(dt);particles.stepFloaters(dt);answers.step(dt);
   marks.rewardEvidence(particles.floaters());
 }
 function reset(reason:'motion'|'scene'='scene'):void {
  stop=0;cool=0;answers.reset();delete host.canvas().dataset.battleOrder;baseHit={player:0,enemy:0};
  marks.reset(reason,cues.pendingMemories());
  delete host.canvas().dataset.battlefieldMemoryPending;
  for(const g of groundFx)g.clear();
  cues.clear();fallen.clear();particles.clear();glow.clear();
 }
 return {
  ...answers,fallen,emit,ring,flare,floatText,impact,baseImpact,step,reset,
  /** Seconds left on each base's hit pulse, read by the base-damage painter. */
  baseHit:(side:Side)=>baseHit[side],
  pushImpactCue:cues.pushImpactCue,pushAttackCue:cues.pushAttackCue,pushBolt:cues.pushBolt,
  /** Hit-stop: a heavy blow freezes the scene for about 50 ms, at most twice a second. */
  hitStop:{
   get count():number {return stops;},
   get remaining():number {return stop;},
   get cooldown():number {return cool;},
   trigger():boolean {if(cool>0)return false;stop=.05;cool=.5;stops++;if(host.webdriver?host.webdriver():navigator.webdriver)host.canvas().dataset.hitStops=String(stops);return true;},
   cancel():void {stop=0;cool=0;},
   /** Cools the limiter and reports whether this frame is frozen. */
   frozen(dt:number):boolean {
    if(cool>0)cool=Math.max(0,cool-dt);
    if(stop>0){stop=Math.max(0,stop-dt);return true;}
    return false;
   },
  },
 };
}
