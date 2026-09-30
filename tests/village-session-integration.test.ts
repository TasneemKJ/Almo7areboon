import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { pauseReason } from '../src/ui/pause.ts';
import { ambienceAllowed } from '../src/ui/audio-preferences.ts';
import { advanceVillagePresentation } from '../src/view/village-mood.ts';

const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const names=new Set(['playable','syncPause','syncVillagePresentation','events']);
const functions=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&node.name&&names.has(node.name.text));
assert.equal(functions.length,names.size);
const code=ts.transpile(functions.map(node=>node.getText(ast)).join('\n'),{target:ts.ScriptTarget.ES2022});

test('actual village owner freezes and silences ambience without save ownership',()=>{
  const audible:boolean[]=[],game=new Game();game.dispatch({type:'start'});
  const context:any={game,sessionReady:true,pagePresent:true,lifetime:{disposed:false},session:{status:'active'},
    manualPaused:false,activeTab:'battle',modal:null,document:{hidden:false},atmosphereEnabled:true,villagePresentation:null,
    stopCombatAudio(){},pauseReason,ambienceAllowed,advanceVillagePresentation,updateSoundscape:(_age:number,allowed:boolean)=>audible.push(allowed)};
  runInNewContext(`${code}\nthis.api={syncPause,syncVillagePresentation};`,context);
  context.api.syncPause();context.api.syncVillagePresentation(.05);
  assert.equal(audible.at(-1),true);
  const time=context.villagePresentation.mood.time;
  for(const status of ['starting','blocked','conflict','unsupported','unavailable','suspended','disposed']){
    context.session.status=status;context.api.syncPause();context.api.syncVillagePresentation(.05);
    assert.equal(game.state.paused,true,status);assert.equal(audible.at(-1),false,status);
    assert.equal(context.villagePresentation.mood.time,time,status);
  }
  context.session.status='temporary';context.api.syncPause();context.api.syncVillagePresentation(.05);
  assert.equal(game.state.paused,false);assert.equal(audible.at(-1),true);
  assert.ok(context.villagePresentation.mood.time>time);
  context.pagePresent=false;context.api.syncPause();assert.equal(audible.at(-1),false);
  context.pagePresent=true;game.state.phase='won';context.api.syncPause();
  assert.equal(audible.at(-1),false,'terminal phase silences ambience before the delayed result modal');
});

// Execute actual main admission/lifecycle functions against the real audio owner.
import * as audio from '../src/view/audio.ts';
import {recordedContext,installContext} from './helpers/audio-context.ts';
function combatHarness(){
 audio.disposeAudio();const c=recordedContext(),restore=installContext(c);audio.unlockAudio();
 const game=new Game();game.dispatch({type:'start'});const persisted:number[]=[];
 const context:any={game,sessionReady:true,pagePresent:true,lifetime:{disposed:false},session:{status:'active'},
  manualPaused:false,activeTab:'battle',modal:null,document:{hidden:false},atmosphereEnabled:false,villagePresentation:null,
  pauseReason,ambienceAllowed,advanceVillagePresentation,updateSoundscape:audio.updateSoundscape,
  playCombatEvents:audio.playCombatEvents,stopCombatAudio:audio.stopCombatAudio,persist:()=>persisted.push(c.oscillators.length)};
 runInNewContext(`${code}\nthis.api={syncPause,events};`,context);
 return {...c,context,persisted,close(){audio.disposeAudio();restore();}};
}
test('actual main preserves metadata and silences menu, modal, manual pause, hidden and unowned batches',()=>{
 const h=combatHarness(),c=h.context;try{
  c.api.syncPause();c.api.events([{type:'hit',source:{kind:1}}]);assert.equal(h.oscillators[0].type,'sawtooth','full batch keeps material kind');
  for(const changes of [{activeTab:'cards'},{modal:'settings'},{manualPaused:true},{document:{hidden:true}},{session:{status:'conflict'}},{pagePresent:false},{sessionReady:false},{lifetime:{disposed:true}}]){
   Object.assign(c,{activeTab:'battle',modal:null,manualPaused:false,document:{hidden:false},session:{status:'active'},pagePresent:true,sessionReady:true,lifetime:{disposed:false}},changes);
   const count=h.oscillators.length;c.api.syncPause();assert.equal(h.live(),0);c.api.events([{type:'skill',skill:'freeze'}]);assert.equal(h.oscillators.length,count,JSON.stringify(changes));
  }
 }finally{h.close();}
});
for(const dialogAt of [.350,1.300])test(`fresh result starts before persistence and survives result dialog at ${dialogAt}s`,()=>{
 const h=combatHarness(),c=h.context;try{
  c.api.syncPause();c.game.state.phase='won';c.api.events([{type:'hit',target:'base',side:'enemy'},{type:'coin'},{type:'win'}]);
  assert.equal(h.oscillators.length,1);assert.deepEqual(h.persisted,[1]);assert.ok(h.oscillators[0].stops[0]<=1.650);
  h.ctx.currentTime=1+dialogAt;c.modal='result';c.api.syncPause();assert.equal(h.live(),1,'opening result does not cancel the finite result voice');
  c.api.events([{type:'skill',skill:'food'}]);assert.equal(h.oscillators.length,1,'result modal admits no new batch');
  h.oscillators[0].onended();assert.equal(h.live(),0);c.modal='settings';c.api.syncPause();assert.equal(h.live(),0);
 }finally{h.close();}
});
