import type {Phase} from '../game/types.ts';

export interface VillageVerdictInput {
 phase:Phase;
 elapsed:number;
 reduced:boolean;
}

export interface VillageVerdictFrame {
 mode:'celebrate'|'shelter';
 progress:number;
}

/** Pure presentation intent. Outcome ownership remains with the battle event/phase. */
export function villageVerdictFrame(input:Readonly<VillageVerdictInput>):Readonly<VillageVerdictFrame>|null {
 if(input.phase!=='won'&&input.phase!=='lost')return null;
 const elapsed=Number.isFinite(input.elapsed)&&input.elapsed>=0?input.elapsed:0;
 const progress=input.reduced?1:Math.max(0,Math.min(1,elapsed/.6));
 return Object.freeze({mode:input.phase==='won'?'celebrate':'shelter',progress});
}
