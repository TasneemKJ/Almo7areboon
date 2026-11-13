import { CAPTAINS, type MissionObjective } from '../game/chronicle.ts';
import { ERAS, foodRate, foodUpgradeCost, unlockCost } from '../game/data.ts';
import { compactNumber } from '../game/format.ts';
import { cardPackCost } from '../game/cards.ts';
import type { WavePreview, WaveStatus } from '../game/encounters.ts';
import type { BattleState, DeploymentStatus, Profile } from '../game/types.ts';
import { chapterMastery } from '../game/mastery.ts';
import { masteryAdvice } from './mastery-presentation.ts';
import { chapterScouting } from './chapter-scouting.ts';
import { isArabic, plural, tr } from './i18n.ts';

/** A short seconds tag for HUD text: "5s" / "5 ث". Plain text (textContent, attributes, canvas). */
export function secondsShort(value: number): string { return tr(`${value}s`, `${value} ث`); }

/** "N seconds" spelled out, with Arabic number agreement. `fmt` wraps the number (n() for HTML sinks). The Arabic
 *  dual is oblique ("بعد ثانيتين") unless `subject` (the seconds are the sentence's subject: "بقي ثانيتان"). */
export function secondsLong(value: number, fmt: (value: number) => string = String, subject = false): string {
  return counted(value, ['second', 'seconds'], ['ثانية واحدة', subject ? 'ثانيتان' : 'ثانيتين', 'ثوانٍ', 'ثانية'], fmt);
}

/**
 * A count with its noun. English: "3 enemies". Arabic: one and two are their own words ("عدوّ واحد", "عدوّان"),
 * 3-10 and 11+ take the number before the plural or singular noun ("3 أعداء", "12 عدوّاً").
 */
export function counted(value: number, en: [one: string, other: string], ar: [one: string, two: string, few: string, many: string], fmt: (value: number) => string = String): string {
  if (isArabic() && (value === 1 || value === 2)) return value === 1 ? ar[0] : ar[1];
  return `${fmt(value)} ${plural(value, en, ar)}`;
}

/** The display name of a wave's intent; the id stays the English word. */
export function intentName(intent: string): string {
  if (!isArabic()) return intent[0].toUpperCase() + intent.slice(1);
  return ({ rush: 'هجمة', volley: 'وابل', bulwark: 'متراس' } as Record<string, string>)[intent] ?? intent;
}

/** A captain's skill name and its effect without the "Replace Food Drop:" lead (the captain table speaks the current language). */
export function captainSkill(captain: { skill: string; description: string }): { name: string; effect: string } {
  return { name: captain.skill, effect: captain.description.replace(/^Replace Food Drop: /, '').replace(/^بدل إمداد المؤونة: /, '') };
}

/**
 * Phrases that other battle files test for at the start of, or inside, a guidance line. Each is one tr() pair used
 * both to write the line and to recognise it, so the Arabic can never drift from its probe.
 */
export const GUIDE = {
  danger: () => tr('Your base is in danger.', 'حصنك في خطر.'),
  piling: () => tr('Food is piling up', 'المؤونة تتكدّس'),
  foodDrop: () => tr('Food Drop adds', 'إمداد المؤونة يضيف'),
  tapFreeze: () => tr('Tap Freeze', 'المس «التجميد»'),
  tapMeteor: () => tr('Tap Meteor', 'المس «النيزك»'),
  trySkill: () => tr('Try a skill:', 'جرّب مهارة:'),
  needCover: () => tr('Ranged troops need cover.', 'الرماة يحتاجون إلى غطاء.'),
  affordable: () => tr('Ranged troops are affordable.', 'تستطيع الآن شراء الرماة.'),
  foodDropName: () => tr('Food Drop', 'إمداد المؤونة'),
};

export { compactNumber };

/** What most improves the next attempt, judged from what the player can afford right now. */
export function defeatAdvice(profile: Profile): string {
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return tr('Unlock your ranged troop so it can strike from behind your front line, then retry.', 'افتح جنديّ الرماية ليضرب من خلف خطّك الأمامي، ثم أعد المحاولة.');
  if (!profile.unlocked[2] && profile.coins >= unlockCost(2, profile)) return tr('Unlock your heavy troop to hold the front line, then retry.', 'افتح جنديّك الثقيل ليثبت في الخطّ الأمامي، ثم أعد المحاولة.');
  if (profile.foodLevel < 100 && profile.coins >= foodUpgradeCost(profile)) return tr('Upgrade food production to deploy faster, then retry.', 'طوّر إنتاج المؤونة لترسل جندك أسرع، ثم أعد المحاولة.');
  if (profile.gems >= cardPackCost(1)) return tr(`You have ${profile.gems.toLocaleString('en-US')} gems: summon a card in Cards for a permanent boost, then retry.`, `معك من الجواهر ${profile.gems.toLocaleString('en-US')}: استدعِ بطاقة من «البطاقات» لدعمٍ دائم، ثم أعد المحاولة.`);
  return tr('Deploy earlier and mix melee with ranged troops. Winning any battle pays gems for cards.', 'أرسل جندك أبكر، واخلط القتال القريب بالرماية. كلّ نصر يمنحك جواهر للبطاقات.');
}

/** A new player banks food instead of spending it. True in the first three wins, mid-battle, after the first
 *  deployment, with food for eight of the cheapest warriors unspent and fewer than three of them fighting
 *  while an enemy is alive. */
export function foodIsPiling(profile: Profile, state: BattleState): boolean {
  if (profile.wins >= 3 || state.phase !== 'running' || state.paused || state.stats.deployed === 0) return false;
  const cost = ERAS[profile.age].units[0].cost;
  const living = (side: string) => state.units.filter(unit => unit.side === side && unit.hp > 0).length;
  return state.food >= cost * 8 && living('enemy') > 0 && living('player') < 3;
}

/** A single contextual instruction, not an onboarding panel over the battlefield. */
export function battleGuidance(profile: Profile, state: BattleState, preview?: WavePreview | null, melee?: Readonly<DeploymentStatus>): string {
  if (state.phase === 'ready') return profile.wins===0?tr('Tap Battle, then spend food on warriors. They fight automatically.','المس «المعركة»، ثم أنفق المؤونة على المحاربين. سيقاتلون وحدهم.'):`${chapterScouting(profile.enemyAge).opening} ${tr('Tap Battle to begin.','المس «المعركة» لتبدأ.')}`;
  if (state.phase === 'won') return tr('Victory! Continue to the next battle when you are ready.', 'نصر! تابع إلى المعركة التالية متى كنت مستعدّاً.');
  if (state.phase === 'lost') return `${tr('Your coins are safe.','نقودك في أمان.')} ${masteryAdvice(profile,state)}`;
  if (state.paused) return tr('Battle paused. Resume to deploy your army.', 'المعركة متوقّفة. تابع لترسل جيشك.');
  if (state.playerHp / state.playerMaxHp <= 0.3) return `${GUIDE.danger()} ${tr('Deploy reinforcements or use a skill.','أرسل المدد أو استعمل مهارة.')}`;
  if (state.stats.deployed === 0 && state.food >= ERAS[profile.age].units[0].cost) return tr('Deploy a melee warrior. Save some food for the next wave.', 'أرسل محارباً للقتال القريب، واحفظ بعض المؤونة للموجة التالية.');
  const captain=profile.chronicle?.enabled&&profile.chronicle.captain!=='none'?CAPTAINS.find(c=>c.id===profile.chronicle!.captain):undefined;
  // A first-timer who banks food loses the battle with it unspent, so this outranks the skill cues below.
  if (foodIsPiling(profile, state)) return `${GUIDE.piling()} (${Math.floor(state.food)}). ${tr('Tap a troop below to send more warriors.','المس جندياً في الأسفل لترسل محاربين أكثر.')}`;
  // First-Freeze cue: teach the skill at the moment it pays off, while three or more enemies gather.
  if (profile.wins < 5 && state.stats.skillsCast === 0 && !state.skillsUsed.includes('freeze') && state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length >= 3) return tr('Enemies are gathering. ','الأعداء يتجمّعون. ')+GUIDE.tapFreeze()+tr(' to hold them while your army strikes.',' لتوقفهم بينما يضرب جيشك.');
  // First-Meteor cue: once Freeze has been tried, point at the skill that damages every living enemy at once.
  if (profile.wins < 5 && state.skillsUsed.includes('freeze') && !state.skillsUsed.includes('meteor') && state.time >= 20 && state.units.filter(unit => unit.side === 'enemy' && unit.hp > 0).length >= 3) return tr('Enemies are bunched up. ','الأعداء متلاصقون. ')+GUIDE.tapMeteor()+tr(' to hit every one of them at once.',' لتصيبهم جميعاً دفعةً واحدة.');
  const wait = Math.ceil((ERAS[profile.age].units[0].cost - state.food) / foodRate(profile));
  if (wait > 0) return profile.wins<3&&!captain&&!state.skillsUsed.includes('food')
    ? `${GUIDE.foodDrop()} ${tr(`10 now, once per battle; or wait ${wait}s.`,`10 الآن، مرّةً في كل معركة؛ أو انتظر ${secondsShort(wait)}.`)}`
    : tr(`More food in ${wait}s. Your warriors fight automatically.`, `مؤونة أكثر بعد ${secondsShort(wait)}. محاربوك يقاتلون وحدهم.`);
  if(profile.wins<3&&melee?.allowed){
    const army=state.units.filter(unit=>unit.side==='player'&&unit.hp>0);
    if(army.some(unit=>unit.kind===1)&&!army.some(unit=>unit.kind===0||unit.kind===2))return `${GUIDE.needCover()} ${tr('Add a melee guard.','أضف حارساً للقتال القريب.')}`;
  }
  if (profile.wins < 3 && state.stats.skillsCast === 0 && state.time >= 25 && (!preview || preview.nextIn > 8)) {
    const enemies = state.units.some(unit => unit.side === 'enemy' && unit.hp > 0);
    const skills = [
      ...(enemies && !state.skillsUsed.includes('freeze') ? [tr('Freeze','التجميد')] : []),
      ...(enemies && !state.skillsUsed.includes('meteor') ? [tr('Meteor','النيزك')] : []),
      ...((captain || state.food < 99) && !state.skillsUsed.includes('food') ? [captain?captainSkill(captain).name:GUIDE.foodDropName()] : []),
    ];
    if (skills.length) return `${GUIDE.trySkill()} ${skills.join(tr(' or ',' أو '))}. ${tr('Each works once per battle.','كلّ مهارة تعمل مرّةً في المعركة.')}`;
  }
  if (preview) {
    if (preview.intent === 'volley') return tr('Ranged enemies are coming. Melee guards take less damage from them.', 'رماة العدوّ قادمون. حرّاس القتال القريب يتلقّون منهم ضرراً أقلّ.');
    if (preview.intent === 'rush' && profile.unlocked[2]) return tr('A rush is coming. A heavy warrior can hit two enemies.', 'هجمة قادمة. المحارب الثقيل يصيب عدوّين معاً.');
    if (preview.intent === 'bulwark' && profile.unlocked[1]) return tr('A heavy enemy is coming. Ranged troops deal extra damage to it.', 'عدوّ ثقيل قادم. الرماة يوقعون به ضرراً إضافياً.');
    return tr('A stronger wave is coming. Save food and send melee warriors together.', 'موجة أقوى قادمة. احفظ المؤونة وأرسل محاربي القتال القريب معاً.');
  }
  if (!profile.unlocked[1] && profile.coins >= unlockCost(1, profile)) return `${GUIDE.affordable()} ${tr('Unlock them behind your front line.','افتحهم ليقفوا خلف خطّك الأمامي.')}`;
  if (state.food >= 90) return tr('Food storage is nearly full. Deploy a stronger army now.', 'مخزن المؤونة يكاد يمتلئ. أرسل جيشاً أقوى الآن.');
  const objective=chapterMastery(profile,profile.enemyAge);
  if(!(objective.record.earnedMask&4))return objective.thirdRequirement;
  return profile.unlocked[1] ? tr('Protect ranged troops with a front line of melee warriors.', 'احمِ الرماة بخطّ أماميّ من محاربي القتال القريب.') : tr('Save food and deploy together to overwhelm the enemy.', 'احفظ المؤونة وأرسل جندك معاً لتغلب العدوّ.');
}

export function baseHealthDisplay(hp: number, maximum: number): { ratio: number; label: string; danger: boolean } {
  const max = Number.isFinite(maximum) && maximum > 0 ? maximum : 1;
  const current = Math.max(0, Math.min(max, Number.isFinite(hp) ? hp : 0));
  const ratio = current / max;
  return { ratio, label: `${compactNumber(current)} / ${compactNumber(max)}`, danger: ratio <= 0.3 };
}


/** Compact visible chip; delayed final members always precede clearance. */
const objectiveOrder=(objective?:MissionObjective)=>({escort:tr('Escort the cart','رافق العربة'),hold:tr('Protect the courtyard','احمِ الساحة'),rescue:tr('Bring the scout home','أعِد الكشّاف إلى بيته'),light:tr('Hold the lantern, then break the gate','احرس القنديل، ثم حطّم البوّابة'),boss:tr('Defeat the keeper, then break the gate','اهزم حارس الجرس، ثم حطّم البوّابة'),siege:tr('Attack the base','هاجم الحصن')}[objective??'siege']);

export function waveLabel(status: WaveStatus,objective?:MissionObjective): string {
  const p=status.preview;
  if(p){
    // Arabic marks each role with its troop shape (circle melee, triangle ranged, square heavy) instead of a letter.
    const counts=p.counts.flatMap((count,index)=>count>0?[`${count}${(isArabic()?['●','▲','■']:['M','R','H'])[index]}`]:[]).join(' ');
    return `${isArabic()?intentName(p.intent):p.intent.toUpperCase()} ${p.number}/${p.total} · ${counts} · ${secondsShort(Math.ceil(p.nextIn))}`;
  }
  if(status.pendingEnemies>0)return tr(`FINAL WAVE · ${status.pendingEnemies} INCOMING`,`الموجة الأخيرة · ${status.pendingEnemies} في الطريق`);
  return status.cleared?tr(`WAVES CLEARED · ${objectiveOrder(objective).toUpperCase()}`,`انتهت الموجات · ${objectiveOrder(objective)}`):tr(`${status.enemiesRemaining} ENEMIES REMAIN`,`بقي من الأعداء ${status.enemiesRemaining}`);
}

/** Updated accessible name, deliberately not a countdown live region. */
export function waveAccessibleLabel(status: WaveStatus,objective?:MissionObjective): string {
  const p=status.preview;
  if(isArabic()){
    if(!p)return status.pendingEnemies>0?`الموجة الأخيرة. ${counted(status.pendingEnemies,['enemy','enemies'],['عدوّ واحد','عدوّان','أعداء','عدوّاً'])} في الطريق.`:status.cleared?`انتهت الموجات. ${objectiveOrder(objective)}.`:`بقي من الأعداء ${status.enemiesRemaining}.`;
    const roles=['قتال قريب','رماية','ثقيل'];
    const counts=p.counts.flatMap((count,index)=>count>0?[`${roles[index]}: ${count}`]:[]).join('، ');
    return `الموجة ${p.number} من ${p.total}: ${intentName(p.intent)}. ${counts}. تصل بعد ${secondsLong(Math.ceil(p.nextIn))}.`;
  }
  if(!p)return status.pendingEnemies>0?`Final wave. ${status.pendingEnemies} ${status.pendingEnemies===1?'enemy':'enemies'} incoming.`:status.cleared?`Waves cleared. ${objectiveOrder(objective)}.`:`${status.enemiesRemaining} enemies remain.`;
  const counts=p.counts.flatMap((count,index)=>count>0?[`${count} ${['melee','ranged','heavy'][index]}`]:[]).join(', ');
  return `${p.intent[0].toUpperCase()+p.intent.slice(1)} wave ${p.number} of ${p.total}. ${counts}. Arrives in ${Math.ceil(p.nextIn)} seconds.`;
}
