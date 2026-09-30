import { legacyEffects } from '../game/prestige.ts';
import type { BattleState, LegacyChoice, LegacyEffects, LegacyRank, PrestigePreview, Profile } from '../game/types.ts';

const names:Record<LegacyChoice,string>={hearth:'Hearth',watch:'Watch',stillness:'Stillness'};
const choices:LegacyChoice[]=['hearth','watch','stillness'];
const amount=(value:number)=>value.toLocaleString('en-US',{maximumFractionDigits:2});
const effectsText=(effects:LegacyEffects)=>`Starting food: ${amount(effects.startingFood)} · Gate factor: ×${amount(effects.gateFactor)} · Freeze: ${effects.freezeSeconds} seconds`;
function choiceDescription(choice:LegacyChoice,rank:LegacyRank):string {
  const effects=legacyEffects({rank,selected:choice});
  return choice==='hearth'?`Starting food: ${amount(effects.startingFood)}. Form your opening army sooner.`:choice==='watch'?`Gate factor: ×${amount(effects.gateFactor)}. Give your gate more time under pressure.`:`Freeze: ${effects.freezeSeconds} seconds. Give your army more time to strike.`;
}
function radios(prefix:'prestige'|'ready',rank:LegacyRank,selected:LegacyChoice):string {
  return `<fieldset class="legacy-choices"><legend>Choose one legacy</legend>${choices.map(choice=>`<div class="legacy-choice"><input type="radio" id="${prefix}-${choice}" name="${prefix}-legacy" value="${choice}" aria-describedby="${prefix}-${choice}-description" ${choice===selected?'checked':''}/><label for="${prefix}-${choice}">${names[choice]}</label><p id="${prefix}-${choice}-description">${choiceDescription(choice,rank)}</p></div>`).join('')}</fieldset>`;
}
/** Replaces explanatory values only: native radio nodes and keyboard focus stay stable. */
export function prestigeDetailsHtml(profile:Profile,preview:PrestigePreview):string {
  return `<p>Timeline ${preview.expectedTimeline} → ${preview.nextTimeline}</p><p>Enemy strength: ×${amount(preview.currentEnemyFactor)} → ×${amount(preview.nextEnemyFactor)}</p>
  <div class="legacy-rank"><span aria-hidden="true">${'◆'.repeat(preview.rankAfter)}${'◇'.repeat(3-preview.rankAfter)}</span><strong>Rank ${preview.rankBefore} → Rank ${preview.rankAfter}</strong><p>${preview.earnedSeals} / 18 seals${preview.nextRank?` · ${preview.nextRank.remainingSeals} more seals for rank ${preview.nextRank.rank}`:' · Rank 3 complete'}</p></div>
  <p>Current legacy: ${names[profile.legacy.selected]} · rank ${profile.legacy.rank}<small>${effectsText(legacyEffects(profile.legacy))}</small></p>
  <p>Next legacy: ${names[preview.choice]}<small>${effectsText(preview.effects)}</small></p>
  <p class="prestige-credit">Timeline credit: ${amount(preview.timelineGemCredit)} gems<small>Gems: ${amount(preview.gemsBefore)} → ${amount(preview.gemsAfter)}</small></p>`;
}
export function prestigeDialogHtml(profile:Profile,preview:PrestigePreview):string {
  if(profile.timeline>=1000)return '<h2 id="dialog-title">Timeline limit reached</h2><p>This journey has no further timeline reset.</p>';
  return `<span class="eyebrow">ONE LASTING LEGACY</span><h2 id="dialog-title" tabindex="-1">Begin a new timeline?</h2>
  <div id="prestige-preview-values" class="prestige-values" aria-live="polite">${prestigeDetailsHtml(profile,preview)}</div>
  ${radios('prestige',preview.rankAfter,preview.choice)}<p class="legacy-note">One legacy is active at a time. You can change your choice before battle in Evolution.</p>
  <details class="prestige-reset" open><summary>What resets and what stays</summary><h3>These reset</h3><ul><li>Coins: ${amount(profile.coins)} → 0</li><li>Army: first age</li><li>Selected chapter: 1</li><li>Unlocked chapters: chapter 1 only</li><li>Food upgrade: level ${profile.foodLevel} → 0</li><li>Base upgrade: level ${profile.baseLevel} → 0</li><li>Ranged and heavy troops: locked</li><li>Six chapter records: seals and both bests cleared</li></ul>
  <h3>These stay</h3><ul><li>Cards, copies and card bonuses</li><li>Gems and permanent legacy rank</li><li>Claimed quests and lifetime totals</li><li>Summon count and seed</li><li>Daily claim and streak</li><li>Sound, speed and motion preferences</li></ul></details>
  <button class="big-button green" data-command="confirm-prestige">Begin timeline ${preview.nextTimeline}</button><button class="big-button secondary" data-command="close">Keep exploring this timeline</button>`;
}
export function legacyPreparationHtml(profile:Profile,state:BattleState):string {
  const earned=profile.legacy.rank>0,ready=state.phase==='ready'&&earned;
  return `<section class="legacy-preparation" aria-labelledby="legacy-title"><h3 id="legacy-title">Lasting legacy</h3><div id="legacy-current">${legacyCurrentHtml(profile)}</div>${ready?radios('ready',profile.legacy.rank,profile.legacy.selected):''}<p class="legacy-note">${ready?'One legacy is active. You can change your choice before battle.':earned?'Your current legacy stays active. Return to a ready battle to change your choice.':'Your first legacy is earned when you begin the next timeline.'}</p></section>`;
}
export function legacyCurrentHtml(profile:Profile):string {
  return `<p>${profile.legacy.rank>0?`Current legacy: ${names[profile.legacy.selected]} · Rank ${profile.legacy.rank}`:'No earned legacy yet. Complete a timeline to carry one forward.'}<small>${effectsText(legacyEffects(profile.legacy))}</small></p>`;
}
