import test from 'node:test';import assert from 'node:assert/strict';import {isProvisionDrop,provisionFrame} from '../src/view/camp-provision.ts';
test('grain handover requires actual accepted positive food and excludes captain abilities',()=>{
 assert.equal(isProvisionDrop({type:'skill',skill:'food',amount:3}),true);
 for(const event of [{type:'skill',skill:'food',amount:0},{type:'skill',skill:'food',amount:3,storyCue:'captain'},{type:'skill',skill:'meteor',amount:3},{type:'coin',amount:3}] as const)assert.equal(isProvisionDrop(event),false);
 assert.equal(provisionFrame(4,3,false),null);assert.equal(provisionFrame(4,4.85,false),null);
 assert.ok(provisionFrame(4,4.2,false)!.lift>0);assert.equal(provisionFrame(4,4.2,true)!.lift,0);
});
