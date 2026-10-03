/** Serialized into isolated browser contexts before production scripts run.
 * Every constructor/method delegates to the original native Web Audio/Worker API.
 * Observation never replaces DSP, promises, callbacks, scheduling or transfer data. */
export function installNativeAudioObserver({blockStorage=false}={}){
 const contexts=[],workers=[],nodes=[],events=[],writes=[];let nextId=0,maxWorkers=0,maxBeds=0,maxTransients=0,maxAccents=0;
 const count=kind=>nodes.filter(node=>node.kind===kind&&node.live&&node.context.state!=='closed').length;
 const accentCount=()=>nodes.filter(node=>{
  if(node.kind!=='transient'||!node.live||node.context.state==='closed')return false;
  const atmosphere=nodes.filter(n=>n.context===node.context&&n.kind==='gain')[1]?.id;
  return node.connections.some(id=>nodes.find(n=>n.id===id)?.connections.includes(atmosphere));
 }).length;
 const peaks=()=>{maxBeds=Math.max(maxBeds,count('bed'));maxTransients=Math.max(maxTransients,count('transient'));maxAccents=Math.max(maxAccents,accentCount());};
 const recordParameter=(parameter,id)=>{
  for(const name of ['setValueAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime','cancelScheduledValues']){
   const original=parameter[name];parameter[name]=function(...args){const result=Reflect.apply(original,this,args);events.push({id,method:name,args});return result;};
  }
 };
 const observeNode=(context,node,kind)=>{
  const entry={id:++nextId,context,kind,live:false,connected:false,starts:[],stops:[],connections:[],disconnects:0,...(kind==='transient'?{wave:null}:{})};nodes.push(entry);
  const connect=node.connect,disconnect=node.disconnect;
  node.connect=function(...args){const result=Reflect.apply(connect,this,args);entry.connected=true;entry.connections.push(nodes.find(n=>n.native===args[0])?.id??'destination');return result;};
  node.disconnect=function(...args){const result=Reflect.apply(disconnect,this,args);if(args.length===0){entry.connected=false;entry.live=false;}entry.disconnects++;return result;};
  Object.defineProperty(entry,'native',{value:node});
  if(kind==='gain')recordParameter(node.gain,entry.id);
  if(kind==='bed'||kind==='transient'){
   if(kind==='transient')recordParameter(node.frequency,entry.id);
   const start=node.start,stop=node.stop;
   node.start=function(...args){const result=Reflect.apply(start,this,args);entry.starts.push({at:args[0]??context.currentTime,bufferFrames:node.buffer?.length??null});if(kind==='transient')entry.wave=node.type;entry.live=entry.connected;peaks();return result;};
   node.stop=function(...args){const result=Reflect.apply(stop,this,args);entry.stops.push(args[0]??context.currentTime);return result;};
   node.addEventListener('ended',()=>{entry.live=false;});
  }
  return node;
 };
 if(typeof AudioContext==='function'){
  const Native=AudioContext;
  const Observed=new Proxy(Native,{construct(target,args,newTarget){
   const context=Reflect.construct(target,args,newTarget);contexts.push(context);
   for(const [method,kind] of [['createGain','gain'],['createBufferSource','bed'],['createOscillator','transient']]){
    const original=context[method];context[method]=function(...args){return observeNode(context,Reflect.apply(original,this,args),kind);};
   }
   return context;
  }});
  Object.defineProperty(window,'AudioContext',{configurable:true,writable:true,value:Observed});
 }
 if(typeof Worker==='function'){
  const Native=Worker;
  Object.defineProperty(window,'Worker',{configurable:true,writable:true,value:new Proxy(Native,{construct(target,args,newTarget){
   const worker=Reflect.construct(target,args,newTarget),entry={url:String(args[0]),live:true,requests:[]};workers.push(entry);maxWorkers=Math.max(maxWorkers,workers.filter(w=>w.live).length);
   const post=worker.postMessage,terminate=worker.terminate;
   worker.postMessage=function(...args){const result=Reflect.apply(post,this,args);entry.requests.push(args[0]);return result;};
   worker.terminate=function(...args){const result=Reflect.apply(terminate,this,args);entry.live=false;return result;};
   return worker;
  }})});
 }
 const nativeGet=Storage.prototype.getItem,nativeSet=Storage.prototype.setItem;
 Storage.prototype.getItem=function(...args){if(blockStorage)throw new DOMException('Review storage blocked','SecurityError');return Reflect.apply(nativeGet,this,args);};
 Storage.prototype.setItem=function(...args){
  const entry={key:String(args[0]),bytes:String(args[1]).length,ok:false};writes.push(entry);
  if(blockStorage)throw new DOMException('Review storage blocked','SecurityError');
  const result=Reflect.apply(nativeSet,this,args);entry.ok=true;return result;
 };
 window.nativeAudioReview={closeLatestContext:()=>contexts.at(-1)?.close(),snapshot:()=>({nativeAudio:typeof AudioContext==='function',nativeWorker:typeof Worker==='function',blockStorage,
  createdContexts:contexts.length,contextStates:contexts.map(c=>c.state),createdWorkers:workers.length,liveWorkers:workers.filter(w=>w.live).length,maxWorkers,
  liveBeds:count('bed'),liveTransients:count('transient'),maxBeds,maxTransients,liveAccents:accentCount(),maxAccents,
  nodes:nodes.map(({native,context,...entry})=>({...entry,contextIndex:contexts.indexOf(context)})),events:events.map(event=>({...event})),
  workers:workers.map(w=>({...w,requests:w.requests.slice()})),writes:writes.map(write=>({...write}))})};
}
