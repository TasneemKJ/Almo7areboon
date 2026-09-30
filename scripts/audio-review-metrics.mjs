import assert from 'node:assert/strict';
/** Measure actual pre-quantization browser Float32 samples, never encoded WAV. */
export function measureAudioReview(pcm,isolated){
 assert.equal(pcm.sampleRate,16000,'production review sample rate');assert.equal(pcm.channels,2,'stereo render required');
 assert.equal(pcm.duration,isolated?1:20,'fixed review duration');
 const frames=pcm.duration*pcm.sampleRate;assert.equal(pcm.left.length,frames);assert.equal(pcm.right.length,frames);
 let peak=0,energy=0;
 for(let i=0;i<frames;i++)for(const sample of [pcm.left[i],pcm.right[i]]){
  assert.ok(Number.isFinite(sample),`nonfinite sample at ${i}`);peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;
 }
 const rms=Math.sqrt(energy/(frames*2));assert.ok(rms>0,'render must not be silent');assert.ok(peak<1,`unclipped float peak required: ${peak}`);
 assert.ok(Array.isArray(pcm.onsets)&&pcm.onsets.length>0,'production source timing required');
 const window=(frame)=>{
  const first=Math.max(0,frame-16),last=Math.min(frames-1,frame+16),samples=[];
  for(let i=first;i<=last;i++)samples.push([i,pcm.left[i],pcm.right[i]]);
  return {centerFrame:frame,firstFrame:first,lastFrame:last,samples};
 };
 const onsets=pcm.onsets.map(onset=>{
  assert.ok(Number.isFinite(onset.at)&&Number.isFinite(onset.end)&&onset.at>=0&&onset.end>onset.at&&onset.end<pcm.duration,'bounded production oscillator timing');
  const startFrame=Math.round(onset.at*pcm.sampleRate),endFrame=Math.round(onset.end*pcm.sampleRate);
  const startResidual=Math.max(Math.abs(pcm.left[startFrame]),Math.abs(pcm.right[startFrame]));
  const endResidual=Math.max(Math.abs(pcm.left[endFrame]),Math.abs(pcm.right[endFrame]));
  if(isolated){assert.ok(startResidual<1e-5,`nonzero cue onset: ${startResidual}`);assert.ok(endResidual<1e-5,`nonzero cue end: ${endResidual}`);}
  return {...onset,startResidual,endResidual,start:window(startFrame),end:window(endFrame)};
 });
 if(isolated)assert.ok(Math.max(Math.abs(pcm.left[0]),Math.abs(pcm.right[0]),Math.abs(pcm.left.at(-1)),Math.abs(pcm.right.at(-1)))<1e-5,'isolated file endpoints');
 return {sampleRate:pcm.sampleRate,channels:2,duration:pcm.duration,frames,peak,rms,onsets};
}
export function encodeAudioReviewWav(pcm){
 // Reject faulty float data before PCM16 conversion; there is no clipping clamp.
 measureAudioReview(pcm,pcm.duration===1);
 const frames=pcm.left.length,bytes=frames*4,wav=Buffer.alloc(44+bytes);
 wav.write('RIFF',0);wav.writeUInt32LE(36+bytes,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);
 wav.writeUInt32LE(pcm.sampleRate,24);wav.writeUInt32LE(pcm.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(bytes,40);
 for(let i=0;i<frames;i++){wav.writeInt16LE(Math.round(pcm.left[i]*32767),44+i*4);wav.writeInt16LE(Math.round(pcm.right[i]*32767),46+i*4);}
 return wav;
}
/** Fixture enumeration owns the count; merged role coverage and uniqueness are required. */
export function validateAudioReviewCues(cues){
 assert.ok(Array.isArray(cues)&&cues.every(cue=>typeof cue==='string'&&cue.length>0),'cue enumeration required');
 assert.ok(cues.includes('death')&&cues.includes('summon'),'merged death and summon render previews required');
 assert.equal(new Set(cues).size,cues.length,'every preview cue must be unique');return cues.length;
}
