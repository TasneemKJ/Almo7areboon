import {storybookArt} from '../view/storybook-art.ts';
import type {UnitKind} from '../game/types.ts';
import {landscapeSvg} from '../view/world-illustrations.ts';
import {dataSvg} from '../view/illustration-kit.ts';
import {isArabic} from './i18n.ts';

interface ChapterPresentation {
 readonly title:string;
 readonly subtitle:string;
 readonly period:string;
 readonly units:readonly [string,string,string];
}
/** Fictional presentation only: indices, prices, progression and saves stay in game/. One frozen table per language. */
const freeze=(list:ChapterPresentation[]):readonly ChapterPresentation[]=>Object.freeze(list.map(chapter=>Object.freeze({...chapter,units:Object.freeze(chapter.units) as readonly [string,string,string]})));
const chaptersEn=freeze([
 {title:'First Fires',subtitle:'A warm threshold. A silent valley.',period:'EARLY SETTLEMENTS',units:['Pathkeeper','Thrower','Lizard Rider']},
 {title:'Olive Terraces',subtitle:'The last lamps above the fields.',period:'FARMING COMMUNITIES',units:['Fieldhand','Slinger','Harvester']},
 {title:'Harbor Watch',subtitle:'Quiet quays after the ships depart.',period:'COASTAL ANTIQUITY',units:['Quay Guard','Archer','Rider']},
 {title:'Lantern Quarter',subtitle:'Shutters close around the courtyard.',period:'HISTORIC CRAFT TOWNS',units:['Gatekeeper','Musketeer','Cannon']},
 {title:'Hillside Watch',subtitle:'One lit window above a sleeping town.',period:'AN IMAGINED PRESENT',units:['Sentinel','Scout','Tank']},
 {title:'Courtyards Beyond',subtitle:'Old thresholds beneath unfamiliar stars.',period:'AN IMAGINED FUTURE',units:['Light Guard','Trooper','Sky Skimmer']},
]);
const chaptersAr=freeze([
 {title:'النيران الأولى',subtitle:'عتبةٌ دافئة، ووادٍ صامت.',period:'المستوطنات الأولى',units:['حارس الدرب','الرامي','فارس الضبّ']},
 {title:'مدرّجات الزيتون',subtitle:'آخر القناديل فوق الحقول.',period:'مجتمعات الزراعة',units:['عامل الحقل','المِقلاع','الحصّاد']},
 {title:'حراسة الميناء',subtitle:'أرصفةٌ هادئة بعد رحيل السفن.',period:'الساحل القديم',units:['حارس الرصيف','النبّال','الفارس']},
 {title:'حيّ الفوانيس',subtitle:'تُغلَق النوافذ حول الساحة.',period:'مدن الحِرَف القديمة',units:['حارس البوّابة','حامل البندقية','المدفع']},
 {title:'حراسة التلّة',subtitle:'نافذةٌ مضاءة فوق بلدةٍ نائمة.',period:'حاضرٌ متخيَّل',units:['الحارس','الكشّاف','الدبّابة']},
 {title:'ساحاتٌ وراء الأفق',subtitle:'عتباتٌ قديمة تحت نجومٍ غريبة.',period:'مستقبلٌ متخيَّل',units:['حارس النور','الجنديّ','زورق السماء']},
]);
const chapterIndex=(age:number)=>Number.isInteger(age)&&age>=0&&age<chaptersEn.length?age:0;
/** Both languages at once (the victory postcard is written Arabic first, English under it). */
export function chapterInBothLanguages(age:number):{ar:ChapterPresentation;en:ChapterPresentation} {return {ar:chaptersAr[chapterIndex(age)],en:chaptersEn[chapterIndex(age)]};}
export function chapterPresentation(age:number):ChapterPresentation {return (isArabic()?chaptersAr:chaptersEn)[chapterIndex(age)];}
export function unitPresentationName(age:number,kind:UnitKind):string {
 return chapterPresentation(age).units[[0,1,2].includes(kind)?kind:0];
}
const landscapes=new Map<number,string>();
/** Same authored landscape as the battlefield, cached by the browser. */
export function chapterLandscape(age:number):string {
 const index=chapterIndex(age),art=storybookArt(index);
 // The DOM shows the HD copy exported from the original art (scripts/prepare-storybook-hd.cjs); the canvas keeps its packed texture.
 if(art)return `${art.folder}/village-hd.webp`;
 let image=landscapes.get(index);
 if(!image){image=dataSvg(landscapeSvg(index,false));landscapes.set(index,image);}
 return image;
}
