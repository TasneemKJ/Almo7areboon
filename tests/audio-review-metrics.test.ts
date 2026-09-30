import test from 'node:test';
import assert from 'node:assert/strict';
const path='../scripts/audio-review-metrics.mjs';
const {measureAudioReview,encodeAudioReviewWav,validateAudioReviewCues}=await import(path);
const frames=16000;
function fixture(){const left=new Float32Array(frames),right=new Float32Array(frames);left[801]=.125;right[801]=-.25;return {left,right,sampleRate:16000,duration:1,channels:2,onsets:[{at:.05,end:.1}]};}
test('offline gate rejects nonfinite, clipping, silence, wrong formats and cue endpoint residue before encoding',()=>{
 assert.equal(measureAudioReview(fixture(),true).peak,.25);
 for(const value of [NaN,Infinity,-Infinity,1,-1]){const f=fixture();f.left[801]=value;assert.throws(()=>measureAudioReview(f,true));}
 const silent=fixture();silent.left.fill(0);silent.right.fill(0);assert.throws(()=>measureAudioReview(silent,true));
 for(const change of [{sampleRate:48000},{channels:1},{duration:2},{right:new Float32Array(100)}])assert.throws(()=>measureAudioReview({...fixture(),...change},true));
 for(const index of [800,1600]){const f=fixture();f.left[index]=.001;assert.throws(()=>measureAudioReview(f,true));}
 assert.throws(()=>encodeAudioReviewWav({...fixture(),left:new Float32Array(frames).fill(1)}),'encoder may not hide clipping');
});
test('pre-WAV metrics retain float energy and onset/end inspection windows; WAV is exact stereo PCM16',()=>{
 const f=fixture(),metrics=measureAudioReview(f,true),wav=encodeAudioReviewWav(f);
 assert.equal(metrics.frames,16000);assert.equal(metrics.channels,2);assert.equal(metrics.duration,1);assert.equal(metrics.sampleRate,16000);
 assert.ok(Math.abs(metrics.rms-Math.sqrt((.125*.125+.25*.25)/32000))<1e-15);
 assert.equal(metrics.onsets[0].startResidual,0);assert.equal(metrics.onsets[0].endResidual,0);
 assert.ok(metrics.onsets[0].start.samples.some((s:number[])=>s[1]===.125&&s[2]===-.25));
 assert.equal(wav.length,64044);assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),16000);
 assert.equal(wav.readUInt16LE(22),2);assert.equal(wav.readUInt16LE(34),16);
 assert.equal(wav.readInt16LE(44+801*4),4096);assert.equal(wav.readInt16LE(46+801*4),-8192);
});

test('native runner derives cue count and rejects duplicates or missing merged roles',()=>{
 const cues=['deploy','hit-neutral','hit-blunt','hit-flick','hit-hollow','base-player','base-enemy','coin','freeze','meteor','food','upgrade','evolve','win','lose','death','summon'];
 assert.equal(validateAudioReviewCues(cues),17);assert.equal(validateAudioReviewCues([...cues,'additional-review-role']),18);
 assert.throws(()=>validateAudioReviewCues([...cues,'death']));assert.throws(()=>validateAudioReviewCues(cues.filter(c=>c!=='summon')));
});
