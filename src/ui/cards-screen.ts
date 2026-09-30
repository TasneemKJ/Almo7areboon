import { CARD_DEFS, availableSummonOdds, cardPackCost, cardProgress, summonLevel } from '../game/cards.ts';
import { cardBonus } from '../game/data.ts';
import type { Profile } from '../game/types.ts';
import { cardIllustration } from '../view/card-illustrations.ts';
import { icon } from '../view/icons.ts';
import { compactNumber } from './battle-hud.ts';

export function multiplier(value: number): string { return value < 1000 ? value.toFixed(2) : compactNumber(value); }

export function cardsScreenHtml(profile: Profile): string {
  const bonus = cardBonus(profile), summon = summonLevel(profile.summonCount);
  const odds = availableSummonOdds(profile.summonCount, profile.cards);
  const available = CARD_DEFS.reduce((sum, card, i) => sum + Math.max(0, 1000 - profile.cards[i]), 0);
  const canDraw = odds.some(odds => odds > 0);
  return `<div class="screen-heading"><span class="eyebrow">PERMANENT POWER</span><h2 id="secondary-title" tabindex="-1">Cards</h2><p>Your collection strengthens every battle.</p></div>
  <div class="bonus-strip"><span>${icon('battle')} Damage <b>×${multiplier(bonus.damage)}</b></span><span>${icon('heart')} Health <b>×${multiplier(bonus.health)}</b></span></div>
  <details class="collection-details"><summary>Food, base and coin bonuses</summary><p>Food ×${multiplier(bonus.food)} · Base ×${multiplier(bonus.base)} · Coins ×${multiplier(bonus.coins)}</p></details>
  <section class="summon-panel" aria-label="Summon cards"><h3>Summon level ${summon.level}</h3><p>${summon.required ? `${summon.progress} / ${summon.required} draws to the next level` : 'Maximum summon level'}</p>
  <div class="pack-options">${([1,10,50] as const).map(count => `<button class="big-button blue" data-pack="${count}" ${profile.gems < cardPackCost(count) || available < count || !canDraw ? 'disabled' : ''} aria-label="Summon ${count} ${count === 1 ? 'card' : 'cards'} for ${cardPackCost(count)} gems"><span>${count} ${count === 1 ? 'card' : 'cards'}</span><small>${icon('gem')} ${cardPackCost(count).toLocaleString('en-US')}</small></button>`).join('')}</div>
  <details class="collection-details"><summary>Current draw odds</summary><p>${['Common','Rare','Epic','Legendary'].map((rarity,i)=>`${rarity} ${Number(odds[i].toFixed(2))}%`).join(' · ')}</p><p>Odds improve as you summon. Full cards are excluded. No real-money purchases.</p></details></section>
  <p class="collection-summary">${profile.cards.filter(count=>count>0).length} / ${CARD_DEFS.length} discovered · All bonuses apply automatically.</p>
  <div class="collection-grid">${CARD_DEFS.map((card,i)=>{
    const progress=cardProgress(profile.cards[i]);
    return `<article class="collection-card ${progress.level?'owned':'unowned'}" data-rarity="${card.rarity}" style="--card-color:${card.color}"><div class="rarity">${card.rarity.toUpperCase()}</div><div class="card-art"><img alt="" loading="lazy" src="${cardIllustration(i)}"/></div><h3>${card.name}</h3><p>${card.description}</p><div class="card-level">${progress.level?`LEVEL ${progress.level}`:'NOT DISCOVERED'}</div><small class="card-copies">${profile.cards[i]>=1000?'COLLECTION LIMIT':`${progress.owned} / ${progress.required} copies to next level`}${progress.level>=100?' · bonus cap 100':''}</small></article>`;
  }).join('')}</div>`;
}

const RARITY_RANK={common:0,rare:1,epic:2,legendary:3} as const;

/** Best pulls first, so the rare card is never hidden below the scroll; first-time cards are marked NEW. */
export function summonedCardsHtml(before: readonly number[], profile: Profile): string {
  const changed=CARD_DEFS.map((card,index)=>({card,index,gained:profile.cards[index]-(before[index]??0)})).filter(item=>item.gained>0).sort((a,b)=>RARITY_RANK[b.card.rarity]-RARITY_RANK[a.card.rarity]||b.gained-a.gained||a.index-b.index);
  const total=changed.reduce((sum,item)=>sum+item.gained,0);
  return `<span class="eyebrow">PERMANENT POWER</span><h2 id="dialog-title">${total} ${total===1?'card':'cards'} summoned</h2><p>Already added to your collection.</p><div class="summon-results">${changed.map(({card,index,gained})=>`<article data-rarity="${card.rarity}"><span style="background:${card.color}"><img alt="" src="${cardIllustration(index)}"/></span><div><strong>${card.name}</strong><small>${card.rarity.toUpperCase()} · LEVEL ${cardProgress(profile.cards[index]).level}${(before[index]??0)===0?' · NEW':''}</small></div><b>+${gained}</b></article>`).join('')}</div><button class="big-button blue" data-command="close">BACK TO COLLECTION</button>`;
}
