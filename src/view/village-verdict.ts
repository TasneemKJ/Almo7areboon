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
 return Object.freeze({mode:input.phase==='won'?'celebrate':'shelter',progress:1});
}
