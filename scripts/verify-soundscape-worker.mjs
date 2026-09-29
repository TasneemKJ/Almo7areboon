/** Execute the built PCM worker in a Node thread. This is not browser/audio-device QA. */
import {Worker} from 'node:worker_threads';
import {readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {synthesizeSoundscape} from '../src/view/soundscape.ts';
const asset=readdirSync('dist/assets').find(name=>/^soundscape-worker-.*\.js$/.test(name));
assert.ok(asset,'Run npm run build first.');
const url=pathToFileURL(resolve('dist/assets',asset)).href;
const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.postMessage=(data,transfer)=>parentPort.postMessage(data,transfer);parentPort.on('message',data=>globalThis.onmessage({data}));import(${JSON.stringify(url)}).then(()=>parentPort.postMessage('ready'));`,{eval:true});
const next=()=>new Promise((resolve,reject)=>{
 const cleanup=()=>{clearTimeout(timer);worker.off('message',message);worker.off('error',error);worker.off('exit',exit);};
 const message=data=>{cleanup();resolve(data);},error=e=>{cleanup();reject(e);},exit=code=>error(new Error(`Worker exited before replying (${code}).`));
 const timer=setTimeout(()=>error(new Error('Built-worker verification timed out.')),10000);
 worker.once('message',message);worker.once('error',error);worker.once('exit',exit);
});
const digest=data=>createHash('sha256').update(Buffer.from(data.buffer,data.byteOffset,data.byteLength)).digest('hex');
const report=[];
try{
 assert.equal(await next(),'ready');
 for(let age=0;age<6;age++){
  const reply=next();worker.postMessage({age});const actual=await reply,expected=synthesizeSoundscape(age);
  assert.equal(actual.sampleRate,16000);assert.equal(actual.duration,24);
  assert.equal(digest(actual.left),digest(expected.left));assert.equal(digest(actual.right),digest(expected.right));
  report.push({age,frames:actual.left.length,left:digest(actual.left),right:digest(actual.right),matchesSource:true});
 }
}finally{await worker.terminate();}
const directory=resolve(process.argv[2]||'artifacts/soundscape');mkdirSync(directory,{recursive:true});
writeFileSync(resolve(directory,'built-worker-verification.json'),JSON.stringify({kind:'Node worker verification, not browser playback',asset,chapters:report},null,2)+'\n');
console.log(`Built worker matches source PCM for ${report.length} chapters.`);
