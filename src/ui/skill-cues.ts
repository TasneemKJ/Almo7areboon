import { CAPTAINS } from '../game/chronicle.ts';
import { legacyEffects } from '../game/prestige.ts';
import type { BattleState,Profile,Skill } from '../game/types.ts';
import { captainSkill,counted,GUIDE,secondsLong,secondsShort } from './battle-hud.ts';
import { tr } from './i18n.ts';

export interface SkillCue { readonly badge:string; readonly label:string; readonly opportunity:boolean; readonly activeEffect:boolean; }

/** Presentation only. The caller retains authoritative canUseSkill availability. Labels keep " · " between the
 * skill name and its detail in both languages (the field reads the name before it). */
export function skillCue(profile:Readonly<Profile>,state:Readonly<BattleState>,skill:Skill,available:boolean):SkillCue {
 const used=state.skillsUsed.includes(skill),running=state.phase==='running',active=running&&!state.paused;
 const targets=state.units.filter(unit=>unit.side==='enemy'&&unit.hp>0).length;
 const targetText=tr(`${targets} living ${targets===1?'enemy':'enemies'}`,targets===0?'لا أعداء أحياء':counted(targets,['enemy','enemies'],['عدوّ واحد حيّ','عدوّان حيّان','أعداء أحياء','عدوّاً حيّاً']));
 const paused=tr(' · battle paused',' · المعركة متوقّفة');
 const suffix=state.phase==='won'||state.phase==='lost'?tr(' · battle complete',' · انتهت المعركة'):state.paused?paused:!running?tr(' · start a battle to use skills',' · ابدأ معركة لتستعمل المهارات'):'';
 if(skill==='freeze'){
  const duration=legacyEffects(profile.legacy).freezeSeconds;
  const remaining=running&&used?Math.max(0,state.freezeUntil-state.time):0;
  if(remaining>1e-9){const left=Math.ceil(remaining-1e-9);return {badge:secondsShort(left),label:`${tr(`Freeze active: ${left} battle seconds remain`,`التجميد فعّال: بقي ${secondsLong(left,String,true)} من وقت المعركة`)}${state.paused?paused:''}`,opportunity:false,activeEffect:true};}
  return {badge:used?'✓':String(targets),label:`${tr(`Freeze enemies for ${duration} seconds`,`جمّد الأعداء ${secondsLong(duration)}`)}${used?tr(' · used this battle',' · استُعمل في هذه المعركة'):` · ${targetText}${tr('; starts immediately','؛ يبدأ فوراً')}${suffix}`}`,opportunity:active&&available&&!used&&targets>=3,activeEffect:false};
 }
 if(skill==='meteor'){
  const cover=state.chronicle?.enabled&&state.chronicle.landmark.kind==='cover'&&!state.chronicle.landmark.broken;
  const coverOnly=targets===0&&cover;
  const name=tr('Meteor strike','ضربة النيزك');
  return {badge:used?'✓':coverOnly?tr('COVER','ملجأ'):String(targets),label:used?`${name}${tr(' · used this battle',' · استُعملت في هذه المعركة')}`:coverOnly?`${name}${tr(' · breaks the road shelter',' · تحطّم ملجأ الطريق')}${suffix}`:`${name} · ${targetText}${tr('; damages every living enemy','؛ تصيب كلّ عدوّ حيّ')}${cover?tr('; breaks road shelter','؛ وتحطّم ملجأ الطريق'):''}${suffix}`,opportunity:active&&available&&!used&&(targets>=3||!!coverOnly),activeEffect:false};
 }
 const captain=profile.chronicle?.enabled&&profile.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===profile.chronicle!.captain):undefined;
 if(captain){
  const remaining=running&&used?Math.max(0,((captain.id==='gatekeeper'?state.chronicle?.shieldUntil:state.chronicle?.revealUntil)??0)-state.time):0;
  const text=captainSkill(captain);
  return {badge:used?'✓':captain.id==='gatekeeper'?tr('GUARD','حماية'):tr('LIGHT','نور'),label:`${text.name}${used?tr(' · used this battle',' · استُعملت في هذه المعركة'):` · ${text.effect}${suffix}`}`,opportunity:active&&available&&!used&&targets>=3,activeEffect:remaining>0};
 }
 const full=state.food>=99,limited=state.food>89,name=GUIDE.foodDropName();
 return {badge:used?'✓':full?tr('FULL','ممتلئ'):limited?tr('CAP','الحدّ'):'+10',label:used?`${name}${tr(' · used this battle',' · استُعمل في هذه المعركة')}`:full?`${name}${tr(' · food storage full at 99 food',' · المخزن ممتلئ عند 99 من المؤونة')}`:`${name} · ${limited?tr('storage almost full; ','المخزن يكاد يمتلئ؛ '):''}${tr('gain up to 10 food, limited to 99 food','اكسب حتى 10 من المؤونة، والحدّ 99')}${suffix}`,opportunity:false,activeEffect:false};
}
