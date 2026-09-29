/** Offline PCM export: same generator/mix as the game, not a browser listening test. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {synthesizeSoundscape} from '../src/view/soundscape.ts';
const directory=resolve(process.argv[2]||'artifacts/soundscape');mkdirSync(directory,{recursive:true});
const names=['first-fires','olive-terraces','harbor-watch','lantern-quarter','hillside-watch','courtyards-beyond'];
const report=[];
for(let age=0;age<6;age++){
 const before=performance.now(),pcm=synthesizeSoundscape(age),generationMs=performance.now()-before;
 const length=pcm.left.length,bytes=length*4,wav=Buffer.alloc(44+bytes);
 wav.write('RIFF',0);wav.writeUInt32LE(36+bytes,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);
 wav.writeUInt32LE(pcm.sampleRate,24);wav.writeUInt32LE(pcm.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(bytes,40);
 let peak=0,energy=0,mean=0;
 for(let i=0;i<length;i++)for(let c=0;c<2;c++){
  const sample=(c?pcm.right[i]:pcm.left[i])*.35;
  peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;mean+=sample;
  wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),44+i*4+c*2);
 }
 writeFileSync(`${directory}/${names[age]}.wav`,wav);
 report.push({chapter:names[age],duration:pcm.duration,sampleRate:pcm.sampleRate,channels:2,pcmBytes:pcm.left.byteLength+pcm.right.byteLength,previewMixGain:.35,peak,rms:Math.sqrt(energy/(length*2)),mean:mean/(length*2),generationMs,loopEdge:{left:[pcm.left[0],pcm.left.at(-1)],right:[pcm.right[0],pcm.right.at(-1)]}});
}
writeFileSync(`${directory}/metrics.json`,JSON.stringify({kind:'offline generated audio, not device listening verification',chapters:report},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
