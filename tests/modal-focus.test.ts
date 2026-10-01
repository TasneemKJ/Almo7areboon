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
 document.activeElement=active;let dialog:any={scrollTop:486,focus(){document.activeElement=this;}};
 const layer:any={hidden:false,controls:[active],get innerHTML(){return '';},set innerHTML(_value:string){dialog={scrollTop:0,focus(){document.activeElement=this;}};this.controls=[disabledReplacement,close];},querySelector(selector:string){return selector==='.dialog'?dialog:null;},querySelectorAll(selector:string){if(selector==='[data-command]')return this.controls.filter((item:any)=>item.dataset.command);if(selector.includes('[data-story-'))return this.controls.filter((item:any)=>Object.keys(item.dataset).some(key=>key.startsWith('story')));return [];}};
 const context:any={modal,modalVersion,focusFrame,focusBefore,document,lifetime:{disposed:false},playable:()=>true,$:()=>layer,icon:()=>'',isolateModal(){},syncPause(){},modalFocusables:()=>[close],chronicleActionFromData,window:{cancelAnimationFrame(){}},requestAnimationFrame(callback:()=>void){callback();return 1;}};
 runInNewContext(code,context);context.showModal('result','<button data-story-discovery="door" disabled>Door mark found</button>');
 assert.equal(dialog.scrollTop,486);assert.equal(document.activeElement,close);
});
