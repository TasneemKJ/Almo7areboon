import type {Game} from '../game/simulation.ts';
import type {Profile} from '../game/types.ts';
import {blades,fieldBlades} from '../game/smithy.ts';
import type {arenaLayout} from '../view/visual-theme.ts';
import {fieldBladeHtml,fieldBladeLabel,HAKAWATI_BLADE_LINE,NO_BLADE_LINE} from './smithy-screen.ts';
import {textIfChanged} from './dom-state.ts';
import {lang} from '../game/locale.ts';

/**
 * Broken blades on the field (game/smithy.ts): after a battle, and on the ready field until the next battle starts, each
 * lies where a troop of the company fell, a native button (64x44) over the painted ground. A tap carries it home
 * (listeners.ts dispatches 'blade-carry'); the carried button flies off before it is removed. While they lie, the
 * hakawati's line rests over the field; after a battle nobody fell in, a drier one.
 */
export function syncFieldBlades(layer:HTMLElement,tale:HTMLElement,p:Readonly<Profile>,s:Game['state'],arena:ReturnType<typeof arenaLayout>,w:number,h:number):void {
 const lying=s.phase==='running'||s.dusk?[]:fieldBlades(p),ids=new Set(lying.map(b=>String(b.id)));
 for(const node of Array.from(layer.querySelectorAll<HTMLElement>('.field-blade')))if(!ids.has(node.dataset.blade!)){
  if(node.classList.contains('carried')&&!node.dataset.leaving){node.dataset.leaving='true';node.addEventListener('animationend',()=>node.remove(),{once:true});setTimeout(()=>node.remove(),700);}
  else if(!node.classList.contains('carried'))node.remove();
 }
 for(const blade of lying){
  let node=layer.querySelector<HTMLElement>(`.field-blade[data-blade="${blade.id}"]`);
  if(!node){layer.insertAdjacentHTML('beforeend',fieldBladeHtml(blade.id,blade.kind));node=layer.lastElementChild as HTMLElement;}
  const x=blade.x*.45*arena.scale,y=(arena.groundY+blade.lane*arena.laneGap)*arena.scale;
  const style=`left:${Math.max(0,Math.min(w-64,x-32)).toFixed(1)}px;top:${Math.max(0,Math.min(h-44,y-16)).toFixed(1)}px`;
  if(node.getAttribute('style')!==style)node.setAttribute('style',style);
  const label=fieldBladeLabel(p,blade);if(node.getAttribute('aria-label')!==label)node.setAttribute('aria-label',label);
 }
 const over=s.phase==='won'||s.phase==='lost',none=over&&!s.dusk&&!s.smith&&s.stats.deployed>0&&blades(p).length>0;
 const line=lying.length&&over?HAKAWATI_BLADE_LINE[lang()]:none?NO_BLADE_LINE[lang()]:'';
 if(line&&!tale.dataset.dusk){textIfChanged(tale,line);tale.dataset.blades='true';tale.hidden=false;}
 else if(!line&&tale.dataset.blades){delete tale.dataset.blades;tale.hidden=true;}
}
