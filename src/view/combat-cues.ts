import type {GameEvent} from '../game/types.ts';
export type CombatCueId='story-rally'|'story-bell'|'story-shatter'|'story-protect'|'story-cover'|'story-breach'|'story-landmark'|'story-rescue'|'deploy'|'hit-neutral'|'hit-blunt'|'hit-flick'|'hit-hollow'|'base-player'|'base-enemy'|'coin'|'freeze'|'meteor'|'food'|'upgrade'|'evolve'|'win'|'lose'|'death'|'summon';
export type CueCooldown='deployment'|'unit-hit'|'base-hit'|'coin'|'death';
export interface CombatCue {
 readonly id:CombatCueId;readonly eventIndex:number;readonly priority:number;
 readonly critical:boolean;readonly cooldown:CueCooldown|null;
}
function storyAccent(storyCue:GameEvent['storyCue']):CombatCueId|undefined {
 switch(storyCue){
  case 'rally':return 'story-rally';case 'bell-warning':case 'bell-ring':return 'story-bell';
  case 'bell-stilled':case 'captain':return 'story-protect';case 'shatter':return 'story-shatter';
  case 'covered':return 'story-cover';case 'breach':return 'story-breach';
  case 'landmark':return 'story-landmark';case 'rescued':return 'story-rescue';default:return undefined;
 }
}
/** Pure presentation selection: fixed retained categories, no copied batch/history. */
export function selectCombatCues(events:readonly GameEvent[]):readonly CombatCue[] {
 const skills:CombatCue[]=[],other=new Map<CombatCueId,CombatCue>();let hit:CombatCue|undefined,replacesImpact=false;
 for(let index=0;index<events.length;index++){
  const event=events[index];if(!event||typeof event!=='object')continue;
  let id:CombatCueId,priority=1,critical=false,cooldown:CueCooldown|null=null;
  if(event.type==='win'||event.type==='lose')return [{id:event.type,eventIndex:index,priority:7,critical:true,cooldown:null}];
  if(event.storyCue){
   const accent=storyAccent(event.storyCue);
   const semanticImpact=event.storyCue==='shatter'||event.storyCue==='covered'||event.storyCue==='breach';
   if(accent){if(semanticImpact)replacesImpact=true;if(!other.has(accent))other.set(accent,{id:accent,eventIndex:index,priority:event.storyCue==='bell-warning'?6:4,critical:event.storyCue==='bell-warning',cooldown:semanticImpact?'unit-hit':null});}
   if((event.amount??0)<=0)continue;
  }
  switch(event.type){
   case 'skill':if(event.skill!=='freeze'&&event.skill!=='meteor'&&event.skill!=='food')continue;
    if(skills.length<3)skills.push({id:event.skill,eventIndex:index,priority:6,critical:true,cooldown:null});continue;
   case 'hit':
    if(event.target!==undefined&&event.target!=='unit'&&event.target!=='base')continue;
    if(event.target==='base'&&(event.side==='player'||event.side==='enemy')){
     id=event.side==='enemy'?'base-player':'base-enemy';priority=event.side==='enemy'?5:4;critical=event.side==='enemy';cooldown='base-hit';
    }else{
     // Missing/invalid base side cannot identify whose structure was damaged.
     id=event.target==='base'?'hit-neutral':event.source?.kind===0?'hit-blunt':event.source?.kind===1?'hit-flick':event.source?.kind===2?'hit-hollow':'hit-neutral';
     priority=3;cooldown='unit-hit';
    }
    if(!hit||priority>hit.priority)hit={id,eventIndex:index,priority,critical,cooldown};continue;
   case 'spawn':if(event.side!=='player')continue;id='deploy';priority=2;cooldown='deployment';break;
   case 'coin':id='coin';cooldown='coin';break;
   case 'death':id='death';priority=0;cooldown='death';break;
   case 'upgrade':id=Array.isArray(event.cardIndices)&&event.cardIndices.length>0&&event.cardIndices.length<=50&&event.cardIndices.every(index=>Number.isInteger(index)&&index>=0)?'summon':'upgrade';break;
   case 'evolve':id=event.type;break;
   default:continue;
  }
  if(!other.has(id))other.set(id,{id,eventIndex:index,priority,critical,cooldown});
 }
 const candidates=[...skills,...other.values()];if(hit&&!replacesImpact)candidates.push(hit);
 return candidates.sort((a,b)=>b.priority-a.priority||a.eventIndex-b.eventIndex).slice(0,3);
}
