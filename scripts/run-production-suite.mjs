/** Run an existing exact-source production suite without rewriting its checks. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
const suite=process.env.REVIEW_SUITE,expected=process.env.SOURCE_SHA;
assert.match(expected??'',/^[a-f0-9]{40}$/);assert(['mobile-touch','upgrade-text','save-sessions'].includes(suite));
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git(['rev-parse','HEAD']),expected);git(['diff','--exit-code','HEAD','--']);
mkdirSync('artifacts/suite-review',{recursive:true});
let server,log='',result;
const record={suite,sourceCommit:expected,sourceTree:git(['rev-parse','HEAD^{tree}']),status:'failed',scope:'Existing production suite unchanged. Root-font and synthetic lifecycle checks, where used by production scripts, are diagnostic emulation and not native preference/background proof.'};
try{
  const args=['run',`review:${suite}`];
  if(suite==='mobile-touch'){
    const origin='http://127.0.0.1:4189';
    server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4189','--strictPort'],{stdio:'pipe'});
    server.stdout.on('data',chunk=>log+=chunk);server.stderr.on('data',chunk=>log+=chunk);
    let ready=false;
    for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(log);try{ready=(await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok;}catch{}if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));}
    assert(ready,'owned preview must start');args.push('--',origin+'/');
  }
  record.command=['npm',...args];
  result=await new Promise((resolve,reject)=>{const process=spawn('npm',args,{stdio:'inherit'});process.once('error',reject);process.once('exit',(code,signal)=>resolve({code,signal}));});
  record.result=result;assert.equal(result.code,0,`${suite} failed`);git(['diff','--exit-code','HEAD','--']);record.status='passed';
}catch(error){record.error=String(error);process.exitCode=1;
}finally{
  server?.kill('SIGTERM');record.serverLog=log.slice(-6000);
  const diagnosticPath=suite==='upgrade-text'?'artifacts/browser-review/upgrade-text/diagnostics.json':suite==='save-sessions'?'artifacts/save-session-review/diagnostics.json':null;
  if(diagnosticPath&&existsSync(diagnosticPath)){
    const diagnostic=JSON.parse(readFileSync(diagnosticPath,'utf8'));
    record.diagnostic={status:diagnostic.status,error:diagnostic.error,pageErrors:diagnostic.pageErrors,assetFailures:diagnostic.assetFailures,nativeStatus:diagnostic.nativeStatus,paintedFocus:diagnostic.paintedFocus,cases:diagnostic.cases.map(row=>({name:row.name,status:row.status,error:row.error}))};
  }
  writeFileSync(`artifacts/suite-review/${suite}.json`,JSON.stringify(record,null,2));console.log('ARENA_PRODUCTION_SUITE '+JSON.stringify(record));
}
