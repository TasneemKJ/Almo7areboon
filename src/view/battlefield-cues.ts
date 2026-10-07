import type Phaser from 'phaser';
import {groundEffectLayer} from './ground-effects.ts';
import {attackCueFrame} from './combat-choreography.ts';
import {impactMaterialFrame} from './impact-material.ts';
import {lanePresentation} from './lane-perspective.ts';
import {projectileGeometry,paintProjectile} from './projectile-art.ts';
import {paintAttackMark,paintBoltLight,paintImpactMark,paintTraitCue} from './battlefield-cue-paint.ts';
import type {AttackCue,Bolt,ImpactCue} from './battlefield-types.ts';

export interface CueHost {
 reduce():boolean;
 canvas():HTMLCanvasElement;
}

/** Attack cues at the striker, impact cues at the target and projectiles in flight; they land through `onLand`. */
export function createCues(host:CueHost,layers:{fx:Phaser.GameObjects.Graphics;glow:Phaser.GameObjects.Graphics;groundFx:Phaser.GameObjects.Graphics[]}){
 const {fx,glow,groundFx}=layers;
 let attackCues:AttackCue[]=[],impactCues:ImpactCue[]=[],bolts:Bolt[]=[];
 function drawAttackCues(dt:number):void {
   for(const cue of attackCues){
    const g=groundEffectLayer(groundFx,fx,cue.lane);
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    const perspective=lanePresentation(cue.lane,cue.kind);
    for(const mark of attackCueFrame(cue.age,cue.kind,cue.side,progress,host.reduce())){
     const x=cue.x+mark.x*perspective.scale,y=cue.y+mark.y*perspective.scale,forward=cue.side==='player'?1:-1,size=mark.size*perspective.scale;
     paintAttackMark(g,mark,x,y,forward,size);
    }
   }
   attackCues=attackCues.filter(cue=>cue.life>0);
  }
 function drawImpactCues(dt:number):void {
   const g=fx;
   for(const cue of impactCues){
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    if(cue.trait){
     const layer=groundEffectLayer(groundFx,g,cue.lane),alpha=host.reduce()?.85:Math.max(0,1-progress),size=host.reduce()?11:11+progress*5;
     paintTraitCue(layer,cue as typeof cue&{trait:NonNullable<typeof cue.trait>},alpha,size);
     continue;
    }
    for(const mark of impactMaterialFrame(cue.age,cue.kind,cue.side,progress,host.reduce())){
     const x=cue.x+mark.x,y=cue.y+mark.y,size=mark.size;
     paintImpactMark(g,mark,x,y,size);
    }
   }
   impactCues=impactCues.filter(cue=>cue.life>0);
  }

 return {
  drawAttackCues,drawImpactCues,
  pushImpactCue(cue:ImpactCue):void {impactCues.push(cue);if(impactCues.length>54)impactCues.shift();},
  pushAttackCue(cue:AttackCue):void {attackCues.push(cue);if(attackCues.length>42)attackCues.shift();},
  /** Projectiles are capped at 70 in flight; meteors (at most six per cast) are not. */
  pushBolt(bolt:Bolt,capped=true):void {bolts.push(bolt);if(capped&&bolts.length>70)bolts.shift();},
  /** Moves and paints every projectile; `onLand` runs for each one that arrives this frame. */
  stepBolts(dt:number,onLand:(bolt:Bolt)=>void):void {
   const g=fx;
   for(const bolt of bolts){
    bolt.life-=dt;const progress=1-Math.max(0,bolt.life)/bolt.max;
    const shot=projectileGeometry(bolt.from,bolt.to,progress,bolt.arc,bolt.age,bolt.heavy,bolt.side,bolt.meteor);
    paintBoltLight(glow,bolt,shot,progress);
    paintProjectile(g,shot);
    if(bolt.life<=0)onLand(bolt);
   }
   bolts=bolts.filter(b=>b.life>0);
   if(navigator.webdriver){const pending=bolts.flatMap(b=>b.memory?[b.memory.kind]:[]);if(pending.length)host.canvas().dataset.battlefieldMemoryPending=JSON.stringify(pending);else delete host.canvas().dataset.battlefieldMemoryPending;}
  },
  /** Accepted in-flight impacts, so a reset can commit them to battlefield memory. */
  pendingMemories:()=>bolts.flatMap(b=>b.memory?[b.memory]:[]),
  clear():void {attackCues=[];impactCues=[];bolts=[];},
 };
}
