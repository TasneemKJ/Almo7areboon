import { battleClock } from './battle-clock.ts';
import { chronicleResultHtml } from './chronicle-screen.ts';
import { ERAS } from '../game/data.ts';
import { advanceStatus, canRetry, chapterMastery } from '../game/mastery.ts';
import type { BattleState, Profile } from '../game/types.ts';
import { battleStats } from '../game/statistics.ts';
import { chapterPresentation, chapterLandscape } from './chapter-presentation.ts';
import { icon } from '../view/icons.ts';
import { compactNumber } from './battle-hud.ts';
import { masteryMarksHtml, masteryAttemptText, masteryAdvice } from './mastery-presentation.ts';
import { villageVoice, villageMoment } from './chapter-scouting.ts';
import { earlierChapter, regroupLearningHtml } from './regroup-learning.ts';

export const timelineResetText='Preview the next timeline before you begin. In this harder timeline, your age, coins, upgrades and troop unlocks reset; seals and their rewards start afresh. Cards, gems, quests and lifetime records stay. Review the reset, actual gem credit and one lasting legacy before confirming.';
const amount=(value:number)=>Math.floor(value).toLocaleString('en-US');

export function resultsHtml(profile: Profile, state: BattleState): string {
 const won=state.phase==='won',stats=battleStats(state.stats),advance=advanceStatus(profile,state),view=chapterMastery(profile,profile.enemyAge);
 const terminal=advance.reason==='complete',receipt=won?profile.pendingVictory:null;
 const settled=receipt?.settlement==='mastery-v1'?receipt:null;
 const voiceStats=won&&!settled?undefined:stats;
 const newTitles=settled?['Clear','Gate Unbroken',view.thirdTitle].filter((_,index)=>settled.newMask&(1<<index)):[];
 const terminalCopy=won||(view.record.earnedMask&1)?'All 1,000 timelines complete. Return to chapters to revisit your journey.':'The final timeline is at its limit. Return to chapters to prepare another attempt.';
 const nextTitle=advance.target==='battle'?chapterPresentation(advance.nextBattle!).title:'';
 const continuation=advance.allowed&&!profile.chronicle?.expedition?`<button class="big-button green" data-command="next">${advance.target==='timeline'?'Next Timeline':`Continue to ${nextTitle}`} ${icon('arrow')}</button>`:'';
 const retry=canRetry(profile,state)&&!terminal?`<button class="big-button ${won?'secondary':'blue'}" data-command="retry">${won?(view.record.earnedMask===7?'Replay':'Try for remaining seals'):'Prepare next attempt'} ${icon('arrow')}</button>`:'';
 const canEvolve=!profile.chronicle?.expedition&&won&&profile.age<ERAS.length-1&&profile.age<=profile.enemyAge;
 const evolve=canEvolve?`<button class="big-button secondary" data-command="evolve" ${profile.coins<ERAS[profile.age].evolveCost?'disabled':''}>Evolve · ${amount(ERAS[profile.age].evolveCost)} coins</button>`:'';
 return `<div class="result-landscape" aria-hidden="true"><img alt="" src="${chapterLandscape(won&&advance.target==='battle'?advance.nextBattle!:profile.enemyAge)}"/></div><div class="result-emblem ${won?'':'defeat'}">${icon(won?'trophy':'shield')}</div><span class="eyebrow">${won?'THE BATTLE IS YOURS':'YOUR COINS ARE SAFE'}</span><h2 id="dialog-title" tabindex="-1" data-initial-focus>${won?'VICTORY!':'REGROUP'}</h2><p>${terminal?terminalCopy:won?(advance.target==='timeline'?`Timeline complete! ${timelineResetText}`:`${nextTitle} is next. Your own army evolves separately.`):masteryAdvice(profile,state)}</p>
 <blockquote class="village-voice" data-village-moment="${villageMoment(voiceStats)}">${villageVoice(profile.enemyAge,state.phase,voiceStats)}</blockquote>
 ${regroupLearningHtml(profile,state)}
 ${state.phase==='lost'&&earlierChapter(profile)!==null?'<button class="big-button secondary" data-command="regroup-chapters">Choose an earlier chapter</button>':''}
 <div class="reward"><span>TOTAL BATTLE EARNINGS</span><strong>${icon('coin')}${compactNumber(state.earned)}</strong><small>Already added to your coins${won?' · victory bonus: up to 10 gems':''}</small>${settled?`<small>Normal combat: ${amount(state.earned-settled.masteryCoins)} coins</small><small>Mastery credited: ${amount(settled.masteryCoins)} coins · ${amount(settled.masteryGems)} gems</small>`:''}</div>
 <div class="result-mastery">${masteryMarksHtml(profile,profile.enemyAge)}${settled?`<p>New seals: ${newTitles.length?newTitles.join(', '):'none · previously earned seals stay earned'}.</p>`:''}<p>${masteryAttemptText(profile,state)}</p>${settled?`<small>Gate damage this attempt: ${amount(stats.gateDamageTaken)}</small>`:''}</div>
 <dl class="battle-statistics"><div><dt>Battle time</dt><dd>${battleClock(state.time)}</dd></div><div><dt>Warriors deployed</dt><dd>${stats.deployed}</dd></div><div><dt>Enemies defeated</dt><dd>${stats.kills}</dd></div><div><dt>Food spent</dt><dd>${compactNumber(stats.foodSpent)}</dd></div><div><dt>Damage dealt</dt><dd>${compactNumber(stats.damageDealt)}</dd></div><div><dt>Largest army</dt><dd>${stats.peakArmy}</dd></div></dl>
 ${!won&&advance.target==='timeline'?`<p>${timelineResetText}</p>`:''}${chronicleResultHtml(profile,state)}${continuation}${retry}${evolve}${terminal?'<button class="big-button blue" data-command="return-chapters">Return to chapters</button>':''}`;
}
