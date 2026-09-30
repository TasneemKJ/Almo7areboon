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
const names=new Set(['playable','syncPause','syncVillagePresentation']);
const functions=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&node.name&&names.has(node.name.text));
assert.equal(functions.length,names.size);
const code=ts.transpile(functions.map(node=>node.getText(ast)).join('\n'),{target:ts.ScriptTarget.ES2022});

test('actual village owner freezes and silences ambience without save ownership',()=>{
  const audible:boolean[]=[],game=new Game();game.dispatch({type:'start'});
  const context:any={game,sessionReady:true,pagePresent:true,lifetime:{disposed:false},session:{status:'active'},
    manualPaused:false,activeTab:'battle',modal:null,document:{hidden:false},atmosphereEnabled:true,villagePresentation:null,
    pauseReason,ambienceAllowed,advanceVillagePresentation,updateSoundscape:(_age:number,allowed:boolean)=>audible.push(allowed)};
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
