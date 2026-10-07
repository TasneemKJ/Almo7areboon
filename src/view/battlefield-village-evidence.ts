import type {VillageFrame,VillageHalo} from './village-life.ts';
import type {VillageVerdictFrame} from './village-verdict.ts';
import type {WaveArrivalFrame} from './wave-arrival.ts';
import type {orderPresentationFrame} from './order-presentation.ts';
import type {villageMusterFrame} from './village-muster.ts';
import type {AtmosphereHost} from './battlefield-atmosphere.ts';

const strokeBounds=(stroke:{from:{x:number;y:number};to:{x:number;y:number};width:number})=>({left:Math.min(stroke.from.x,stroke.to.x)-stroke.width,top:Math.min(stroke.from.y,stroke.to.y)-stroke.width,right:Math.max(stroke.from.x,stroke.to.x)+stroke.width,bottom:Math.max(stroke.from.y,stroke.to.y)+stroke.width});
const lightBounds=(mark:{center:{x:number;y:number};rx:number;ry:number})=>({left:mark.center.x-mark.rx,top:mark.center.y-mark.ry,right:mark.center.x+mark.rx,bottom:mark.center.y+mark.ry});
const paneBounds=(residents:readonly {panes:readonly {points:readonly {x:number;y:number}[]}[]}[])=>residents.flatMap(resident=>resident.panes.map(pane=>pane.points.reduce((bounds,point)=>({left:Math.min(bounds.left,point.x),top:Math.min(bounds.top,point.y),right:Math.max(bounds.right,point.x),bottom:Math.max(bounds.bottom,point.y)}),{left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity})));

/** Review-harness evidence for the village answers (verdict, watchfire, order, muster): bounded geometry of what was painted. */
export function publishVillageEvidence(host:AtmosphereHost,frame:VillageFrame,lights:readonly VillageHalo[],answers:{villageVerdict:VillageVerdictFrame|null;waveArrival:WaveArrivalFrame|null;orderFrame:ReturnType<typeof orderPresentationFrame>;musterFrame:ReturnType<typeof villageMusterFrame>}):void {
  const {villageVerdict,waveArrival,orderFrame,musterFrame}=answers;
    const verdictRegions=[...paneBounds(frame.verdictResidents),...frame.verdictStrokes.map(strokeBounds),...frame.verdictLights.map(lightBounds)];
    const watchfireRegions=[...frame.watchStrokes.map(strokeBounds),...frame.watchLights.map(lightBounds)];
    const orderRegions=[...frame.orderStrokes.map(strokeBounds),...frame.orderLights.map(lightBounds)];
    const musterRegions=[...paneBounds(frame.musterResidents),...frame.musterStrokes.map(strokeBounds),...frame.musterLights.map(lightBounds)];
    if(navigator.webdriver&&villageVerdict)host.canvas().dataset.villageVerdict=JSON.stringify({mode:villageVerdict.mode,progress:villageVerdict.progress,witnesses:frame.verdictResidents.length,strokes:frame.verdictStrokes.length,lights:lights.length,affectedLights:frame.verdictLights.length,regions:verdictRegions,reduced:host.reduce(),paused:host.game.state.paused});
    if(navigator.webdriver&&waveArrival&&frame.watchLights.length)host.canvas().dataset.villageWatchfire=JSON.stringify({number:waveArrival.number,intent:waveArrival.intent,progress:waveArrival.progress,lights:frame.watchLights.length,strokes:frame.watchStrokes.length,regions:watchfireRegions,reduced:host.reduce(),paused:host.game.state.paused});
    if(navigator.webdriver&&orderFrame?.answer&&frame.orderLights.length)host.canvas().dataset.villageOrderAnswer=JSON.stringify({kind:orderFrame.answer.kind,progress:orderFrame.answer.progress,lights:frame.orderLights.length,strokes:frame.orderStrokes.length,regions:orderRegions,reduced:host.reduce(),paused:host.game.state.paused});
    if(navigator.webdriver&&musterFrame)host.canvas().dataset.villageMusterAnswer=JSON.stringify({progress:musterFrame.progress,witnesses:frame.musterResidents.length,lights:frame.musterLights.length,strokes:frame.musterStrokes.length,regions:musterRegions,reduced:host.reduce(),paused:host.game.state.paused});
}
