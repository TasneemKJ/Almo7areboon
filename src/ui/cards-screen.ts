import { CARD_DEFS, availableSummonOdds, cardBonuses, cardPackCost, cardProgress, summonLevel } from '../game/cards.ts';
import { cardBonus } from '../game/data.ts';
import type { Profile } from '../game/types.ts';
import { cardIllustration } from '../view/card-illustrations.ts';
import { icon } from '../view/icons.ts';
import { compactNumber } from './battle-hud.ts';
import { isArabic, n, plural, tr } from './i18n.ts';
import type { CardRarity } from '../game/cards.ts';

const cardsWord=(count:number)=>plural(count,['card','cards'],['بطاقة','بطاقتان','بطاقات','بطاقة']);
const rarityLabel=(rarity:CardRarity)=>tr(rarity.toUpperCase(),{common:'شائعة',rare:'نادرة',epic:'ملحمية',legendary:'أسطورية'}[rarity]);
const statLabel=(stat:'damage'|'health')=>stat==='health'?'الصحّة':'الضرر';

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
  return {text:tr(`${count} ${count===1?'card':'cards'} · ${cost.toLocaleString('en-US')} gems`,`${count} ${cardsWord(count)} · ${cost.toLocaleString('en-US')} من الجواهر`),
    label:tr(`Summon ${count} ${count===1?'card':'cards'} for ${cost} gems`,`استدعِ ${count} ${cardsWord(count)} مقابل ${cost} من الجواهر`),
    disabled:profile.gems<cost||available<count||!availableSummonOdds(profile.summonCount,profile.cards).some(odds=>odds>0)};
}

export function cardsScreenHtml(profile: Profile, quantity:CardQuantity=1): string {
  const bonus = cardBonus(profile), summon = summonLevel(profile.summonCount);
  const odds = availableSummonOdds(profile.summonCount, profile.cards);
  const pack=cardPackPreview(profile,quantity);
  return `<div class="screen-heading"><span class="eyebrow">${tr('PERMANENT POWER','قوّةٌ دائمة')}</span><h2 id="secondary-title" tabindex="-1">${tr('Cards','البطاقات')}</h2><p>${tr('Your collection strengthens every battle.','مجموعتك تقوّي كلّ معركة.')}</p></div>
  <div class="bonus-strip"><span>${icon('battle')} ${tr('Damage','الضرر')} <b>${tr(`×${multiplier(bonus.damage)}`,n(`×${multiplier(bonus.damage)}`))}</b></span><span>${icon('heart')} ${tr('Health','الصحّة')} <b>${tr(`×${multiplier(bonus.health)}`,n(`×${multiplier(bonus.health)}`))}</b></span></div>
  <details class="collection-details"><summary>${tr('Food, base and coin bonuses','مكاسب المؤونة والحصن والنقود')}</summary><p>${tr(`Food ×${multiplier(bonus.food)} · Base ×${multiplier(bonus.base)} · Coins ×${multiplier(bonus.coins)}`,`المؤونة ${n(`×${multiplier(bonus.food)}`)} · الحصن ${n(`×${multiplier(bonus.base)}`)} · النقود ${n(`×${multiplier(bonus.coins)}`)}`)}</p></details>
  <section class="summon-panel" aria-label="${tr('Summon cards','استدعاء البطاقات')}"><h3>${tr(`Summon level ${summon.level}`,`مستوى الاستدعاء ${n(summon.level)}`)}</h3><p>${summon.required ? tr(`${summon.progress} / ${summon.required} draws to the next level`,`${n(`${summon.progress} / ${summon.required}`)} سحبة حتى المستوى التالي`) : tr('Maximum summon level','أعلى مستوى للاستدعاء')}</p>
  <div class="card-pack-choice"><label for="card-quantity">${tr('Quantity','العدد')}</label><select id="card-quantity" data-card-quantity aria-describedby="card-pack-preview">${([1,10,50] as const).map(count=>`<option value="${count}"${count===quantity?' selected':''}>${tr(`${count} ${count===1?'card':'cards'}`,`${count} ${cardsWord(count)}`)}</option>`).join('')}</select></div>
  <p id="card-pack-preview" class="card-pack-preview">${pack.text}</p><button id="card-summon" class="big-button blue card-summon" data-pack="${quantity}" ${pack.disabled?'disabled':''} aria-label="${pack.label}">${tr('Summon','استدعِ')}</button>
  <details class="collection-details"><summary>${tr('Current draw odds','احتمالات السحب الحالية')}</summary><p>${(isArabic()?['شائعة','نادرة','ملحمية','أسطورية']:['Common','Rare','Epic','Legendary']).map((rarity,i)=>tr(`${rarity} ${Number(odds[i].toFixed(2))}%`,`${rarity} ${n(`${Number(odds[i].toFixed(2))}%`)}`)).join(' · ')}</p><p>${tr('Odds improve as you summon. Full cards are excluded. No real-money purchases.','تتحسّن الاحتمالات كلّما استدعيت. البطاقات المكتملة مستبعدة. لا شراء بمالٍ حقيقيّ.')}</p></details></section>
  <p class="collection-summary">${tr(`${profile.cards.filter(count=>count>0).length} / ${CARD_DEFS.length} discovered · All bonuses apply automatically.`,`المكتشَف ${n(`${profile.cards.filter(count=>count>0).length} / ${CARD_DEFS.length}`)} · كلّ المكاسب تُطبَّق تلقائياً.`)}</p>
  <div class="collection-grid">${CARD_DEFS.map((card,i)=>{
    const progress=cardProgress(profile.cards[i]);
    return `<article class="collection-card ${progress.level?'owned':'unowned'}" data-rarity="${card.rarity}" style="--card-color:${card.color}"><div class="rarity">${rarityLabel(card.rarity)}</div><div class="card-art"><img alt="" loading="lazy" src="${cardIllustration(i)}"/></div><h3>${card.name}</h3><p>${card.description}</p><div class="card-level">${progress.level?tr(`LEVEL ${progress.level} · ×${multiplier(cardEffect(i,profile.cards[i]))} ${card.stat}`,`المستوى ${n(progress.level)} · ${n(`×${multiplier(cardEffect(i,profile.cards[i]))}`)} ${statLabel(card.stat)}`):tr('NOT DISCOVERED','لم تُكتشف')}</div><small class="card-copies">${profile.cards[i]>=1000?tr('COLLECTION LIMIT','حدّ المجموعة'):tr(`${progress.owned} / ${progress.required} copies to next level`,`${n(`${progress.owned} / ${progress.required}`)} نسخة حتى المستوى التالي`)}${progress.level>=100?tr(' · bonus cap 100',` · سقف المكسب ${n(100)}`):''}</small></article>`;
  }).join('')}</div>`;
}

const RARITY_RANK={common:0,rare:1,epic:2,legendary:3} as const;

/** Explain only this card's contribution; collection totals remain in Cards. */
function summonLearning(index:number,before:number,after:number):string {
  const progress=cardProgress(after),previous=cardEffect(index,before),current=cardEffect(index,after);
  const change=current>previous?tr(`This card: ${CARD_DEFS[index].stat==='health'?'Health':'Damage'} ×${multiplier(previous)} → ×${multiplier(current)}.`,`هذه البطاقة: ${statLabel(CARD_DEFS[index].stat)} ${n(`×${multiplier(previous)} → ×${multiplier(current)}`)}.`):'';
  const next=after>=1000?tr('Collection limit reached.','بلغت حدّ المجموعة.'):progress.level>=100?tr('Bonus cap reached.','بلغت سقف المكسب.'):!change?tr(`Next level: ${progress.owned} / ${progress.required} copies.`,`المستوى التالي: ${n(`${progress.owned} / ${progress.required}`)} نسخة.`):'';
  return `<p class="summon-learning">${[change,next].filter(Boolean).join(' ')}</p>`;
}

/** Best pulls first, so the rare card is never hidden below the scroll; first-time cards are marked NEW. */
export function summonedCardsHtml(before: readonly number[], profile: Profile): string {
  const changed=CARD_DEFS.map((card,index)=>({card,index,gained:profile.cards[index]-(before[index]??0)})).filter(item=>item.gained>0).sort((a,b)=>RARITY_RANK[b.card.rarity]-RARITY_RANK[a.card.rarity]||b.gained-a.gained||a.index-b.index);
  const total=changed.reduce((sum,item)=>sum+item.gained,0);
  return `<span class="eyebrow">${tr('PERMANENT POWER','قوّةٌ دائمة')}</span><h2 id="dialog-title">${tr(`${total} ${total===1?'card':'cards'} summoned`,`استُدعيت ${n(total)} ${cardsWord(total)}`)}</h2><p>${tr('Already added to your collection. Bonuses apply automatically. Cards stay when you move camp and in new timelines.','أُضيفت إلى مجموعتك، ومكاسبها تُطبَّق تلقائياً. البطاقات تبقى بعد نقل المخيّم وفي الخطوط الزمنية الجديدة.')}</p><div class="summon-results">${changed.map(({card,index,gained})=>`<article data-rarity="${card.rarity}"><span style="background:${card.color}"><img alt="" src="${cardIllustration(index)}"/></span><div><strong>${card.name}</strong><small>${rarityLabel(card.rarity)} · ${tr(`LEVEL ${cardProgress(profile.cards[index]).level}`,`المستوى ${n(cardProgress(profile.cards[index]).level)}`)}${(before[index]??0)===0?tr(' · NEW',' · جديدة'):''}</small>${summonLearning(index,before[index]??0,profile.cards[index])}</div><b>+${gained}</b></article>`).join('')}</div><button class="big-button blue" data-command="close">${tr('BACK TO COLLECTION','عُد إلى المجموعة')}</button>`;
}
