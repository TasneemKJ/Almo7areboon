import test from 'node:test';
import assert from 'node:assert/strict';
const path='../scripts/soundscape-review-metrics.mjs';
test('soundscape report measures source, independent mix and adjacent changes across the seam',async()=>{
 const m=await import(path).catch(()=>null);assert.ok(m,'production soundscape metric export required');
 const pcm={sampleRate:100,duration:.06,left:new Float32Array([0,.125,.25,-.5,.125,0]),right:new Float32Array([0,0,0,0,0,0])};
 const metrics=m.measureSoundscape(pcm,{bedGain:.35,atmosphereLevel:.5,alarmMix:0});
 assert.equal(metrics.source.peak,.5);assert.equal(metrics.source.maxSeamAdjacentDifference,.625);
 assert.equal(metrics.previewMix.peak,.0875);assert.ok(Math.abs(metrics.previewMix.rms-metrics.source.rms*.175)<1e-15);
 assert.equal(metrics.pcmBytes,48);assert.equal(metrics.mix.effectiveGain,.175);
 const baseline={source:{...metrics.source,rms:metrics.source.rms/2},previewMix:metrics.previewMix};
 assert.ok(m.compareSoundscape(metrics,baseline).source.rmsRiseDb>6);assert.equal(m.compareSoundscape(metrics,baseline).needsListeningReview,true);
 pcm.left[2]=NaN;assert.throws(()=>m.measureSoundscape(pcm,{bedGain:.35,atmosphereLevel:1,alarmMix:0}));
});
