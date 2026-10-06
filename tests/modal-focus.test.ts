import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {chronicleActionFromData} from '../src/ui/chronicle-screen.ts';

const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const ast=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const node=ast.statements.find(statement=>ts.isFunctionDeclaration(statement)&&statement.name?.text==='showModal');
assert.ok(node,'actual showModal must remain reachable');
const code=ts.transpile(node.getText(ast)+'\nthis.showModal=showModal;', {target:ts.ScriptTarget.ES2022});

test('rerendering the storybook preserves its scroll and the activated company control',()=>{
 let modal='chronicle',modalVersion=0,focusFrame=0,focusBefore=null;const document:any={activeElement:null};
 const control=(dataset:Record<string,string>,disabled=false)=>({dataset,disabled,matches(selector:string){return disabled&&selector.includes(':disabled');},focus(){if(!this.disabled)document.activeElement=this;}});
 const active=control({storyCaptain:'gatekeeper'}),replacement=control({storyCaptain:'gatekeeper'}),close=control({command:'close'});
 document.activeElement=active;let dialog:any={scrollTop:486,focus(){document.activeElement=this;}};
 const layer:any={hidden:false,controls:[active],get innerHTML(){return '';},set innerHTML(_value:string){dialog={scrollTop:0,focus(){document.activeElement=this;}};this.controls=[close,replacement];},querySelector(selector:string){return selector==='.dialog'?dialog:null;},querySelectorAll(selector:string){if(selector==='[data-command]')return this.controls.filter((item:any)=>item.dataset.command);if(selector.includes('[data-story-'))return this.controls.filter((item:any)=>Object.keys(item.dataset).some(key=>key.startsWith('story')));return [];}};
 const context:any={modal,modalVersion,focusFrame,focusBefore,document,lifetime:{disposed:false},playable:()=>true,$:()=>layer,icon:()=>'',isolateModal(){},syncPause(){},modalFocusables:()=>[close,replacement],chronicleActionFromData,window:{cancelAnimationFrame(){}},requestAnimationFrame(callback:()=>void){callback();return 1;}};
 runInNewContext(code,context);context.showModal('chronicle','<button data-story-captain="gatekeeper">Gatekeeper</button>');
 assert.equal(dialog.scrollTop,486);assert.equal(document.activeElement,replacement);
});

test('rerendering after finding a discovery moves focus to an enabled control',()=>{
 let modal='result',modalVersion=0,focusFrame=0,focusBefore=null;const document:any={activeElement:null};
 const control=(dataset:Record<string,string>,disabled=false)=>({dataset,disabled,matches(selector:string){return disabled&&selector.includes(':disabled');},focus(){if(!this.disabled)document.activeElement=this;}});
 const active=control({storyDiscovery:'door'}),disabledReplacement=control({storyDiscovery:'door'},true),close=control({command:'chronicle'});
 const heading:any={focus(){document.activeElement=this;}};
 document.activeElement=active;let dialog:any={scrollTop:486,focus(){document.activeElement=this;}};
 const layer:any={hidden:false,controls:[active],get innerHTML(){return '';},set innerHTML(_value:string){dialog={scrollTop:0,focus(){document.activeElement=this;}};this.controls=[disabledReplacement,close];},querySelector(selector:string){return selector==='.dialog'?dialog:selector==='[data-initial-focus]'?heading:null;},querySelectorAll(selector:string){if(selector==='[data-command]')return this.controls.filter((item:any)=>item.dataset.command);if(selector.includes('[data-story-'))return this.controls.filter((item:any)=>Object.keys(item.dataset).some(key=>key.startsWith('story')));return [];}};
 const context:any={modal,modalVersion,focusFrame,focusBefore,document,lifetime:{disposed:false},playable:()=>true,$:()=>layer,icon:()=>'',isolateModal(){},syncPause(){},modalFocusables:()=>[close],chronicleActionFromData,window:{cancelAnimationFrame(){}},requestAnimationFrame(callback:()=>void){callback();return 1;}};
 runInNewContext(code,context);context.showModal('result','<button data-story-discovery="door" disabled>Door mark found</button>');
 assert.equal(dialog.scrollTop,486);assert.equal(document.activeElement,close);
});

test('a fresh result dialog focuses its outcome heading before below-the-fold actions',()=>{
 const document:any={activeElement:null};
 const heading:any={id:'dialog-title',dataset:{initialFocus:''},focus(){document.activeElement=this;}};
 const action:any={dataset:{command:'review-battlefield'},focus(){document.activeElement=this;}};
 const dialog:any={scrollTop:0,focus(){document.activeElement=this;}};
 const layer:any={hidden:true,innerHTML:'',querySelector(selector:string){return selector==='.dialog'?dialog:selector==='[data-initial-focus]'?heading:null;},querySelectorAll(selector:string){return selector==='[data-command]'?[action]:[];}};
 const context:any={modal:null,modalVersion:0,focusFrame:0,focusBefore:null,document,lifetime:{disposed:false},playable:()=>true,$:()=>layer,icon:()=>'',isolateModal(){},syncPause(){},modalFocusables:()=>[action],chronicleActionFromData,window:{cancelAnimationFrame(){}},requestAnimationFrame(callback:()=>void){callback();return 1;}};
 runInNewContext(code,context);context.showModal('result','<h2 id="dialog-title" tabindex="-1" data-initial-focus>Victory</h2><button data-command="review-battlefield">Look around</button>');
 assert.equal(document.activeElement,heading,'opening results must announce the outcome, not scroll to a lower action');
 // A deliberate return from a confirmation still restores the initiating control.
 context.showModal('result','', 'review-battlefield');
 assert.equal(document.activeElement,action);
});

test('replacing another modal with results resets scroll and focuses the outcome heading',()=>{
 const document:any={activeElement:null};
 const oldClose:any={dataset:{command:'close'},focus(){document.activeElement=this;}};
 const heading:any={id:'dialog-title',dataset:{initialFocus:''},focus(){document.activeElement=this;}};
 const action:any={dataset:{command:'review-battlefield'},focus(){document.activeElement=this;}};
 document.activeElement=oldClose;
 let dialog:any={scrollTop:486,focus(){document.activeElement=this;}};
 const layer:any={hidden:false,get innerHTML(){return '';},set innerHTML(_value:string){dialog={scrollTop:0,focus(){document.activeElement=this;}};},querySelector(selector:string){return selector==='.dialog'?dialog:selector==='[data-initial-focus]'?heading:null;},querySelectorAll(selector:string){return selector==='[data-command]'?[action]:[];}};
 const context:any={modal:'settings',modalVersion:0,focusFrame:0,focusBefore:null,document,lifetime:{disposed:false},playable:()=>true,$:()=>layer,icon:()=>'',isolateModal(){},syncPause(){},modalFocusables:()=>[action],chronicleActionFromData,window:{cancelAnimationFrame(){}},requestAnimationFrame(callback:()=>void){callback();return 1;}};
 runInNewContext(code,context);context.showModal('result','<h2 id="dialog-title" tabindex="-1" data-initial-focus>Victory</h2><button data-command="review-battlefield">Look around</button>');
 assert.equal(dialog.scrollTop,0,'scroll belongs only to a rerender of the same modal');
 assert.equal(document.activeElement,heading,'a cross-modal result transition must announce its outcome');
});
test('focused Preferences, recovery and consequence dialogs do not add a fourth Close control',()=>{
 const layer:any={hidden:true,innerHTML:'',querySelector(){return null;},querySelectorAll(){return [];}};
 const context:any={modal:null,modalVersion:0,focusFrame:0,focusBefore:null,document:{activeElement:null},lifetime:{disposed:false},playable:()=>true,$:()=>layer,icon:()=>'',isolateModal(){},syncPause(){},modalFocusables:()=>[],chronicleActionFromData,window:{cancelAnimationFrame(){}},requestAnimationFrame(){return 1;}};
 runInNewContext(code,context);
 for(const [name,count] of [['settings',3],['save-recovery',3],['reset',3],['import',2],['leave-battle',2],['field-pause',3]] as const){
  context.showModal(name,'<h2 id="dialog-title">Test</h2>'+Array.from({length:count},(_,i)=>`<button data-command="test-${i}">Action</button>`).join(''));
  assert.equal((layer.innerHTML.match(/<button\b/g)||[]).length,count,name);assert.doesNotMatch(layer.innerHTML,/close-button/);
 }
});
