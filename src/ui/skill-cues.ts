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
 if(skill==='meteor')return {badge:used?'✓':String(targets),label:used?'Meteor strike · used this battle':`Meteor strike · ${targetText}; damages every living enemy${suffix}`,opportunity:active&&available&&!used&&targets>=3,activeEffect:false};
 return {badge:used?'✓':'+10',label:used?'Food Drop · used this battle':state.food>=99?'Food Drop · food storage full':`Food Drop · gain up to 10 food${suffix}`,opportunity:false,activeEffect:false};
}
