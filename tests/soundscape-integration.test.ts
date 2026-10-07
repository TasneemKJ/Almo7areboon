import test from 'node:test';
import { runInApp } from './helpers/run-app.ts';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as audio from '../src/view/audio.ts';
async function prefs(){const path='../src/ui/audio-preferences.ts';const m=await import(path).catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return null;throw e;});assert.ok(m,'independent atmosphere setting must exist');return m;}

test('atmosphere playback is disallowed by every existing visibility, pause and screen owner',async()=>{
 const m=await prefs(),base={sound:true,atmosphere:true,paused:false,hidden:false,tab:'battle',modal:null,phase:'running'};
 assert.equal(m.ambienceAllowed(base),true);assert.equal(m.ambienceAllowed({...base,phase:'ready'}),true);
 for(const overrides of [{sound:false},{atmosphere:false},{paused:true},{hidden:true},{tab:'cards'},{modal:'settings'},{phase:'won'},{phase:'lost'}])assert.equal(m.ambienceAllowed({...base,...overrides}),false);
});
test('atmosphere preference persists separately and never writes to either game-save key',async()=>{
 const m=await prefs(),values=new Map([['almo7areboon.save.v1','protected future save'],['almo7areboon.save.v1.backup','backup']]);
 const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}};
 assert.equal(m.loadAtmosphere(storage),true);assert.equal(m.saveAtmosphere(false,storage),true);assert.equal(m.loadAtmosphere(storage),false);
 assert.equal(values.get('almo7areboon.save.v1'),'protected future save');assert.equal(values.get('almo7areboon.save.v1.backup'),'backup');
 assert.equal(m.loadAtmosphere({getItem(){throw Error('blocked');}}),true);
 assert.equal(m.saveAtmosphere(true,{setItem(){throw Error('quota');}}),false);
});

test('late AudioContext resume cannot start ambience after mute, and latest gesture recovers it',async()=>{
 const api=audio as typeof audio & {updateSoundscape?:(age:number,audible:boolean)=>void};
 assert.equal(typeof api.updateSoundscape,'function');audio.disposeAudio();
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
 const previousWorker=Object.getOwnPropertyDescriptor(globalThis,'Worker');
 class FakeWorker{onmessage:((event:any)=>void)|null=null;onerror=null;onmessageerror=null;postMessage(){queueMicrotask(()=>this.onmessage?.({data:{sampleRate:16000,duration:24,left:new Float32Array([0,.05,0]),right:new Float32Array([0,.04,0])}}));}terminate(){}}
 Object.defineProperty(globalThis,'Worker',{configurable:true,value:FakeWorker});
 let created=0,starts=0,stops=0,finish:()=>void=()=>{};
 class Context {
  state='suspended';currentTime=1;destination={};constructor(){created++;}
  resume(){return new Promise<void>(resolve=>{finish=()=>{this.state='running';resolve();};});}
  suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
  createBuffer(_n:number,length:number){const channels=[new Float32Array(length),new Float32Array(length)];return {getChannelData:(i:number)=>channels[i]};}
  createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}},connect(){},disconnect(){}};}
  createBufferSource(){return {onended:null,buffer:null,loop:false,connect(){},disconnect(){},start(){starts++;},stop(){stops++;}};}
 }
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:Context});
 try{
  api.updateSoundscape!(3,true);assert.equal(created,0);
  audio.unlockAudio(false);assert.equal(created,0);
  audio.unlockAudio(true);assert.equal(created,1);audio.suspendAudio();finish();
  await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,0);
  // Merely updating desired state after a hidden-tab suspend cannot unlock playback.
  api.updateSoundscape!(3,true);assert.equal(starts,0);
  audio.unlockAudio(true);finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,1);
  api.updateSoundscape!(3,false);assert.equal(stops,1);
  audio.disposeAudio();assert.equal(stops,1);
 }finally{audio.disposeAudio();if(previousWorker)Object.defineProperty(globalThis,'Worker',previousWorker);else delete (globalThis as Record<string,unknown>).Worker;if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete (globalThis as Record<string,unknown>).AudioContext;}
});
test('disposed-context resume callbacks cannot attach a loop to a replacement session',async()=>{
 const api=audio as typeof audio & {updateSoundscape?:(age:number,audible:boolean)=>void};assert.equal(typeof api.updateSoundscape,'function');
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');let finish:()=>void=()=>{},starts=0;
 class Context{state='suspended';currentTime=0;destination={};resume(){return new Promise<void>(resolve=>{finish=()=>{this.state='running';resolve();};});}close(){this.state='closed';return Promise.resolve();}createBuffer(){starts++;throw Error('must not create a buffer');}}
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:Context});
 try{audio.disposeAudio();api.updateSoundscape!(0,true);audio.unlockAudio(true);audio.disposeAudio();finish();await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,0);}
 finally{audio.disposeAudio();if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete (globalThis as Record<string,unknown>).AudioContext;}
});
test('settings and existing pause lifecycle are wired to the ambience gate (source contract)',()=>{
 const source=mainSource();
 const preferences=readFileSync(new URL('../src/ui/preferences-screen.ts',import.meta.url),'utf8');
 assert.match(preferences,/check\('atmosphere','Atmosphere'/);assert.match(source,/preference==='atmosphere'/);
 assert.match(source,/updateSoundscape\(app\.game\.profile\.age,ambienceAllowed\(/);
 assert.match(source,/atmosphere:app\.atmosphereEnabled/);assert.match(source,/app\.modal,hidden:document.hidden/);
 assert.match(source,/saveAtmosphere\(app\.atmosphereEnabled\)/);
});
test('a gesture attempts to resume an interrupted context instead of silently abandoning it',()=>{
 audio.disposeAudio();const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');let resumes=0;
 class Context{state='interrupted';currentTime=0;destination={};createGain(){return {gain:{setValueAtTime(){}},connect(){},disconnect(){}};}resume(){resumes++;return Promise.resolve();}close(){return Promise.resolve();}}
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:Context});
 try{audio.unlockAudio(true);assert.equal(resumes,1);}finally{audio.disposeAudio();if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete (globalThis as Record<string,unknown>).AudioContext;}
});

test('actual main loads the separate stored mix before any gesture and applies it to the first native-boundary buses',async()=>{
 const {runInNewContext}=await import('node:vm'),{default:ts}=await import('typescript');
 const {loadAudioMix,DEFAULT_AUDIO_MIX,AUDIO_MIX_KEY}=await import('../src/ui/audio-preferences.ts');
 const {recordedContext,installContext}=await import('./helpers/audio-context.ts');
 const source=mainSource(),ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 let declaration:any;ast.forEachChild(function find(node){if(ts.isPropertyAssignment(node)&&node.name.getText(ast)==='audioMix')declaration=node;ts.forEachChild(node,find);});
 const application=ast.statements.find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='updateAudioMix');
 assert.ok(declaration&&application,'main must load and apply its audio mix snapshot before gestures');
 const values=new Map([['almo7areboon.save.v1','protected save bytes'],['almo7areboon.save.v1.backup','protected backup bytes'],[AUDIO_MIX_KEY,'{"version":1,"effects":50,"atmosphere":25}']]);
 const storedBefore=[...values],c=recordedContext();let created=0;const restore=installContext(c,()=>{created++;return c.ctx;});audio.disposeAudio();
 try{
  const context={loadAudioMix:()=>loadAudioMix({getItem:(key:string)=>values.get(key)??null}),updateAudioMix:audio.updateAudioMix};
  runInApp(ts.transpile(`const app={${declaration!.getText(ast)}};${application!.getText(ast)}`,{target:ts.ScriptTarget.ES2022}),context);
  assert.equal(created,0);assert.equal(c.gains.length,0);assert.equal(c.sources.length,0);assert.deepEqual([...values],storedBefore);
  audio.unlockAudio();assert.equal(created,1);assert.deepEqual(c.gains.map(g=>g.gain.events[0][1]),[.5,.25]);
 }finally{audio.disposeAudio();audio.updateAudioMix(DEFAULT_AUDIO_MIX);restore();}
});
