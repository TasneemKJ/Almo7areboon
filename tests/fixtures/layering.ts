import Phaser from 'phaser';
import { Game } from '../../src/game/simulation.ts';
import { defaultProfile } from '../../src/game/save.ts';
import type { GameEvent, GamePort, Unit } from '../../src/game/types.ts';
import { mountBattlefield } from '../../src/view/battlefield.ts';

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
  impactCues?: {trait?:string;x:number;y:number;lane?:number;life:number}[];
  attackCues?: unknown[];
  bolts?: unknown[];
  reduce?: boolean;
};
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
  return {
    ready: frames >= 6, age, enemyAge, lane, health, effectMode, includeTroops,
    images, groundEffects: actual.groundFx?.map(graphics) ?? [],
    baseDamage: graphics(actual.baseDamage),
    traits:actual.impactCues?.filter(cue=>cue.trait).map(cue=>({...cue}))??[],
    sourceCues:actual.attackCues?.length??0,projectiles:actual.bolts?.length??0,reduced:actual.reduce,
    state: { time: game.state.time, paused: game.state.paused, unitCount: game.state.units.length },
    canvas: { width: scene.game.canvas.width, height: scene.game.canvas.height },
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
}, () => {});

// Diagnostic access belongs exclusively to this test document.
declare global { interface Window { layeringReview: { inspect: typeof inspect; resumeEffects(): void; resetEffects(): void; destroy(): void }; } }
window.layeringReview = { inspect, resumeEffects:()=>{game.state.paused=false;}, resetEffects:()=>{game.state={...game.state,units:[]};}, destroy: () => renderer.destroy() };
window.addEventListener('pagehide', () => renderer.destroy(), { once: true });
