import test from 'node:test';
import assert from 'node:assert/strict';
import * as existing from '../src/ui/audio-preferences.ts';
const api=existing as any;
test('mix preferences validate version and normalize finite fields independently in five-point steps',()=>{
 assert.equal(typeof api.loadAudioMix,'function','versioned mix preference required');
 const load=(value:string|null)=>api.loadAudioMix({getItem:()=>value});
 for(const value of [null,'broken','null','{}','{"version":2,"effects":0,"atmosphere":0}'])assert.deepEqual(load(value),{effects:100,atmosphere:100});
 assert.deepEqual(load('{"version":1,"effects":-10,"atmosphere":140}'),{effects:0,atmosphere:100});
 assert.deepEqual(load('{"version":1,"effects":23,"atmosphere":77}'),{effects:25,atmosphere:75});
 assert.deepEqual(api.normalizeAudioMix({effects:NaN,atmosphere:Infinity}),{effects:100,atmosphere:100});
 assert.deepEqual(api.normalizeAudioMix({effects:'50',atmosphere:null}),{effects:100,atmosphere:100});
 assert.deepEqual(api.normalizeAudioMix({effects:50,atmosphere:'bad'}),{effects:50,atmosphere:100});
});
test('mix persistence touches only its exact versioned key and tolerates storage access failures',()=>{
 assert.equal(typeof api.saveAudioMix,'function','mix persistence required');
 const values=new Map([['almo7areboon.save.v1','future bytes'],['almo7areboon.save.v1.backup','backup bytes']]);
 const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
 assert.equal(api.AUDIO_MIX_KEY,'almo7areboon.audio.mix.v1');assert.equal(api.saveAudioMix({effects:23,atmosphere:77},storage),true);
 assert.equal(values.get(api.AUDIO_MIX_KEY),'{"version":1,"effects":25,"atmosphere":75}');assert.deepEqual(api.loadAudioMix(storage),{effects:25,atmosphere:75});
 api.saveAtmosphere(false,storage);api.saveAtmosphere(true,storage);assert.deepEqual(api.loadAudioMix(storage),{effects:25,atmosphere:75});
 assert.equal(values.get('almo7areboon.save.v1'),'future bytes');assert.equal(values.get('almo7areboon.save.v1.backup'),'backup bytes');
 assert.deepEqual(api.loadAudioMix({getItem(){throw Error('read denied');}}),{effects:100,atmosphere:100});assert.equal(api.saveAudioMix(api.DEFAULT_AUDIO_MIX,{setItem(){throw Error('write denied');}}),false);
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('property denied');}});
 try{assert.deepEqual(api.loadAudioMix(),{effects:100,atmosphere:100});assert.equal(api.saveAudioMix(api.DEFAULT_AUDIO_MIX),false);}
 finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete (globalThis as any).localStorage;}
});
