import {synthesizeSoundscape,type SoundscapePCM} from './soundscape.ts';
// A narrow worker port avoids mixing lib.dom and lib.webworker global declarations.
const scope=globalThis as unknown as {
 onmessage:(event:MessageEvent<{age:number}>)=>void;
 postMessage(pcm:SoundscapePCM,transfer:Transferable[]):void;
};
scope.onmessage=({data})=>{
 const pcm=synthesizeSoundscape(data?.age);
 scope.postMessage(pcm,[pcm.left.buffer,pcm.right.buffer]);
};
