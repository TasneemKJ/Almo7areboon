import type {BattleState,Profile} from '../game/types.ts';
import {chapterPresentation} from './chapter-presentation.ts';
import {harvestMoon} from '../game/finale.ts';

/** A storybook stamp across the sky for the few moments that shape a battle (presentation only). */
export interface HeraldLine{readonly key:string;readonly title:string;readonly detail:string}
export const HERALD_SECONDS=2.6;

/** Battle moments the herald may announce, in priority order. Each key is announced at most once per battle. */
export function heraldMoments(p:Readonly<Profile>,s:Readonly<BattleState>):HeraldLine[]{
 if(s.phase!=='running')return [];
 const lines:HeraldLine[]=[];
 if(s.time<1.5)lines.push({key:'title',title:chapterPresentation(p.enemyAge).title,detail:`Chapter ${p.enemyAge+1} · ${s.totalWaves} waves`});
 if(s.totalWaves>0&&s.wave>=s.totalWaves)lines.push({key:'last-wave',title:'The last wave comes',detail:'Hold the line'});
 if(harvestMoon(s))lines.push({key:'harvest-moon',title:'Harvest Moon',detail:'Food gathers twice as fast'});
 return lines;
}

/** One herald at a time: unseen moments queue, each shows for HERALD_SECONDS of battle time with a gap between. */
export function createHerald(moments=heraldMoments){
 let battle:object|null=null,seen=new Set<string>(),queue:HeraldLine[]=[],current:HeraldLine|null=null,since=0;
 return {next(p:Readonly<Profile>,s:Readonly<BattleState>):HeraldLine|null{
  if(battle!==s){battle=s;seen=new Set();queue=[];current=null;}
  for(const line of moments(p,s))if(!seen.has(line.key)){seen.add(line.key);queue.push(line);}
  if(s.phase!=='running')return current=null;
  if(current&&s.time-since>=HERALD_SECONDS)return current=null;
  if(!current&&queue.length){current=queue.shift()!;since=s.time;}
  return current;
 }};
}
