import type {Side,UnitKind} from '../game/types.ts';
import {storybookArt} from './storybook-art.ts';
// Phaser 3.90 decodes ALL data: URLs as base64. Percent-encoded DOM URLs fail.
const loaderSvg=(svg:string)=>`data:image/svg+xml;base64,${btoa(svg)}`;
import {unitSheetSvg} from './unit-illustrations.ts';
import {baseSvg,foregroundSvg,landscapeSvg} from './world-illustrations.ts';
// Painted chapter shares one atlas per role; team halos and mirroring distinguish sides.
export const unitTexture=(age:number,kind:UnitKind,side:Side)=>`army-${age}-${kind}-${storybookArt(age)?'player':side}`;
export const baseTexture=(age:number,side:Side)=>`base-${age}-${storybookArt(age)?'player':side}`;
export const landscapeTexture=(age:number)=>`landscape-${age}`;
export const foregroundTexture=(age:number)=>`foreground-${age}`;
export interface VisualAsset {key:string;url:string;width:number;height:number;frames?:number;format?:'image'}
let cached:readonly VisualAsset[]|undefined;
export function visualAssets():readonly VisualAsset[] {
 if(cached)return cached;
 const entries:VisualAsset[]=[{key:'spoils-coin',url:'/art/storybook/interface/coin-token.webp',width:48,height:48,format:'image'}];
 for(let age=0;age<6;age++){
  const art=storybookArt(age);
  if(art){
   entries.push({key:landscapeTexture(age),url:`${art.folder}/village.webp`,width:900,height:1000,format:'image'});
   entries.push({key:foregroundTexture(age),url:loaderSvg('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'),width:1,height:1});
   entries.push({key:baseTexture(age,'player'),url:`${art.folder}/shelter.webp`,width:256,height:256,format:'image'});
   for(const kind of [0,1,2] as const)entries.push({key:unitTexture(age,kind,'player'),url:`${art.folder}/${art.roles[kind]}-strip.webp`,width:art.frameWidth*6,height:192,frames:6,format:'image'});
   continue;
  }
  entries.push({key:landscapeTexture(age),url:loaderSvg(landscapeSvg(age,false)),width:900,height:1000});
  entries.push({key:foregroundTexture(age),url:loaderSvg(foregroundSvg(age)),width:450,height:220});
  for(const side of ['player','enemy'] as const){
   entries.push({key:baseTexture(age,side),url:loaderSvg(baseSvg(age,side)),width:160,height:160});
   for(const kind of [0,1,2] as const)entries.push({key:unitTexture(age,kind,side),url:loaderSvg(unitSheetSvg(age,kind,side)),width:768,height:144,frames:6});
  }
 }
 cached=Object.freeze(entries.map(entry=>Object.freeze(entry)));return cached;
}
