/** The player's effects/atmosphere levels: pure value rules, no storage. */
export interface AudioMix {readonly effects:number;readonly atmosphere:number}
export const DEFAULT_AUDIO_MIX:AudioMix={effects:100,atmosphere:100};
export function normalizeAudioMix(value:unknown):AudioMix {
 const object=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const level=(field:unknown)=>typeof field==='number'&&Number.isFinite(field)?Math.round(Math.max(0,Math.min(100,field))/5)*5:100;
 return {effects:level(object.effects),atmosphere:level(object.atmosphere)};
}
