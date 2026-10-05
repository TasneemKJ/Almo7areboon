import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseFieldContext} from '../src/ui/field-focus.ts';
function boundary(){
 const document={activeElement:null as any},node=(visible=true)=>({ownerDocument:document,hidden:!visible,isConnected:true,closest(){return null;},getClientRects(){return this.hidden?[]:[{}];},focus(){document.activeElement=this;}});
 const origin=node(),fallback=node(),button=node(),modal=node(),context={...node(),contains(n:unknown){return n===button;}};document.activeElement=button;
 return {document,origin,fallback,button,modal,context};
}
test('dismissal of a focused tactical choice returns focus to its still-visible world origin',()=>{
 const b=boundary();releaseFieldContext(b.context as any,b.origin as any,b.fallback as any);assert.equal(b.context.hidden,true);assert.equal(b.document.activeElement,b.origin);
});
test('enemy departure returns focused tactical choice to the stable Pause control',()=>{
 const b=boundary();b.origin.hidden=true;releaseFieldContext(b.context as any,b.origin as any,b.fallback as any);assert.equal(b.document.activeElement,b.fallback);
});
test('automatic context expiry never steals focus from a separate modal',()=>{
 const b=boundary();b.document.activeElement=b.modal;releaseFieldContext(b.context as any,b.origin as any,b.fallback as any);assert.equal(b.document.activeElement,b.modal);
});
