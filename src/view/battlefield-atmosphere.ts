import Phaser from 'phaser';
import {storybookArt} from './storybook-art.ts';
import {paintStorybookDepth,type StorybookDepthTriangle} from './storybook-depth.ts';
import {landscapePlacement} from './visual-theme.ts';
import {atmosphereFrame} from './era-atmosphere.ts';
import {createStageLight} from './battlefield-stage-light.ts';
import {publishVillageEvidence} from './battlefield-village-evidence.ts';
import {paintAmbientMarks} from './battlefield-ambient-paint.ts';
import {villageFrame,type VillageViewport} from './village-life.ts';
import {createVillageMood,type VillageMoodSnapshot} from './village-mood.ts';
import {duskAtmosphereFrame,paintDuskAtmosphere} from './dusk-atmosphere.ts';
import {lightingHierarchyFrame,paintLightingHierarchy} from './lighting-hierarchy.ts';


import {villageVerdictFrame} from './village-verdict.ts';
import type {orderPresentationFrame} from './order-presentation.ts';
import type {villageMusterFrame} from './village-muster.ts';
import type {WaveArrivalFrame} from './wave-arrival.ts';
import type {GamePort} from '../game/types';
import type {Layout} from './battlefield-types.ts';


export interface AtmosphereLayers {
 ambience:Phaser.GameObjects.Graphics;streak:Phaser.GameObjects.Graphics;stars:Phaser.GameObjects.Container;clouds:Phaser.GameObjects.Container;mist:Phaser.GameObjects.Container;stageLight:Phaser.GameObjects.Container;
}
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
export function createBattlefieldAtmosphere(host:AtmosphereHost,layers:AtmosphereLayers){
 const quiet=createVillageMood();
 const drawStageLight=createStageLight(host,layers);
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
    for(let i=0;i<layers.stageLight.length;i++){
     const image=layers.stageLight.getAt(i) as Phaser.GameObjects.Image,mark=lights[i];
     if(!mark){image.setVisible(false);continue;}
     image.setVisible(true).setPosition(mark.center.x,mark.center.y).setDisplaySize(mark.rx*2,mark.ry*2).setTint(mark.color).setAlpha(mark.alpha);
    }
    publishVillageEvidence(host,frame,lights,{villageVerdict,waveArrival,orderFrame,musterFrame});
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
