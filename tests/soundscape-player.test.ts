import test from 'node:test';
import assert from 'node:assert/strict';
async function module(){const path='../src/view/soundscape-player.ts';const m=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});assert.ok(m,'soundscape loop lifecycle must exist');return m;}
function context(){
 const nodes:any[]=[],gains:any[]=[],buffers:any[]=[];
 const ctx={state:'running',currentTime:1,destination:{},fail:false,
  createBuffer(_channels:number,length:number,rate:number){const a=[new Float32Array(length),new Float32Array(length)];const b={length,sampleRate:rate,copyToChannel:(x:Float32Array,i:number)=>a[i].set(x),getChannelData:(i:number)=>a[i]};buffers.push(b);return b;},
  createGain(){const values:any[]=[];const g={values,gain:{value:0,cancelScheduledValues:(t:number)=>values.push(['cancel',t]),setValueAtTime:(v:number,t:number)=>values.push(['set',v,t]),linearRampToValueAtTime:(v:number,t:number)=>values.push(['ramp',v,t])},connect(){},disconnects:0,disconnect(){this.disconnects++;}};gains.push(g);return g;},
  createBufferSource(){if(ctx.fail)throw Error('blocked');const n={buffer:null,loop:false,onended:null as null|(()=>void),starts:0,stops:0,disconnects:0,connect(){},start(){this.starts++;},stop(){this.stops++;},disconnect(){this.disconnects++;}};nodes.push(n);return n;}
 };return {ctx,nodes,gains,buffers};
}
const samples=()=>({sampleRate:16000,duration:24,left:new Float32Array([0,.05,0]),right:new Float32Array([0,.04,0])});
test('loop controller is inert without a running context or audible intent',async()=>{
 const m=await module();let generated=0;const player=new m.SoundscapePlayer(()=>{generated++;return samples();}),c=context();
 player.update(undefined,0,true);player.update(c.ctx,0,false);c.ctx.state='suspended';player.update(c.ctx,0,true);
 assert.equal(generated,0);assert.equal(c.nodes.length,0);player.dispose();
});
test('one loop and one cached chapter buffer serve repeated updates and pause/resume',async()=>{
 const m=await module();let generated=0;const player=new m.SoundscapePlayer(()=>{generated++;return samples();}),c=context();
 for(let i=0;i<50;i++)player.update(c.ctx,2,true);
 assert.equal(generated,1);assert.equal(c.nodes.length,1);assert.equal(c.nodes[0].loop,true);assert.equal(c.nodes[0].starts,1);
 player.update(c.ctx,2,false);assert.equal(c.nodes[0].stops,1);
 player.update(c.ctx,2,true);assert.equal(generated,1);assert.equal(c.nodes.length,2);
 assert.ok(c.gains.some(g=>g.values.some((x:any[])=>x[0]==='ramp'&&x[1]===0)));
 player.dispose();assert.ok(c.nodes.every(n=>n.disconnects===1));
});
test('rapid scene changes never retain more than an active loop and a retiring fade',async()=>{
 const m=await module(),player=new m.SoundscapePlayer(samples),c=context();
 for(let i=0;i<24;i++){player.update(c.ctx,i%6,true);assert.ok(c.nodes.filter(n=>n.disconnects===0).length<=2);}
 player.dispose();player.dispose();assert.ok(c.nodes.every(n=>n.disconnects===1));assert.ok(c.gains.every(g=>g.disconnects===1));
});
test('old onended callbacks never clear or disconnect the newer active voice',async()=>{
 const m=await module(),player=new m.SoundscapePlayer(samples),c=context();
 player.update(c.ctx,0,true);const first=c.nodes[0],ended=first.onended;player.update(c.ctx,1,true);
 ended?.();ended?.();assert.equal(first.disconnects,1);assert.equal(c.nodes[1].disconnects,0);
 player.update(c.ctx,1,true);assert.equal(c.nodes.length,2);player.dispose();
});
test('construction failures are contained and are not retried on every animation frame',async()=>{
 const m=await module();let generated=0;const player=new m.SoundscapePlayer(()=>{generated++;return samples();}),c=context();c.ctx.fail=true;
 for(let i=0;i<20;i++)assert.doesNotThrow(()=>player.update(c.ctx,0,true));
 assert.equal(generated,1);assert.equal(c.gains.length,0);
 c.ctx.fail=false;player.retry();player.update(c.ctx,0,true);assert.equal(c.nodes.length,1);player.dispose();
});
test('context replacement drops the old voice and never reuses an incompatible audio buffer',async()=>{
 const m=await module(),player=new m.SoundscapePlayer(samples),a=context(),b=context();
 player.update(a.ctx,0,true);player.update(b.ctx,0,true);assert.equal(a.nodes[0].disconnects,1);assert.equal(b.buffers.length,1);
 player.dispose();assert.equal(b.nodes[0].disconnects,1);
});
test('start failures detach their onended callback so later browser cleanup cannot double-release',async()=>{
 const m=await module(),player=new m.SoundscapePlayer(samples),c=context();const create=c.ctx.createBufferSource;
 c.ctx.createBufferSource=()=>{const node=create();node.start=()=>{throw Error('start denied');};return node;};
 assert.doesNotThrow(()=>player.update(c.ctx,0,true));
 assert.equal(c.nodes[0].disconnects,1);assert.equal(c.gains[0].disconnects,1);assert.equal(c.nodes[0].onended,null);
 player.dispose();assert.equal(c.nodes[0].disconnects,1);
});
test('asynchronous synthesis starts no voice before completion and ignores superseded chapter results',async()=>{
 const m=await module();const pending:Array<(x:any)=>void>=[];
 const player=new m.SoundscapePlayer(()=>new Promise(resolve=>pending.push(resolve))),c=context();
 player.update(c.ctx,0,true);for(let i=0;i<20;i++)player.update(c.ctx,0,true);assert.equal(pending.length,1);assert.equal(c.nodes.length,0);
 player.update(c.ctx,1,true);assert.equal(pending.length,2);
 pending[0](samples());await Promise.resolve();assert.equal(c.nodes.length,0);
 pending[1](samples());await Promise.resolve();assert.equal(c.nodes.length,1);player.dispose();
});
test('an asynchronous result received during a menu pause caches safely without becoming audible',async()=>{
 const m=await module();let resolve:(x:any)=>void=()=>{};
 const player=new m.SoundscapePlayer(()=>new Promise(r=>{resolve=r;})),c=context();
 player.update(c.ctx,3,true);player.update(c.ctx,3,false);resolve(samples());await Promise.resolve();
 assert.equal(c.nodes.length,0);player.update(c.ctx,3,true);assert.equal(c.nodes.length,1);player.dispose();
});
test('disposed or explicitly cancelled synthesis cannot attach a late voice',async()=>{
 const m=await module();let resolve:(x:any)=>void=()=>{};
 const player=new m.SoundscapePlayer(()=>new Promise(r=>{resolve=r;})),c=context();
 player.update(c.ctx,1,true);assert.equal(typeof player.cancelPending,'function');player.cancelPending();resolve(samples());await Promise.resolve();assert.equal(c.nodes.length,0);
 player.update(c.ctx,1,true);player.dispose();resolve(samples());await Promise.resolve();assert.equal(c.nodes.length,0);
});
test('a completed result for a chapter changed while paused never leaves a phantom pending request',async()=>{
 const m=await module();const pending:Array<(x:any)=>void>=[];
 const player=new m.SoundscapePlayer(()=>new Promise(resolve=>pending.push(resolve))),c=context();
 player.update(c.ctx,0,true);player.update(c.ctx,1,false);pending[0](samples());await Promise.resolve();
 player.update(c.ctx,0,true);assert.equal(pending.length,2);pending[1](samples());await Promise.resolve();assert.equal(c.nodes.length,1);player.dispose();
});
