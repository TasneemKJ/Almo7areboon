import Phaser from 'phaser';
import { Game } from '../../src/game/simulation.ts';
import { defaultProfile } from '../../src/game/save.ts';
import type { GameEvent, GamePort, Unit } from '../../src/game/types.ts';
import { mountBattlefield } from '../../src/view/battlefield.ts';
import type {VillageMoodSnapshot} from '../../src/view/village-mood.ts';
import {VILLAGE_PLATES,type VillageViewport} from '../../src/view/village-life.ts';
import {visualAssets} from '../../src/view/visual-assets.ts';

// This entry is served only by the Vite development server. Production main.ts
// never imports it, and the production build has no route to this fixture.
const query = new URLSearchParams(location.search);
function numberParam(name: string, fallback: number, allowed: number[]): number {
  const value = Number(query.get(name) ?? fallback);
  if (!allowed.includes(value)) throw new Error(`Invalid fixture ${name}: ${value}`);
  return value;
}
const age = numberParam('age', 3, [0, 1, 2, 3, 4, 5]);
const enemyAge = numberParam('enemyAge', age, [0, 1, 2, 3, 4, 5]);
const lane = numberParam('lane', 0, [0, 1, 2]);
const health = numberParam('health', 25, [25, 70, 100]);
const effectMode = query.get('effects') ?? 'both';
if (!['none', 'attack', 'dust', 'both'].includes(effectMode)) throw new Error('Invalid fixture effects');
const traitMode=query.get('traits')??'none';
if(!['none','guard','pierce','sweep','all'].includes(traitMode))throw new Error('Invalid fixture traits');
const reduced=query.get('motion')==='reduced';
const width=numberParam('width',450,[320,390,450]);
if(width!==450){document.querySelector<HTMLElement>('main')!.style.width=`${width}px`;document.querySelector<HTMLElement>('#battlefield')!.style.width=`${width}px`;}
const includeTroops = query.get('troops') !== '0';
const village = query.get('village') === '1';
const crop = numberParam('crop',430,[220,430]);
const moodName = query.get('mood') ?? 'quiet';
if(!['quiet','alarmed','recovering'].includes(moodName))throw new Error('Invalid village mood');
let villageMood:VillageMoodSnapshot={mood:moodName as VillageMoodSnapshot['mood'],alarmMix:moodName==='quiet'?0:moodName==='alarmed'?1:.25,alarmSerial:moodName==='quiet'?0:1,time:2,alarmEnteredAt:moodName==='quiet'?null:0,alarmHistory:moodName==='recovering'?[{enteredAt:0,endedAt:1}]:[]};
if(village){
 const main=document.querySelector<HTMLElement>('main')!,field=document.querySelector<HTMLElement>('#battlefield')!;
 main.style.width=`${width}px`;field.style.width=`${width}px`;field.style.height=`${crop*width/450}px`;main.classList.add('game-shell');
 // Representative occupied production HUD selectors, actually measured by the
 // renderer's resize cache. This intentionally leaves a safe central sky gap.
 const hud=document.createElement('div');hud.className='resources';hud.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:2';
 hud.innerHTML='<span class="currency" style="position:absolute;left:6px;top:6px;background:#17252abb;padding:4px">COINS 240</span><span class="currency" style="position:absolute;right:6px;top:6px;background:#17252abb;padding:4px">FOOD 8</span>';
 field.append(hud);
}
const description = `Chapters ${age + 1}/${enemyAge + 1} · ${health}% base health · lane ${lane} · ${effectMode} effects`;
document.querySelector('#description')!.textContent = description;

const game = new Game({ ...defaultProfile(), age, enemyAge, motion: reduced?'reduced':'system' });
Object.assign(game.state, {
  phase: 'running', paused: true, time: 0,
  playerHp: game.state.playerMaxHp * health / 100,
  enemyHp: game.state.enemyMaxHp * health / 100,
});
const units: Unit[] = (['player', 'enemy'] as const).map((side, index) => ({
  id: index + 1, side, kind: 0, age: side === 'player' ? age : enemyAge,
  x: (side === 'player' ? 39 : 411) / .45, lane,
  hp: 100, maxHp: 100, attackTimer: 0, attacking: effectMode === 'attack' || effectMode === 'both', hitFlash: 0,
}));
game.state.units = includeTroops ? units : [];

// Real event handling produces the graphics. Paused presentation holds their
// lifetime at zero elapsed time; no Phaser methods or drawing code are mocked.
let pending: GameEvent[] = [];
for (const unit of units) {
  if (effectMode === 'dust' || effectMode === 'both') pending.push({ type: 'spawn', x: unit.x, lane, side: unit.side });
  if (effectMode === 'attack' || effectMode === 'both') pending.push({
    type: 'hit', source: unit, target: 'unit', x: 500, lane,
    side: unit.side, amount: 0,
  });
}
for(const [index,trait] of (['guard','pierce','sweep'] as const).entries())if(traitMode===trait||traitMode==='all')pending.push({type:'hit',target:'unit',amount:4,x:300+index*200,lane,side:'player',trait,source:{id:10+index,kind:trait==='sweep'?2:1,age:3,side:'player',x:250,lane:0}});
const port: GamePort = {
  profile: game.profile, get state(){return game.state;},
  dispatch: () => false, step: () => {},
  // Allow the initial ResizeObserver/layout pass to finish before emitting.
  drainEvents: () => { if (frames < 3) return []; const events = pending; pending = []; return events; },
};

let scene: Phaser.Scene;
// A fixture-only plugin uses Phaser's ordinary plugin API to observe the real
// scene graph. It adds no display objects and does not alter rendering order.
class ReviewPlugin extends Phaser.Plugins.ScenePlugin {
  constructor(current: Phaser.Scene, manager: Phaser.Plugins.PluginManager, key: string) {
    super(current, manager, key);
    if (current.sys.settings.key === 'battlefield') scene = current;
  }
}
Phaser.Plugins.PluginCache.register('LayeringReview', ReviewPlugin, 'layeringReview');
Phaser.Plugins.DefaultPlugins.CoreScene.push('LayeringReview');

type DisplayObject = Phaser.GameObjects.GameObject & Partial<Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.Visible>;
type RendererDiagnostics = Phaser.Scene & {
  groundFx?: Phaser.GameObjects.Graphics[];
  baseDamage?: Phaser.GameObjects.Graphics;
  ambience?:Phaser.GameObjects.Graphics;
  stageLight?:Phaser.GameObjects.Container;
  shadows?:Phaser.GameObjects.Graphics;
  halos?:Phaser.GameObjects.Graphics;
  sky?:Phaser.GameObjects.Image;
  armyLayer?:Phaser.GameObjects.Container;
  stars?:Phaser.GameObjects.Container;
  clouds?:Phaser.GameObjects.Container;
  mist?:Phaser.GameObjects.Container;
  villageViewport?:VillageViewport;
  impactCues?: {trait?:string;x:number;y:number;lane?:number;life:number}[];
  attackCues?: unknown[];
  bolts?: unknown[];
  reduce?: boolean;
};
// Decode the actual Graphics path stream emitted by the production renderer.
// These Phaser command IDs are stable in the pinned 3.90 Graphics API. Unknown
// commands fail diagnostics rather than silently substituting model output.
function paths(graphic:Phaser.GameObjects.Graphics|undefined){
 const fills:Array<{points:number[][];alpha:number}>=[],strokes:Array<{points:number[][];alpha:number;lineWidth:number}>=[];
 const commands=graphic?.commandBuffer??[];let points:number[][]=[],alpha=1,lineAlpha=1,lineWidth=1;
 for(let i=0;i<commands.length;){const command=commands[i++];switch(command){
  case 1:points=[];break;case 2:break;
  case 4:case 5:points.push([commands[i++],commands[i++]]);break;
  case 6:lineWidth=commands[i++];i++;lineAlpha=commands[i++];break;
  case 7:i++;alpha=commands[i++];break;
  case 8:fills.push({points:points.slice(),alpha});break;
  case 9:strokes.push({points:points.slice(),alpha:lineAlpha,lineWidth});break;
  default:throw new Error(`Unexpected village Graphics command ${command}`);
 }}
 return {fills,strokes};
}
function inspect() {
  const leaves: DisplayObject[] = [];
  function walk(objects: Phaser.GameObjects.GameObject[]) {
    for (const object of objects as DisplayObject[]) {
      if (object.visible === false) continue;
      if (object instanceof Phaser.GameObjects.Container) walk(object.list);
      else leaves.push(object);
    }
  }
  walk(scene.children.list);
  const images = leaves.flatMap((object, paintIndex) => {
    if (!(object instanceof Phaser.GameObjects.Image)) return [];
    const bounds = object.getBounds();
    return [{ texture: object.texture.key, paintIndex, x: object.x, y: object.y,
      flipX: object.flipX, depth: object.depth,
      bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } }];
  });
  const actual = scene as RendererDiagnostics;
  const graphics = (object: Phaser.GameObjects.Graphics | undefined) => object ? {
    paintIndex: leaves.indexOf(object), depth: object.depth,
    commandCount: object.commandBuffer.length,
  } : null;
  let objects=0;const count=(items:Phaser.GameObjects.GameObject[])=>{for(const item of items){objects++;if(item instanceof Phaser.GameObjects.Container)count(item.list);}};count(scene.children.list);
  const textures=scene.textures.getTextureKeys(),light=scene.textures.exists('village-light')?scene.textures.get('village-light').getSourceImage() as HTMLImageElement|HTMLCanvasElement:null;
  const decodedAssetBytes=visualAssets().reduce((bytes,asset)=>{const source=scene.textures.get(asset.key).getSourceImage() as HTMLImageElement|HTMLCanvasElement;return bytes+source.width*source.height*4;},0);
  return {
    ready: frames >= 6, age:game.profile.age, enemyAge:game.profile.enemyAge, lane, health, effectMode, includeTroops,
    images, groundEffects: actual.groundFx?.map(graphics) ?? [],
    baseDamage: graphics(actual.baseDamage),
    traits:actual.impactCues?.filter(cue=>cue.trait).map(cue=>({...cue}))??[],
    sourceCues:actual.attackCues?.length??0,projectiles:actual.bolts?.length??0,reduced:actual.reduce,
    state: { time: game.state.time, paused: game.state.paused, unitCount: game.state.units.length },
    canvas: { width: scene.game.canvas.width, height: scene.game.canvas.height },
    village:village?{mood:{...villageMood},plate:VILLAGE_PLATES[game.profile.age],viewport:actual.villageViewport,
     paths:paths(actual.ambience),ambience:graphics(actual.ambience),shadows:graphics(actual.shadows),halos:graphics(actual.halos),
     skyIndex:actual.sky?leaves.indexOf(actual.sky):-1,
     lamps:actual.stageLight?.list.map(object=>{const lamp=object as Phaser.GameObjects.Image;return {visible:lamp.visible,paintIndex:leaves.indexOf(lamp),x:lamp.x,y:lamp.y,width:lamp.displayWidth,height:lamp.displayHeight,alpha:lamp.alpha,tint:lamp.tintTopLeft};})??[],
     pools:{lights:actual.stageLight?.length,stars:actual.stars?.length,clouds:actual.clouds?.length,mist:actual.mist?.length},
     objects,textures,decodedBytes:decodedAssetBytes+(light?light.width*light.height*4:0),light:light?{width:light.width,height:light.height}:null,softLight:scene.textures.exists('soft-light'),
    }:null,
  };
}

let frames = 0;
const battlefield = document.querySelector<HTMLElement>('#battlefield')!;
battlefield.addEventListener('visual-fallback', () => { document.body.dataset.fallback = 'true'; });
const renderer = mountBattlefield(battlefield, port, () => {
  frames++;
  if (frames >= 6) {
    document.body.dataset.ready = 'true';
    document.querySelector('#status')!.textContent = 'Frozen state ready · actual Phaser renderer';
  }
}, () => {},village?{villageMood:()=>villageMood}:{});

// Diagnostic access belongs exclusively to this test document.
async function setClock(time:number){villageMood={...villageMood,time};await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return inspect();}
async function crossing(x:number){for(const unit of game.state.units)unit.x=x;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return inspect();}
async function chapter(age:number){if(!Number.isInteger(age)||age<0||age>5)throw Error('Invalid chapter');game.profile.age=age;game.profile.enemyAge=age;for(const unit of game.state.units)unit.age=age;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return inspect();}
declare global { interface Window { layeringReview: { inspect: typeof inspect;setClock:typeof setClock;crossing:typeof crossing;chapter:typeof chapter; resumeEffects():void;resetEffects():void;destroy():void }; } }
window.layeringReview = { inspect,setClock,crossing,chapter,resumeEffects:()=>{game.state.paused=false;},resetEffects:()=>{game.state={...game.state,units:[]};},destroy:()=>renderer.destroy() };
window.addEventListener('pagehide', () => renderer.destroy(), { once: true });
