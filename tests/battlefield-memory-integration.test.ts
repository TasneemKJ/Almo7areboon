import test from 'node:test';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';

const source=()=>battlefieldSource();

test('resolved heavy unit hits carry one truthful mark to the real visual impact',()=>{
 const code=source();
 assert.match(code,/battlefieldMemoryIntentForHit\(e\)/);
 assert.match(code,/memory\?:BattlefieldMemoryInput/);
 assert.match(code,/memory:intent\?\?undefined/);
 assert.match(code,/marks\.remember\(bolt\.memory\)/);
 assert.match(code,/else\{this\.effects\.impact\([^;]+;if\(intent\)this\.marks\.remember\(intent\);\}/);
});

test('accepted Meteor lands only on real current enemy views and survives reduced motion',()=>{
 const code=source();
 assert.match(code,/type TroopView=\{[^}]*lane:number/);
 assert.match(code,/view\.lane=unit\.lane/);
 assert.match(code,/const targets=\[\.\.\.this\.army\.units\.values\(\)\]\.filter\(v=>v\.side==='enemy'\)\.slice\(0,6\)/);
 assert.match(code,/kind:'meteor',x:v\.x,lane:v\.lane,side:'player'/);
 assert.match(code,/if\(this\.reduce\)\{[^}]*for\(const v of targets\)\{this\.effects\.meteorLanding\(v\.x,v\.y-15\);this\.marks\.remember\(\{kind:'meteor',x:v\.x,lane:v\.lane,side:'player'\}\);\}return;/);
 assert.match(code,/memory:targets\.length\?memory:undefined/,'the no-target fallback meteor must not leave a false scar');
});

test('accepted impact events are adapted before hidden presentation returns',()=>{
 const code=source(),adapt=code.indexOf('for(const event of events)this.event(event)'),hidden=code.indexOf("if(options.isVisible&&!options.isVisible())"),clock=code.indexOf('if(!game.state.paused&&!this.reduce)this.clock+=dt');
 assert.ok(adapt>=0&&hidden>adapt,'hidden ownership may freeze painting and aging only after accepted events become presentation state');
 assert.ok(clock>hidden,'hidden ownership must still freeze the presentation clock');
});

test('memory reuses the existing ambience plane behind actors without burying combat cues',()=>{
 const code=source();
 assert.match(code,/let memory:readonly BattlefieldMemoryMark\[\]=\[\]/);
 assert.match(code,/battlefieldMemoryFrame\(mark,host\.reduce\(\)\)/);
 assert.match(code,/layer=host\.ambience\(\)/,'road scars belong on the existing actor-underlay, not the source-cue lane pool');
 assert.match(code,/drawAttackCues[\s\S]+groundEffectLayer\(groundFx,fx,cue\.lane\)/,'actor-attached combat cues retain their lane depth');
 assert.match(code,/battlefieldMemoryRegionClearOf\(region,hudBounds\)/,'HUD-covered scars must not paint');
 assert.match(code,/measureHud\(\)/);
 const draw=code.slice(code.indexOf('const drawMemory='),code.indexOf('const drawSpoils='));
 assert.ok(draw.indexOf('if(!battlefieldMemoryNeedsHudMeasurement(memory))')>=0,'empty memory must leave before DOM measurement');
 assert.ok(draw.indexOf('if(!battlefieldMemoryNeedsHudMeasurement(memory))')<draw.indexOf('host.measureHud()'),'HUD geometry refresh is allowed only after visible memory is confirmed');
 assert.match(code,/ages:/);
 assert.match(code,/alphas:/);
 assert.match(code,/memory=stepBattlefieldMemory\(memory,dt,host\.paused\(\)\)/);
 assert.match(code,/dataset\.battlefieldMemory=JSON\.stringify/);
 assert.match(code,/delete host\.canvas\(\)\.dataset\.battlefieldMemory/);
 assert.match(code,/memory=battlefieldMemoryAfterReset\(memory,reason,pending\)/,'motion reset must commit accepted in-flight impact memory before clearing bolts');
 assert.match(code,/dataset\.battlefieldMemoryPending=JSON\.stringify\(pending\)/,'native evidence must expose the real in-flight interval');
 assert.match(code,/dataset\.battlefieldEnemyViews=String/,'native evidence must wait for a truthful current Meteor target');
 assert.match(code,/if\(reduced&&!this\.reduce\)this\.effects\.reset\('motion'\)/,'entering reduced motion must preserve active road memory');
 const allocations=code.match(/(?:this|host\.scene|scene)\.add\.graphics\(\)/g)??[];
 assert.equal(allocations.length,13,'twelve established planes plus one fixed camp-prop plane; no per-frame graphics allocation');
 assert.match(code,/this\.campProps=this\.add\.graphics\(\)/);
});
