import {CAPTAINS} from '../game/chronicle.ts';
import { ERAS, unlockCost } from '../game/data.ts';
import type { DeploymentStatus, Phase, Profile, UnitKind } from '../game/types.ts';
import { unitPresentationName } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
import { plural, tr } from './i18n.ts';
/** English names, kept for readers of the table; show `troopSpecialty(kind)` instead. */
export const TROOP_SPECIALTIES = [
  {name:'Guard',effect:'Takes less damage from ranged enemies.'},
  {name:'Pierce',effect:'Deals extra damage to heavy enemies.'},
  {name:'Sweep',effect:'Hits a second nearby enemy.'},
] as const;
const SPECIALTIES_AR = [
  {name:'الصدّ',effect:'يتلقّى ضرراً أقلّ من رماة العدوّ.'},
  {name:'الاختراق',effect:'يُنزل ضرراً أكبر بثقيلي العدوّ.'},
  {name:'الاكتساح',effect:'يصيب عدوّاً ثانياً قريباً منه.'},
] as const;
/** A troop specialty in the current language. */
export function troopSpecialty(kind:UnitKind):{name:string;effect:string} {
  const en=TROOP_SPECIALTIES[kind],ar=SPECIALTIES_AR[kind];
  return {name:tr(en.name,ar.name),effect:tr(en.effect,ar.effect)};
}
/** Shared native name/title: disabled controls explain the current choice. */
export function troopControlLabel(profile:Readonly<Profile>,kind:UnitKind,status:Readonly<DeploymentStatus>):string {
  const name=unitPresentationName(profile.age,kind),locked=!profile.unlocked[kind];
  const cost=locked?unlockCost(kind,profile):ERAS[profile.age].units[kind].cost;
  const missing=Math.max(0,cost-profile.coins);
  const wait=Math.ceil(status.waitSeconds);
  const hint=locked?missing>0?tr(`Needs ${missing.toLocaleString('en-US')} more ${missing===1?'coin':'coins'}`,`ينقصك ${missing.toLocaleString('en-US')} من النقود`):tr('Tap to unlock','انقر لتفتحه')
    :status.reason==='available'?tr('Tap to deploy','انقر لترسله')
    :status.reason==='food'?tr(`Ready in ${wait} seconds`,`يجهز بعد ${wait} ${plural(wait,['second','seconds'],['ثانية','ثانيتين','ثوانٍ','ثانية'])}`)
    :status.reason==='blocked'?tr('Deployment area full','ساحة الإرسال ممتلئة')
    :status.reason==='capacity'?tr('Army limit reached','بلغ الجيش حدّه')
    :status.reason==='paused'?tr('Resume battle to deploy','تابع المعركة لترسله')
    :status.reason==='ready'?tr('Start battle to deploy','ابدأ المعركة لترسله'):tr('Deployment unavailable','الإرسال غير متاح الآن');
  const price=cost.toLocaleString('en-US');
  return `${locked?tr(`Unlock ${name}, ${price} coins`,`افتح ${name}، ${price} من النقود`):tr(`Deploy ${name}, ${price} food`,`أرسل ${name}، ${price} من المؤونة`)}. ${hint}. ${troopSpecialty(kind).effect}`;
}

/** Post-purchase guidance uses authoritative deployment status, without buying or spawning. */
export function troopUnlockMessage(profile: Readonly<Profile>, phase: Phase, kind: UnitKind, status: Readonly<DeploymentStatus>): string {
  const cost = ERAS[profile.age].units[kind].cost;
  const wait = Math.ceil(status.waitSeconds), name = unitPresentationName(profile.age, kind);
  const next = phase === 'ready' ? tr(`Start Battle, then deploy: ${cost} food.`, `ابدأ المعركة ثم أرسله: ${cost} من المؤونة.`)
    : phase !== 'running' ? tr(`Prepare another battle, then deploy: ${cost} food.`, `استعدّ لمعركة أخرى ثم أرسله: ${cost} من المؤونة.`)
    : status.reason === 'paused' ? tr(`Resume Battle, then deploy: ${cost} food.`, `تابع المعركة ثم أرسله: ${cost} من المؤونة.`)
    : status.reason === 'food' ? tr(`Needs ${cost} food; wait ${wait}s.`, `يحتاج ${cost} من المؤونة؛ انتظر ${wait} ث.`)
    : status.reason === 'blocked' ? tr(`Deployment area full; wait for space. Costs ${cost} food.`, `ساحة الإرسال ممتلئة؛ انتظر مكاناً. كلفته ${cost} من المؤونة.`)
    : status.reason === 'capacity' ? tr(`Army full; wait for a place. Costs ${cost} food.`, `الجيش مكتمل؛ انتظر مكاناً. كلفته ${cost} من المؤونة.`)
    : tr(`Tap it again to deploy: ${cost} food.`, `انقره مرّة أخرى لترسله: ${cost} من المؤونة.`);
  return `${tr(`${name} unlocked!`, `انضمّ ${name}!`)} ${troopSpecialty(kind).effect} ${next}`;
}
type MarkupTarget = Pick<HTMLElement, 'innerHTML'>;

export function createArmyUpdater(targets: { units: MarkupTarget; skills: MarkupTarget; stages: MarkupTarget }, portrait: (age: number, kind: UnitKind) => string, formatCost = (cost: number) => cost.toLocaleString('en-US')) {
  let armyKey = '', stageKey = '', skillsKey = '';
  return (profile: Profile): boolean => {
    const nextArmyKey = `${profile.age}:${profile.unlocked.join(',')}`;
    const unitsChanged = nextArmyKey !== armyKey;
    if (unitsChanged) {
      targets.units.innerHTML = ERAS[profile.age].units.map((unit, index) => {
        const specialty=troopSpecialty(index as UnitKind);
        const kind = index as UnitKind, unlocked = profile.unlocked[index], cost = unlockCost(kind, profile), name = unitPresentationName(profile.age, kind);
        return `<button class="unit-card ${unlocked ? '' : 'locked'}" data-unit="${index}" aria-label="${unlocked ? tr(`Deploy ${name}, ${unit.cost} food`, `أرسل ${name}، ${unit.cost} من المؤونة`) : tr(`Unlock ${name}, ${cost} coins`, `افتح ${name}، ${cost} من النقود`)}. ${specialty.effect}" title="${specialty.effect}"><i class="troop-mark troop-mark-${index}" aria-hidden="true"></i><span class="unit-role">${unit.role} · ${specialty.name}</span><span class="unit-name">${name}</span><img alt="" src="${portrait(profile.age, kind)}"/><span class="unit-price">${unlocked ? icon('food') + unit.cost : icon('lock') + `<span>${formatCost(cost)}</span>` + icon('coin')}</span><span class="unit-fill"></span></button>`;
      }).join('');
      armyKey = nextArmyKey;
    }
    const captain=profile.chronicle?.enabled&&profile.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===profile.chronicle!.captain):undefined;
    const nextSkillsKey=captain?.id??'none';
    if (nextSkillsKey!==skillsKey) {
      targets.skills.innerHTML = (['freeze', 'meteor', 'food'] as const).map(skill => `<button class="skill-circle ${skill}" data-skill="${skill}" aria-label="${skill === 'food' ? (captain?.skill ?? tr('Food drop', 'إمداد المؤونة')) : skill === 'freeze' ? tr('Freeze enemies', 'جمّد الأعداء') : tr('Meteor strike', 'ضربة النيزك')}">${icon(skill==='food'&&captain?(captain.id==='gatekeeper'?'shield':'evolution'):skill)}<small>${skill === 'food' ? captain?(captain.id==='gatekeeper'?tr('GUARD','صدّ'):tr('LIGHT','نور')):'+10' : skill === 'freeze' ? '❄' : '✦'}</small></button>`).join('');
      skillsKey = nextSkillsKey;
    }
    const nextStageKey = String(profile.enemyAge);
    if (nextStageKey !== stageKey) {
      targets.stages.innerHTML = ERAS.map((_, index) => `<span class="${index < profile.enemyAge ? 'complete' : index === profile.enemyAge ? 'current' : ''}">${index < profile.enemyAge ? '✓' : index + 1}</span>`).join('');
      stageKey = nextStageKey;
    }
    return unitsChanged;
  };
}
