import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {startReviewServer,reviewPort} from '../scripts/review-server.mjs';

test('the actual browser review rejects an occupied chosen port before launching a browser',async()=>{
 let requests=0;
 const foreign=createServer((_request,response)=>{requests++;response.end('FOREIGN_BUILD_MARKER');});
 foreign.listen(0,'127.0.0.1');await once(foreign,'listening');
 const port=(foreign.address() as {port:number}).port;
 const source=`import {chromium} from 'playwright';let launched=false;chromium.launch=async()=>{launched=true;throw new Error('BROWSER_INTERCEPT');};try{await import('./scripts/capture-browser-review.mjs');}catch(error){console.log(JSON.stringify({launched,error:error.message}));}`;
 try{
  const child=spawn(process.execPath,['--input-type=module','-e',source],{cwd:new URL('../',import.meta.url),env:{...process.env,ALMO_REVIEW_PORT:String(port)},stdio:['ignore','pipe','pipe']});
  let output='',errors='';child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>errors+=data);
  const [code]=await once(child,'exit');assert.equal(code,0,errors);
  const result=JSON.parse(output.trim());assert.equal(result.launched,false,JSON.stringify(result));
  assert.match(result.error,/port.*in use|exited/i);assert.equal(requests,0,'readiness never polls the other project');
  assert.equal(await (await fetch(`http://127.0.0.1:${port}/`)).text(),'FOREIGN_BUILD_MARKER');
 }finally{await new Promise<void>(resolve=>foreign.close(()=>resolve()));}
});

test('owned startup serves its selected origin and closes only its own process',async()=>{
 const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');
 const port=(reservation.address() as {port:number}).port;await new Promise<void>(resolve=>reservation.close(()=>resolve()));
 const owned=await startReviewServer({port,preview:false});
 try{assert.equal(owned.origin,`http://127.0.0.1:${port}`);const text=await (await fetch(owned.origin)).text();assert.match(text,/Almo7areboon|المحاربون|app/);}
 finally{await owned.close();}
 await assert.rejects(fetch(`http://127.0.0.1:${port}/`));
});

test('invalid review ports fail before spawning a child',()=>{
 for(const value of ['0','65536','-1','bad','1.5'])assert.throws(()=>reviewPort(value,4173),/Invalid review port/);
 assert.equal(reviewPort(undefined,4173),4173);assert.equal(reviewPort('4319',4173),4319);
});
