import type {CardRarity} from '../game/cards.ts';
import {path as p,ellipse as e,rect as r,line as l} from './illustration-kit.ts';

export interface CardFrameSpec {
  outerInset:number;
  clearRadius:number;
  plinthY:number;
  rimWidth:number;
  ornamentCount:number;
}

const SPECS:Record<CardRarity,CardFrameSpec>={
  common:{outerInset:8,clearRadius:46,plinthY:109,rimWidth:1.2,ornamentCount:0},
  rare:{outerInset:8,clearRadius:45,plinthY:108,rimWidth:1.5,ornamentCount:1},
  epic:{outerInset:7,clearRadius:44,plinthY:107,rimWidth:2,ornamentCount:3},
  legendary:{outerInset:6,clearRadius:43,plinthY:106,rimWidth:2.5,ornamentCount:5},
};
const valid=(rarity:CardRarity):CardRarity=>rarity in SPECS?rarity:'common';
export function cardFrameSpec(rarity:CardRarity):CardFrameSpec{return {...SPECS[valid(rarity)]};}

const diamond=(x:number,y:number,size:number,fill:string,stroke:string,width:number)=>p(`M${x} ${y-size}L${x+size} ${y} ${x} ${y+size} ${x-size} ${y}Z`,fill,stroke,width);
const ornamentXs:Record<CardRarity,readonly number[]>={common:[],rare:[64],epic:[42,64,86],legendary:[30,47,64,81,98]};

/** Perimeter-only frame: ornament grows with rarity while the center remains object-first. */
export function cardFrameSvg(input:CardRarity,color:string):string {
  const rarity=valid(input),spec=SPECS[rarity],i=spec.outerInset,inner=i+5;
  const upper=rarity==='legendary'?'#fff0bd':rarity==='epic'?'#ead9ff':rarity==='rare'?'#dceaff':'#e5ecd4';
  let body=r(i,i,128-i*2,104,10,'none',color,spec.rimWidth);
  body+=r(inner,inner,128-inner*2,94,8,'none','#e9dfbd',.7);
  body+=l(`M${i+5} ${i+17}V${i+5}H${i+17}M${111-i} ${i+5}H${123-i}V${i+17}M${i+5} 93V105H${i+17}M${111-i} 105H${123-i}V93`,upper,1.3);
  body+=`<g data-layer="card-ground">${e(64,spec.plinthY,36,4.2,'#183a45')}<g opacity=".42">${p(`M29 ${spec.plinthY}Q64 ${spec.plinthY-8} 99 ${spec.plinthY}L94 ${spec.plinthY+7}Q64 ${spec.plinthY+11} 34 ${spec.plinthY+7}Z`,color,'none',0)}</g></g>`;
  for(const x of ornamentXs[rarity])body+=diamond(x,13,rarity==='legendary'?3.1:2.6,upper,color,.8);
  if(rarity==='epic'||rarity==='legendary')body+=l(`M22 102Q64 96 106 102`,upper,rarity==='legendary'?1.6:1);
  if(rarity==='legendary')body+=l('M18 27L10 23M110 27l8-4M18 83l-8 4M110 83l8 4','#f3d589',1.2);
  return `<g data-layer="card-frame" data-rarity="${rarity}" data-clear-radius="${spec.clearRadius}">${body}</g>`;
}
