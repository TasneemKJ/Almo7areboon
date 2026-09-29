import type {SoundscapePCM} from './soundscape.ts';
interface SynthesisWorker {
 onmessage:((event:MessageEvent)=>void)|null;
 onerror:((event:ErrorEvent)=>void)|null;
 onmessageerror:((event:MessageEvent)=>void)|null;
 postMessage(message:{age:number}):void;
 terminate():void;
}
/** At most one synthesis thread. Superseded work is cancelled, not queued indefinitely. */
export function createSoundscapeSynthesis(create:()=>SynthesisWorker=()=>new Worker(new URL('./soundscape-worker.ts',import.meta.url),{type:'module'})) {
 let cancel:(()=>void)|undefined;
 return {
  generate(age:number):Promise<SoundscapePCM>{
   cancel?.();
   return new Promise((resolve,reject)=>{
    let worker:SynthesisWorker|undefined,closed=false;
    const finish=(error?:Error,pcm?:SoundscapePCM)=>{
     if(closed)return;closed=true;
     if(worker){worker.onmessage=worker.onerror=worker.onmessageerror=null;worker.terminate();}
     if(cancel===abort)cancel=undefined;
     if(error)reject(error);else resolve(pcm!);
    };
    const abort=()=>finish(new Error('Soundscape generation cancelled.'));cancel=abort;
    try{
     worker=create();
     worker.onmessage=({data})=>{
      const pcm=data as SoundscapePCM;
      if(!pcm||!(pcm.left instanceof Float32Array)||!(pcm.right instanceof Float32Array)||pcm.left.length!==pcm.right.length||pcm.left.length===0||pcm.left.length>529200||!Number.isFinite(pcm.sampleRate)||pcm.sampleRate<8000||pcm.sampleRate>22050||pcm.duration!==24){finish(new Error('Invalid generated soundscape.'));return;}
      finish(undefined,pcm);
     };
     worker.onerror=event=>{event.preventDefault();finish(new Error('Soundscape generation unavailable.'));};
     worker.onmessageerror=()=>finish(new Error('Soundscape transfer failed.'));
     worker.postMessage({age});
    }catch{finish(new Error('Soundscape worker unavailable.'));}
   });
  },
  dispose(){cancel?.();}
 };
}
