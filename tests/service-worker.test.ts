import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const deferred=()=>{let resolve!:(value?:any)=>void,reject!:(reason?:any)=>void;const promise=new Promise<any>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function worker({cached=true,mode='cors',url='https://game.test/art/a.webp',method='GET'}={}){
 const network=deferred(),write=deferred(),trim=deferred(),lifetimes:Promise<any>[]=[];
 const handlers:Record<string,Function>={},request={url,method,mode};let response:Promise<any>|undefined,putStarted=false,trimStarted=false,fetches=0;
 const fresh={ok:true,type:'basic',clone(){return this;}},old={name:'cached'};
 const cache={match:async()=>cached?old:undefined,put:()=>{putStarted=true;return write.promise;},keys:()=>{trimStarted=true;return trim.promise;},delete:async()=>true};
 runInNewContext(source,{URL,Response:{error:()=>({name:'error'})},caches:{open:async()=>cache},fetch:()=>{fetches++;return network.promise;},self:{location:{origin:'https://game.test'},registration:{scope:'https://game.test/'},addEventListener:(name:string,fn:Function)=>handlers[name]=fn}});
 handlers.fetch({request,respondWith:(p:Promise<any>)=>response=p,waitUntil:(p:Promise<any>)=>lifetimes.push(p)});
 return {network,write,trim,lifetimes,fresh,old,get response(){return response;},get putStarted(){return putStarted;},get trimStarted(){return trimStarted;},get fetches(){return fetches;}};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('cached response remains immediate while refresh lifetime covers write and bundle trim',async()=>{
 const w=worker();assert.ok(w.lifetimes.length,'background refresh must be registered synchronously');assert.equal(await w.response,w.old);
 let settled=false;Promise.all(w.lifetimes).then(()=>settled=true);
 assert.equal(settled,false);w.network.resolve(w.fresh);await flush();assert.equal(w.putStarted,true);assert.equal(settled,false);
 w.write.resolve();await flush();assert.equal(w.trimStarted,true);assert.equal(settled,false);
 w.trim.resolve([]);await Promise.all(w.lifetimes);await flush();assert.equal(settled,true);assert.equal(w.fetches,1);
});
test('fresh response is independent of a pending cache write and offline navigation retains fallback',async()=>{
 const w=worker({cached:false,mode:'navigate'});w.network.resolve(w.fresh);
 assert.equal(await w.response,w.fresh);await flush();assert.equal(w.putStarted,true);
 w.write.reject(Error('quota'));await Promise.all(w.lifetimes);
 const offline=worker({mode:'navigate'});offline.network.reject(Error('offline'));assert.equal(await offline.response,offline.old);await Promise.all(offline.lifetimes);
});
test('background network failure preserves cached asset without an unhandled lifetime rejection',async()=>{
 const w=worker();assert.equal(await w.response,w.old);w.network.reject(Error('offline'));await Promise.all(w.lifetimes);
});
test('external and non-GET requests stay outside the game cache',async()=>{
 for(const options of [{url:'https://other.test/file'},{method:'POST'}]){const w=worker(options);await flush();assert.equal(w.response,undefined);assert.equal(w.lifetimes.length,0);assert.equal(w.fetches,0);}
});
