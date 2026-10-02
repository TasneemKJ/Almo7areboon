import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Game} from '../../src/game/simulation.ts';
import {defaultProfile,decodeSave} from '../../src/game/save.ts';
import {createChronicle} from '../../src/game/chronicle.ts';
import {createMastery} from '../../src/game/mastery.ts';
import type {Action,UnitKind,Skill} from '../../src/game/types.ts';
const out=process.env.QA_OUT??'artifacts/expanded-qa/stress-domain';mkdirSync(out,{recursive:true});
const cases:unknown[]=[];let totalActions=0,totalSteps=0,roundtrips=0,rejections=0,failed=0;
function finite(v:unknown):boolean{return typeof v==='number'?Number.isFinite(v):!v||typeof v!=='object'||Object.values(v).every(finite);}
for(let age=0;age<6;age++)for(const timeline of [1,2,4,1000]){
 let seed=(0x9137+age*97+timeline)>>>0;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 const p=defaultProfile();p.age=age;p.enemyAge=age;p.furthestBattle=5;p.timeline=timeline;p.mastery=createMastery(timeline);p.chronicle=createChronicle(timeline,age);p.coins=50000;p.gems=10000;p.baseLevel=10;
 const g=new Game(p);const phases=new Set<string>();let rejected=0,maxUnits=0;const start=performance.now();
 try{
  for(let i=0;i<2500;i++){
   const kind=Math.floor(random()*3) as UnitKind,skill=(['freeze','meteor','food'] as Skill[])[Math.floor(random()*3)];
   const actions:Action[]=[{type:'start'},{type:'spawn',kind},{type:'spawn',kind},{type:'skill',skill},{type:'rally'},{type:'pause'},{type:'upgrade',stat:random()<.5?'food':'base'},{type:'unlock',kind},{type:'retry'},{type:'retreat'},{type:'next'},{type:'evolve'},{type:'select-battle',battle:Math.floor(random()*6)},{type:'summon',count:1},{type:'daily',day:20000+Math.floor(random()*4)},{type:'chronicle-route',route:'road',battle:g.profile.enemyAge}];
   const a=actions[Math.floor(random()*actions.length)],before=JSON.stringify([g.profile,g.state,g.events]);
   const accepted=g.dispatch(a);totalActions++;
   if(!accepted){rejections++;rejected++;assert.equal(JSON.stringify([g.profile,g.state,g.events]),before,'rejected action mutated state');}
   for(let n=0;n<4;n++){g.step([1/60,1/30,.1,.25][Math.floor(random()*4)]);totalSteps++;}
   assert.ok(finite(g.state)&&finite(g.profile),'nonfinite state');
   assert.ok(g.state.food>=-1e-8&&g.state.food<=99);
   assert.ok(g.profile.coins>=0&&g.profile.coins<=1e9&&g.profile.gems>=0&&g.profile.gems<=1e7);
   assert.equal(new Set(g.state.units.map(u=>u.id)).size,g.state.units.length);
   assert.equal(new Set(g.state.skillsUsed).size,g.state.skillsUsed.length);
   maxUnits=Math.max(maxUnits,g.state.units.length);phases.add(g.state.phase);g.drainEvents();
   if(i%25===0){
    const decoded=decodeSave(JSON.stringify(g.profile));assert.ok(decoded.profile);assert.equal(decoded.problem,null);
    const copy=new Game(decoded.profile!);assert.equal(copy.profile.coins,g.profile.coins);assert.equal(copy.profile.gems,g.profile.gems);assert.equal(copy.profile.wins,g.profile.wins);roundtrips++;
   }
  }
  cases.push({age,timeline,seedInitial:(0x9137+age*97+timeline)>>>0,status:'passed',actions:2500,steps:10000,rejected,maxUnits,phases:[...phases],durationMs:performance.now()-start});
 }catch(error){failed++;cases.push({age,timeline,status:'failed',error:String(error)});}
}
const report={scope:'Deterministic mixed valid/rejected input; no live rendering or real-time soak claim',cases,totalActions,totalSteps,roundtrips,rejections,failed};
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,cases:cases.length}));if(failed)process.exitCode=1;
