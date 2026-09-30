// Recorded native Web Audio boundary; production node/slot ownership remains real.
export function recordedContext(){
 const oscillators:any[]=[],gains:any[]=[],sources:any[]=[];let failure='';
 const fail=(operation:string)=>{if(failure===operation)throw Error(operation);};
 const parameter=(name:string)=>({events:[] as any[],value:0,setValueAtTime(v:number,t:number){fail(name);this.events.push(['set',v,t]);this.value=v;},linearRampToValueAtTime(v:number,t:number){fail(name);this.events.push(['linear',v,t]);},exponentialRampToValueAtTime(v:number,t:number){fail(name);this.events.push(['exp',v,t]);},cancelScheduledValues(){}});
 const node=()=>({connections:[] as any[],disconnects:0,connect(to:any){fail('connect');this.connections.push(to);},disconnect(){this.disconnects++;this.connections=[];}});
 const ctx:any={state:'running',currentTime:1,destination:{},resume(){ctx.state='running';return Promise.resolve();},suspend(){ctx.state='suspended';return Promise.resolve();},close(){ctx.state='closed';return Promise.resolve();},
  createOscillator(){fail('oscillator');const n={...node(),type:'',frequency:parameter('frequency'),onended:null,starts:[] as number[],stops:[] as number[],start(at:number){fail('start');this.starts.push(at);},stop(at?:number){fail('stop');this.stops.push(at??ctx.currentTime);}};oscillators.push(n);return n;},
  createGain(){fail('gain');const n={...node(),gain:parameter('envelope')};gains.push(n);return n;},
  createBiquadFilter(){return {...node(),frequency:parameter('filter'),Q:parameter('filter'),type:''};},
  createBuffer(_n:number,length:number,rate:number){const channels=[new Float32Array(length),new Float32Array(length)];return {sampleRate:rate,getChannelData:(i:number)=>channels[i]};},
  createBufferSource(){const n={...node(),onended:null,buffer:null,loop:false,start(){},stop(){}};sources.push(n);return n;},
 };
 return {ctx,oscillators,gains,sources,fail:(operation:string)=>{failure=operation;},live:()=>oscillators.filter(n=>n.connections.length>0).length};
}
export function installContext(c:ReturnType<typeof recordedContext>,create?:()=>any){
 const descriptors=['AudioContext','Worker'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)] as const);
 class Worker{onmessage:any;onerror:any;onmessageerror:any;postMessage(){queueMicrotask(()=>this.onmessage?.({data:{sampleRate:16000,duration:24,left:new Float32Array([0,.05,0]),right:new Float32Array([0,.04,0])}}));}terminate(){}}
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class{constructor(){return create?create():c.ctx;}}});
 Object.defineProperty(globalThis,'Worker',{configurable:true,value:Worker});
 return ()=>{for(const [name,descriptor] of descriptors){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete (globalThis as any)[name];}};
}
