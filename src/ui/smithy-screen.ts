import type {Profile,UnitKind} from '../game/types.ts';
import {blades,brokenBlades,forgeWaits,hungFor,reforgeCost,temperOf,wallBlades,type Blade,type TemperKey} from '../game/smithy.ts';
import {brokenBladeIllustration,forgeIllustration,weaponIllustration} from '../view/smithy-art.ts';
import {chapterPresentation,unitPresentationName} from './chapter-presentation.ts';
import {isArabic,n,tr} from './i18n.ts';

/**
 * The smith «الحدّاد» in Camp and the broken blades on the field (DESIGN.md #60, game/smithy.ts). Everything acts on the
 * world: a blade on the field, the forge, a hook. No panel and no row of buttons; the wall is a picture with a label.
 */
export const HAKAWATI_BLADE_LINE={en:'A broken sword knows more about war than a new one.',ar:'السيف المكسور يعرف عن الحرب أكثر من السيف الجديد.'} as const;
/** After a battle nobody fell in: nothing lies on the field. */
export const NO_BLADE_LINE={en:'Nobody fell, so there is nothing to carry home. The smith will be bored tonight.',ar:'لم يسقط أحد، فلا شيء يُحمل إلى الديار. سيشعر الحدّاد بالملل الليلة.'} as const;
/** The forge waits while the village lamp is lit over another place (game/smithy.ts forgeWaits). */
export const FORGE_WAITS_LINE={en:'The fire waits. Bread first, then iron.',ar:'النار تنتظر. الخبز أوّلاً، ثم الحديد.'} as const;
export const WALL_LINE={en:'The swords on this wall no longer fight, but they do not forget.',ar:'السيوف على هذا الجدار لم تعد تقاتل، لكنها لا تنسى.'} as const;

const number=(value:number)=>Math.floor(value).toLocaleString('en-US');
/** Attribute text: no markup (n() wraps digits in <bdi>) and no bare quotes. */
const attr=(text:string)=>text.replace(/<[^>]*>/g,'').replace(/"/g,'&quot;');
/** The Arabic object pronoun for a weapon: «حربة» is feminine, «سيف» and «رمح» masculine. */
const it=(kind:UnitKind)=>kind===1?'ها':'ه';
const weaponNoun=(kind:UnitKind)=>[tr('Sword','سيف'),tr('Javelin','حربة'),tr('Lance','رمح')][kind];
/** The battle's place in the genitive: «ساحاتٌ» becomes «ساحاتِ…» after a noun (idafa), so the name reads as one phrase. */
const placeOf=(chapter:number)=>{const title=chapterPresentation(chapter).title;return isArabic()?title.replace(/ٌ/g,'ِ'):title;};
/** A reforged weapon's name comes from the battle it was carried from: «سيف النيران الأولى», "Sword of First Fires". */
export function weaponName(blade:Pick<Blade,'kind'|'chapter'>):string {
 return isArabic()?`${weaponNoun(blade.kind)} ${placeOf(blade.chapter)}`:`${weaponNoun(blade.kind)} of ${placeOf(blade.chapter)}`;
}
export function brokenName(blade:Pick<Blade,'kind'|'chapter'>):string {
 const noun=weaponNoun(blade.kind);
 return isArabic()?`${noun} ${blade.kind===1?'مكسورة':'مكسور'} من ${placeOf(blade.chapter)}`:`Broken ${noun.toLowerCase()} from ${placeOf(blade.chapter)}`;
}
const TEMPER_LINES:Record<TemperKey,()=>string>={
 'heavy-edge':()=>tr('strikes harder, swings slower','يضرب أثقل، ويلوّح أبطأ'),
 'light-edge':()=>tr('swings quicker, strikes lighter','يلوّح أسرع، ويضرب أخفّ'),
 'long-reach':()=>tr('reaches further, throws slower','يبلغ أبعد، ويرمي أبطأ'),
 'quick-hand':()=>tr('throws quicker, from closer in','يرمي أسرع، من مسافةٍ أقرب'),
 'first-charge':()=>tr('arrives first, falls sooner','يصل أوّلاً، ويسقط أسرع'),
 'steady':()=>tr('holds longer, arrives later','يصمد أطول، ويصل متأخّراً'),
};
/** What the weapon does to its troop kind, one gain and one cost: "Pathkeeper: strikes harder, swings slower". */
export function temperLine(p:Readonly<Pick<Profile,'age'>>,blade:Pick<Blade,'kind'|'lost'>):string {
 return `${unitPresentationName(p.age,blade.kind)}: ${TEMPER_LINES[temperOf(blade).key]()}`;
}
/** A blade on the field: its label says what it is and what a tap does. */
export function fieldBladeLabel(p:Readonly<Pick<Profile,'age'>>,blade:Pick<Blade,'kind'|'chapter'>):string {
 return `${brokenName(blade)}, ${tr(`where a ${unitPresentationName(p.age,blade.kind)} fell`,`حيث سقط ${unitPresentationName(p.age,blade.kind)}`)}. ${tr('Tap to carry it home.',`انقر لتحمل${it(blade.kind)} إلى الديار.`)}`;
}
export function fieldBladeHtml(id:number,kind:UnitKind):string {
 return `<button class="world-hit field-blade" data-command="blade-carry" data-blade="${id}">${brokenBladeIllustration(kind)}</button>`;
}

/** One hook per troop kind: tapping it hangs the next weapon of that kind from the wall, or takes the hung one down. */
function hookHtml(p:Readonly<Profile>,kind:UnitKind):string {
 const hung=hungFor(p,kind),spare=wallBlades(p).find(b=>b.kind===kind),target=spare??hung;
 const name=unitPresentationName(p.age,kind);
 const now=hung?`${weaponName(hung)}. ${temperLine(p,hung)}.`:tr(`No weapon on the ${name}'s hook.`,`لا سلاح على خطّاف ${name}.`);
 const act=spare?tr(` Tap to hang the ${weaponName(spare)}.`,` انقر لتعلّق ${weaponName(spare)}.`):hung?tr(' Tap to take it down to the wall.',` انقر لتنزل${it(hung!.kind)} إلى الجدار.`):'';
 return `<button class="camp-smithy-hook${hung?' hung':''}" data-command="smithy-hang"${target?` data-blade="${target.id}"`:' aria-disabled="true"'} data-kind="${kind}" aria-label="${attr(now+act)}"><i class="camp-smithy-peg" aria-hidden="true"></i>${hung?weaponIllustration(kind,true,true):''}</button>`;
}
/** The smithy in Camp, once the company has carried a blade home. */
export function campSmithyHtml(p:Readonly<Profile>):string {
 if(!blades(p).length)return '';
 const broken=brokenBlades(p),next=broken[0],cost=reforgeCost(p),waits=!!next&&forgeWaits(p),short=!!next&&!waits&&p.coins<cost;
 const wall=wallBlades(p),shown=wall.slice(0,8);
 const plate=!next?tr('The smith','الحدّاد'):waits?tr('The fire waits','النار تنتظر'):`${tr('Reforge','أصلِح')} · ${tr(`${number(cost)} coins`,`${n(number(cost))} من النقود`)}`;
 const forgeLabel=!next?tr('The smith. Carry broken blades home from the field and he will reforge them.','الحدّاد. احمل السيوف المكسورة من الساحة إلى الديار، وهو يصلحها.')
  :`${tr('The smith','الحدّاد')}. ${brokenName(next)}${broken.length>1?tr(`, and ${broken.length-1} more waiting`,`، وينتظر غيره ${n(broken.length-1)}`):''}. ${waits?FORGE_WAITS_LINE[isArabic()?'ar':'en']:tr(`Tap to reforge it into the ${weaponName(next)} for ${number(cost)} coins. ${temperLine(p,next)}.`,`انقر ليصنع من${it(next.kind)} الحدّاد «${weaponName(next)}» مقابل ${n(number(cost))} من النقود. ${temperLine(p,next)}.`)}${short?tr(` You have ${number(p.coins)}.`,` معك ${n(number(p.coins))}.`):''}`;
 const wallLabel=wall.length?`${tr(`The smithy wall: ${wall.length} ${wall.length===1?'weapon':'weapons'} kept`,`جدار الحدّاد: ${n(wall.length)} من الأسلحة المحفوظة`)}: ${wall.slice(0,12).map(weaponName).join(isArabic()?'، ':', ')}. ${WALL_LINE[isArabic()?'ar':'en']}`:'';
 return `<div class="camp-smithy" data-waits="${waits}">${wall.length?`<span class="camp-smithy-wall" role="img" aria-label="${attr(wallLabel)}">${shown.map(b=>`<i>${weaponIllustration(b.kind)}</i>`).join('')}${wall.length>shown.length?`<b>+${n(wall.length-shown.length)}</b>`:''}</span>`:''}<span class="camp-smithy-hooks">${([0,1,2] as UnitKind[]).map(kind=>hookHtml(p,kind)).join('')}</span><button class="camp-smithy-forge${next&&!waits&&!short?' smithy-ready':''}" data-command="smithy-reforge"${next?` data-blade="${next.id}"`:''}${next&&!waits&&!short?'':' aria-disabled="true"'} aria-label="${attr(forgeLabel)}">${forgeIllustration(!!next&&!waits)}${broken.length?`<span class="camp-smithy-pile" aria-hidden="true">${broken.slice(0,3).map(b=>brokenBladeIllustration(b.kind)).join('')}</span>`:''}<span class="camp-smithy-plate">${plate}</span></button></div>`;
}
