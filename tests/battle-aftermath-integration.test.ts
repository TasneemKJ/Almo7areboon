import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import { battlefieldSource } from './helpers/battlefield-source.ts';
import assert from 'node:assert/strict';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';

const battlefield=()=>battlefieldSource();

test('only a fresh authoritative terminal event owns an aftermath tableau',()=>{
 const won=new Game(defaultProfile());assert.equal(won.dispatch({type:'start'}),true);won.drainEvents();won.state.enemyHp=0;won.step(1/60);
 assert.deepEqual(won.drainEvents().filter(event=>event.type==='win'||event.type==='lose').map(event=>event.type),['win']);
 const restored=new Game(won.profile);assert.equal(restored.state.phase,'won');assert.deepEqual(restored.drainEvents(),[],'restoring a result must not replay its old terminal event');

 const lost=new Game(defaultProfile());assert.equal(lost.dispatch({type:'start'}),true);lost.drainEvents();lost.state.playerHp=0;lost.step(1/60);
 assert.deepEqual(lost.drainEvents().filter(event=>event.type==='win'||event.type==='lose').map(event=>event.type),['lose']);
});

test('renderer observes terminal events and transforms its existing actor pool',()=>{
 const source=battlefield();
 assert.match(source,/import \{battleAftermathPose\} from '\.\/battle-aftermath\.ts';/);
 assert.match(source,/private aftermath:\{phase:'won'\|'lost';at:number\}\|null=null;/);
 assert.match(source,/if\(e\.type==='win'\|\|e\.type==='lose'\)this\.aftermath=\{phase:e\.type==='win'\?'won':'lost',at:this\.clock\};/);
 assert.match(source,/battleAftermathPose\(\{phase:aftermath\.phase,side:unit\.side,kind:unit\.kind,elapsed:aftermathElapsed,reduced:host\.reduce\(\)\}\)/);
 const actorBlock=source.slice(source.indexOf('for(const unit of host.game.state.units)'),source.indexOf('for(const [id,view]of units)'));
 assert.match(actorBlock,/poseTroop\(view\.body,frame\)/);assert.match(source,/body\.setPosition/);assert.match(source,/body\.setScale/);
 assert.doesNotMatch(actorBlock,/this\.add\.(image|graphics|sprite|text)/,'aftermath must reuse current actors instead of allocating per unit');
 assert.match(source,/else\{\s*body\.setPosition[\s\S]*setScale\(facingDirection\*perspective\.scale/,'vector fallback must receive the same facing and bounded transform');
 assert.match(actorBlock,/const recoil=verdict\?stillReaction:hitReaction/,'terminal verdict bounds must not compose with a stale hit recoil');
 assert.match(source,/drawTroop\([\s\S]*verdict\?verdict\.mode==='triumph':unit\.attacking/,'a withdrawing vector survivor must not retain its terminal attack posture');
});

test('diagnostics are bounded and every reset or shutdown clears stale aftermath state',()=>{
 const source=battlefield();
 assert.match(source,/dataset\.battleAftermath=JSON\.stringify\(\{phase:aftermath\.phase,elapsed:aftermathElapsed,triumph:aftermathCounts\.triumph,withdraw:aftermathCounts\.withdraw,roles:aftermathCounts\.roles,maxForward:aftermathCounts\.maxForward,maxLift:aftermathCounts\.maxLift,maxAngle:aftermathCounts\.maxAngle,reduced:host\.reduce\(\)\}\)/);
 assert.match(source,/delete this\.game\.canvas\.dataset\.battleAftermath/);
 assert.match(source,/this\.aftermath=null/);
 assert.match(source,/if\(this\.lastState!==game\.state\)[\s\S]*this\.aftermath=null/,'state replacement must clear a previous battle');
 assert.match(source,/host\.game\.state\.phase==='ready'\|\|host\.game\.state\.phase==='running'/,'nonterminal phases must clear a prior tableau');
});

test('pause, hidden ownership and reduced motion cannot advance an independent aftermath clock',()=>{
 const source=battlefield(),visibility=source.indexOf("if(options.isVisible&&!options.isVisible())"),clock=source.indexOf("if(!game.state.paused&&!this.reduce)this.clock+=dt");
 assert.ok(visibility>=0&&clock>visibility,'visibility must gate the presentation clock before it advances');
 assert.match(source,/aftermathElapsed=aftermath\?Math\.max\(0,host\.clock\(\)-aftermath\.at\):0/);
 assert.doesNotMatch(source,/setTimeout\([^)]*aftermath|requestAnimationFrame\([^)]*aftermath/);
});

test('result timing and model ownership remain unchanged',()=>{
 const main=mainSource(),source=battlefield();
 assert.match(main,/resultDue=now\+\(document\.documentElement\.dataset\.motion==='reduced'\?350:1300\)/);
 assert.match(main,/const reviewHoldingResult=globalThis\.navigator\?\.webdriver&&document\.querySelector\('canvas'\)\?\.dataset\.battlefieldReviewFrameReady===s\.phase;/,'only phase-matched native browser evidence may hold a due result sheet, while non-browser model tests remain inert');
 assert.match(main,/state\.resultShown!==s\.phase&&now>=state\.resultDue&&!reviewHoldingResult/,'the evidence latch must not alter the production deadline or terminal ownership');
 assert.doesNotMatch(source,/\.dispatch\(/);assert.doesNotMatch(source,/profile\.[A-Za-z_$][\w$]*\s*=/);
});

test('native evidence uses Phaser post-render readback only under browser automation',()=>{
 const source=battlefield();
 assert.match(source,/if\(navigator\.webdriver\)/);
 assert.match(source,/Object\.defineProperty\(renderer\.canvas,'battlefieldReviewArm'/);
 assert.match(source,/Object\.defineProperty\(renderer\.canvas,'battlefieldReviewSnapshot'/);
 assert.match(source,/state\.phase!==expected/,'the pre-armed hook must wait for the requested authoritative terminal frame');
 assert.match(source,/villageVerdict\.progress!==1/,'the hook must capture the first complete village response');
 assert.match(source,/cameras\.main\.flashEffect\.isRunning/,'the evidence frame must wait until the terminal victory flash no longer obscures the village');
 assert.doesNotMatch(source,/state\.elapsed<\.\d+/,'the hook must not race the wall-clock result sheet through a clamped presentation threshold');
 assert.match(source,/renderer\.renderer\.once\(Phaser\.Renderer\.Events\.POST_RENDER/);
 assert.match(source,/renderer\.canvas\.dataset\.battlefieldReviewFrameReady=expected;\s*renderer\.renderer\.snapshot\(/,'the native full-stage capture must be released at the clear post-render boundary before PNG encoding');
 assert.match(source,/renderer\.renderer\.snapshot\(/);
});
