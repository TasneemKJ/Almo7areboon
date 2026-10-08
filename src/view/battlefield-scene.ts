import Phaser from 'phaser';
import {orderPresentationFrame} from './order-presentation.ts';
import {ChronicleView} from './chronicle-view.ts';
import {storybookArt} from './storybook-art.ts';
import {cacheStorybookDepth,type StorybookDepthTriangle} from './storybook-depth.ts';
import {reducedMotion,projectileForHit,traitCueForHit} from './combat-feedback.ts';
import {arenaLayout,foregroundPlacement,landscapePlacement,visualEra} from './visual-theme.ts';
import {ensureVillageLight,villageOrderHudChanged,type VillageViewport} from './village-life.ts';
import {type VillageMoodSnapshot} from './village-mood.ts';
import {createVillageMuster,rememberVillageMuster,villageMusterFrame} from './village-muster.ts';
import {lanePresentation,projectileLift} from './lane-perspective.ts';
import {foregroundTexture,landscapeTexture,visualAssets} from './visual-assets.ts';
import {waveArrivalForPort,type WaveArrivalFrame} from './wave-arrival.ts';
import {battlefieldMemoryIntentForHit,type BattlefieldMemoryInput} from './battlefield-memory.ts';
import {compactNumber} from '../game/format.ts';
import {createHudMeasure} from './battlefield-hud.ts';
import {bakeGrade} from './battlefield-grade.ts';
import {createBattlefieldMarks} from './battlefield-marks.ts';
import {createBattlefieldEffects} from './battlefield-effects.ts';
import {createBattlefieldArmy} from './battlefield-army.ts';
import {createBattlefieldAtmosphere} from './battlefield-atmosphere.ts';
import {paintBaseDamage,paintHealthBars,paintOrders} from './battlefield-overlays.ts';
import {tint,xAt} from './battlefield-types.ts';
import type {BattleState,GameEvent,GamePort,Side,Phase} from '../game/types';

export interface SceneHost {
 element:HTMLElement;
 game:GamePort;
 onFrame:(force?:boolean)=>void;
 onEvents:(events:GameEvent[])=>void;
 options:{isVisible?:()=>boolean;villageMood?:()=>Readonly<VillageMoodSnapshot>;onPresentation?:(dt:number,events:readonly GameEvent[])=>void};
 isDisposed():boolean;
 motionQuery:MediaQueryList;
 loading:HTMLElement;
 pixelRatio:number;
}

/** The Phaser scene: lays out the layers, then each frame steps the game and hands the frame to the collaborators. */
class Battlefield extends Phaser.Scene {
  private readonly ctx:SceneHost;
  private world!:Phaser.GameObjects.Container;
  private chronicleView!:ChronicleView;
  private sky!:Phaser.GameObjects.Image;
  private ambience!:Phaser.GameObjects.Graphics;
  private baseDamage!:Phaser.GameObjects.Graphics;
  private armyLayer!:Phaser.GameObjects.Container;
  private arrivalSignal!:Phaser.GameObjects.Graphics;
  private foreground!:Phaser.GameObjects.Image;
  private groundFx:Phaser.GameObjects.Graphics[]=[];
  private shadows!:Phaser.GameObjects.Graphics;
  private fx!:Phaser.GameObjects.Graphics;
  private bars!:Phaser.GameObjects.Graphics;
  private stageLight!:Phaser.GameObjects.Container;
  private villageViewport!:VillageViewport;
  private storybookDepth:readonly StorybookDepthTriangle[]=[];
  private villageHudPhase:Phase|null=null;
  private villageHudPaused:boolean|null=null;
  private villageMuster=createVillageMuster();
  private readonly hud:ReturnType<typeof createHudMeasure>;
  private readonly marks:ReturnType<typeof createBattlefieldMarks>;
  private effects!:ReturnType<typeof createBattlefieldEffects>;
  private army!:ReturnType<typeof createBattlefieldArmy>;
  private atmosphere!:ReturnType<typeof createBattlefieldAtmosphere>;
  private halos!:Phaser.GameObjects.Graphics;
  private glow!:Phaser.GameObjects.Graphics;
  private mist!:Phaser.GameObjects.Container;
  private clouds!:Phaser.GameObjects.Container;
  private stars!:Phaser.GameObjects.Container;
  private streak!:Phaser.GameObjects.Graphics;
  private graded=new Set<string>();
  private baseText:Phaser.GameObjects.Text[]=[];
  private campProps!:Phaser.GameObjects.Graphics;
  private layout=arenaLayout(450,430);
  private ages='';
  private lastState:BattleState|null=null;
  private aftermath:{phase:'won'|'lost';at:number}|null=null;
  private clock=0;
  private reduce=false;
  private failed=false;
  private orderFrame:ReturnType<typeof orderPresentationFrame>=null;
  private musterFrame:ReturnType<typeof villageMusterFrame>=null;
  private waveArrival:WaveArrivalFrame|null=null;
  constructor(ctx:SceneHost){
   super('battlefield');
   this.ctx=ctx;
   const {element,game}=ctx;
   this.hud=createHudMeasure(element,()=>this.game.canvas,()=>this.layout);
   this.marks=createBattlefieldMarks({ambience:()=>this.ambience,fx:()=>this.fx,canvas:()=>this.game.canvas,layout:()=>this.layout,yAt:lane=>this.yAt(lane),reduce:()=>this.reduce,paused:()=>game.state.paused,measureHud:()=>this.hud.regions()});
  }
  preload():void {
   for(const asset of visualAssets()){
    if(asset.format==='image')this.load.image(asset.key,asset.url);
    else this.load.svg(asset.key,asset.url);
   }
   this.load.on('loaderror',()=>{this.failed=true;});
  }
  create():void {
   const host=this.ctx,{game,element,options}=host;
   if(host.isDisposed())return;
   this.layout=arenaLayout(this.scale.width,this.scale.height);
   for(const asset of visualAssets())if(asset.frames&&this.textures.exists(asset.key)){
    const texture=this.textures.get(asset.key);
    const frameWidth=asset.width/asset.frames;
    for(let frame=0;frame<asset.frames;frame++)texture.add(String(frame),0,frame*frameWidth,0,frameWidth,asset.height);
   }
   this.world=this.add.container();
   this.sky=this.add.image(0,0,this.textures.exists(landscapeTexture(game.profile.age))?landscapeTexture(game.profile.age):'__WHITE').setOrigin(0);
   this.world.add(this.sky);
   this.stars=this.add.container();this.world.add(this.stars);
   this.streak=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);this.world.add(this.streak);
   this.clouds=this.add.container();this.world.add(this.clouds);
   this.ambience=this.add.graphics();this.world.add(this.ambience);
   this.stageLight=this.add.container();this.world.add(this.stageLight);
   if(storybookArt(game.profile.age))this.initVillageLights();
   this.shadows=this.add.graphics();this.world.add(this.shadows);
   this.halos=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);this.world.add(this.halos);
   this.armyLayer=this.add.container();this.world.add(this.armyLayer);
   this.arrivalSignal=this.add.graphics();this.armyLayer.add(this.arrivalSignal);
   this.campProps=this.add.graphics();this.armyLayer.add(this.campProps);
   this.chronicleView=new ChronicleView(this,this.armyLayer);
   this.baseDamage=this.add.graphics();this.armyLayer.add(this.baseDamage);
   // Fixed pools share the actor sort; no masks or per-particle game objects.
   for(let lane=0;lane<3;lane++){const g=this.add.graphics();this.armyLayer.add(g);this.groundFx.push(g);}
   this.foreground=this.add.image(0,0,this.textures.exists(foregroundTexture(game.profile.age))?foregroundTexture(game.profile.age):'__WHITE').setOrigin(0);
   if(this.foreground.texture.key==='__WHITE')this.foreground.setVisible(false);
   this.world.add(this.foreground);
   this.mist=this.add.container();this.world.add(this.mist);
   this.fx=this.add.graphics();this.world.add(this.fx);
   this.glow=this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);this.world.add(this.glow);
   this.bars=this.add.graphics();this.world.add(this.bars);
   for(let i=0;i<2;i++){
    const text=this.add.text(0,0,'',{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#fff5d8',stroke:'#203e4b',strokeThickness:2}).setOrigin(.5);
    this.baseText.push(text);this.world.add(text);
   }
   this.effects=createBattlefieldEffects({scene:this,game,world:()=>this.world,canvas:()=>this.game.canvas,layout:()=>this.layout,reduce:()=>this.reduce,clock:()=>this.clock},{fx:this.fx,glow:this.glow,groundFx:this.groundFx},this.marks);
   this.army=createBattlefieldArmy({scene:this,game,element,pixelRatio:host.pixelRatio,canvas:()=>this.game.canvas,layout:()=>this.layout,yAt:lane=>this.yAt(lane),reduce:()=>this.reduce,clock:()=>this.clock,aftermath:()=>this.aftermath,clearAftermath:()=>{this.aftermath=null;},waveArrival:()=>this.waveArrival},{shadows:this.shadows,halos:this.halos,armyLayer:this.armyLayer,arrivalSignal:this.arrivalSignal,baseDamage:this.baseDamage,groundFx:this.groundFx,campProps:this.campProps,chronicleView:this.chronicleView},this.effects);
   this.atmosphere=createBattlefieldAtmosphere({scene:this,game,canvas:()=>this.game.canvas,layout:()=>this.layout,clock:()=>this.clock,reduce:()=>this.reduce,aftermath:()=>this.aftermath,waveArrival:()=>this.waveArrival,orderFrame:()=>this.orderFrame,musterFrame:()=>this.musterFrame,villageViewport:()=>this.villageViewport,storybookDepth:()=>this.storybookDepth,villageMood:options.villageMood},{ambience:this.ambience,streak:this.streak,stars:this.stars,clouds:this.clouds,mist:this.mist,stageLight:this.stageLight});
   this.scale.on('resize',this.resize,this);
   this.events.once('shutdown',()=>{delete this.game.canvas.dataset.waveArrival;delete this.game.canvas.dataset.battleAftermath;delete this.game.canvas.dataset.villageVerdict;delete this.game.canvas.dataset.villageWatchfire;delete this.game.canvas.dataset.villageOrderAnswer;delete this.game.canvas.dataset.villageMusterAnswer;delete this.game.canvas.dataset.battlefieldMemory;delete this.game.canvas.dataset.spoilsHomecoming;delete this.game.canvas.dataset.spoilsReward;delete this.game.canvas.dataset.battlefieldReviewFrameReady;this.aftermath=null;this.orderFrame=null;this.musterFrame=null;this.waveArrival=null;this.villageMuster=createVillageMuster();this.scale.off('resize',this.resize,this);this.effects.reset();this.army.forget();});
   this.resize();this.syncEra();host.loading.remove();
   if(this.failed)element.dispatchEvent(new CustomEvent('visual-fallback',{bubbles:true}));
  }
  private resize():void {
   if(!this.world)return;
   this.layout=arenaLayout(this.scale.width,this.scale.height);
   this.world.setScale(this.layout.scale); // one scale: heads, circles and bodies never stretch
   this.placeLandscape();
   this.placeForeground();
   this.cacheVillageViewport();
   this.effects.reset();
  }
  private cacheVillageViewport():void {
   const host=this.ctx,{game}=host;
   const viewport=this.hud.viewport(game.profile.age);
   this.villageViewport=viewport;
   this.storybookDepth=cacheStorybookDepth(game.profile.age,viewport);
   this.villageHudPaused=game.state.paused;
   this.marks.setHudBounds(this.hud.regions());
  }
  private initVillageLights():void {
   const key=ensureVillageLight(this.textures);
   // Six scene-lifetime quads: four authored lamps plus two saved restoration witnesses.
   while(this.stageLight.length<6)this.stageLight.add(this.add.image(0,0,key).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
   for(let i=0;i<6;i++)(this.stageLight.getAt(i) as Phaser.GameObjects.Image).setTexture(key);
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
  private placeForeground():void {
   if(!this.foreground||!this.foreground.visible)return;
   const placement=foregroundPlacement(450,this.layout.height,this.layout.groundY);
   this.foreground.setPosition(placement.x,placement.y).setDisplaySize(placement.width,placement.height);
  }
  private yAt(lane:number):number{return this.layout.groundY+lane*this.layout.laneGap;}
  private syncEra():void {
   const host=this.ctx,{game,element}=host;
   const p=game.profile,key=`${p.age}:${p.enemyAge}`;
   if(this.ages===key)return;this.ages=key;
   bakeGrade(this,this.graded,this.layout,p.age);bakeGrade(this,this.graded,this.layout,p.enemyAge);
   const backdrop=landscapeTexture(p.age),foreground=foregroundTexture(p.age);
   if(this.textures.exists(backdrop))this.sky.setTexture(backdrop).clearTint();else this.sky.setTexture('__WHITE').setTint(tint(visualEra(p.age).ground));
   if(this.textures.exists(foreground))this.foreground.setTexture(foreground).setVisible(true).clearTint();else this.foreground.setVisible(false);
   this.placeLandscape();this.placeForeground();
   if(storybookArt(p.age))this.initVillageLights();
   this.cacheVillageViewport();
   this.army.syncActors(p);
   const shell=element.closest<HTMLElement>('.game-shell');
   if(shell){shell.dataset.era=String(p.age);shell.style.setProperty('--era-accent',visualEra(p.age).accent);}
  }
  private event(e:GameEvent):void {
   const host=this.ctx,{game}=host;
   this.villageMuster=rememberVillageMuster(this.villageMuster,e,game.state.time);
   const x=xAt(e.x??500),y=this.yAt(e.lane??1);
   if(e.type==='order'){this.effects.floatText(106,this.layout.groundY-58,e.order==='advance'?'ADVANCE':'HOLD THE LINE',e.order==='advance'?'#f0ce87':'#a9dfdc',false);return;}
   if(e.type==='win'||e.type==='lose')this.aftermath={phase:e.type==='win'?'won':'lost',at:this.clock};
   if(e.storyCue){
    const words:Partial<Record<NonNullable<GameEvent['storyCue']>,string>>={'bell-warning':'THE BELL WAKES','bell-stilled':'STILLED',shatter:'SHATTER',captain:game.profile.chronicle?.captain==='gatekeeper'?'STAND TOGETHER':'BORROWED DAWN',rally:'TOGETHER',rescued:'COME HOME'};
    if(words[e.storyCue])this.effects.floatText(x,y-50,words[e.storyCue]!,'#e5d4ad',e.storyCue==='captain');
    this.effects.ring(x,y-10,e.storyCue==='shatter'?0xacc9c5:0xd5bd89,18);
    if((e.amount??0)<=0)return;
   }
   this.effects.recordProvision(e);
   if(e.type==='spawn')this.effects.recordArrival(e,game.state.units);
   if(e.type==='spawn'){this.effects.emit(x,y,5,0xdfd4b1,true,.4,e.lane??1);this.effects.ring(x,y,0xc9e2b3,13);this.effects.flare(x,y-4,16,e.side==='enemy'?0xff8b55:0x6fd6ff,.3);}
   if(e.type==='hit'){
    if(e.source?.kind===2&&e.target==='unit'&&(e.amount??0)>0&&!this.reduce)this.effects.hitStop.trigger();
    const trait=traitCueForHit(e);
    if(trait){this.effects.pushImpactCue({x:xAt(trait.x),y:this.yAt(trait.lane)-22,lane:trait.lane,trait:trait.trait,age:e.source?.age??0,kind:e.source?.kind??0,side:e.source?.side??'player',life:.28,max:.28});}
    if(e.source&&e.trait!=='sweep'){this.effects.pushAttackCue({x:xAt(e.source.x),y:this.yAt(e.source.lane),lane:e.source.lane,age:e.source.age,kind:e.source.kind,side:e.source.side,life:.18,max:.18});}
    const shot=projectileForHit(e),intent=battlefieldMemoryIntentForHit(e),targetBase=e.target==='base',targetSide:Side=e.side==='player'?'enemy':'player';
    const targetAge=targetSide==='player'?game.profile.age:game.profile.enemyAge;
    if(shot&&!this.reduce){
     const u=shot.source,heavy=u.kind===2,direction=u.side==='player'?1:-1;
     const perspective=lanePresentation(u.lane,u.kind);
     this.effects.pushBolt({from:{x:xAt(u.x)+direction*(heavy?27:22)*perspective.scale,y:this.yAt(u.lane)-projectileLift(u.kind,u.lane)},to:{x:xAt(shot.targetX),y:shot.base?this.layout.groundY-22:this.yAt(shot.targetLane)-22},life:.2,max:.2,arc:u.age<3?13*perspective.scale:0,age:u.age,kind:u.kind,side:u.side,heavy,damage:e.amount??0,memory:intent??undefined,targetBase:shot.base,targetSide,targetAge});
     
    }else if(targetBase)this.effects.baseImpact(x,this.layout.groundY-22,e.amount??0,e.source?.kind===2,targetSide,targetAge);
    else{this.effects.impact(x,y-22,e.amount??0,e.source?.age??0,e.source?.kind??0,e.source?.side??'player');if(intent)this.marks.remember(intent);}
   }
   if(navigator.webdriver&&e.type==='death'){const c=this.game.canvas.dataset;c.lastDeath=JSON.stringify({kind:e.kind,side:e.side,n:Number(JSON.parse(c.lastDeath??'{}').n??0)+1});}
   if(e.type==='death'&&e.kind===2){
    // A heavy falling is the loudest thing on the field: wider dust, a second ring and a short low shake (none when reduced).
    this.effects.emit(x,y-10,18,e.side==='player'?0x82cce8:0xe6b388,true,.7,e.lane??1);this.effects.emit(x,y-16,8,0xf4e6c2,false,.45,e.lane??1);
    this.effects.flare(x,y-14,34,e.side==='player'?0x5ccfff:0xff8a50,.38);this.effects.ring(x,y-6,e.side==='player'?0x82cce8:0xf0c08a,30);
    this.effects.cameraKick(70,.0016,2);
    return;
   }
   if(e.type==='death'){this.effects.emit(x,y-12,9,e.side==='player'?0x82cce8:0xe6b388,true,.52,e.lane??1);this.effects.flare(x,y-14,18,e.side==='player'?0x5ccfff:0xff8a50,.3);}
   if(e.type==='coin'&&e.amount){this.marks.recordCoin(e,this.effects.floatText(x,y-51,`+${compactNumber(e.amount)}`,'#ffdf7f'));}
   if(e.type==='win'&&game.state.chronicle&&['escort','hold','rescue'].includes(game.state.chronicle.objective)){this.effects.floatText(225,this.layout.groundY-70,'THE COMPANY RETURNS','#e5d4ad',true);this.effects.ring(110,this.layout.groundY-12,0xd5bd89,24);return;}
   if(e.type==='win'){this.effects.emit(408,this.layout.groundY-27,40,0xffd373,false,1.25);this.effects.flare(411,this.layout.groundY-30,120,0xffd27a,1.1);if(!this.reduce){this.effects.cameraKick(100,.0015,4);this.cameras.main.flash(260,255,226,170);}}
   if(e.type==='lose')this.effects.emit(39,this.layout.groundY-10,20,0xb6a484,true,.8);
   if(e.type==='evolve')this.effects.ring(225,this.layout.groundY,0xd2f9d8,200);
   if(e.type==='skill'){
    if(e.skill==='food'){this.effects.floatText(225,this.layout.groundY-85,`+${Number((e.amount??10).toFixed(1))} FOOD`,'#fff0ae',true);this.effects.ring(119,this.layout.groundY,0xc6ef9f,55);}
    if(e.skill==='freeze'){
     this.effects.floatText(225,this.layout.groundY-90,'FROZEN','#d6fcff',true);
     if(!this.reduce)this.cameras.main.flash(220,170,240,255);
     for(const view of this.army.units.values())if(view.side==='enemy'){this.effects.ring(view.x,view.y-18,0xa4efff,35);this.effects.emit(view.x,view.y-25,12,0xd8fbff,false,.8);this.effects.flare(view.x,view.y-20,34,0x9ff4ff,.6);}
    }
    if(e.skill==='meteor'){
     const targets=[...this.army.units.values()].filter(v=>v.side==='enemy').slice(0,6);
     if(this.reduce){this.effects.floatText(225,this.layout.groundY-85,'METEOR','#ffd6a5',true);for(const v of targets){this.effects.meteorLanding(v.x,v.y-15);this.marks.remember({kind:'meteor',x:v.x,lane:v.lane,side:'player'});}return;}
     for(const v of targets.length?targets:[{x:310,y:this.layout.groundY,lane:1}]){const memory:BattlefieldMemoryInput={kind:'meteor',x:v.x,lane:v.lane,side:'player'};this.effects.pushBolt({from:{x:v.x-70,y:v.y-150},to:{x:v.x,y:v.y-15},life:.4,max:.4,arc:0,age:0,kind:2,side:'player',heavy:true,damage:0,meteor:true,memory:targets.length?memory:undefined},false);}
     this.effects.cameraKick(180,.0025,3);this.cameras.main.flash(180,255,190,120);
    }
   }
  }
  update(_time:number,delta:number):void {
   const host=this.ctx,{game,options,onEvents,onFrame,element}=host;
   if(host.isDisposed()||!this.world)return;
   const dt=Math.min(.05,Math.max(0,delta/1000));
   const reduced=reducedMotion(game.profile.motion,host.motionQuery.matches);
   // A transient impact never owns a replacement, paused, hidden or reduced-motion frame.
   if(this.lastState!==game.state||game.state.phase!=='running'||game.state.paused||(options.isVisible&&!options.isVisible())||reduced)this.effects.hitStop.cancel();
   // Hit-stop: a heavy blow freezes the whole scene for about 50 ms (at most twice a second); never with reduced motion.
   if(this.effects.hitStop.frozen(dt))return;
   game.step(dt);
   const events=game.drainEvents();options.onPresentation?.(dt,events);if(events.length)onEvents(events);
   if(this.lastState!==game.state){this.lastState=game.state;this.aftermath=null;delete this.game.canvas.dataset.battleAftermath;delete this.game.canvas.dataset.villageVerdict;delete this.game.canvas.dataset.villageWatchfire;delete this.game.canvas.dataset.villageOrderAnswer;delete this.game.canvas.dataset.villageMusterAnswer;this.villageMuster=createVillageMuster();this.musterFrame=null;this.marks.restartOrder();this.effects.reset();this.army.clearUnits();}
   if(reduced&&!this.reduce)this.effects.reset('motion');this.reduce=reduced;
   this.syncEra();for(const event of events)this.event(event);
   if(options.isVisible&&!options.isVisible()){onFrame();return;}
   if(!game.state.paused&&!this.reduce)this.clock+=dt;
   this.orderFrame=orderPresentationFrame(game.state,this.layout.groundY,this.reduce,this.layout.laneGap);
   this.musterFrame=villageMusterFrame(this.villageMuster,game.state.time,this.reduce);
   this.waveArrival=waveArrivalForPort(game,this.reduce);
   const phaseHudChanged=this.villageHudPhase!==game.state.phase,orderHudChanged=villageOrderHudChanged(this.villageHudPaused,game.state.paused,!!this.orderFrame?.answer,!!this.waveArrival,!!this.musterFrame);
   if(phaseHudChanged||orderHudChanged){const world=element.closest<HTMLElement>('.world');if(world?.dataset.phase!==game.state.phase||orderHudChanged)onFrame(true);this.villageHudPhase=game.state.phase;this.cacheVillageViewport();}
   this.atmosphere.draw();paintBaseDamage(this.baseDamage,game,this.layout,this.clock,this.reduce,side=>this.effects.baseHit(side));this.army.draw();paintOrders(this.shadows,this.orderFrame,()=>this.game.canvas,this.reduce);paintHealthBars(this.bars,this.baseText,game,this.layout,lane=>this.yAt(lane));this.effects.step(game.state.paused?0:dt);onFrame();
  }
}

/** Creates the battlefield scene for the given host. */
export function createBattlefieldScene(host:SceneHost):Phaser.Scene {
 return new Battlefield(host);
}
