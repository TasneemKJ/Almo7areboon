import { QUESTS, foodUpgradeCost, unlockCost } from '../game/data.ts';
import { chapterMastery } from '../game/mastery.ts';
import type { BattleState, Profile, UnitKind } from '../game/types.ts';
import { chapterPresentation, chapterLandscape } from './chapter-presentation.ts';
import { masteryMarksHtml } from './mastery-presentation.ts';
import { icon } from '../view/icons.ts';
export function journeyGoals(profile: Readonly<Profile>) {
 return (['wins','kills','deployed'] as const).map(stat=>{
  const quest=QUESTS.filter(q=>q.stat===stat&&!profile.claimed.includes(q.id)).sort((a,b)=>a.target-b.target)[0]??null;
  const count=quest?Math.min(quest.target,profile[stat]):profile[stat];
  return {stat,quest,count,progress:quest?Math.min(1,count/quest.target):1,complete:quest===null,claimable:!!quest&&profile[stat]>=quest.target};
 });
}
export function journeyScreenHtml(profile: Profile, state: BattleState): string {
 const chapter=chapterPresentation(profile.enemyAge),mastery=chapterMastery(profile,profile.enemyAge),goals=journeyGoals(profile);
 const readyReward=goals.find(g=>g.claimable),incomplete=mastery.record.earnedMask!==7;
 const affordableTroop=([1,2] as UnitKind[]).find(kind=>!profile.unlocked[kind]&&profile.coins>=unlockCost(kind,profile));
 const next=readyReward?'An earned milestone is ready. Claim its gems below.':incomplete?`Your next mark: ${!(mastery.record.earnedMask&1)?'clear this chapter':!(mastery.record.earnedMask&2)?'finish with your gate unbroken':mastery.thirdTitle}.`:affordableTroop!==undefined?'Unlock another troop role to broaden your company.':profile.foodLevel<100&&profile.coins>=foodUpgradeCost(profile)?'You can improve food production before your next battle.':'Choose another story route or replay for the seals you still need.';
 const earned=profile.mastery.chapters.reduce((sum,c)=>sum+[1,2,4].filter(bit=>c.earnedMask&bit).length,0);
 return `<span class="eyebrow">THE COMPANY JOURNAL</span><h2 id="dialog-title" tabindex="-1" data-initial-focus>Your journey</h2>
 <div class="journey-landscape"><img src="${chapterLandscape(profile.enemyAge)}" alt=""/><div><small>Timeline ${profile.timeline} · Chapter ${profile.enemyAge+1}</small><strong>${chapter.title}</strong><span>${earned}/18 chapter seals</span></div></div>
 <p class="journey-next">${next}</p><div class="journey-seals">${masteryMarksHtml(profile,profile.enemyAge)}</div>
 <h3 class="journey-heading">Company milestones</h3><div class="journey-goals">${goals.map(g=>`<article class="journey-goal"><div><span>${{wins:'Victories',kills:'Enemies defeated',deployed:'Warriors deployed'}[g.stat]}</span><strong>${g.quest?g.quest.title:'Every milestone earned'}</strong><div class="journey-meter" role="progressbar" aria-label="${g.stat} milestone" aria-valuemin="0" aria-valuemax="${g.quest?.target??1}" aria-valuenow="${g.quest?g.count:1}"><i style="transform:scaleX(${g.progress})"></i></div><small>${g.quest?`${g.count.toLocaleString('en-US')} / ${g.quest.target.toLocaleString('en-US')}`:'Complete'}</small></div>${g.quest?`<button class="buy-button" data-claim="${g.quest.id}" aria-label="Claim ${g.quest.reward} gems for ${g.quest.title}" ${g.claimable?'':'disabled'}>${icon('gem')}${g.quest.reward}</button>`:`<span class="journey-complete" aria-label="Completed">${icon('trophy')}</span>`}</article>`).join('')}</div>
 <div class="journey-destinations"><button class="big-button secondary" data-journey-tab="battle">${icon('food')} Prepare troops and food</button><button class="big-button green" data-command="chronicle">${icon('battle')} Choose a story mission</button><button class="big-button secondary" data-journey-tab="cards">${icon('cards')} Strengthen your collection</button><button class="big-button secondary" data-command="quests">${icon('quest')} All quests and daily reward</button></div>
 <p class="journey-note">Progress stays with your company. Milestone gems are earned once; replay for the seals you still need.</p>
 ${state.phase==='won'||state.phase==='lost'?'<button class="big-button secondary" data-command="journey-result">Return to battle result</button>':''}`;
}
