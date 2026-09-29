import { ERAS } from '../game/data.ts';
import type { BattleState, Profile } from '../game/types.ts';
import { battleStats } from '../game/statistics.ts';
import { chapterPresentation, chapterLandscape } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
import { compactNumber } from './battle-hud.ts';

export function resultsHtml(profile: Profile, state: BattleState): string {
  const won=state.phase==='won',stats=battleStats(state.stats),next=ERAS[profile.enemyAge+1];
  const title=won?'VICTORY!':'REGROUP';
  return `<div class="result-landscape" aria-hidden="true"><img alt="" src="${chapterLandscape(won&&next?profile.enemyAge+1:profile.enemyAge)}"/></div><div class="result-emblem ${won?'':'defeat'}">${icon(won?'trophy':'shield')}</div><span class="eyebrow">${won?'THE BATTLE IS YOURS':'YOUR COINS ARE SAFE'}</span><h2 id="dialog-title">${title}</h2><p>${won?(next?`${chapterPresentation(profile.enemyAge+1).title} is next. Your own army evolves separately.`:'Timeline complete. Continue to restart the age economy and earn 100 gems.'):'Upgrade food production, then retry with a stronger formation.'}</p>
  <div class="reward"><span>BATTLE EARNINGS</span><strong>${icon('coin')}${compactNumber(state.earned)}</strong><small>Already added to your coins${won?' · victory bonus: up to 10 gems':''}</small></div>
  <dl class="battle-statistics"><div><dt>Battle time</dt><dd>${Math.floor(state.time/60)}:${String(Math.floor(state.time%60)).padStart(2,'0')}</dd></div><div><dt>Warriors deployed</dt><dd>${stats.deployed}</dd></div><div><dt>Enemies defeated</dt><dd>${stats.kills}</dd></div><div><dt>Food spent</dt><dd>${compactNumber(stats.foodSpent)}</dd></div><div><dt>Damage dealt</dt><dd>${compactNumber(stats.damageDealt)}</dd></div><div><dt>Largest army</dt><dd>${stats.peakArmy}</dd></div></dl>
  <button class="big-button ${won?'green':'blue'}" data-command="${won?'next':'retry'}">${won?(next?'NEXT BATTLE':'NEXT TIMELINE'):'UPGRADE & RETRY'} ${icon('arrow')}</button>`;
}
