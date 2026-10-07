import test from 'node:test';
import { flatStatements, mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import { runInApp } from './helpers/run-app.ts';
import ts from 'typescript';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile,SAVE_KEY,BACKUP_KEY} from '../src/game/save.ts';
import {createSaveSession,type SaveSessionLocks} from '../src/game/save-session.ts';
import {AUDIO_MIX_KEY,DEFAULT_AUDIO_MIX,loadAudioMix,normalizeAudioMix,saveAudioMix} from '../src/ui/audio-preferences.ts';
import {textIfChanged} from '../src/ui/dom-state.ts';
import * as audio from '../src/view/audio.ts';
import {recordedContext,installContext} from './helpers/audio-context.ts';
const source=mainSource(),ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const functions=flatStatements(ast).filter(node=>ts.isFunctionDeclaration(node)&&node.name&&['playable','guardAction'].includes(node.name.text));
const listener=flatStatements(ast).find(node=>ts.isExpressionStatement(node)&&ts.isCallExpression(node.expression)&&node.expression.expression.getText(ast)==='lifetime.listen'&&node.expression.arguments[0]?.getText(ast)==='root'&&node.expression.arguments[1]?.getText(ast)==="'input'");
const locks:SaveSessionLocks={request:(name,_options,callback)=>Promise.resolve(callback({name}))};
async function harness({temporary=false,mixQuota=false}={}){
 assert.ok(listener,'actual root input listener must exist');
 audio.disposeAudio();const nativeBoundary=recordedContext();let created=0;const restore=installContext(nativeBoundary,()=>{created++;return nativeBoundary.ctx;});
 const profile=defaultProfile();profile.sound=false;const raw=JSON.stringify(profile);
 const values=new Map([[SAVE_KEY,raw],[BACKUP_KEY,raw],[AUDIO_MIX_KEY,'{"version":1,"effects":100,"atmosphere":100}']]),writes:string[]=[];
 const storage={getItem(key:string){if(temporary)throw Error('blocked read');return values.get(key)??null;},setItem(key:string,value:string){writes.push(key);if(temporary||(mixQuota&&key===AUDIO_MIX_KEY))throw Error('blocked write');values.set(key,value);}};
 class InputBoundary {id:string;type='range';value='100';attributes=new Map<string,string>();constructor(id:string){this.id=id;}get valueAsNumber(){return Number(this.value);}setAttribute(name:string,value:string){this.attributes.set(name,value);}}
 const effects=new InputBoundary('effects-volume'),atmosphere=new InputBoundary('atmosphere-volume'),contained=new Set([effects,atmosphere]);
 const effectsOutput={textContent:'100%'},atmosphereOutput={textContent:'100%'};
 const layer={contains:(node:InputBoundary)=>contained.has(node)};
 const unexpected=()=>{throw Error('input must not unlock, persist, dispatch or re-render');};
 const context:any={root:{},HTMLInputElement:InputBoundary,game:new Game(profile),sessionReady:false,pagePresent:true,lifetime:{disposed:false,listen(_target:unknown,_event:string,handler:Function){context.input=handler;}},modal:'settings',atmosphereEnabled:false,
  audioMix:loadAudioMix(storage),normalizeAudioMix,saveAudioMix:(mix:typeof DEFAULT_AUDIO_MIX)=>saveAudioMix(mix,storage),updateAudioMix:audio.updateAudioMix,textIfChanged,
  $:(id:string)=>id==='modal-layer'?layer:id==='effects-volume-value'?effectsOutput:id==='atmosphere-volume-value'?atmosphereOutput:undefined,
  document:{activeElement:effects},unlockAudio:unexpected,showSettings:unexpected,showModal:unexpected,persist:unexpected,action:unexpected};
 audio.updateAudioMix(context.audioMix);
 const session=createSaveSession({storage,locks,onStatus(status){if(status!=='active'&&status!=='temporary'){context.sessionReady=false;context.modal='session';}}});context.session=session;
 try{await session.acquire();if(temporary)assert.equal(session.playTemporarily(),true);context.sessionReady=true;context.modal='settings';
  runInApp(ts.transpile([...functions,listener].map(node=>node.getText(ast)).join('\n'),{target:ts.ScriptTarget.ES2022}),context);
 }catch(error){session.dispose();audio.disposeAudio();restore();throw error;}
 return {context,effects,atmosphere,effectsOutput,atmosphereOutput,values,writes,session,nativeBoundary,created:()=>created,
  input(node:unknown=effects,value='50'){if(node instanceof InputBoundary)node.value=value;context.input({target:node});},
  foreign(){values.set(SAVE_KEY,JSON.stringify({...profile,coins:777}));},outside(node:InputBoundary){contained.delete(node);},
  close(){session.dispose();audio.disposeAudio();audio.updateAudioMix(DEFAULT_AUDIO_MIX);restore();}};
}
test('actual range input updates only its percentage/mix, preserving muted switches, protected saves and live node identity',async()=>{
 const h=await harness();try{
  const gameBefore=JSON.stringify(h.context.game.profile),saveBefore=[h.values.get(SAVE_KEY),h.values.get(BACKUP_KEY)],mixBefore=h.context.audioMix;
  h.input(h.effects,'23');assert.deepEqual(h.context.audioMix,{effects:25,atmosphere:100});assert.notEqual(h.context.audioMix,mixBefore);
  assert.equal(h.effects.value,'25');assert.equal(h.effects.attributes.get('aria-valuetext'),'25%');assert.equal(h.effectsOutput.textContent,'25%');assert.equal(h.atmosphereOutput.textContent,'100%');assert.equal(h.context.document.activeElement,h.effects);
  h.input(h.atmosphere,'0');assert.deepEqual(h.context.audioMix,{effects:25,atmosphere:0});assert.equal(h.atmosphereOutput.textContent,'0%');assert.equal(h.atmosphere.attributes.get('aria-valuetext'),'0%');
  assert.deepEqual(loadAudioMix({getItem:key=>h.values.get(key)??null}),{effects:25,atmosphere:0});assert.ok(h.writes.every(key=>key===AUDIO_MIX_KEY));
  assert.deepEqual([h.values.get(SAVE_KEY),h.values.get(BACKUP_KEY)],saveBefore);assert.equal(JSON.stringify(h.context.game.profile),gameBefore);assert.equal(h.context.game.profile.sound,false);assert.equal(h.context.atmosphereEnabled,false);
  assert.equal(h.created(),0);assert.equal(h.nativeBoundary.gains.length,0);assert.equal(h.nativeBoundary.sources.length,0);
 }finally{h.close();}
});
test('actual connected input checks unannounced foreign bytes synchronously before mix mutation, bus retarget or preference write',async()=>{
 const h=await harness();try{
  audio.unlockAudio();const before=h.context.audioMix,events=JSON.stringify(h.nativeBoundary.gains.map(g=>g.gain.events));h.foreign();const protectedBytes=[...h.values],writes=h.writes.length;
  h.input(h.effects,'5');assert.equal(h.context.audioMix,before,'foreign input must not replace mix intent');assert.deepEqual([...h.values],protectedBytes,'foreign input must not write preference or protected keys');assert.equal(h.session.status,'conflict');assert.equal(h.context.modal,'session');assert.equal(h.writes.length,writes);assert.equal(JSON.stringify(h.nativeBoundary.gains.map(g=>g.gain.events)),events);assert.equal(h.effectsOutput.textContent,'100%');
 }finally{h.close();}
});
test('actual input remains in memory under blocked storage temporary play and preference quota failures',async()=>{
 for(const options of [{temporary:true},{mixQuota:true}]){const h=await harness(options);try{
  const before=[...h.values],profile=JSON.stringify(h.context.game.profile);h.input(h.effects,'50');h.input(h.atmosphere,'25');
  assert.deepEqual(h.context.audioMix,{effects:50,atmosphere:25});assert.equal(h.effectsOutput.textContent,'50%');assert.equal(h.atmosphereOutput.textContent,'25%');assert.deepEqual([...h.values],before);assert.equal(JSON.stringify(h.context.game.profile),profile);assert.equal(h.created(),0);assert.ok(h.writes.every(key=>key===AUDIO_MIX_KEY));
 }finally{h.close();}}
});
test('actual input rejects other targets, stale modal ownership and inactive page/lifetime before any state or write',async()=>{
 const h=await harness();try{
  const before=h.context.audioMix,values=[...h.values],writes=h.writes.length;
  h.input({id:'effects-volume',type:'range',valueAsNumber:50});h.effects.type='text';h.input();h.effects.type='range';
  h.effects.id='import-save';h.input();h.effects.id='effects-volume';
  h.context.modal='result';h.input();h.context.modal='settings';h.context.pagePresent=false;h.input();h.context.pagePresent=true;
  h.context.lifetime.disposed=true;h.input();h.context.lifetime.disposed=false;h.outside(h.effects);h.input();
  assert.equal(h.context.audioMix,before);assert.deepEqual([...h.values],values);assert.equal(h.writes.length,writes);assert.equal(h.created(),0);assert.equal(h.effectsOutput.textContent,'100%');
 }finally{h.close();}
});
test('actual enabled Settings input changes persistent buses without construction, resume, source starts or replacement',async()=>{
 const h=await harness();try{
  audio.unlockAudio();const gains=h.nativeBoundary.gains.slice();let resumes=0;h.nativeBoundary.ctx.resume=()=>{resumes++;return Promise.resolve();};
  h.input(h.effects,'50');h.input(h.atmosphere,'25');
  assert.equal(h.created(),1);assert.equal(resumes,0);assert.deepEqual(h.nativeBoundary.gains,gains);assert.equal(h.nativeBoundary.sources.length,0);assert.equal(h.nativeBoundary.oscillators.length,0);
  assert.equal(gains[0].gain.events.at(-1)[1],.5);assert.equal(gains[1].gain.events.at(-1)[1],.25);assert.equal(h.context.document.activeElement,h.effects);
 }finally{h.close();}
});
