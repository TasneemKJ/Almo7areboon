import assert from 'node:assert/strict';
/** Production float data, including adjacent differences within 20 ms on both sides of the wrap. */
export function measureSoundscape(pcm,mix){
 const frames=pcm.left.length;assert.ok(frames>1);assert.equal(pcm.right.length,frames);
 let peak=0,energy=0,mean=0,maxSeamAdjacentDifference=0;
 const window=Math.ceil(pcm.sampleRate*.020);
 for(const channel of [pcm.left,pcm.right])for(let i=0;i<frames;i++){
  const sample=channel[i];assert.ok(Number.isFinite(sample),'finite production PCM');
  peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;mean+=sample;
  if(i<window||i>=frames-window)maxSeamAdjacentDifference=Math.max(maxSeamAdjacentDifference,Math.abs(sample-channel[(i+frames-1)%frames]));
 }
 const source={peak,rms:Math.sqrt(energy/(frames*2)),mean:mean/(frames*2),maxSeamAdjacentDifference};
 const effectiveGain=mix.bedGain*mix.atmosphereLevel;
 return {pcmBytes:pcm.left.byteLength+pcm.right.byteLength,source,previewMix:Object.fromEntries(Object.entries(source).map(([key,value])=>[key,value*effectiveGain])),mix:{...mix,effectiveGain}};
}
export function compareSoundscape(current,previous){
 const comparison={};let needsListeningReview=false;
 for(const name of ['source','previewMix']){
  assert.ok(previous?.[name],'baseline must contain source and preview-mix metrics');
  const rmsRiseDb=20*Math.log10(current[name].rms/previous[name].rms);
  comparison[name]={previous:previous[name],peakDelta:current[name].peak-previous[name].peak,rmsRiseDb,seamDelta:current[name].maxSeamAdjacentDifference-previous[name].maxSeamAdjacentDifference};
  needsListeningReview ||= rmsRiseDb>3;
 }
 return {...comparison,needsListeningReview};
}
export function encodeSoundscapeWav(pcm,gain=.35,loops=1){
 const frames=pcm.left.length*loops,bytes=frames*4,wav=Buffer.alloc(44+bytes);
 wav.write('RIFF',0);wav.writeUInt32LE(36+bytes,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);
 wav.writeUInt32LE(pcm.sampleRate,24);wav.writeUInt32LE(pcm.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(bytes,40);
 for(let i=0;i<frames;i++)for(let c=0;c<2;c++){
  const sample=(c?pcm.right:pcm.left)[i%pcm.left.length]*gain;assert.ok(Number.isFinite(sample)&&Math.abs(sample)<1,'unclipped float sample required');
  wav.writeInt16LE(Math.round(sample*32767),44+i*4+c*2);
 }
 return wav;
}
