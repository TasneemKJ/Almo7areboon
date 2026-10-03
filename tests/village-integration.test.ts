import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {visualAssets} from '../src/view/visual-assets.ts';
import * as mood from '../src/view/village-mood.ts';
import * as life from '../src/view/village-life.ts';
const presentation=()=>{assert.ok('advanceVillagePresentation' in mood,'production ownership seam is missing');return (mood as any).advanceVillagePresentation;};
const viewport={placement:{x:0,y:0,scale:1},cssWorldScale:1,visibleSource:[0,0,900,1000] as const,hudSourceBounds:[]};
const unit=(side:'player'|'enemy',x:number,hp:number)=>({id:1,side,x,hp,maxHp:100,lane:0,kind:0 as const,age:0,attackTimer:0,attacking:false,hitFlash:0});

// Catches dead/friendly pressure, simulation mutation and game-speed-scaled atmosphere time.
test('presentation uses living enemies and real elapsed time without changing gameplay or profile',()=>{const advance=presentation(),g=new Game(defaultProfile());g.dispatch({type:'start'});g.state.units=[unit('enemy',200,0),unit('player',100,100)];g.profile.speed=2;const before=structuredClone({state:g.state,profile:g.profile});let owner:any=null;for(let i=0;i<20;i++)owner=advance(owner,g.state,g.profile.age,.05,[],false);assert.equal(owner.mood.mood,'quiet');assert.ok(Math.abs(owner.mood.time-1)<1e-9);assert.deepEqual({state:g.state,profile:g.profile},before);g.state.units.push(unit('enemy',300,100));for(let i=0;i<12;i++)owner=advance(owner,g.state,0,.05,[],false);assert.equal(owner.mood.mood,'alarmed');});
test('paused and hidden owners freeze, but retry/import/chapter identity reset immediately',()=>{const advance=presentation(),g=new Game(defaultProfile());g.dispatch({type:'start'});let owner=advance(null,g.state,0,0,[{type:'hit',target:'base',side:'enemy'}],false);assert.equal(owner.mood.mood,'alarmed');const frozen=structuredClone(owner.mood);g.state.paused=true;owner=advance(owner,g.state,0,.05,[],false);assert.deepEqual(owner.mood,frozen);g.state.paused=false;owner=advance(owner,g.state,0,.05,[],true);assert.deepEqual(owner.mood,frozen);g.state.phase='lost';g.dispatch({type:'retry'});g.state.paused=true;owner=advance(owner,g.state,0,.05,[],true);assert.equal(owner.mood.mood,'quiet');assert.equal(owner.mood.time,0);const imported=new Game(defaultProfile());owner=advance(owner,imported.state,0,0,[],true);assert.equal(owner.battle,imported.state);assert.equal(owner.mood.alarmSerial,0);owner=advance(owner,imported.state,1,0,[],true);assert.equal(owner.age,1);assert.equal(owner.mood.time,0);});
test('fresh player-base hits survive a hit plus result batch, enemy-base hits do not alarm',()=>{const advance=presentation(),g=new Game(defaultProfile());g.dispatch({type:'start'});let owner=advance(null,g.state,0,.05,[],false);owner=advance(owner,g.state,0,0,[{type:'hit',target:'base',side:'player'}],false);assert.equal(owner.mood.mood,'quiet');g.state.phase='lost';owner=advance(owner,g.state,0,0,[{type:'hit',target:'base',side:'enemy'},{type:'lose'}],false);assert.equal(owner.mood.mood,'alarmed');assert.equal(owner.mood.alarmSerial,1);const frame=life.villageFrame({age:0,time:owner.mood.time,reduced:false,mood:owner.mood,viewport});owner=advance(owner,g.state,0,.05,[],false);assert.deepEqual(life.villageFrame({age:0,time:owner.mood.time,reduced:false,mood:owner.mood,viewport}),frame);});
test('one shared 64 by 64 light allocation keeps the manifest below the decoded budget',()=>{assert.ok('ensureVillageLight' in life,'production light resource seam is missing');const textures=new Map<string,any>();const creations:any[]=[];const manager={exists:(key:string)=>textures.has(key),createCanvas:(key:string,width:number,height:number)=>{creations.push({key,width,height});const context={createRadialGradient:()=>({addColorStop:()=>{}}),fillStyle:null,fillRect:()=>{}};const texture={getContext:()=>context,refresh:()=>{}};textures.set(key,texture);return texture;}};for(let i=0;i<180*60;i++)(life as any).ensureVillageLight(manager);assert.deepEqual(creations,[{key:'village-light',width:64,height:64}]);assert.equal(textures.has('soft-light'),false);const bytes=visualAssets().reduce((sum,a)=>sum+a.width*a.height*4,0)+64*64*4;assert.equal(bytes,41_989_912);assert.ok(bytes<42_000_000);});
test('180 seconds of village rendering retains bounded marks and cached sky geometry',()=>{const advance=presentation(),g=new Game(defaultProfile());const path=life.villageSkyPath(2,viewport);let owner:any=null;for(let i=0;i<180*20;i++){owner=advance(owner,g.state,2,.05,[],false);const frame=life.villageFrame({age:2,time:owner.mood.time,reduced:false,restoration:7,mood:owner.mood,viewport:{...viewport,skyPath:path} as any});assert.ok(frame.residents.length<=2&&frame.lamps.length<=4&&frame.restorationLights.length<=2&&frame.water.length<=3);assert.ok(frame.residents.reduce((sum,r)=>sum+r.panes.length,0)<=90);assert.ok((frame.bird?.length??0)<=9);}assert.equal(g.state.time,0);});
test('battlefield owns restored life through one saved mask and a fixed six-light pool',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 const layeringReview=readFileSync(new URL('../scripts/capture-layering-review.mjs',import.meta.url),'utf8');
 assert.match(source,/restoration:game\.profile\.chronicle\?\.restoration\?\?0/);
 assert.match(source,/while\(this\.stageLight\.length<6\)/);
 assert.match(source,/const lights=\[\.\.\.frame\.lamps,\.\.\.frame\.restorationLights\]/);
 assert.match(source,/mark=lights\[i\]/);
 assert.match(layeringReview,/v\.pools,\{lights:6,stars:0,clouds:0,mist:0\}/);
});
test('battlefield derives the village verdict from authoritative aftermath without a new timing owner',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/import \{villageVerdictFrame\} from '\.\/village-verdict\.ts';/);
 assert.match(source,/const villageVerdict=this\.aftermath\?\.phase===game\.state\.phase\?villageVerdictFrame\(\{phase:this\.aftermath\.phase,elapsed:Math\.max\(0,this\.clock-this\.aftermath\.at\),reduced:this\.reduce\}\):null;/);
 assert.match(source,/villageFrame\(\{[^}]*verdict:villageVerdict/s);
 assert.doesNotMatch(source,/setTimeout\([^)]*villageVerdict|Date\.now\(\)[^;]*villageVerdict/);
});
test('verdict response reuses ambience and light pools, exposes webdriver evidence, and clears with the battle',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/for\(const stroke of frame\.verdictStrokes\)\{g\.lineStyle\(stroke\.width,stroke\.color,stroke\.alpha\);g\.lineBetween\(stroke\.from\.x,stroke\.from\.y,stroke\.to\.x,stroke\.to\.y\);\}/);
 assert.match(source,/const verdictRegions=/);
 assert.match(source,/frame\.verdictResidents\.flatMap/,'webdriver geometry must include verdict-created witnesses without claiming ordinary HUD-preserved residents');
 assert.match(source,/frame\.verdictLights\.map/,'webdriver geometry must include every halo whose verdict brightness actually changed');
 assert.match(source,/if\(navigator\.webdriver&&villageVerdict\)this\.game\.canvas\.dataset\.villageVerdict=JSON\.stringify\(\{mode:villageVerdict\.mode,progress:villageVerdict\.progress,witnesses:frame\.verdictResidents\.length,strokes:frame\.verdictStrokes\.length,lights:lights\.length,affectedLights:frame\.verdictLights\.length,regions:verdictRegions,reduced:this\.reduce,paused:game\.state\.paused\}\)/);
 assert.match(source,/delete this\.game\.canvas\.dataset\.villageVerdict/);
 assert.match(source,/while\(this\.stageLight\.length<6\)/);
 assert.doesNotMatch(source,/villageVerdict[^\n]*this\.add\.(?:graphics|image|container)/);
});
test('one authoritative wave frame drives both the road omen and pooled village watchfire',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/import \{waveArrivalForPort,type WaveArrivalFrame\} from '\.\/wave-arrival\.ts';/);
 assert.match(source,/private waveArrival:WaveArrivalFrame\|null=null;/);
 assert.equal(source.match(/waveArrivalForPort\(game,this\.reduce\)/g)?.length,1,'one read boundary must own the complete rendered frame');
 assert.match(source,/this\.waveArrival=waveArrivalForPort\(game,this\.reduce\);\s*this\.drawAtmosphere\(\)/);
 assert.match(source,/const frame=this\.waveArrival;if\(!frame\)return;/);
 assert.match(source,/villageFrame\(\{[^}]*watch:this\.waveArrival/s);
 assert.doesNotMatch(source,/setTimeout\([^)]*watchfire|Date\.now\(\)[^;]*watchfire/i);
});
test('watchfire reuses village ambience and light pools with bounded webdriver evidence and cleanup',()=>{
 const source=readFileSync(new URL('../src/view/battlefield.ts',import.meta.url),'utf8');
 assert.match(source,/for\(const stroke of frame\.watchStrokes\)\{g\.lineStyle\(stroke\.width,stroke\.color,stroke\.alpha\);g\.lineBetween\(stroke\.from\.x,stroke\.from\.y,stroke\.to\.x,stroke\.to\.y\);\}/);
 assert.match(source,/const watchfireRegions=/);
 assert.match(source,/frame\.watchStrokes\.map/);assert.match(source,/frame\.watchLights\.map/);
 assert.match(source,/dataset\.villageWatchfire=JSON\.stringify\(\{intent:this\.waveArrival\.intent,progress:this\.waveArrival\.progress,lights:frame\.watchLights\.length,strokes:frame\.watchStrokes\.length,regions:watchfireRegions,reduced:this\.reduce,paused:game\.state\.paused\}\)/);
 assert.match(source,/delete this\.game\.canvas\.dataset\.villageWatchfire/);
 assert.match(source,/battlefieldReviewCanvasSnapshot/,'native watchfire evidence must use Phaser post-render pixels rather than a DOM screenshot clip');
 assert.match(source,/while\(this\.stageLight\.length<6\)/);
 assert.doesNotMatch(source,/watch(?:fire|Strokes|Lights)[^\n]*this\.add\.(?:graphics|image|container)/i);
});
test('chronicle renderer no longer paints abstract restoration bars beside the player base',()=>{
 const source=readFileSync(new URL('../src/view/chronicle-view.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/restoration.*\n\s*for\(let i=0;i<3;i\)/);
 assert.doesNotMatch(source,/fillRoundedRect\(24\+i\*9,groundY-19,4,6,1\)/);
});
