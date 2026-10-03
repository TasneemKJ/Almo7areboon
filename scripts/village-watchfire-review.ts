import assert from 'node:assert/strict';
import type {WaveIntent} from '../src/game/encounters.ts';

export interface WatchfireReviewRegion {left:number;top:number;right:number;bottom:number}
export interface WatchfireReviewSnapshot {
 intent:WaveIntent;progress:number;lights:number;strokes:number;regions:readonly WatchfireReviewRegion[];
 reduced:boolean;paused:boolean;
}

export function validateWatchfireSnapshot(value:unknown,expected:WaveIntent):WatchfireReviewSnapshot {
 assert.ok(value&&typeof value==='object'&&!Array.isArray(value));const state=value as Record<string,unknown>;
 assert.equal(state.intent,expected);assert.ok(typeof state.progress==='number'&&Number.isFinite(state.progress)&&state.progress>=0&&state.progress<=1);
 assert.ok(typeof state.lights==='number'&&Number.isInteger(state.lights)&&state.lights>=1&&state.lights<=4);
 assert.equal(state.strokes,(state.lights as number)*3);assert.ok(Array.isArray(state.regions)&&state.regions.length===(state.lights as number)+(state.strokes as number));
 for(const region of state.regions as unknown[]){
  assert.ok(region&&typeof region==='object'&&!Array.isArray(region));const bounds=region as Record<string,unknown>;
  for(const key of ['left','top','right','bottom'])assert.ok(typeof bounds[key]==='number'&&Number.isFinite(bounds[key] as number));
  assert.ok((bounds.left as number)>=0&&(bounds.top as number)>=0&&(bounds.left as number)<(bounds.right as number)&&(bounds.top as number)<(bounds.bottom as number));
  assert.ok((bounds.right as number)<=450&&(bounds.bottom as number)<=500);
 }
 assert.equal(typeof state.reduced,'boolean');assert.equal(typeof state.paused,'boolean');return value as WatchfireReviewSnapshot;
}

export function assertWatchfirePaused(before:WatchfireReviewSnapshot,after:WatchfireReviewSnapshot):void {
 assert.equal(before.paused,false);assert.deepEqual(after,{...before,paused:true});
}
