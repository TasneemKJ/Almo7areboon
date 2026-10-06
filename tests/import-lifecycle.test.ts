import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {importBackup} from '../src/game/backup.ts';
import {defaultProfile,MAX_SAVE_CHARS} from '../src/game/save.ts';
import {chapterPresentation} from '../src/ui/chapter-presentation.ts';

const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const listener=ast.statements.find(n=>ts.isExpressionStatement(n)&&ts.isCallExpression(n.expression)&&n.expression.expression.getText(ast)==='lifetime.listen'&&n.expression.arguments[1]?.getText(ast)==="'change'");
assert.ok(listener,'test the actual production import handler');
const code=ts.transpile(listener.getText(ast),{target:ts.ScriptTarget.ES2022});
function deferred(){
 let resolve!:(value:string)=>void,reject!:(error:Error)=>void;
 const promise=new Promise<string>((yes,no)=>{resolve=yes;reject=no;});
 return {resolve,reject,promise};
}
function setup(){
 let handler!:(e:{target:any})=>Promise<void>;
 const messages:string[]=[],dialogs:string[]=[];
 class Input {
  id='import-save';type='file';value='selected-save.json';files:any[]=[];
  checked=false;name='';dataset={};isConnected=true;
  closest(){return null;}
 }
 const input=new Input();
 const context:any={
  root:{},HTMLInputElement:Input,HTMLSelectElement:class {},MAX_SAVE_CHARS,importBackup,chapterPresentation,money:String,
  modal:'save-recovery',modalVersion:1,importRequest:0,pendingImport:null,session:{status:'active'},allowed:true,
  lifetime:{disposed:false,listen(_root:any,_event:string,callback:any){handler=callback;}},
  guardAction:()=>context.allowed,
  toast:(message:string)=>messages.push(message),
  showModal:(name:string,html:string,focusCommand?:string)=>{context.focusCommand=focusCommand;context.modal=name;context.modalVersion++;dialogs.push(html);},
  isLegacyChoice:()=>false,
 };
 runInNewContext(code,context);
 function select(size=20){
  const read=deferred();input.files=[{size,text:()=>read.promise}];input.value='selected-save.json';
  const completion=handler({target:input});return {...read,completion};
 }
 return {context,input,messages,dialogs,select,clear:()=>{input.files=[];input.value='';return handler({target:input});}};
}
test('a failed active file read clears the input and keeps progress unmodified',async()=>{
 const h=setup(),read=h.select();read.reject(Error('disclosed read failure'));await read.completion;
 assert.equal(h.input.value,'');assert.equal(h.messages.length,1);assert.match(h.messages[0],/could not be read/);
 assert.equal(h.context.pendingImport,null);assert.equal(h.dialogs.length,0);
});
for(const reason of ['dismissed','replaced','ownership-lost','disposed'] as const){
 test(`an import failure is silent when ${reason}`,async()=>{
  const h=setup(),read=h.select();
  if(reason==='dismissed')h.context.modal=null;
  if(reason==='replaced')h.context.modalVersion++;
  if(reason==='ownership-lost')h.context.allowed=false;
  if(reason==='disposed')h.context.lifetime.disposed=true;
  read.reject(Error('late error'));await read.completion;
  assert.deepEqual(h.messages,[]);assert.equal(h.context.pendingImport,null);
 });
}
test('an older successful read cannot replace a later pending selection',async()=>{
 const h=setup(),first=h.select(),second=h.select();
 first.resolve(JSON.stringify({...defaultProfile(),coins:111}));await first.completion;
 assert.equal(h.context.modal,'save-recovery');assert.equal(h.context.pendingImport,null);
 second.resolve(JSON.stringify({...defaultProfile(),coins:222}));await second.completion;
 assert.equal(h.context.pendingImport.coins,222);assert.equal(h.dialogs.length,1);
});
test('an older failed read cannot clear or report over a later selection',async()=>{
 const h=setup(),first=h.select(),second=h.select();first.reject(Error('obsolete'));await first.completion;
 assert.equal(h.input.value,'selected-save.json');assert.deepEqual(h.messages,[]);
 second.resolve(JSON.stringify(defaultProfile()));await second.completion;assert.equal(h.dialogs.length,1);
});
test('the newest success remains selected when the older read later succeeds',async()=>{
 const h=setup(),first=h.select(),second=h.select();second.resolve(JSON.stringify({...defaultProfile(),coins:222}));await second.completion;
 first.resolve(JSON.stringify({...defaultProfile(),coins:111}));await first.completion;
 assert.equal(h.context.pendingImport.coins,222);assert.equal(h.dialogs.length,1);
});
test('an oversized newer selection invalidates an older pending read',async()=>{
 const h=setup(),first=h.select(),second=h.select(MAX_SAVE_CHARS+1);await second.completion;
 first.resolve(JSON.stringify(defaultProfile()));await first.completion;
 assert.equal(h.context.pendingImport,null);assert.equal(h.dialogs.length,0);assert.equal(h.input.value,'');
});
test('clearing the file input invalidates its pending read',async()=>{
 const h=setup(),first=h.select();await h.clear();
 first.resolve(JSON.stringify(defaultProfile()));await first.completion;
 assert.equal(h.context.pendingImport,null);assert.equal(h.dialogs.length,0);
});

test('import confirmation focuses Cancel instead of replacing progress',async()=>{
 const h=setup(),read=h.select();read.resolve(JSON.stringify(defaultProfile()));await read.completion;
 assert.equal(h.context.modal,'import');assert.equal(h.context.focusCommand,'close');
});
