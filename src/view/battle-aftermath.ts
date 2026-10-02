import type {Phase,Side,UnitKind} from '../game/types.ts';

export interface BattleAftermathInput {
 phase:Phase;
 side:Side;
 kind:UnitKind;
 elapsed:number;
 reduced:boolean;
}
export interface BattleAftermathPose {
 mode:'triumph'|'withdraw';
 facing:'front'|'home';
 frame:number;
 forward:number;
 lift:number;
 angle:number;
 sx:number;
 sy:number;
}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const triumph=[
 {frame:5,lift:3.2,angle:-3.4,sx:.988,sy:1.018},
 {frame:4,lift:1.8,angle:3.7,sx:1.016,sy:.986},
 {frame:5,lift:.8,angle:1.2,sx:1.04,sy:.96},
] as const;
const withdraw=[
 {frame:1,angle:2.1,sx:.99,sy:1.01},
 {frame:2,angle:3.1,sx:.982,sy:1.018},
 {frame:3,angle:3.8,sx:1.025,sy:.975},
] as const;

/** View-only terminal pose. It never owns outcome, position, or lifetime state. */
export function battleAftermathPose(input:Readonly<BattleAftermathInput>):Readonly<BattleAftermathPose>|null {
 if((input.phase!=='won'&&input.phase!=='lost')||(input.side!=='player'&&input.side!=='enemy'))return null;
 const kind:UnitKind=Number.isInteger(input.kind)&&input.kind>=0&&input.kind<=2?input.kind:0;
 const elapsed=Number.isFinite(input.elapsed)?clamp(input.elapsed,0,1.3):0;
 const winner=input.phase==='won'?'player':'enemy';
 const mode=input.side===winner?'triumph':'withdraw';
 if(mode==='triumph'){
  const role=triumph[kind],pulse=input.reduced?0:Math.sin(clamp(elapsed/1.2,0,1)*Math.PI);
  return Object.freeze({mode,facing:'front',frame:role.frame,forward:0,lift:role.lift*pulse,angle:role.angle*(input.reduced?1:.6+.4*pulse),sx:1+(role.sx-1)*(input.reduced?1:pulse),sy:1+(role.sy-1)*(input.reduced?1:pulse)});
 }
 const role=withdraw[kind],progress=input.reduced?0:1-Math.pow(1-clamp(elapsed/1.3,0,1),2),pulse=input.reduced?0:Math.sin(clamp(elapsed/1.2,0,1)*Math.PI);
 return Object.freeze({mode,facing:'home',frame:role.frame,forward:4*progress,lift:.35*pulse,angle:role.angle*(input.reduced?1:.55+.45*pulse),sx:1+(role.sx-1)*(input.reduced?1:pulse),sy:1+(role.sy-1)*(input.reduced?1:pulse)});
}
