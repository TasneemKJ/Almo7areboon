import { CARD_DEFS, availableSummonOdds, cardBonuses, cardPackCost, cardProgress, summonLevel } from '../game/cards.ts';
import { cardBonus } from '../game/data.ts';
import type { Profile } from '../game/types.ts';
import { cardIllustration } from '../view/card-illustrations.ts';
import { icon } from '../view/icons.ts';
import { compactNumber } from './battle-hud.ts';

/** The stat multiplier this one card contributes alone, so its level has a visible payoff. */
function cardEffect(index: number, copies: number): number {
  const owned = CARD_DEFS.map((_, i) => (i === index ? copies : 0));
  return cardBonuses(owned)[CARD_DEFS[index].stat];
}

export function multiplier(value: number): string {
  const fixed = Number.isFinite(value) ? value.toFixed(2) : '0.00';
  // 999.999 rounds to 1000.00: hand it to the compact formatter so it reads 1k.
  return Number(fixed) < 1000 ? fixed : compactNumber(value);
}

export type CardQuantity = 1|10|50;

/** Read-only purchase preview. Settlement remains the canonical summon action. */
export function cardPackPreview(profile:Profile,count:CardQuantity) {
  const cost=cardPackCost(count);
  const available=CARD_DEFS.reduce((sum,_,i)=>sum+Math.max(0,1000-profile.cards[i]),0);
  return {text:`${count} ${count===1?'card':'cards'} · ${cost.toLocaleString('en-US')} gems`,
    label:`Summon ${count} ${count===1?'card':'cards'} for ${cost} gems`,
    disabled:profile.gems<cost||available<count||!availableSummonOdds(profile.summonCount,profile.cards).some(odds=>odds>0)};
}

export function cardsScreenHtml(profile: Profile, quantity:CardQuantity=1): string {
  const bonus = cardBonus(profile), summon = summonLevel(profile.summonCount);
  const odds = availableSummonOdds(profile.summonCount, profile.cards);
  const pack=cardPackPreview(profile,quantity);
  return `<div class="screen-heading"><span class="eyebrow">PERMANENT POWER</span><h2 id="secondary-title" tabindex="-1">Cards</h2><p>Your collection strengthens every battle.</p></div>
  <div class="bonus-strip"><span>${icon('battle')} Damage <b>×${multiplier(bonus.damage)}</b></span><span>${icon('heart')} Health <b>×${multiplier(bonus.health)}</b></span></div>
  <details class="collection-details"><summary>Food, base and coin bonuses</summary><p>Food ×${multiplier(bonus.food)} · Base ×${multiplier(bonus.base)} · Coins ×${multiplier(bonus.coins)}</p></details>
  <section class="summon-panel" aria-label="Summon cards"><h3>Summon level ${summon.level}</h3><p>${summon.required ? `${summon.progress} / ${summon.required} draws to the next level` : 'Maximum summon level'}</p>
  <div class="card-pack-choice"><label for="card-quantity">Quantity</label><select id="card-quantity" data-card-quantity aria-describedby="card-pack-preview">${([1,10,50] as const).map(count=>`<option value="${count}"${count===quantity?' selected':''}>${count} ${count===1?'card':'cards'}</option>`).join('')}</select></div>
  <p id="card-pack-preview" class="card-pack-preview">${pack.text}</p><button id="card-summon" class="big-button blue card-summon" data-pack="${quantity}" ${pack.disabled?'disabled':''} aria-label="${pack.label}">Summon</button>
  <details class="collection-details"><summary>Current draw odds</summary><p>${['Common','Rare','Epic','Legendary'].map((rarity,i)=>`${rarity} ${Number(odds[i].toFixed(2))}%`).join(' · ')}</p><p>Odds improve as you summon. Full cards are excluded. No real-money purchases.</p></details></section>
  <p class="collection-summary">${profile.cards.filter(count=>count>0).length} / ${CARD_DEFS.length} discovered · All bonuses apply automatically.</p>
  <div class="collection-grid">${CARD_DEFS.map((card,i)=>{
    const progress=cardProgress(profile.cards[i]);
    return `<article class="collection-card ${progress.level?'owned':'unowned'}" data-rarity="${card.rarity}" style="--card-color:${card.color}"><div class="rarity">${card.rarity.toUpperCase()}</div><div class="card-art"><img alt="" loading="lazy" src="${cardIllustration(i)}"/></div><h3>${card.name}</h3><p>${card.description}</p><div class="card-level">${progress.level?`LEVEL ${progress.level} · ×${multiplier(cardEffect(i,profile.cards[i]))} ${card.stat}`:'NOT DISCOVERED'}</div><small class="card-copies">${profile.cards[i]>=1000?'COLLECTION LIMIT':`${progress.owned} / ${progress.required} copies to next level`}${progress.level>=100?' · bonus cap 100':''}</small></article>`;
  }).join('')}</div>`;
}

const RARITY_RANK={common:0,rare:1,epic:2,legendary:3} as const;

/** Explain only this card's contribution; collection totals remain in Cards. */
function summonLearning(index:number,before:number,after:number):string {
  const progress=cardProgress(after),previous=cardEffect(index,before),current=cardEffect(index,after);
  const change=current>previous?`This card: ${CARD_DEFS[index].stat==='health'?'Health':'Damage'} ×${multiplier(previous)} → ×${multiplier(current)}.`:'';
  const next=after>=1000?'Collection limit reached.':progress.level>=100?'Bonus cap reached.':!change?`Next level: ${progress.owned} / ${progress.required} copies.`:'';
  return `<p class="summon-learning">${[change,next].filter(Boolean).join(' ')}</p>`;
}

/** Best pulls first, so the rare card is never hidden below the scroll; first-time cards are marked NEW. */
export function summonedCardsHtml(before: readonly number[], profile: Profile): string {
  const changed=CARD_DEFS.map((card,index)=>({card,index,gained:profile.cards[index]-(before[index]??0)})).filter(item=>item.gained>0).sort((a,b)=>RARITY_RANK[b.card.rarity]-RARITY_RANK[a.card.rarity]||b.gained-a.gained||a.index-b.index);
  const total=changed.reduce((sum,item)=>sum+item.gained,0);
  return `<span class="eyebrow">PERMANENT POWER</span><h2 id="dialog-title">${total} ${total===1?'card':'cards'} summoned</h2><p>Already added to your collection. Bonuses apply automatically. Cards stay through evolution and new timelines.</p><div class="summon-results">${changed.map(({card,index,gained})=>`<article data-rarity="${card.rarity}"><span style="background:${card.color}"><img alt="" src="${cardIllustration(index)}"/></span><div><strong>${card.name}</strong><small>${card.rarity.toUpperCase()} · LEVEL ${cardProgress(profile.cards[index]).level}${(before[index]??0)===0?' · NEW':''}</small>${summonLearning(index,before[index]??0,profile.cards[index])}</div><b>+${gained}</b></article>`).join('')}</div><button class="big-button blue" data-command="close">BACK TO COLLECTION</button>`;
}
