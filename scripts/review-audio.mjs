/** Native browser waveform evidence; never substitutes for device listening. */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {measureAudioReview,encodeAudioReviewWav,validateAudioReviewCues} from './audio-review-metrics.mjs';

const args=process.argv.slice(2);let offline=false,output='artifacts/audio-review/task-1';
for(let i=0;i<args.length;i++){
 if(args[i]==='--offline')offline=true;
 else if(args[i]==='--output'){assert.ok(args[i+1]&&!args[i+1].startsWith('--'),'--output requires a directory');output=args[++i];}
 else if(args[i]==='--help'){console.log('Usage: node scripts/review-audio.mjs --offline [--output directory]');process.exit(0);}
 else throw Error(`Unsupported audio review option: ${args[i]}`);
}
assert.ok(offline,'Task 1 supports --offline; native production-page UI checks belong to Task 2');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),directory=resolve(output),origin='http://127.0.0.1:4176';
mkdirSync(directory,{recursive:true});
const server=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','4176','--strictPort'],{cwd:root,stdio:'pipe'});
let serverLog='',serverError,browser,browserVersion;const errors=[],reports=[];
server.stdout.on('data',chunk=>{serverLog+=chunk;});server.stderr.on('data',chunk=>{serverLog+=chunk;});server.on('error',error=>{serverError=error;});
let revision='unavailable';try{revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
const common=()=>({kind:'native OfflineAudioContext production rendering; not live admission or device listening',revision,browserVersion,
 sampleFormat:'pre-WAV Float32 browser samples; output stereo PCM16',limits:{sampleRate:16000,isolatedDuration:1,crowdedDuration:20,peakExclusive:1,isolatedBoundaryResidualExclusive:1e-5},
 listening:'Listening not performed; combat distinction and masking unverified. Auditory acceptance not established.',cases:reports,pageErrors:errors});
try{
 let ready=false;
 for(let attempt=0;attempt<80;attempt++){
  if(serverError)throw serverError;if(server.exitCode!==null)throw Error(`Fixture server exited ${server.exitCode}: ${serverLog}`);
  try{ready=(await fetch(`${origin}/tests/fixtures/audio-review.html`,{signal:AbortSignal.timeout(1000)})).ok;}catch{}
  if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.ok(ready,`Audio fixture server did not start: ${serverLog}`);
 browser=await chromium.launch({headless:true});browserVersion=browser.version();
 const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(30000);
 await page.goto(`${origin}/tests/fixtures/audio-review.html`,{waitUntil:'networkidle'});
 await page.waitForSelector('body[data-ready="true"]');
 const cues=await page.evaluate(()=>window.audioReview.cues);
 const cueCount=validateAudioReviewCues(cues);
 for(const id of [...cues,'crowded']){
  const pcm=await page.evaluate(id=>window.audioReview.render(id),id);
  const isolated=id!=='crowded',metrics=measureAudioReview(pcm,isolated);
  assert.equal(pcm.parameters.nativeOffline,true);assert.equal(pcm.parameters.scheduledVoices,pcm.parameters.releasedVoices);
  if(isolated)assert.equal(pcm.parameters.scheduledVoices,1);
  else{assert.equal(pcm.parameters.bedPCMBytes,3_072_000);assert.equal(pcm.parameters.bedMixGain,.35);}
  writeFileSync(resolve(directory,`${id}.wav`),encodeAudioReviewWav(pcm));
  reports.push({name:id,wav:`${id}.wav`,parameters:pcm.parameters,...metrics});
  // Persist measured cases as they complete so a later failure keeps evidence.
  writeFileSync(resolve(directory,'metrics.json'),JSON.stringify({status:'in-progress',...common()},null,2)+'\n');
 }
 assert.deepEqual(errors,[],'native render fixture must not raise page errors');assert.equal(reports.length,cueCount+1);
 writeFileSync(resolve(directory,'metrics.json'),JSON.stringify({status:'passed',...common()},null,2)+'\n');
 console.log(`Offline audio review passed: ${cueCount} isolated production cues + 20-second crowded reference, Chromium ${browserVersion}.`);
 console.log(`Float peak/RMS, onset/end intervals and WAVs: ${directory}`);
}catch(error){
 writeFileSync(resolve(directory,'metrics.json'),JSON.stringify({status:'failed',...common(),error:error.stack??String(error),serverLog},null,2)+'\n');
 throw error;
}finally{
 try{await browser?.close();}finally{
  if(server.exitCode===null){
   const exited=new Promise(resolve=>server.once('close',resolve));server.kill('SIGTERM');
   let timer;await Promise.race([exited,new Promise(resolve=>{timer=setTimeout(resolve,3000);})]);clearTimeout(timer);
   if(server.exitCode===null)server.kill('SIGKILL');
  }
 }
}
