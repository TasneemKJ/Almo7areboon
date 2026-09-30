import { ERAS, eraEconomyScale } from '../game/data.ts';
import type { BattleState, Profile } from '../game/types.ts';
import { chapterPresentation, chapterLandscape } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
import { advanceStatus } from '../game/mastery.ts';
import { masteryMarksHtml } from './mastery-presentation.ts';
import { timelineResetText } from './results-screen.ts';
import { chapterScoutingHtml, battleTeachingHtml } from './chapter-scouting.ts';

export function battleSelectionHtml(profile: Profile, state: BattleState): string {
  const advance=advanceStatus(profile,state);
  const footer=state.phase==='ready'&&advance.allowed?`<footer class="chapter-continuation">${advance.target==='timeline'?`<p>${timelineResetText}</p>`:''}<button class="big-button green" data-command="next">${advance.target==='timeline'?'Next Timeline':`Continue to ${chapterPresentation(advance.nextBattle!).title}`} ${icon('arrow')}</button></footer>`:'';
  return `<span class="eyebrow">TIMELINE ${profile.timeline}</span><h2 id="dialog-title">Choose a battle</h2><p>${state.phase === 'ready' ? 'Replay unlocked opponents for coins. Later opponents pay far more, so replay the highest one you can beat. Your army and upgrades stay with you.' : 'Finish this battle before choosing another opponent.'}</p>${chapterScoutingHtml(profile.enemyAge)}${battleTeachingHtml()}<div class="battle-options">${ERAS.map((_, index) => {
    const locked = index > profile.furthestBattle, current = index === profile.enemyAge;
    return `<button class="battle-option" data-battle="${index}" aria-current="${current}" ${locked || state.phase !== 'ready' ? 'disabled' : ''}><img class="battle-preview" alt="" loading="lazy" src="${chapterLandscape(index)}"/><strong>${index + 1}</strong><span>${chapterPresentation(index).title}<small>${locked ? 'LOCKED' : `${current ? 'CURRENT BATTLE' : 'AVAILABLE TO REPLAY'} · COINS ×${eraEconomyScale(index).toLocaleString('en-US')}`}</small>${masteryMarksHtml(profile,index)}</span>${icon(locked ? 'lock' : current ? 'flag' : 'arrow')}</button>`;
  }).join('')}</div>${footer}`;
}

export function evolutionDialogHtml(profile: Profile, state: BattleState): string | null {
  if (state.phase === 'running' || profile.age >= ERAS.length - 1 || profile.age > profile.enemyAge) return null;
  const next = chapterPresentation(profile.age + 1), cost = ERAS[profile.age].evolveCost;
  return `<span class="eyebrow">ENTER THE NEXT CHAPTER</span><h2 id="dialog-title">Evolve to ${next.title}?</h2><p>Your new army is stronger, but this restarts your age economy.</p><div class="evolution-warning"><strong>These will reset</strong><p>All coins, food and base upgrades, and troop unlocks.</p><strong>These stay with you</strong><p>Your selected opponent and unlocked battles stay. Your chapter seals, cards and gems, quests, lifetime records, and current timeline stay with you.</p></div><p>Evolution requires <strong>${cost.toLocaleString('en-US')} coins</strong>. Your remaining coins are also cleared.</p><button class="big-button green" data-command="confirm-evolve" ${profile.coins < cost ? 'disabled' : ''}>EVOLVE TO ${next.title.toUpperCase()}</button><button class="big-button secondary" data-command="close">KEEP MY CURRENT AGE</button>`;
}
