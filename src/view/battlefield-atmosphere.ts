import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {paintStorybookDepth,type StorybookDepthTriangle} from './storybook-depth.ts';
import {landscapePlacement} from './visual-theme.ts';
import {atmosphereFrame} from './era-atmosphere.ts';
import {paintAmbientMarks} from './battlefield-ambient-paint.ts';
import {villageFrame,type VillageViewport} from './village-life.ts';
import {createVillageMood,type VillageMoodSnapshot} from './village-mood.ts';
import {duskAtmosphereFrame,paintDuskAtmosphere} from './dusk-atmosphere.ts';
import {lightingHierarchyFrame,paintLightingHierarchy} from './lighting-hierarchy.ts';
import {cloudFrame,shootingStar,starFrame} from './living-sky.ts';
import {foregroundMist,stageGlow,type GlowMark} from './cinematic-grade.ts';
import {villageVerdictFrame} from './village-verdict.ts';
import type {orderPresentationFrame} from './order-presentation.ts';
import type {villageMusterFrame} from './village-muster.ts';
import type {WaveArrivalFrame} from './wave-arrival.ts';
import type {GamePort} from '../game/types';
import type {Layout} from './battlefield-types.ts';

const strokeBounds=(stroke:{from:{x:number;y:number};to:{x:number;y:number};width:number})=>({left:Math.min(stroke.from.x,stroke.to.x)-stroke.width,top:Math.min(stroke.from.y,stroke.to.y)-stroke.width,right:Math.max(stroke.from.x,stroke.to.x)+stroke.width,bottom:Math.max(stroke.from.y,stroke.to.y)+stroke.width});
const lightBounds=(mark:{center:{x:number;y:number};rx:number;ry:number})=>({left:mark.center.x-mark.rx,top:mark.center.y-mark.ry,right:mark.center.x+mark.rx,bottom:mark.center.y+mark.ry});
const paneBounds=(residents:readonly {panes:readonly {points:readonly {x:number;y:number}[]}[]}[])=>residents.flatMap(resident=>resident.panes.map(pane=>pane.points.reduce((bounds,point)=>({left:Math.min(bounds.left,point.x),top:Math.min(bounds.top,point.y),right:Math.max(bounds.right,point.x),bottom:Math.max(bounds.bottom,point.y)}),{left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity})));

export interface AtmosphereHost {
 scene:Phaser.Scene;
 game:GamePort;
 canvas():HTMLCanvasElement;
 layout():Layout;
 clock():number;
 reduce():boolean;
 aftermath():{phase:'won'|'lost';at:number}|null;
 waveArrival():WaveArrivalFrame|null;
 orderFrame():ReturnType<typeof orderPresentationFrame>;
 musterFrame():ReturnType<typeof villageMusterFrame>;
 villageViewport():VillageViewport;
 storybookDepth():readonly StorybookDepthTriangle[];
 villageMood?:()=>Readonly<VillageMoodSnapshot>;
}

/** The sky, ambient marks and village life behind the troops; repainted every frame from the scene's frames. */
export function createBattlefieldAtmosphere(host:AtmosphereHost,layers:{ambience:Phaser.GameObjects.Graphics;streak:Phaser.GameObjects.Graphics;stars:Phaser.GameObjects.Container;clouds:Phaser.GameObjects.Container;mist:Phaser.GameObjects.Container;stageLight:Phaser.GameObjects.Container}){
 const quiet=createVillageMood();
 function softTexture():string {
   const key='soft-light';
   if(!host.scene.textures.exists(key)){
    const texture=host.scene.textures.createCanvas(key,128,128),ctx=texture?.getContext();
    if(texture&&ctx){const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);texture.refresh();}
   }
   return key;
  }
 function paintSoft(pool:Phaser.GameObjects.Container,marks:readonly GlowMark[],blend:Phaser.BlendModes):void {
   const key=softTexture();
   while(pool.length<marks.length)pool.add(host.scene.add.image(0,0,key).setBlendMode(blend));
   pool.list.forEach((child,i)=>{
    const image=child as Phaser.GameObjects.Image,mark=marks[i];
    if(!mark){image.setVisible(false);return;}
    image.setVisible(true).setPosition(mark.x,mark.y).setDisplaySize(mark.rx*2,mark.ry*2).setTint(mark.color).setAlpha(Math.min(1,mark.alpha));
   });
  }
 function drawStageLight():void {
   const s=host.game.state,age=host.game.profile.age,st=layers.streak;st.clear();
   // Painted plates already contain sky, lamps and foreground shading. Procedural
   // clouds cannot be masked by their baked rooftops and would float over the walls.
   if(storybookArt(age)){
    for(const pool of [layers.stars,layers.clouds,layers.mist,layers.stageLight])pool.setVisible(false);
    return;
   }
   for(const pool of [layers.stars,layers.clouds,layers.mist,layers.stageLight])pool.setVisible(true);
   // Stars are pooled soft quads: tessellating 60 circles a frame cost ~12% fps at 2x density.
   paintSoft(layers.stars,starFrame(age,host.clock(),host.layout().groundY,host.reduce()).map(star=>({x:star.x,y:star.y,rx:star.size*2.2,ry:star.size*2.2,color:0xfff6e0,alpha:star.alpha})),Phaser.BlendModes.ADD);
   const streak=shootingStar(age,host.clock(),host.layout().groundY,host.reduce());
   if(streak){st.lineStyle(2.2,0xfff4d6,streak.alpha*.3);st.lineBetween(streak.x1,streak.y1,streak.x2,streak.y2);st.lineStyle(.9,0xffffff,streak.alpha);st.lineBetween(streak.x1+(streak.x2-streak.x1)*.4,streak.y1+(streak.y2-streak.y1)*.4,streak.x2,streak.y2);st.fillStyle(0xffffff,streak.alpha);st.fillCircle(streak.x2,streak.y2,1.1);}
   paintSoft(layers.clouds,cloudFrame(age,host.clock(),host.layout().groundY,host.reduce()),Phaser.BlendModes.NORMAL);
   paintSoft(layers.mist,foregroundMist(age,host.layout().groundY,host.layout().height,host.clock(),host.reduce()).map(m=>({...m,alpha:m.alpha*1.1})),Phaser.BlendModes.NORMAL);
   paintSoft(layers.stageLight,stageGlow(age,host.layout().groundY,host.clock(),host.reduce(),s.playerHp/Math.max(1,s.playerMaxHp),s.enemyHp/Math.max(1,s.enemyMaxHp)).map(m=>({...m,alpha:m.alpha*1.1})),Phaser.BlendModes.ADD);
  }
 function draw():void {
   const aftermath=host.aftermath(),waveArrival=host.waveArrival(),orderFrame=host.orderFrame(),musterFrame=host.musterFrame();
   const g=layers.ambience;g.clear();
   if(navigator.webdriver){delete host.canvas().dataset.villageVerdict;delete host.canvas().dataset.villageWatchfire;delete host.canvas().dataset.villageOrderAnswer;delete host.canvas().dataset.villageMusterAnswer;}
   if(storybookArt(host.game.profile.age)){
    layers.streak.clear();layers.stars.setVisible(false);layers.clouds.setVisible(false);layers.mist.setVisible(false);layers.stageLight.setVisible(true);
    const mood=host.villageMood?.()??quiet;
    const villageVerdict=aftermath?.phase===host.game.state.phase?villageVerdictFrame({phase:aftermath.phase,elapsed:Math.max(0,host.clock()-aftermath.at),reduced:host.reduce()}):null;
    const frame=villageFrame({age:host.game.profile.age,time:host.villageMood?mood.time:host.clock(),reduced:host.reduce(),restoration:host.game.profile.chronicle?.restoration??0,mood,viewport:host.villageViewport(),verdict:villageVerdict,watch:waveArrival,order:orderFrame?.answer,muster:musterFrame});
    paintStorybookDepth(g,host.storybookDepth(),host.villageMood?mood.time:host.clock(),host.reduce(),frame.lamps.map(lamp=>lamp.alpha));
    for(const resident of frame.residents)for(const pane of resident.panes){g.fillStyle(pane.color,pane.alpha);g.fillPoints(pane.points as Phaser.Types.Math.Vector2Like[],true);}
    for(const line of [...frame.verdictStrokes,...frame.watchStrokes,...frame.orderStrokes,...frame.musterStrokes,...frame.water]){g.lineStyle(line.width,line.color,line.alpha);g.lineBetween(line.from.x,line.from.y,line.to.x,line.to.y);}
    if(frame.bird)for(const shape of frame.bird){g.fillStyle(shape.color,shape.alpha);g.fillPoints(shape.points as Phaser.Types.Math.Vector2Like[],true);}
    const lights=[...frame.lamps,...frame.restorationLights];
    const verdictRegions=[...paneBounds(frame.verdictResidents),...frame.verdictStrokes.map(strokeBounds),...frame.verdictLights.map(lightBounds)];
    const watchfireRegions=[...frame.watchStrokes.map(strokeBounds),...frame.watchLights.map(lightBounds)];
    const orderRegions=[...frame.orderStrokes.map(strokeBounds),...frame.orderLights.map(lightBounds)];
    const musterRegions=[...paneBounds(frame.musterResidents),...frame.musterStrokes.map(strokeBounds),...frame.musterLights.map(lightBounds)];
    for(let i=0;i<layers.stageLight.length;i++){
     const image=layers.stageLight.getAt(i) as Phaser.GameObjects.Image,mark=lights[i];
     if(!mark){image.setVisible(false);continue;}
     image.setVisible(true).setPosition(mark.center.x,mark.center.y).setDisplaySize(mark.rx*2,mark.ry*2).setTint(mark.color).setAlpha(mark.alpha);
    }
    if(navigator.webdriver&&villageVerdict)host.canvas().dataset.villageVerdict=JSON.stringify({mode:villageVerdict.mode,progress:villageVerdict.progress,witnesses:frame.verdictResidents.length,strokes:frame.verdictStrokes.length,lights:lights.length,affectedLights:frame.verdictLights.length,regions:verdictRegions,reduced:host.reduce(),paused:host.game.state.paused});
    if(navigator.webdriver&&waveArrival&&frame.watchLights.length)host.canvas().dataset.villageWatchfire=JSON.stringify({number:waveArrival.number,intent:waveArrival.intent,progress:waveArrival.progress,lights:frame.watchLights.length,strokes:frame.watchStrokes.length,regions:watchfireRegions,reduced:host.reduce(),paused:host.game.state.paused});
    if(navigator.webdriver&&orderFrame?.answer&&frame.orderLights.length)host.canvas().dataset.villageOrderAnswer=JSON.stringify({kind:orderFrame.answer.kind,progress:orderFrame.answer.progress,lights:frame.orderLights.length,strokes:frame.orderStrokes.length,regions:orderRegions,reduced:host.reduce(),paused:host.game.state.paused});
    if(navigator.webdriver&&musterFrame)host.canvas().dataset.villageMusterAnswer=JSON.stringify({progress:musterFrame.progress,witnesses:frame.musterResidents.length,lights:frame.musterLights.length,strokes:frame.musterStrokes.length,regions:musterRegions,reduced:host.reduce(),paused:host.game.state.paused});
    return;
   }
   if(!storybookArt(host.game.profile.age)){
    paintDuskAtmosphere(g,duskAtmosphereFrame(host.game.profile.age,host.clock(),host.reduce()),landscapePlacement(450,host.layout().height,host.layout().groundY));
    paintLightingHierarchy(g,lightingHierarchyFrame(host.game.profile.age,host.clock(),host.reduce()),landscapePlacement(450,host.layout().height,host.layout().groundY));
   }
   drawStageLight();
   paintAmbientMarks(g,atmosphereFrame(host.game.profile.age,host.clock(),450,host.layout().groundY,host.reduce()));
 }
 return {draw};
}
