import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='closeModal');
assert.ok(node);
const code=ts.transpile(node.getText(ast)+'\nthis.closeModal=closeModal;',{target:ts.ScriptTarget.ES2022});
for(const mode of ['camp','camp-advanced','field'])for(const target of ['body','hidden','disabled','detached','unfocusable','valid'] as const){
 test(`closing a dialog restores usable focus from a ${target} origin in ${mode}`,()=>{
  const doc:any={body:{},documentElement:{},activeElement:null};
  const nav={focus(){doc.activeElement=this;}};
  const origin:any=target==='body'?doc.body:{};
  Object.assign(origin,{
   isConnected:target!=='detached',
   hasAttribute:()=>target==='disabled',
   closest:()=>target==='hidden'?{}:null,
   matches:()=>target==='disabled',
   getClientRects:()=>target==='hidden'?[]:[{}],
   focus(){if(!['body','hidden','disabled','detached','unfocusable'].includes(target))doc.activeElement=this;},
  });
  const layer:any={hidden:false,innerHTML:'dialog'};
  doc.activeElement={};
  const context:any={document:doc,focusBefore:origin,modal:'settings',modalVersion:0,pendingImport:null,focusFrame:0,entryEntered:true,activeTab:mode==='camp-advanced'?'cards':'battle',campOwner:mode==='field'?null:mode==='camp-advanced'?{kind:'advanced',returnTarget:'journal'}:{kind:'root'},
   playable:()=>true,session:{check:()=>true},window:{cancelAnimationFrame(){}},$:()=>layer,isolateModal(){},syncPause(){},update(){},
   root:{dataset:{fieldMode:mode},querySelector:(selector:string)=>{assert.equal(selector,mode==='field'?'[data-command="field-pause"]':mode==='camp-advanced'?'[data-command="camp-return"]':'[data-command="camp-battle"]');return nav;}},
  };
  runInNewContext(code,context);context.closeModal(false);
  assert.equal(doc.activeElement,target==='valid'?origin:nav);
  assert.equal(layer.hidden,true);assert.equal(context.modal,null);
 });
}
test('initial loading with no dialog does not steal keyboard focus',()=>{
 const doc:any={body:{},documentElement:{},activeElement:{}};const before=doc.activeElement;let focused=false;
 const context:any={document:doc,focusBefore:null,modal:null,modalVersion:0,pendingImport:null,focusFrame:0,entryEntered:true,activeTab:'battle',
  playable:()=>true,session:{check:()=>true},window:{cancelAnimationFrame(){}},$:()=>({}),isolateModal(){},syncPause(){},update(){},
  root:{querySelector:()=>({focus(){focused=true;}})},
 };
 runInNewContext(code,context);context.closeModal(false);assert.equal(focused,false);assert.equal(doc.activeElement,before);
});
test('closing Home Settings returns focus to the entry when its original control is gone',()=>{
 const doc:any={body:{},documentElement:{},activeElement:{}};
 const play={focus(){doc.activeElement=this;}};const layer={hidden:false,innerHTML:'settings'};
 const context:any={document:doc,focusBefore:null,modal:'settings',modalVersion:0,pendingImport:null,focusFrame:0,entryEntered:false,activeTab:'battle',
  playable:()=>true,session:{check:()=>true},window:{cancelAnimationFrame(){}},$:(id:string)=>id==='entry-play'?play:layer,isolateModal(){},syncPause(){},update(){},root:{querySelector:()=>null}};
 runInNewContext(code,context);context.closeModal(false);assert.equal(doc.activeElement,play);assert.equal(context.entryEntered,false);
});
