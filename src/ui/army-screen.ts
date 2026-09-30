import { ERAS, unlockCost } from '../game/data.ts';
import type { DeploymentStatus, Phase, Profile, UnitKind } from '../game/types.ts';
import { unitPresentationName } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
export const TROOP_SPECIALTIES = [
  {name:'Guard',effect:'Takes less damage from ranged enemies.'},
  {name:'Pierce',effect:'Deals extra damage to heavy enemies.'},
  {name:'Sweep',effect:'Hits a second nearby enemy.'},
] as const;

/** Shared native name/title: disabled controls explain the current choice. */
export function troopControlLabel(profile:Readonly<Profile>,kind:UnitKind,status:Readonly<DeploymentStatus>):string {
  const name=unitPresentationName(profile.age,kind),locked=!profile.unlocked[kind];
  const cost=locked?unlockCost(kind,profile):ERAS[profile.age].units[kind].cost;
  const missing=Math.max(0,cost-profile.coins);
  const hint=locked?missing>0?`Needs ${missing.toLocaleString('en-US')} more ${missing===1?'coin':'coins'}`:'Tap to unlock'
    :status.reason==='available'?'Tap to deploy'
    :status.reason==='food'?`Ready in ${Math.ceil(status.waitSeconds)} seconds`
    :status.reason==='blocked'?'Deployment area full'
    :status.reason==='capacity'?'Army limit reached'
    :status.reason==='paused'?'Resume battle to deploy'
    :status.reason==='ready'?'Start battle to deploy':'Deployment unavailable';
  return `${locked?'Unlock':'Deploy'} ${name}, ${cost.toLocaleString('en-US')} ${locked?'coins':'food'}. ${hint}. ${TROOP_SPECIALTIES[kind].effect}`;
}

/** Post-purchase guidance uses authoritative deployment status, without buying or spawning. */
export function troopUnlockMessage(profile: Readonly<Profile>, phase: Phase, kind: UnitKind, status: Readonly<DeploymentStatus>): string {
  const cost = ERAS[profile.age].units[kind].cost;
  const next = phase === 'ready' ? `Start Battle, then deploy: ${cost} food.`
    : phase !== 'running' ? `Prepare another battle, then deploy: ${cost} food.`
    : status.reason === 'paused' ? `Resume Battle, then deploy: ${cost} food.`
    : status.reason === 'food' ? `Needs ${cost} food; wait ${Math.ceil(status.waitSeconds)}s.`
    : status.reason === 'blocked' ? `Deployment area full; wait for space. Costs ${cost} food.`
    : status.reason === 'capacity' ? `Army full; wait for a place. Costs ${cost} food.`
    : `Tap it again to deploy: ${cost} food.`;
  return `${unitPresentationName(profile.age, kind)} unlocked! ${TROOP_SPECIALTIES[kind].effect} ${next}`;
}
type MarkupTarget = Pick<HTMLElement, 'innerHTML'>;

export function createArmyUpdater(targets: { units: MarkupTarget; skills: MarkupTarget; stages: MarkupTarget }, portrait: (age: number, kind: UnitKind) => string, formatCost = (cost: number) => cost.toLocaleString('en-US')) {
  let armyKey = '', stageKey = '', skillsReady = false;
  return (profile: Profile): boolean => {
    const nextArmyKey = `${profile.age}:${profile.unlocked.join(',')}`;
    const unitsChanged = nextArmyKey !== armyKey;
    if (unitsChanged) {
      targets.units.innerHTML = ERAS[profile.age].units.map((unit, index) => {
        const specialty=TROOP_SPECIALTIES[index];
        const kind = index as UnitKind, unlocked = profile.unlocked[index], cost = unlockCost(kind, profile), name = unitPresentationName(profile.age, kind);
        return `<button class="unit-card ${unlocked ? '' : 'locked'}" data-unit="${index}" aria-label="${unlocked ? `Deploy ${name}, ${unit.cost} food` : `Unlock ${name}, ${cost} coins`}. ${specialty.effect}" title="${specialty.effect}"><span class="unit-role">${unit.role} · ${specialty.name}</span><span class="unit-name">${name}</span><img alt="" src="${portrait(profile.age, kind)}"/><span class="unit-price">${unlocked ? icon('food') + unit.cost : icon('lock') + `<span>${formatCost(cost)}</span>` + icon('coin')}</span><span class="unit-fill"></span></button>`;
      }).join('');
      armyKey = nextArmyKey;
    }
    if (!skillsReady) {
      targets.skills.innerHTML = (['freeze', 'meteor', 'food'] as const).map(skill => `<button class="skill-circle ${skill}" data-skill="${skill}" aria-label="${skill === 'food' ? 'Food drop' : skill === 'freeze' ? 'Freeze enemies' : 'Meteor strike'}">${icon(skill)}<small>${skill === 'food' ? '+10' : skill === 'freeze' ? '❄' : '✦'}</small></button>`).join('');
      skillsReady = true;
    }
    const nextStageKey = String(profile.enemyAge);
    if (nextStageKey !== stageKey) {
      targets.stages.innerHTML = ERAS.map((_, index) => `<span class="${index < profile.enemyAge ? 'complete' : index === profile.enemyAge ? 'current' : ''}">${index < profile.enemyAge ? '✓' : index + 1}</span>`).join('');
      stageKey = nextStageKey;
    }
    return unitsChanged;
  };
}
