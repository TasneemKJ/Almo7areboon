import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import type {Action} from '../src/game/types.ts';

const path='../src/game/battlefield-port.ts';
async function subject(){
 const module=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});
 assert.ok(module,'the production battlefield adapter must have an executable contract');
 return module;
}

test('production battlefield port forwards the live authoritative wave query',async()=>{
 const m=await subject();let game=new Game();
 const port=m.createBattlefieldPort(()=>game,(action:Action)=>game.dispatch(action),(dt:number)=>game.step(dt));
 assert.equal(port.dispatch({type:'start'}),true);
 assert.deepEqual(port.waveStatus(),game.waveStatus());
 const before=port.waveStatus().preview!.nextIn;
 port.step(.25);
 assert.equal(port.waveStatus().preview!.nextIn,before-.25);
 assert.equal(port.profile,game.profile);assert.equal(port.state,game.state);
 assert.deepEqual(port.drainEvents(),game.drainEvents());
 const replacement=new Game();game=replacement;
 assert.equal(port.profile,replacement.profile);assert.equal(port.state,replacement.state);
 assert.deepEqual(port.waveStatus(),replacement.waveStatus(),'a loaded save must replace every authoritative battlefield read');
});
