import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function reviewPort(value,fallback){
 const port=Number(value??fallback);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error(`Invalid review port: ${value}`);
 return port;
}

/** Wait for this child to bind its strict port before making any HTTP request. */
function ownedListening(server,origin){
 return new Promise((resolve,reject)=>{
  let output='';
  const timer=setTimeout(()=>finish(new Error('Owned Vite server did not start')),15000);
  const exited=code=>finish(new Error(`Owned Vite server exited ${code}: ${output.trim()}`));
  const failed=error=>finish(error);
  const data=chunk=>{
   output=(output+chunk.toString()).replace(/\x1b\[[0-9;]*m/g,'').slice(-4000);
   if(output.includes(`Local:   ${origin}/`)||new RegExp(`Local:\\s+${origin.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/`).test(output))finish();
  };
  function finish(error){
   clearTimeout(timer);server.off('exit',exited);server.off('error',failed);
   server.stdout.off('data',data);server.stderr.off('data',data);
   // Keep draining the owned process; never let a full log pipe stop its server.
   server.stdout.resume();server.stderr.resume();
   if(error)reject(error);else resolve();
  }
  server.once('exit',exited);server.once('error',failed);server.stdout.on('data',data);server.stderr.on('data',data);
 });
}

export async function startReviewServer({port,preview=true,readyPath='/'}={}){
 const chosen=reviewPort(port,4173),origin=`http://127.0.0.1:${chosen}`;
 const server=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),...(preview?['preview']:[]),'--host','127.0.0.1','--port',String(chosen),'--strictPort','--clearScreen','false'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','pipe']});
 const close=()=>new Promise(resolve=>{
  if(!server.pid||server.exitCode!==null||server.signalCode!==null){resolve();return;}
  server.once('exit',resolve);server.kill('SIGTERM');
 });
 try{
  await ownedListening(server,origin);
  const response=await fetch(`${origin}${readyPath}`,{signal:AbortSignal.timeout(5000)});
  if(!response.ok||server.exitCode!==null)throw new Error(`Owned Vite server is not ready (${response.status})`);
  return {origin,close};
 }catch(error){await close();throw error;}
}
