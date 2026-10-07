import {landscapePlacement} from './visual-theme.ts';
import {villageSkyPath,type Bounds,type VillageViewport} from './village-life.ts';
import type {BattlefieldMemoryRegion} from './battlefield-memory.ts';
import type {Layout} from './battlefield-types.ts';

/** Measures the page HUD in canvas space so village lights and battlefield marks stay clear of it. */
export function createHudMeasure(element:HTMLElement,canvas:()=>HTMLCanvasElement,layout:()=>Layout){
 return {
  /** Visible slice of the landscape and the HUD boxes in its source space. */
  viewport(age:number):VillageViewport {
   const placement=landscapePlacement(450,layout().height,layout().groundY),cssWorldScale=(element.clientWidth||450)/450;
   const visibleSource:Bounds=[Math.max(0,-placement.x/placement.scale),Math.max(0,-placement.y/placement.scale),Math.min(900,(450-placement.x)/placement.scale),Math.min(1000,(layout().height-placement.y)/placement.scale)];
   const hudSourceBounds:Bounds[]=[],shell=element.closest<HTMLElement>('.game-shell'),origin=element.getBoundingClientRect();
   if(shell)for(const node of Array.from(shell.querySelectorAll<HTMLElement>('.resources .currency,.resources .game-wordmark,.stage .eyebrow,.stage h1,.stage .scene-name,.stage .battle-select,.world-tools button,.battle-meta span,.battle-meta button,.battle-skills button,.pause-banner'))){
    const rect=node.getBoundingClientRect(),style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||!rect.width||!rect.height)continue;
    const sourceX=(x:number)=>((x-origin.left)/cssWorldScale-placement.x)/placement.scale;
    const sourceY=(y:number)=>((y-origin.top)/cssWorldScale-placement.y)/placement.scale;
    hudSourceBounds.push([sourceX(rect.left),sourceY(rect.top),sourceX(rect.right),sourceY(rect.bottom)]);
   }
   const viewport:VillageViewport={placement,cssWorldScale,visibleSource,hudSourceBounds};
   viewport.skyPath=villageSkyPath(age,viewport);
   return viewport;
  },
  /** HUD boxes in arena coordinates, for marks that must not sit under a control. */
  regions():BattlefieldMemoryRegion[] {
   const shell=element.closest<HTMLElement>('.game-shell'),box=canvas().getBoundingClientRect(),bounds:BattlefieldMemoryRegion[]=[];
   if(shell)for(const node of Array.from(shell.querySelectorAll<HTMLElement>('.resources .currency,.resources .game-wordmark,.stage .eyebrow,.stage h1,.stage .scene-name,.stage .battle-select,.world-tools button,.battle-meta span,.battle-meta button,.battle-skills button'))){
    const rect=node.getBoundingClientRect(),style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||!rect.width||!rect.height)continue;
    const left=Math.max(box.left,rect.left),top=Math.max(box.top,rect.top),right=Math.min(box.right,rect.right),bottom=Math.min(box.bottom,rect.bottom);
    if(left<right&&top<bottom)bounds.push({left:(left-box.left)*450/Math.max(1,box.width),top:(top-box.top)*layout().height/Math.max(1,box.height),right:(right-box.left)*450/Math.max(1,box.width),bottom:(bottom-box.top)*layout().height/Math.max(1,box.height)});
   }
   return bounds;
  },
 };
}
