import Phaser from 'phaser';
import {ChronicleView} from './chronicle-view.ts';
import {storybookArt} from './storybook-art.ts';
import {reducedMotion,projectileForHit,traitCueForHit} from './combat-feedback.ts';
import {arenaLayout,foregroundPlacement,landscapePlacement,troopPose,visualEra} from './visual-theme.ts';
import {atmosphereFrame} from './era-atmosphere.ts';
import {ensureVillageLight,villageFrame,villageSkyPath,type Bounds,type VillageViewport} from './village-life.ts';
import {createVillageMood,type VillageMoodSnapshot} from './village-mood.ts';
import {duskAtmosphereFrame,paintDuskAtmosphere} from './dusk-atmosphere.ts';
import {lightingHierarchyFrame,paintLightingHierarchy} from './lighting-hierarchy.ts';
import {baseDamageFrame,baseDamagePalette,baseDamageStage} from './base-damage.ts';
import {groundEffectDepth,groundEffectLayer} from './ground-effects.ts';
import {attackCueFrame,hitReaction} from './combat-choreography.ts';
import {impactMaterialFrame} from './impact-material.ts';
import {characterGesture} from './character-gesture.ts';
import {healthOffset,lanePresentation,projectileLift,troopScale} from './lane-perspective.ts';
import {unitFocusMarks} from './silhouette-focus.ts';
import {visualAssets,baseTexture,foregroundTexture,unitTexture,landscapeTexture} from './visual-assets.ts';
import {projectileGeometry,paintProjectile,projectileStyle} from './projectile-art.ts';
import {cloudFrame,shootingStar,starFrame} from './living-sky.ts';
import {VIGNETTE_RADIUS,eraGrade,gradeMatrix,gradePixels,keyLightRays,projectileGlow,stageGlow,teamHalo,vignetteStops,foregroundMist,type GlowMark} from './cinematic-grade.ts';
import {DeathVisuals} from './death-visuals.ts';
import {stackedY} from './floater-stack.ts';
import {TROOP_FRAME} from './unit-illustrations.ts';
import {compactNumber} from '../ui/battle-hud.ts';
import {battleResolution} from './render-resolution.ts';
import {drawTroop,drawBase} from './art';
import type {BattleState,GameEvent,GamePort,Unit,Side} from '../game/types';

type ImageOrFallback=Phaser.GameObjects.Image|Phaser.GameObjects.Graphics;
type TroopView={body:ImageOrFallback;x:number;y:number;side:Side;dustAt:number};
type Spark={x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:number;dust:boolean;lane?:number};
type Bolt={from:{x:number;y:number};to:{x:number;y:number};life:number;max:number;arc:number;age:number;kind:Unit['kind'];side:Side;heavy:boolean;damage:number;meteor?:boolean;targetBase?:boolean;targetSide?:Side;targetAge?:number};
type Ring={x:number;y:number;life:number;max:number;radius:number;color:number};
type Floater={text:Phaser.GameObjects.Text;life:number;max:number;startY:number;banner:boolean};
type AttackCue={x:number;y:number;lane:number;age:number;kind:Unit['kind'];side:Side;life:number;max:number};
type ImpactCue={x:number;y:number;age:number;kind:Unit['kind'];side:Side;life:number;max:number;trait?:'guard'|'pierce'|'sweep';lane?:number};
type Flare={x:number;y:number;life:number;max:number;radius:number;color:number};
const xAt=(x:number)=>x*.45;
/** View-only: nudges bodies sharing a lane by a few pixels so crowded columns read as individuals, not one stacked sprite. */
const rankStagger=(id:number)=>((id*7)%5-2)*1.1;
const noise=(n:number)=>{const value=Math.sin(n*117.13)*43758.5453;return value-Math.floor(value);};
const tint=(hex:string)=>parseInt(hex.slice(1),16);

/** Raster and SVG art share logical anchors; simulation remains the gameplay owner. */
export function mountBattlefield(element:HTMLElement,game:GamePort,onFrame:()=>void,onEvents:(events:GameEvent[])=>void,options:{isVisible?:()=>boolean;villageMood?:()=>Readonly<VillageMoodSnapshot>;onPresentation?:(dt:number,events:readonly GameEvent[])=>void}={}):{destroy():void} {
 let disposed=false;
 const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
 const loading=document.createElement('div');loading.className='world-loader';loading.setAttribute('role','status');loading.textContent='Preparing the battlefield…';element.append(loading);
 class Battlefield extends Phaser.Scene {
  private world!:Phaser.GameObjects.Container;
  private chronicleView!:ChronicleView;
  private sky!:Phaser.GameObjects.Image;
  private ambience!:Phaser.GameObjects.Graphics;
  private baseDamage!:Phaser.GameObjects.Graphics;
  private armyLayer!:Phaser.GameObjects.Container;
  private foreground!:Phaser.GameObjects.Image;
  private groundFx:Phaser.GameObjects.Graphics[]=[];
  private shadows!:Phaser.GameObjects.Graphics;
  private fx!:Phaser.GameObjects.Graphics;
  private bars!:Phaser.GameObjects.Graphics;
  private stageLight!:Phaser.GameObjects.Container;
  private villageViewport!:VillageViewport;
  private quietVillage=createVillageMood();
  private halos!:Phaser.GameObjects.Graphics;
  private glow!:Phaser.GameObjects.Graphics;
  private mist!:Phaser.GameObjects.Container;
  private clouds!:Phaser.GameObjects.Container;
  private stars!:Phaser.GameObjects.Container;
  private streak!:Phaser.GameObjects.Graphics;
  private graded=new Set<string>();
  private flares:Flare[]=[];
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
  private impactCues:ImpactCue[]=[];
  private floaters:Floater[]=[];
  private layout=arenaLayout(450,430);
  private ages='';
  private lastState:BattleState|null=null;
  private clock=0;
  private reduce=false;
  private failed=false;
  constructor(){super('battlefield');}
  preload():void {
   for(const asset of visualAssets()){
    if(asset.format==='image')this.load.image(asset.key,asset.url);
    else this.load.svg(asset.key,asset.url);
   }
   this.load.on('loaderror',()=>{this.failed=true;});
  }
  create():void {
   if(disposed)return;
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
   this.placeForeground();
   this.cacheVillageViewport();
   this.resetEffects();
  }
  private cacheVillageViewport():void {
   const placement=landscapePlacement(450,this.layout.height,this.layout.groundY),cssWorldScale=(element.clientWidth||450)/450;
   const visibleSource:Bounds=[Math.max(0,-placement.x/placement.scale),Math.max(0,-placement.y/placement.scale),Math.min(900,(450-placement.x)/placement.scale),Math.min(1000,(this.layout.height-placement.y)/placement.scale)];
   const hudSourceBounds:Bounds[]=[],shell=element.closest<HTMLElement>('.game-shell'),origin=element.getBoundingClientRect();
   if(shell)for(const node of Array.from(shell.querySelectorAll<HTMLElement>('.resources .currency,.resources .game-wordmark,.stage .eyebrow,.stage h1,.stage .scene-name,.stage .battle-select,.world-tools button,.battle-meta span,.battle-meta button'))){
    const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)continue;
    const sourceX=(x:number)=>((x-origin.left)/cssWorldScale-placement.x)/placement.scale;
    const sourceY=(y:number)=>((y-origin.top)/cssWorldScale-placement.y)/placement.scale;
    hudSourceBounds.push([sourceX(rect.left),sourceY(rect.top),sourceX(rect.right),sourceY(rect.bottom)]);
   }
   const viewport:VillageViewport={placement,cssWorldScale,visibleSource,hudSourceBounds};
   viewport.skyPath=villageSkyPath(game.profile.age,viewport);this.villageViewport=viewport;
  }
  private initVillageLights():void {
   const key=ensureVillageLight(this.textures);
   // Six scene-lifetime quads: four authored lamps plus two saved restoration witnesses.
   while(this.stageLight.length<6)this.stageLight.add(this.add.image(0,0,key).setBlendMode(Phaser.BlendModes.ADD).setVisible(false));
   for(let i=0;i<6;i++)(this.stageLight.getAt(i) as Phaser.GameObjects.Image).setTexture(key);
  }
  /**
   * Bakes the chapter grade into its static art once: no per-frame post pass, and Canvas and WebGL match.
   * Frames are sub-rectangles of the same source, so sprite sheets keep their cells. A tainted or
   * unavailable canvas leaves the art ungraded rather than failing.
   */
  /**
   * Static key-light rays and the stage vignette, painted into the art in its own source space
   * (map: world→source). Baked because full-screen blended layers cost ~5 fps each on fill-limited GPUs.
   */
  private finishStage(ctx:CanvasRenderingContext2D,age:number,map:{x:number;y:number;kx:number;ky:number}):void {
   const sx=(x:number)=>(x-map.x)*map.kx,sy=(y:number)=>(y-map.y)*map.ky,h=this.layout.height,{groundY}=this.layout;
   const rgba=(color:number,alpha:number)=>`rgba(${color>>16&255},${color>>8&255},${color&255},${alpha})`;
   ctx.save();ctx.globalCompositeOperation='lighter';
   for(const ray of keyLightRays(age,groundY,0,true)){ctx.fillStyle=rgba(ray.color,ray.alpha);ctx.beginPath();ctx.moveTo(sx(ray.x1),sy(ray.y1));ctx.lineTo(sx(ray.x2),sy(ray.y2));ctx.lineTo(sx(ray.x3),sy(ray.y3));ctx.closePath();ctx.fill();}
   ctx.restore();ctx.save();ctx.globalCompositeOperation='source-atop';
   const {center,stops,floor,color}=vignetteStops(age),rx=VIGNETTE_RADIUS/256*450*map.kx,ry=VIGNETTE_RADIUS/256*h*map.ky;
   ctx.translate(sx(center.x*450),sy(center.y*h));ctx.scale(1,ry/rx);
   const radial=ctx.createRadialGradient(0,0,0,0,0,rx);for(const [at,alpha]of stops)radial.addColorStop(at,rgba(color,alpha));
   ctx.fillStyle=radial;ctx.fillRect(-4*rx,-4*rx,8*rx,8*rx);
   ctx.setTransform(1,0,0,1,0,0);
   const base=ctx.createLinearGradient(0,sy((center.y+40/256)*h),0,sy(h));base.addColorStop(0,rgba(color,0));base.addColorStop(1,rgba(color,floor));
   ctx.fillStyle=base;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
   ctx.restore();
  }
  private bakeGrade(age:number):void {
   // The storybook paintings already contain their authored lighting and paper texture.
   if(storybookArt(age))return;
   const matrix=gradeMatrix(eraGrade(age));
   const keys=[landscapeTexture(age),foregroundTexture(age)];
   for(const side of ['player','enemy'] as const){keys.push(baseTexture(age,side));for(const kind of [0,1,2] as const)keys.push(unitTexture(age,kind,side));}
   for(const key of keys){
    if(this.graded.has(key)||!this.textures.exists(key))continue;
    this.graded.add(key);
    const source=this.textures.get(key).source[0],image=source?.image as CanvasImageSource|undefined;
    if(!source||!image||!source.width||!source.height)continue;
    try{
     const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)continue;
     ctx.drawImage(image,0,0);
     const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);gradePixels(pixels.data,matrix);ctx.putImageData(pixels,0,0);
     if(key===landscapeTexture(age)){const w=landscapePlacement(450,this.layout.height,this.layout.groundY);this.finishStage(ctx,age,{x:w.x,y:w.y,kx:1/w.scale,ky:1/w.scale});}
     if(key===foregroundTexture(age)){const f=foregroundPlacement(450,this.layout.height,this.layout.groundY);this.finishStage(ctx,age,{x:f.x,y:f.y,kx:canvas.width/f.width,ky:canvas.height/f.height});}
     source.image=canvas;source.source=canvas;source.isCanvas=true;
     const renderer=this.renderer;
     if(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer&&source.glTexture)renderer.updateCanvasTexture(canvas,source.glTexture,source.flipY);
    }catch{/* keep the ungraded, still-lit art */}
   }
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
  private sprite(age:number,kind:Unit['kind'],side:Side):ImageOrFallback {
   const key=unitTexture(age,kind,side);
   if(this.textures.exists(key))return this.add.image(0,0,key,'0').setOrigin(.5,136/144);
   return this.add.graphics();
  }
  private createBase(age:number,side:Side):ImageOrFallback {
   const key=baseTexture(age,side);
   if(this.textures.exists(key)){
    const image=this.add.image(0,0,key).setOrigin(.5,140/160);
    return image.setScale(.62*160/image.width).setFlipX(!!storybookArt(age)&&side==='enemy');
   }
   const graphic=this.add.graphics();drawBase(graphic,age,side);return graphic;
  }
  private syncEra():void {
   const p=game.profile,key=`${p.age}:${p.enemyAge}`;
   if(this.ages===key)return;this.ages=key;
   this.bakeGrade(p.age);this.bakeGrade(p.enemyAge);
   const backdrop=landscapeTexture(p.age),foreground=foregroundTexture(p.age);
   if(this.textures.exists(backdrop))this.sky.setTexture(backdrop).clearTint();else this.sky.setTexture('__WHITE').setTint(tint(visualEra(p.age).ground));
   if(this.textures.exists(foreground))this.foreground.setTexture(foreground).setVisible(true).clearTint();else this.foreground.setVisible(false);
   this.placeLandscape();this.placeForeground();
   if(storybookArt(p.age))this.initVillageLights();
   this.cacheVillageViewport();
   this.playerBase?.destroy();this.enemyBase?.destroy();
   this.playerBase=this.createBase(p.age,'player');this.enemyBase=this.createBase(p.enemyAge,'enemy');
   this.armyLayer.add([this.playerBase,this.enemyBase]);
   for(const actor of this.idle)actor.destroy();this.idle=[];
   for(const side of ['player','enemy'] as const){const actor=this.sprite(side==='player'?p.age:p.enemyAge,0,side);this.armyLayer.add(actor);this.idle.push(actor);}
   const shell=element.closest<HTMLElement>('.game-shell');
   if(shell){shell.dataset.era=String(p.age);shell.style.setProperty('--era-accent',visualEra(p.age).accent);}
  }
  private drawArmy():void {
   const g=this.shadows,h=this.halos;g.clear();h.clear();
   const {groundY}=this.layout;
   // A shared ground-plane sort lets rear-lane troops pass behind buildings.
   this.playerBase.setPosition(39,groundY+12).setDepth(groundY+12);
   this.enemyBase.setPosition(411,groundY+12).setDepth(groundY+12);
   this.baseDamage.setDepth(groundY+12.1);
   for(let lane=0;lane<3;lane++)this.groundFx[lane].clear().setDepth(groundEffectDepth(groundY,lane,this.layout.laneGap));
   const ids=new Set<number>();
   for(const unit of game.state.units){
    ids.add(unit.id);let view=this.units.get(unit.id);
    const x=xAt(unit.x),y=this.yAt(unit.lane)+rankStagger(unit.id),frozen=unit.side==='enemy'&&game.state.freezeUntil>game.state.time;
    if(!view){const body=this.sprite(unit.age,unit.kind,unit.side);this.armyLayer.add(body);view={body,x,y,side:unit.side,dustAt:0};this.units.set(unit.id,view);}
    const moving=Math.abs(view.x-x)>.001,perspective=lanePresentation(unit.lane,unit.kind),scale=troopScale(unit.kind,unit.lane)*(unit.storyBoss?1.35:1);
    const direction=unit.side==='player'?1:-1;
    const pose=troopPose(game.state.time+unit.id*.17,moving,unit.attacking,this.reduce||frozen);
    const gesture=characterGesture(unit.kind,game.state.time+unit.id*.17,moving,unit.attacking,this.reduce||frozen);
    const recoil=hitReaction(unit.hitFlash,unit.side,unit.kind,this.reduce||frozen);
    for(const mark of unitFocusMarks(unit.side,unit.lane,unit.kind,unit.hitFlash,frozen)){g.fillStyle(mark.color,mark.alpha);g.fillEllipse(x+mark.x,y+mark.y,mark.width,mark.height);}
    g.fillStyle(0x243c42,perspective.shadowAlpha);g.fillEllipse(x+3,y+3,perspective.shadowWidth,perspective.shadowHeight);
    const halo=teamHalo(unit.side,unit.kind,perspective.scale,unit.hitFlash,frozen);
    h.fillStyle(halo.color,halo.alpha*.45);h.fillEllipse(x+halo.x,y+halo.y,halo.rx*2,halo.ry*2,12);
    h.fillStyle(halo.color,halo.alpha*.6);h.fillEllipse(x+halo.x,y+halo.y,halo.rx*1.2,halo.ry*1.1,10);
    g.fillStyle(0x2a4647,perspective.shadowAlpha*.82);g.fillEllipse(x+2,y+2,perspective.shadowWidth*.68,perspective.shadowHeight*.38);
    if(view.body instanceof Phaser.GameObjects.Image){
     if(!game.state.paused)view.body.setFrame(String(pose.frame));
     view.body.setAngle(pose.angle*direction+gesture.angle*direction+recoil.angle);
     const density=TROOP_FRAME.height/view.body.height;
     view.body.setScale(scale*density*gesture.sx,scale*density*gesture.sy).setFlipX(unit.side==='enemy');
     if(unit.hitFlash>0)view.body.setTintFill(0xfff9db);else if(frozen)view.body.setTint(0x91e5f0);else if(unit.storyShadow)view.body.setTint((game.state.chronicle?.revealUntil??0)>game.state.time?0xd4e3bc:0xb8b8d1);else if(storybookArt(unit.age)&&unit.side==='enemy')view.body.setTint(0xffd9b5);else view.body.clearTint();
     view.body.setPosition(x+recoil.x+gesture.forward*direction,y-(game.state.paused?0:pose.lift)-gesture.lift+recoil.y);
    }else{
     view.body.setPosition(x+recoil.x+gesture.forward*direction,y-gesture.lift+recoil.y).setScale(direction*perspective.scale*gesture.sx,perspective.scale*gesture.sy).setAngle(pose.angle*direction+gesture.angle*direction+recoil.angle);
     drawTroop(view.body,unit.age,unit.kind,unit.side,this.reduce||frozen?0:game.state.time,unit.attacking,unit.hitFlash>0);
    }
    // Troops win a same-baseline tie against the building and its damage marks.
    view.body.setDepth(y+.5);
    if(moving&&!game.state.paused&&!frozen&&this.clock-view.dustAt>.28){this.emit(x,y+2,1,0xdfd4b1,true,.45,unit.lane);view.dustAt=this.clock;}
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
    actor.setPosition(x,y).setDepth(y+.5);
    if(actor instanceof Phaser.GameObjects.Image){actor.setScale(.47*TROOP_FRAME.height/actor.height).setFlipX(i===1);if(i===1&&storybookArt(game.profile.enemyAge))actor.setTint(0xffd9b5);}
    else {actor.setScale(i===0?1:-1,1);drawTroop(actor,i===0?game.profile.age:game.profile.enemyAge,0,side,0,false);}
   }
   this.chronicleView.update(game.profile,game.state,groundY,this.layout.laneGap,this.reduce);
   this.armyLayer.sort('depth');
  }
  private drawAtmosphere():void {
   const g=this.ambience;g.clear();
   if(storybookArt(game.profile.age)){
    this.streak.clear();this.stars.setVisible(false);this.clouds.setVisible(false);this.mist.setVisible(false);this.stageLight.setVisible(true);
    const mood=options.villageMood?.()??this.quietVillage;
    const frame=villageFrame({age:game.profile.age,time:options.villageMood?mood.time:this.clock,reduced:this.reduce,restoration:game.profile.chronicle?.restoration??0,mood,viewport:this.villageViewport});
    for(const resident of frame.residents)for(const pane of resident.panes){g.fillStyle(pane.color,pane.alpha);g.fillPoints(pane.points as Phaser.Types.Math.Vector2Like[],true);}
    for(const mark of frame.water){g.lineStyle(mark.width,mark.color,mark.alpha);g.lineBetween(mark.from.x,mark.from.y,mark.to.x,mark.to.y);}
    if(frame.bird)for(const shape of frame.bird){g.fillStyle(shape.color,shape.alpha);g.fillPoints(shape.points as Phaser.Types.Math.Vector2Like[],true);}
    const lights=[...frame.lamps,...frame.restorationLights];
    for(let i=0;i<this.stageLight.length;i++){
     const image=this.stageLight.getAt(i) as Phaser.GameObjects.Image,mark=lights[i];
     if(!mark){image.setVisible(false);continue;}
     image.setVisible(true).setPosition(mark.center.x,mark.center.y).setDisplaySize(mark.rx*2,mark.ry*2).setTint(mark.color).setAlpha(mark.alpha);
    }
    return;
   }
   if(!storybookArt(game.profile.age)){
    paintDuskAtmosphere(g,duskAtmosphereFrame(game.profile.age,this.clock,this.reduce),landscapePlacement(450,this.layout.height,this.layout.groundY));
    paintLightingHierarchy(g,lightingHierarchyFrame(game.profile.age,this.clock,this.reduce),landscapePlacement(450,this.layout.height,this.layout.groundY));
   }
   this.drawStageLight();
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
  /** One cached white radial falloff; every soft light is a tinted quad of it instead of tessellated nested ellipses. */
  private softTexture():string {
   const key='soft-light';
   if(!this.textures.exists(key)){
    const texture=this.textures.createCanvas(key,128,128),ctx=texture?.getContext();
    if(texture&&ctx){const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);texture.refresh();}
   }
   return key;
  }
  private paintSoft(pool:Phaser.GameObjects.Container,marks:readonly GlowMark[],blend:Phaser.BlendModes):void {
   const key=this.softTexture();
   while(pool.length<marks.length)pool.add(this.add.image(0,0,key).setBlendMode(blend));
   pool.list.forEach((child,i)=>{
    const image=child as Phaser.GameObjects.Image,mark=marks[i];
    if(!mark){image.setVisible(false);return;}
    image.setVisible(true).setPosition(mark.x,mark.y).setDisplaySize(mark.rx*2,mark.ry*2).setTint(mark.color).setAlpha(Math.min(1,mark.alpha));
   });
  }
  private drawStageLight():void {
   const s=game.state,age=game.profile.age,st=this.streak;st.clear();
   // Painted plates already contain sky, lamps and foreground shading. Procedural
   // clouds cannot be masked by their baked rooftops and would float over the walls.
   if(storybookArt(age)){
    for(const pool of [this.stars,this.clouds,this.mist,this.stageLight])pool.setVisible(false);
    return;
   }
   for(const pool of [this.stars,this.clouds,this.mist,this.stageLight])pool.setVisible(true);
   // Stars are pooled soft quads: tessellating 60 circles a frame cost ~12% fps at 2x density.
   this.paintSoft(this.stars,starFrame(age,this.clock,this.layout.groundY,this.reduce).map(star=>({x:star.x,y:star.y,rx:star.size*2.2,ry:star.size*2.2,color:0xfff6e0,alpha:star.alpha})),Phaser.BlendModes.ADD);
   const streak=shootingStar(age,this.clock,this.layout.groundY,this.reduce);
   if(streak){st.lineStyle(2.2,0xfff4d6,streak.alpha*.3);st.lineBetween(streak.x1,streak.y1,streak.x2,streak.y2);st.lineStyle(.9,0xffffff,streak.alpha);st.lineBetween(streak.x1+(streak.x2-streak.x1)*.4,streak.y1+(streak.y2-streak.y1)*.4,streak.x2,streak.y2);st.fillStyle(0xffffff,streak.alpha);st.fillCircle(streak.x2,streak.y2,1.1);}
   this.paintSoft(this.clouds,cloudFrame(age,this.clock,this.layout.groundY,this.reduce),Phaser.BlendModes.NORMAL);
   this.paintSoft(this.mist,foregroundMist(age,this.layout.groundY,this.layout.height,this.clock,this.reduce).map(m=>({...m,alpha:m.alpha*1.1})),Phaser.BlendModes.NORMAL);
   this.paintSoft(this.stageLight,stageGlow(age,this.layout.groundY,this.clock,this.reduce,s.playerHp/Math.max(1,s.playerMaxHp),s.enemyHp/Math.max(1,s.enemyMaxHp)).map(m=>({...m,alpha:m.alpha*1.1})),Phaser.BlendModes.ADD);
  }
  private flare(x:number,y:number,radius:number,color:number,life=.22):void {
   if(this.reduce)return;
   this.flares.push({x,y,radius,color,life,max:life});if(this.flares.length>48)this.flares.shift();
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
   this.flare(x,y,heavy?34:22,targetSide==='player'?0x7fdcff:0xffa060,heavy?.34:.24);
   if(amount>0)this.floatText(x,y-17,compactNumber(amount),'#fff1c8',false,heavy);
   if(heavy&&!this.reduce)this.cameras.main.shake(55,.0012);
  }
  private drawAttackCues(dt:number):void {
   for(const cue of this.attackCues){
    const g=groundEffectLayer(this.groundFx,this.fx,cue.lane);
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    const perspective=lanePresentation(cue.lane,cue.kind);
    for(const mark of attackCueFrame(cue.age,cue.kind,cue.side,progress,this.reduce)){
     const x=cue.x+mark.x*perspective.scale,y=cue.y+mark.y*perspective.scale,forward=cue.side==='player'?1:-1,size=mark.size*perspective.scale;
     if(mark.kind==='slash'){
      const a0=mark.angle-.72*forward,a1=mark.angle,a2=mark.angle+.72*forward;
      const p0={x:x+Math.cos(a0)*size,y:y+Math.sin(a0)*size};
      const p1={x:x+Math.cos(a1)*size*1.22,y:y+Math.sin(a1)*size*1.22};
      const p2={x:x+Math.cos(a2)*size,y:y+Math.sin(a2)*size};
      g.lineStyle(5,mark.color,mark.alpha*.18);g.lineBetween(p0.x,p0.y,p1.x,p1.y);g.lineBetween(p1.x,p1.y,p2.x,p2.y);
      g.lineStyle(1.7,mark.color,mark.alpha);g.lineBetween(p0.x,p0.y,p1.x,p1.y);g.lineBetween(p1.x,p1.y,p2.x,p2.y);
     }else if(mark.kind==='muzzle'||mark.kind==='flash'){
      g.fillStyle(mark.color,mark.alpha*.92);g.fillTriangle(x+forward*size,y,x-forward*size*.45,y-size*.58,x-forward*size*.45,y+size*.58);
      g.lineStyle(1.1,0xfff6d0,mark.alpha);g.lineBetween(x-forward*size*.4,y,x+forward*size*1.35,y);
      if(mark.kind==='muzzle'){g.lineBetween(x,y-size*.75,x,y+size*.75);}
     }else if(mark.kind==='energy'){
      g.fillStyle(mark.color,mark.alpha*.18);g.fillCircle(x,y,size*1.35);g.lineStyle(2,mark.color,mark.alpha);g.strokeCircle(x,y,size*.72);g.fillStyle(0xf0ffff,mark.alpha);g.fillCircle(x,y,size*.24);
     }else if(mark.kind==='smoke'){
      g.fillStyle(mark.color,mark.alpha*.24);g.fillCircle(x-size*.2,y+size*.1,size*.65);g.fillCircle(x+size*.35,y-size*.25,size*.82);
     }else if(mark.kind==='dust'){
      g.fillStyle(mark.color,mark.alpha*.22);g.fillEllipse(x,y,size*2.2,size*.72);
     }else{
      const dx=Math.cos(mark.angle)*size,dy=Math.sin(mark.angle)*size;g.lineStyle(2.1,mark.color,mark.alpha*.72);g.lineBetween(x-dx,y-dy,x+dx,y+dy);
     }
    }
   }
   this.attackCues=this.attackCues.filter(cue=>cue.life>0);
  }
  private drawImpactCues(dt:number):void {
   const g=this.fx;
   for(const cue of this.impactCues){
    cue.life-=dt;const progress=1-Math.max(0,cue.life)/cue.max;
    if(cue.trait){
     const layer=groundEffectLayer(this.groundFx,g,cue.lane),alpha=this.reduce?.85:Math.max(0,1-progress),size=this.reduce?11:11+progress*5;
     const x=cue.x,y=cue.y;
     layer.lineStyle(2,cue.trait==='guard'?0xa8e9ef:cue.trait==='pierce'?0xffe5a2:0xf6b993,alpha);
     if(cue.trait==='guard'){
      layer.beginPath();layer.moveTo(x-size*.7,y-size);layer.lineTo(x+size*.7,y-size);layer.lineTo(x+size*.6,y+size*.2);layer.lineTo(x,y+size*.85);layer.lineTo(x-size*.6,y+size*.2);layer.closePath();layer.strokePath();
     }else if(cue.trait==='pierce'){
      layer.lineBetween(x-size,y+size*.65,x+size,y-size*.65);layer.lineBetween(x+size*.25,y-size*.65,x+size,y-size*.65);layer.lineBetween(x+size,y-size*.65,x+size,y+size*.1);
     }else{
      layer.beginPath();layer.arc(x,y,size*1.15,.15,Math.PI-.15);layer.strokePath();layer.lineBetween(x-size*.9,y+size*.2,x-size*1.2,y-size*.2);
     }
     continue;
    }
    for(const mark of impactMaterialFrame(cue.age,cue.kind,cue.side,progress,this.reduce)){
     const x=cue.x+mark.x,y=cue.y+mark.y,size=mark.size;
     if(mark.kind==='flash'){
      g.fillStyle(mark.color,mark.alpha*.18);g.fillCircle(x,y,size*1.35);
      g.fillStyle(mark.color,mark.alpha);g.fillCircle(x,y,size*.34);
     }else if(mark.kind==='pulse'){
      g.lineStyle(1.5,mark.color,mark.alpha*.72);g.strokeEllipse(x,y,size*2,size*1.15);
      g.fillStyle(mark.color,mark.alpha*.12);g.fillEllipse(x,y,size*1.45,size*.76);
     }else if(mark.kind==='dust'||mark.kind==='smoke'){
      g.fillStyle(mark.color,mark.alpha*(mark.kind==='smoke'?.34:.26));g.fillEllipse(x,y,size*2.1,size*(mark.kind==='smoke'?1.35:.68));
     }else if(mark.kind==='spark'){
      const dx=Math.cos(mark.angle)*size,dy=Math.sin(mark.angle)*size;
      g.lineStyle(1.35,mark.color,mark.alpha);g.lineBetween(x-dx*.22,y-dy*.22,x+dx,y+dy);
      g.fillStyle(mark.color,mark.alpha*.9);g.fillCircle(x,y,Math.max(.6,size*.18));
     }else{
      const c=Math.cos(mark.angle),sn=Math.sin(mark.angle),r=size;
      g.fillStyle(mark.color,mark.alpha);g.fillTriangle(x+c*r,y+sn*r,x-sn*r*.65,y+c*r*.65,x-c*r*.55+sn*r*.42,y-sn*r*.55-c*r*.42);
     }
    }
   }
   this.impactCues=this.impactCues.filter(cue=>cue.life>0);
  }
  private healthBars():void {
   const g=this.bars,s=game.state;g.clear();
   for(const [i,x,hp,max,color]of [[0,39,s.playerHp,s.playerMaxHp,0x68c9ee],[1,411,s.enemyHp,s.enemyMaxHp,0xf19d75]]){
    const age=i===0?game.profile.age:game.profile.enemyAge;
    const y=this.layout.groundY-(storybookArt(age)?65:85),fill=59*Math.max(0,Math.min(1,hp/max));
    g.fillStyle(0x132d3c,.88);g.fillRoundedRect(x-33,y-4,66,19,7);
    g.lineStyle(1,0xd2d9ba,.5);g.strokeRoundedRect(x-33,y-4,66,19,7);
    g.fillStyle(0x5a7477,1);g.fillRoundedRect(x-30,y+7,60,5,2);
    if(fill>.1){g.fillStyle(color,1);g.fillRoundedRect(x-29.5,y+7,fill,4,2);}
    this.baseText[i].setPosition(x,y+1).setText(compactNumber(hp));
   }
   for(const unit of s.units)if(unit.hp<unit.maxHp){
    const perspective=lanePresentation(unit.lane,unit.kind),x=xAt(unit.x),y=this.yAt(unit.lane)-healthOffset(unit.kind,unit.lane),w=(unit.kind===2?31:22)*perspective.scale;
    g.fillStyle(0x203d43,.7);g.fillRoundedRect(x-w/2-1,y-1,w+2,5,2);
    g.fillStyle(unit.side==='player'?0x9de6ef:0xffb18a,1);const fill=w*Math.max(0,unit.hp/unit.maxHp);if(fill>.1)g.fillRoundedRect(x-w/2,y,fill,3,1);
   }
   if(s.freezeUntil>s.time){const y=this.layout.groundY+12;g.fillStyle(0xbff6ff,.1);g.fillEllipse(300,y,260,34,24);g.lineStyle(1.5,0xd6fbff,.55);g.strokeEllipse(300,y,250,30,24);}
  }
  private emit(x:number,y:number,count:number,color:number,dust=false,life=.36,lane?:number):void {
   if(this.reduce)return;
   for(let i=0;i<count;i++){const a=noise(i+this.clock*39)*Math.PI*2,speed=dust?8:22+noise(i+8)*39;
    this.sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-15,life,max:life,size:dust?3:1.3+noise(i+19)*2.5,color,dust,lane});}
   if(this.sparks.length>180)this.sparks.splice(0,this.sparks.length-180);
  }
  private ring(x:number,y:number,color:number,radius=18):void {
   if(this.reduce)return;
   this.rings.push({x,y,life:.32,max:.32,radius,color});if(this.rings.length>24)this.rings.shift();
  }
  private floatText(x:number,y:number,value:string,color='#fff1c8',large=false,heavy=false):void {
   const life=large?1.05:.62;
   const px=Math.max(22,Math.min(428,x));
   y=stackedY(this.floaters.map(f=>({x:f.text.x,startY:f.startY,life:f.life,max:f.max,banner:f.banner})),px,y,large);
   const text=this.add.text(px,y,value,{fontFamily:'Trebuchet MS, Arial, sans-serif',fontSize:large?'22px':heavy?'15px':'13px',fontStyle:'bold',color,stroke:'#132a33',strokeThickness:large?5:3}).setOrigin(.5).setShadow(0,2,'#08171d',large?6:3,true,true);
   this.world.add(text);this.floaters.push({text,life,max:life,startY:y,banner:large});
   // Skill and reward banners never compete with damage numbers for the 24 recycled slots.
   const numbers=this.floaters.filter(f=>!f.banner);
   if(numbers.length>24){const oldest=numbers[0];oldest.text.destroy();this.floaters.splice(this.floaters.indexOf(oldest),1);}
  }
  private impact(x:number,y:number,amount:number,age:number,kind:Unit['kind'],side:Side,heavy=kind===2):void {
   this.impactCues.push({x,y,age,kind,side,life:heavy?.3:.24,max:heavy?.3:.24});if(this.impactCues.length>54)this.impactCues.shift();
   this.flare(x,y,heavy?22:13,side==='player'?0xbfefff:0xffc890,heavy?.26:.18);
   if(amount>0)this.floatText(x,y-15,compactNumber(amount),'#fff1c8',false,heavy);
  }
  private event(e:GameEvent):void {
   const x=xAt(e.x??500),y=this.yAt(e.lane??1);
   if(e.storyCue){
    const words:Partial<Record<NonNullable<GameEvent['storyCue']>,string>>={'bell-warning':'THE BELL WAKES','bell-stilled':'STILLED',shatter:'SHATTER',captain:game.profile.chronicle?.captain==='gatekeeper'?'STAND TOGETHER':'BORROWED DAWN',rally:'TOGETHER',rescued:'COME HOME'};
    if(words[e.storyCue])this.floatText(x,y-50,words[e.storyCue]!,'#e5d4ad',e.storyCue==='captain');
    this.ring(x,y-10,e.storyCue==='shatter'?0xacc9c5:0xd5bd89,18);
    if((e.amount??0)<=0)return;
   }
   if(e.type==='spawn'){this.emit(x,y,5,0xdfd4b1,true,.4,e.lane??1);this.ring(x,y,0xc9e2b3,13);this.flare(x,y-4,16,e.side==='enemy'?0xff8b55:0x6fd6ff,.3);}
   if(e.type==='hit'){
    const trait=traitCueForHit(e);
    if(trait){this.impactCues.push({x:xAt(trait.x),y:this.yAt(trait.lane)-22,lane:trait.lane,trait:trait.trait,age:e.source?.age??0,kind:e.source?.kind??0,side:e.source?.side??'player',life:.28,max:.28});if(this.impactCues.length>54)this.impactCues.shift();}
    if(e.source&&e.trait!=='sweep'){this.attackCues.push({x:xAt(e.source.x),y:this.yAt(e.source.lane),lane:e.source.lane,age:e.source.age,kind:e.source.kind,side:e.source.side,life:.18,max:.18});if(this.attackCues.length>42)this.attackCues.shift();}
    const shot=projectileForHit(e),targetBase=e.target==='base',targetSide:Side=e.side==='player'?'enemy':'player';
    const targetAge=targetSide==='player'?game.profile.age:game.profile.enemyAge;
    if(shot&&!this.reduce){
     const u=shot.source,heavy=u.kind===2,direction=u.side==='player'?1:-1;
     const perspective=lanePresentation(u.lane,u.kind);
     this.bolts.push({from:{x:xAt(u.x)+direction*(heavy?27:22)*perspective.scale,y:this.yAt(u.lane)-projectileLift(u.kind,u.lane)},to:{x:xAt(shot.targetX),y:shot.base?this.layout.groundY-22:this.yAt(shot.targetLane)-22},life:.2,max:.2,arc:u.age<3?13*perspective.scale:0,age:u.age,kind:u.kind,side:u.side,heavy,damage:e.amount??0,targetBase:shot.base,targetSide,targetAge});
     if(this.bolts.length>70)this.bolts.shift();
    }else if(targetBase)this.baseImpact(x,this.layout.groundY-22,e.amount??0,e.source?.kind===2,targetSide,targetAge);
    else this.impact(x,y-22,e.amount??0,e.source?.age??0,e.source?.kind??0,e.source?.side??'player');
   }
   if(e.type==='death'){this.emit(x,y-12,9,e.side==='player'?0x82cce8:0xe6b388,true,.52,e.lane??1);this.flare(x,y-14,18,e.side==='player'?0x5ccfff:0xff8a50,.3);}
   if(e.type==='coin'&&e.amount)this.floatText(x,y-51,`+${compactNumber(e.amount)}`,'#ffdf7f');
   if(e.type==='win'&&game.state.chronicle&&['escort','hold','rescue'].includes(game.state.chronicle.objective)){this.floatText(225,this.layout.groundY-70,'THE COMPANY RETURNS','#e5d4ad',true);this.ring(110,this.layout.groundY-12,0xd5bd89,24);return;}
   if(e.type==='win'){this.emit(408,this.layout.groundY-27,40,0xffd373,false,1.25);this.flare(411,this.layout.groundY-30,120,0xffd27a,1.1);if(!this.reduce){this.cameras.main.shake(100,.0015);this.cameras.main.flash(260,255,226,170);}}
   if(e.type==='lose')this.emit(39,this.layout.groundY-10,20,0xb6a484,true,.8);
   if(e.type==='evolve')this.ring(225,this.layout.groundY,0xd2f9d8,200);
   if(e.type==='skill'){
    if(e.skill==='food'){this.floatText(225,this.layout.groundY-85,`+${Number((e.amount??10).toFixed(1))} FOOD`,'#fff0ae',true);this.ring(119,this.layout.groundY,0xc6ef9f,55);}
    if(e.skill==='freeze'){
     this.floatText(225,this.layout.groundY-90,'FROZEN','#d6fcff',true);
     if(!this.reduce)this.cameras.main.flash(220,170,240,255);
     for(const view of this.units.values())if(view.side==='enemy'){this.ring(view.x,view.y-18,0xa4efff,35);this.emit(view.x,view.y-25,12,0xd8fbff,false,.8);this.flare(view.x,view.y-20,34,0x9ff4ff,.6);}
    }
    if(e.skill==='meteor'){
     if(this.reduce){this.floatText(225,this.layout.groundY-85,'METEOR','#ffd6a5',true);return;}
     const targets=[...this.units.values()].filter(v=>v.side==='enemy').slice(0,6);
     for(const v of targets.length?targets:[{x:310,y:this.layout.groundY}])this.bolts.push({from:{x:v.x-70,y:v.y-150},to:{x:v.x,y:v.y-15},life:.4,max:.4,arc:0,age:0,kind:2,side:'player',heavy:true,damage:0,meteor:true});
     this.cameras.main.shake(180,.0025);this.cameras.main.flash(180,255,190,120);
    }
   }
  }
  private effects(dt:number):void {
   const g=this.fx,glow=this.glow;g.clear();glow.clear();this.drawAttackCues(dt);this.drawImpactCues(dt);this.fallen.step(dt,this.reduce);
   this.baseHit.player=Math.max(0,this.baseHit.player-dt);this.baseHit.enemy=Math.max(0,this.baseHit.enemy-dt);
   for(const spark of this.sparks){spark.life-=dt;spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;spark.vy+=(spark.dust?-3:50)*dt;
    const layer=groundEffectLayer(this.groundFx,g,spark.lane),alpha=Math.max(0,spark.life/spark.max);layer.fillStyle(spark.color,alpha*(spark.dust?.3:1));layer.fillCircle(spark.x,spark.y,spark.size*(spark.dust?2-alpha:1));
    if(!spark.dust){glow.fillStyle(spark.color,alpha*.35);glow.fillCircle(spark.x,spark.y,spark.size*2.6);}}
   this.sparks=this.sparks.filter(p=>p.life>0);
   for(const ring of this.rings){ring.life-=dt;const p=1-Math.max(0,ring.life/ring.max);g.lineStyle(2-p,ring.color,(1-p)*.7);g.strokeEllipse(ring.x,ring.y,ring.radius*2*p,ring.radius*p);}
   this.rings=this.rings.filter(r=>r.life>0);
   for(const bolt of this.bolts){
    bolt.life-=dt;const progress=1-Math.max(0,bolt.life)/bolt.max;
    const shot=projectileGeometry(bolt.from,bolt.to,progress,bolt.arc,bolt.age,bolt.heavy,bolt.side,bolt.meteor);
    const light=projectileGlow(projectileStyle(bolt.age,bolt.heavy,bolt.meteor).shape,bolt.side);
    if(light.alpha>0){
     const back=Math.max(0,progress-.22),tail={x:bolt.from.x+(shot.tip.x-bolt.from.x)*(back/Math.max(.01,progress)),y:bolt.from.y+(shot.tip.y-bolt.from.y)*(back/Math.max(.01,progress))};
     if(light.trail>0){glow.lineStyle(light.radius*.7,light.color,light.alpha*light.trail*.35);glow.lineBetween(tail.x,tail.y,shot.tip.x,shot.tip.y);}
     glow.fillStyle(light.color,light.alpha*.3);glow.fillCircle(shot.tip.x,shot.tip.y,light.radius);
     glow.fillStyle(light.color,light.alpha*.6);glow.fillCircle(shot.tip.x,shot.tip.y,light.radius*.45);
    }
    paintProjectile(g,shot);
    if(bolt.life<=0){if(bolt.targetBase&&bolt.targetSide!==undefined&&bolt.targetAge!==undefined)this.baseImpact(bolt.to.x,bolt.to.y,bolt.damage,bolt.heavy,bolt.targetSide,bolt.targetAge);else this.impact(bolt.to.x,bolt.to.y,bolt.damage,bolt.age,bolt.kind,bolt.side,bolt.heavy);}
   }
   this.bolts=this.bolts.filter(b=>b.life>0);
   for(const flare of this.flares){flare.life-=dt;const k=Math.max(0,flare.life/flare.max),r=flare.radius*(1.15-k*.4);
    glow.fillStyle(flare.color,k*.22);glow.fillCircle(flare.x,flare.y,r);glow.fillStyle(flare.color,k*.4);glow.fillCircle(flare.x,flare.y,r*.42);glow.fillStyle(0xffffff,k*.35);glow.fillCircle(flare.x,flare.y,r*.16);}
   this.flares=this.flares.filter(f=>f.life>0);
   for(const f of this.floaters){f.life-=dt;const progress=1-f.life/f.max;f.text.setY(f.startY-(this.reduce?0:progress*22)).setAlpha(Math.max(0,Math.min(1,f.life/f.max*2)));if(f.life<=0)f.text.destroy();}
   this.floaters=this.floaters.filter(f=>f.life>0);
  }
  private resetEffects():void {this.baseHit={player:0,enemy:0};for(const g of this.groundFx)g.clear();this.attackCues=[];this.impactCues=[];this.fallen.clear();for(const f of this.floaters)f.text.destroy();this.floaters=[];this.sparks=[];this.bolts=[];this.rings=[];this.flares=[];this.glow?.clear();}
  update(_time:number,delta:number):void {
   if(disposed||!this.world)return;
   const dt=Math.min(.05,Math.max(0,delta/1000));game.step(dt);
   const events=game.drainEvents();options.onPresentation?.(dt,events);if(events.length)onEvents(events);
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
 const pixelRatio=battleResolution(window.devicePixelRatio);
 try{
  renderer=new Phaser.Game({type:Phaser.AUTO,parent:element,width:(element.clientWidth||450)*pixelRatio,height:(element.clientHeight||430)*pixelRatio,transparent:true,antialias:true,render:{antialias:true,pixelArt:false},scale:{mode:Phaser.Scale.NONE,zoom:1/pixelRatio,autoCenter:Phaser.Scale.NO_CENTER},scene:[new Battlefield()],audio:{noAudio:true},fps:{target:60},banner:false});
 }catch(error){loading.textContent='The battlefield could not start. Reload or try another browser.';throw error;}
 renderer.canvas.setAttribute('role','img');renderer.canvas.setAttribute('aria-label','Illustrated battlefield. Blue warriors attack the red enemy base.');
 const observer=new ResizeObserver(()=>{if(!disposed&&element.clientWidth>0&&element.clientHeight>0)renderer.scale.resize(Math.round(element.clientWidth*pixelRatio),Math.round(element.clientHeight*pixelRatio));});observer.observe(element);
 return {destroy(){if(disposed)return;disposed=true;observer.disconnect();loading.remove();renderer.destroy(true);}};
}
