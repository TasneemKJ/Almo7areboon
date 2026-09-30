import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../scripts/capture-mastery-review.mjs',import.meta.url),'utf8');
const ast=ts.createSourceFile('capture-mastery-review.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
let foreignCallback='';
function visit(node:ts.Node){
 if(ts.isCallExpression(node)&&node.expression.getText(ast)==='scenario'&&node.arguments[0]?.getText(ast).startsWith('`foreign-during-evolution-'))foreignCallback=node.arguments[2].getText(ast);
 ts.forEachChild(node,visit);
}
visit(ast);assert.ok(foreignCallback,'the real foreign-evolution scenario must remain present');

// An autosave runs after each awaited browser task. This pins the real test
// orchestration so another guard cannot claim detection before the chosen route.
for(const route of ['Escape','close','confirm-evolve'])test(`mastery ${route} fault reaches that handler before intervening autosave`,async()=>{
 const primary='primary',backup='backup';
 const original={age:0,coins:3000,gems:100,wins:1,pendingVictory:{settlement:'mastery-v1',earned:560}};
 const authoritative={...original,coins:560};
 const storage=new Map([[primary,JSON.stringify(original)],[backup,JSON.stringify(original)]]);
 let profile={...original},baseline=storage.get(primary),modal='result',detectedBy='';
 const check=(origin:string)=>{
  if(!detectedBy&&storage.get(primary)!==baseline){detectedBy=origin;modal='session';}
  return modal!=='session';
 };
 const trigger=(command:string)=>{
  if(command==='evolve'){assert.equal(modal,'result');modal='evolve';return;}
  if(command==='session-continue'){profile=JSON.parse(storage.get(primary)!);baseline=storage.get(primary);modal='result';return;}
  assert.equal(modal,'evolve','confirmation/return was replaced before its intended input');
  check(command);
 };
 const browser={
  localStorage:{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)},
  document:{querySelector:(selector:string)=>modal==='evolve'?{click:()=>trigger(selector.includes('confirm-evolve')?'confirm-evolve':'close')}:null,
   dispatchEvent:(event:{key:string})=>{if(event.key==='Escape'&&modal==='evolve')trigger('Escape');}},
  addEventListener(){},KeyboardEvent:class{key:string;constructor(_type:string,options:{key:string}){this.key=options.key;}},
 };
 const page={
  async evaluate(fn:Function,arg?:unknown){const value=runInNewContext(`(${fn.toString()})(arg)`,{...browser,arg});check('autosave');return structuredClone(value);},
  keyboard:{async press(key:string){if(key==='Escape'&&modal==='evolve')trigger('Escape');check('autosave');}},
  getByRole(){return{async waitFor(){assert.equal(modal,'session');}};},
  locator(selector:string){return{async count(){return modal==='session'?0:1;}};},
  async reload(){profile=JSON.parse(storage.get(primary)!);baseline=storage.get(primary);modal='result';},
 };
 const command=(_page:unknown,name:string)=>({last(){return this;},async click(){trigger(name);check('autosave');},async count(){return modal==='evolve'?1:0;}});
 const context={route,assert,seeds:{evolve:original,insufficient:authoritative},SAVE_KEY:primary,BACKUP_KEY:backup,
  setup:async()=>page,open:async()=>page,result:async()=>assert.equal(modal,'result'),command,
  bytes:async()=>[storage.get(primary),storage.get(backup)],saved:async()=>JSON.parse(storage.get(primary)!),
  exported:async()=>profile,ledger:(value:unknown)=>value,inspect:async()=>{}};
 await runInNewContext(`(${foreignCallback})(null)`,context);
 assert.equal(detectedBy,route,'the requested handler must discover the fault before autosave');
 assert.deepEqual(storage.get(primary),JSON.stringify(authoritative));
});

const deployFunction=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='deployIfAvailable');
for(const phase of ['won','lost','running','ready'])test(`bounded native troop click tolerates only a natural ${phase} terminal transition`,async()=>{
 assert.ok(deployFunction,'deployment loop needs its narrowly guarded native-click helper');
 const error=Error('button became disabled during native click');let phaseReads=0,clickTimeout=0;
 const button={isEnabled:async()=>true,async click(options:{timeout:number}){clickTimeout=options.timeout;throw error;}};
 const page={locator:(selector:string)=>selector==='#world'?{getAttribute:async()=>++phaseReads===1?'running':phase}:button};
 const activate=runInNewContext(`(${deployFunction.getText(ast)})`);
 if(phase==='won'||phase==='lost')await activate(page,0);
 else await assert.rejects(activate(page,0),(failure:unknown)=>failure===error);
 assert.ok(clickTimeout>0&&clickTimeout<=1000,'native click remains bounded');
});

test('fresh ready flow changes speed through visible Settings before native Battle activation',async()=>{
 let callback='';
 function find(node:ts.Node){if(ts.isCallExpression(node)&&node.expression.getText(ast)==='scenario'&&node.arguments[0]?.getText(ast).startsWith('`fresh-win-paused-input-'))callback=node.arguments[2].getText(ast);ts.forEachChild(node,find);}
 find(ast);assert.ok(callback);
 let settings=false,speed=1;const reachedBattle=Error('reached the native Battle activation');
 const page={locator(selector:string){return{async click(){
  if(selector==='[data-command="settings"]'){settings=true;return;}
  if(selector==='[data-command="speed"]')throw Error('the ready battlefield speed control is hidden');
  if(selector==='[data-command="start"]'){assert.equal(settings,false);assert.equal(speed,2);throw reachedBattle;}
  throw Error(`unexpected prefix input ${selector}`);
 }};}};
 const command=(_page:unknown,name:string)=>({first(){return this;},async click(){assert.equal(settings,true);if(name==='speed')speed=2;else if(name==='close')settings=false;else throw Error(name);}});
 const context={assert,viewport:{width:320,height:568},defaultProfile:()=>({speed:1}),setup:async()=>page,open:async()=>page,
  active:async()=>{},ready:async()=>assert.equal(settings,false),command,saved:async()=>({speed})};
 await assert.rejects(runInNewContext(`(${callback})(null)`,context),(error:unknown)=>error===reachedBattle);
});
