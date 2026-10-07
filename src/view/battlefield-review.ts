import Phaser from 'phaser';
import type {ReviewSnapshot} from './battlefield-types.ts';

/** Review-only canvas hooks (armed by browser automation): wait for the win/lose outcome frame and snapshot it. */
export function installReviewHooks(renderer:Phaser.Game):void {
  let reviewResult:ReviewSnapshot|null=null,reviewWaiter:((snapshot:ReviewSnapshot)=>void)|null=null,reviewArmed=false;
  Object.defineProperty(renderer.canvas,'battlefieldReviewArm',{configurable:true,value:(expected:'won'|'lost')=>{
   if(reviewArmed||expected!=='won'&&expected!=='lost')return false;reviewArmed=true;delete renderer.canvas.dataset.battlefieldReviewFrameReady;
   const waitForOutcome=()=>renderer.renderer.once(Phaser.Renderer.Events.POST_RENDER,()=>{
    const raw=renderer.canvas.dataset.battleAftermath;let state:{phase?:unknown;elapsed?:unknown}|null=null;try{state=raw?JSON.parse(raw) as {phase?:unknown;elapsed?:unknown}:null;}catch{state=null;}
    const verdictRaw=renderer.canvas.dataset.villageVerdict;let villageVerdict:{progress?:unknown}|null=null;try{villageVerdict=verdictRaw?JSON.parse(verdictRaw) as {progress?:unknown}:null;}catch{villageVerdict=null;}
    if(!state||state.phase!==expected||typeof state.elapsed!=='number'||!villageVerdict||villageVerdict.progress!==1||(renderer.scene.getScene('battlefield') as Phaser.Scene).cameras.main.flashEffect.isRunning){waitForOutcome();return;}
    const frame={resultOpen:document.querySelector('.result-dialog')!==null,aftermath:state,villageVerdict};
    renderer.canvas.dataset.battlefieldReviewFrameReady=expected;
    renderer.renderer.snapshot(image=>{reviewResult={...frame,image:image instanceof HTMLImageElement?image:null};reviewWaiter?.(reviewResult);reviewWaiter=null;},'image/png');
   });
   waitForOutcome();return true;
  }} satisfies PropertyDescriptor);
  Object.defineProperty(renderer.canvas,'battlefieldReviewSnapshot',{configurable:true,value:(callback:(snapshot:ReviewSnapshot)=>void)=>{if(reviewResult)callback(reviewResult);else reviewWaiter=callback;}} satisfies PropertyDescriptor);
  Object.defineProperty(renderer.canvas,'battlefieldReviewCanvasSnapshot',{configurable:true,value:(callback:(image:HTMLImageElement|null)=>void)=>{
   renderer.renderer.once(Phaser.Renderer.Events.POST_RENDER,()=>renderer.renderer.snapshot(image=>callback(image instanceof HTMLImageElement?image:null),'image/png'));
  }} satisfies PropertyDescriptor);
}
