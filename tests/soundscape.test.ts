import test from 'node:test';
import assert from 'node:assert/strict';
async function model(){const path='../src/view/soundscape.ts';const m=await import(path).catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return null;throw error;});assert.ok(m,'soundscape synthesis must exist');return m;}

test('soundscapes are deterministic bounded stereo, with no silence or clipped samples',async()=>{
 const m=await model();const hashes=new Set();
 for(let age=0;age<6;age++){
  const a=m.synthesizeSoundscape(age,8000),b=m.synthesizeSoundscape(age,8000);
  assert.equal(a.duration,24);assert.equal(a.sampleRate,8000);
  assert.equal(a.left.length,192000);assert.equal(a.right.length,a.left.length);
  assert.deepEqual(a,b);assert.notDeepEqual(a.left,a.right);
  let energy=0,peak=0,total=0;for(const c of [a.left,a.right])for(const x of c){assert.ok(Number.isFinite(x));energy+=x*x;total+=x;peak=Math.max(peak,Math.abs(x));}
  assert.ok(peak<=.28&&peak>.02);assert.ok(Math.sqrt(energy/(a.left.length*2))>.005);
  assert.ok(Math.abs(total/(a.left.length*2))<.001);
  hashes.add(a.left.slice(10000,10200).join(','));
 }
 assert.equal(hashes.size,6);
});
test('audio boundaries taper smoothly to zero rather than clicking at the loop seam',async()=>{
 const m=await model();for(let age=0;age<6;age++)for(const c of Object.values(m.synthesizeSoundscape(age,8000)).filter(x=>x instanceof Float32Array) as Float32Array[]){
  assert.equal(c[0],0);assert.equal(c[c.length-1],0);
  assert.ok(Math.abs(c[1])<1e-5&&Math.abs(c[c.length-2])<1e-5);
  assert.ok(Math.max(...c.slice(0,32).map(Math.abs))<.0001);
 }
});
test('invalid scene and rate input use bounded safe defaults without huge allocations',async()=>{
 const m=await model();const baseline=m.synthesizeSoundscape(0,16000);
 for(const age of [-1,6,NaN,Infinity,1.2])assert.deepEqual(m.synthesizeSoundscape(age,8000),m.synthesizeSoundscape(0,8000));
 for(const rate of [NaN,Infinity,-1,0]){const a=m.synthesizeSoundscape(0,rate);assert.equal(a.sampleRate,16000);assert.deepEqual(a.left,baseline.left);}
 const huge=m.synthesizeSoundscape(0,1e12);assert.equal(huge.sampleRate,22050);assert.ok((huge.left.byteLength+huge.right.byteLength)<4_300_000);
});

test('authored production PCM stays finite stereo with the exact 3,072,000-byte payload',async()=>{
 const m=await model();for(let age=0;age<6;age++){
  const pcm=m.synthesizeSoundscape(age);assert.equal(pcm.sampleRate,16000);assert.equal(pcm.duration,24);assert.equal(pcm.left.length,384000);assert.equal(pcm.right.length,384000);assert.equal(pcm.left.byteLength+pcm.right.byteLength,3_072_000);
  for(const channel of [pcm.left,pcm.right]){assert.equal(channel[0],0);assert.equal(channel.at(-1),0);for(const sample of channel){assert.ok(Number.isFinite(sample));assert.ok(Math.abs(sample)<=.27);}}
 }
});

test('six authored courtyard answers are finite bounded and chapter-distinct',async()=>{
 const m=await model(),phrases=[];
 for(let age=0;age<6;age++){
  const phrase=m.courtyardAnswer(age);phrases.push(phrase.join(','));
  assert.ok(Object.isFrozen(phrase));assert.equal(phrase.length,2);
  assert.ok(phrase.every((frequency:number)=>Number.isFinite(frequency)&&frequency>=80&&frequency<=700));
  assert.notEqual(phrase[0],phrase[1]);
 }
 assert.equal(new Set(phrases).size,6);
 assert.deepEqual(m.courtyardAnswer(NaN),m.courtyardAnswer(0));
});
