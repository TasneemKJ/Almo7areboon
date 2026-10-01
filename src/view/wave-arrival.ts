import type {WaveIntent,WavePreview} from '../game/encounters.ts';
import type {GamePort,Phase,UnitKind} from '../game/types.ts';

export type WaveBannerShape='swallowtail'|'split-pennant'|'weighted-square';
export type WaveRoleShape='footprints'|'sling-stitches'|'block-tread';
export interface WaveArrivalPoint {x:number;y:number}
export interface WaveArrivalInput {phase:Phase;paused:boolean;reduced:boolean;preview:WavePreview|null|undefined}
export interface WaveArrivalRoleMark {role:UnitKind;shape:WaveRoleShape;x:number;y:number;alpha:number}
export interface WaveArrivalFrame {
 intent:WaveIntent;banner:{shape:WaveBannerShape;points:readonly WaveArrivalPoint[]};
 counts:readonly [number,number,number];nextIn:number;progress:number;clothLift:number;
 roleMarks:readonly WaveArrivalRoleMark[];countdownKnots:readonly {x:number;y:number;filled:boolean}[];
 depthOffset:number;
}

export const WAVE_ARRIVAL_DEPTH_OFFSET=-3;

const points=(values:readonly WaveArrivalPoint[])=>Object.freeze(values.map(point=>Object.freeze({...point})));
const banners:Record<WaveIntent,{shape:WaveBannerShape;points:readonly WaveArrivalPoint[]}>=Object.freeze({
 rush:Object.freeze({shape:'swallowtail',points:points([{x:0,y:-72},{x:18,y:-68},{x:11,y:-62},{x:18,y:-55},{x:0,y:-58}])}),
 volley:Object.freeze({shape:'split-pennant',points:points([{x:0,y:-72},{x:20,y:-67},{x:9,y:-64},{x:20,y:-58},{x:0,y:-59},{x:5,y:-65}])}),
 bulwark:Object.freeze({shape:'weighted-square',points:points([{x:0,y:-70},{x:18,y:-68},{x:18,y:-54},{x:0,y:-56}])}),
});
const roleShapes:readonly WaveRoleShape[]=['footprints','sling-stitches','block-tread'];
const integer=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0;

function freeze<T>(value:T):T {
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}
 return value;
}

/** Finite, view-only geometry from the same authoritative preview used by the HUD. */
export function waveArrivalFrame(input:WaveArrivalInput):WaveArrivalFrame|null {
 const preview=input.preview;
 if(input.phase!=='running'||!preview||typeof preview.nextIn!=='number'||!Number.isFinite(preview.nextIn)||preview.nextIn>4)return null;
 const raw=Array.isArray(preview.counts)?preview.counts:[],counts:[number,number,number]=[integer(raw[0]),integer(raw[1]),integer(raw[2])];
 let remaining=5;for(let role=0;role<3;role++){counts[role]=Math.min(counts[role],remaining);remaining-=counts[role];}
 if(remaining===5)return null;
 const intent:WaveIntent=preview.intent==='volley'||preview.intent==='bulwark'?preview.intent:'rush';
 const nextIn=Math.max(0,Math.min(4,preview.nextIn)),progress=(4-nextIn)/4;
 const roleMarks:WaveArrivalRoleMark[]=[];
 for(let role=0;role<3;role++)for(let count=0;count<counts[role];count++){
  const index=roleMarks.length;
  roleMarks.push({role:role as UnitKind,shape:roleShapes[role],x:-24+index*10,y:-5-(index%2)*3,alpha:.58+progress*.34});
 }
 const countdownKnots=Array.from({length:4},(_,index)=>({x:-18+index*8,y:4,filled:index<Math.ceil(progress*4-1e-9)}));
 // This is derived only from battle-time preview progress. Pause owns that clock,
 // so the view cannot drift; reduced motion selects the fixed cloth pose.
 const clothLift=input.reduced?0:-2*Math.sin(progress*Math.PI);
 return freeze({intent,banner:banners[intent],counts,nextIn,progress,clothLift,roleMarks,countdownKnots,depthOffset:WAVE_ARRIVAL_DEPTH_OFFSET});
}

/** Optional read boundary keeps fixtures compatible and the simulation query authoritative. */
export function waveArrivalForPort(game:GamePort,reduced:boolean):WaveArrivalFrame|null {
 const status=game.waveStatus?.();
 return waveArrivalFrame({phase:game.state.phase,paused:game.state.paused,reduced,preview:status?.preview});
}
