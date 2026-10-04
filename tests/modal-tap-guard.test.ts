import test from 'node:test';
import assert from 'node:assert/strict';
import {createModalTapGuard} from '../src/ui/modal-tap-guard.ts';

test('Safari-style click without touch metadata uses the preceding touch pointer',()=>{
 const guard=createModalTapGuard();
 const click={detail:1,clientX:200,clientY:700};
 guard.recordPointer({pointerType:'touch',clientX:200,clientY:700},100);
 assert.equal(guard.blocks(click,'result',110),false);
 guard.recordPointer({pointerType:'touch',clientX:200,clientY:700},200);
 assert.equal(guard.blocks(click,null,210),true);
 assert.equal(guard.blocks(click,null,600),false);
});

test('a stale touch pointer cannot classify later mouse or keyboard input as touch',()=>{
 const guard=createModalTapGuard(),click={detail:1,clientX:200,clientY:700};
 guard.recordPointer({pointerType:'touch',clientX:200,clientY:700},100);
 assert.equal(guard.blocks(click,'result',110),false);
 guard.recordPointer({pointerType:'mouse',clientX:200,clientY:700},150);
 assert.equal(guard.blocks(click,null,160),false);
 assert.equal(guard.blocks({...click,detail:0},null,170),false);
});
