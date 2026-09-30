/** Offline PCM export: same generator/mix as the game, not a browser listening test. */
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {synthesizeSoundscape} from '../src/view/soundscape.ts';
import {measureSoundscape,compareSoundscape,encodeSoundscapeWav} from './soundscape-review-metrics.mjs';
const args=process.argv.slice(2),directory=resolve(args.shift()||'artifacts/soundscape');let baseline;
if(args.length){if(args.length!==2||args[0]!=='--baseline')throw Error('Usage: export-soundscape-review.mjs directory [--baseline metrics.json]');baseline=JSON.parse(readFileSync(resolve(args[1]),'utf8'));}
mkdirSync(directory,{recursive:true});
const names=['first-fires','olive-terraces','harbor-watch','lantern-quarter','hillside-watch','courtyards-beyond'],report=[];
for(let age=0;age<6;age++){
 const before=performance.now(),pcm=synthesizeSoundscape(age),generationMs=performance.now()-before;
 const metrics=measureSoundscape(pcm,{bedGain:.35,atmosphereLevel:1,alarmMix:0,filterCutoff:5000,effectsLevel:1});
 const comparison=baseline?compareSoundscape(metrics,baseline.chapters.find(chapter=>chapter.chapter===names[age])):undefined;
 writeFileSync(`${directory}/${names[age]}.wav`,encodeSoundscapeWav(pcm,metrics.mix.effectiveGain));
 writeFileSync(`${directory}/${names[age]}-three-loops.wav`,encodeSoundscapeWav(pcm,metrics.mix.effectiveGain,3));
 report.push({chapter:names[age],duration:pcm.duration,sampleRate:pcm.sampleRate,channels:2,...metrics,comparison,generationMs,loopEdge:{left:[pcm.left[0],pcm.left.at(-1)],right:[pcm.right[0],pcm.right.at(-1)]}});
}
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync(`${directory}/metrics.json`,JSON.stringify({kind:'offline generated audio, not device listening verification',revision,generatedAt:new Date().toISOString(),baseline:args[1],chapters:report},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
