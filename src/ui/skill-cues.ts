import { CAPTAINS } from '../game/chronicle.ts';
import { legacyEffects } from '../game/prestige.ts';
import type { BattleState,Profile,Skill } from '../game/types.ts';

export interface SkillCue { readonly badge:string; readonly label:string; readonly opportunity:boolean; readonly activeEffect:boolean; }

/** Presentation only. The caller retains authoritative canUseSkill availability. */
export function skillCue(profile:Readonly<Profile>,state:Readonly<BattleState>,skill:Skill,available:boolean):SkillCue {
 const used=state.skillsUsed.includes(skill),running=state.phase==='running',active=running&&!state.paused;
 const targets=state.units.filter(unit=>unit.side==='enemy'&&unit.hp>0).length;
 const targetText=`${targets} living ${targets===1?'enemy':'enemies'}`;
 const suffix=state.phase==='won'||state.phase==='lost'?' · battle complete':state.paused?' · battle paused':!running?' · start a battle to use skills':'';
 if(skill==='freeze'){
  const duration=legacyEffects(profile.legacy).freezeSeconds;
  const remaining=running&&used?Math.max(0,state.freezeUntil-state.time):0;
  if(remaining>1e-9)return {badge:`${Math.ceil(remaining-1e-9)}s`,label:`Freeze active: ${Math.ceil(remaining-1e-9)} battle seconds remain${state.paused?' · battle paused':''}`,opportunity:false,activeEffect:true};
  return {badge:used?'✓':String(targets),label:`Freeze enemies for ${duration} seconds${used?' · used this battle':` · ${targetText}; starts immediately${suffix}`}`,opportunity:active&&available&&!used&&targets>=3,activeEffect:false};
 }
 if(skill==='meteor'){
  const cover=state.chronicle?.enabled&&state.chronicle.landmark.kind==='cover'&&!state.chronicle.landmark.broken;
  const coverOnly=targets===0&&cover;
  return {badge:used?'✓':coverOnly?'COVER':String(targets),label:used?'Meteor strike · used this battle':coverOnly?`Meteor strike · breaks the road shelter${suffix}`:`Meteor strike · ${targetText}; damages every living enemy${cover?'; breaks road shelter':''}${suffix}`,opportunity:active&&available&&!used&&(targets>=3||!!coverOnly),activeEffect:false};
 }
 const captain=profile.chronicle?.enabled&&profile.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===profile.chronicle!.captain):undefined;
 if(captain){
  const remaining=running&&used?Math.max(0,((captain.id==='gatekeeper'?state.chronicle?.shieldUntil:state.chronicle?.revealUntil)??0)-state.time):0;
  return {badge:used?'✓':captain.id==='gatekeeper'?'GUARD':'LIGHT',label:`${captain.skill}${used?' · used this battle':` · ${captain.description.replace(/^Replace Food Drop: /,'')}${suffix}`}`,opportunity:active&&available&&!used&&targets>=3,activeEffect:remaining>0};
 }
 const full=state.food>=99,limited=state.food>89;
 return {badge:used?'✓':full?'FULL':limited?'CAP':'+10',label:used?'Food Drop · used this battle':full?'Food Drop · food storage full at 99 food':`Food Drop · ${limited?'storage almost full; ':''}gain up to 10 food, limited to 99 food${suffix}`,opportunity:false,activeEffect:false};
}
