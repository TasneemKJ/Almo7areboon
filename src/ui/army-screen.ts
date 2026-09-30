import { ERAS, unlockCost } from '../game/data.ts';
import type { Profile, UnitKind } from '../game/types.ts';
import { unitPresentationName } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
export const TROOP_SPECIALTIES = [
  {name:'Guard',effect:'Takes less damage from ranged enemies.'},
  {name:'Pierce',effect:'Deals extra damage to heavy enemies.'},
  {name:'Sweep',effect:'Hits a second nearby enemy.'},
] as const;
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
