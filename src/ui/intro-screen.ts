import {storybookArt} from '../view/storybook-art.ts';
import {chapterLandscape} from './chapter-presentation.ts';

/**
 * One beat of the opening tale: a single short line in English and Arabic, and how long it holds. `voice` is
 * the slot for a narrated line (an audio URL) if one is added later; the beat timing would stay as it is.
 */
export interface IntroBeat {readonly id:'dusk'|'rival'|'gather';readonly en:string;readonly ar:string;readonly ms:number;readonly voice?:string}

/** Three beats, about twelve seconds with the settle, then the field. Copy stays short and concrete. */
export const INTRO_BEATS:readonly IntroBeat[]=Object.freeze([
 {id:'dusk',en:'At dusk, the valley keeps its lamps lit.',ar:'عند الغروب، يُبقي الوادي قناديله مضاءة.',ms:3800},
 {id:'rival',en:'Across the fields, a rival company marches.',ar:'عبر الحقول، تزحف سريّةٌ منافسة.',ms:3700},
 {id:'gather',en:'Gather your company. Hold the gate.',ar:'اجمع سريّتك. احمِ البوّابة.',ms:3800},
] as const);
/** The fade that hands the last frame to the live field. */
export const INTRO_SETTLE_MS=700;
export const INTRO_KICKER='A LEVANTINE FOLKTALE';

/** Total running time, settle included. */
export function introLength():number {return INTRO_BEATS.reduce((sum,beat)=>sum+beat.ms,0)+INTRO_SETTLE_MS;}

/** When each beat after the first begins, in ms from the start. */
export function introCues():number[] {
 const starts:number[]=[];let at=0;
 for(const beat of INTRO_BEATS.slice(0,-1)){at+=beat.ms;starts.push(at);}
 return starts;
}

/** The chapter's own shipped plate and walking strips; the art is already in the offline cache. */
export function introArt(chapter:number):{plate:string;troops:{strip:string;ratio:number}[]} {
 const art=storybookArt(chapter)??storybookArt(0)!;
 return {plate:chapterLandscape(chapter),troops:art.roles.map(role=>({strip:`${art.folder}/${role}-strip.webp`,ratio:art.frameWidth/192}))};
}

const troop=(strip:string,ratio:number,index:number,side:'company'|'rival')=>
 `<span class="intro-troop intro-${side}" style="--strip:url('${strip}');--ratio:${ratio.toFixed(4)};--i:${index}"><i></i></span>`;

/** Markup only: the app's intro module owns timing, the camera, input and the save. Plate and troops share one camera layer. */
export function introHtml(chapter:number,language:'en'|'ar'='en'):string {
 const {plate,troops}=introArt(chapter);
 // The rival column is the company's own art, mirrored and rim-lit, as on the battlefield.
 const rivals=[troops[2],troops[0],troops[1]].map((t,i)=>troop(t.strip,t.ratio,i,'rival')).join('');
 const company=[troops[0],troops[1],troops[2]].map((t,i)=>troop(t.strip,t.ratio,i,'company')).join('');
 return `<div class="intro-stage" aria-hidden="true"><div class="intro-world"><img class="intro-plate" src="${plate}" alt="" decoding="async"><div class="intro-lamps"></div><div class="intro-band intro-band-rival">${rivals}</div><div class="intro-ground"><div class="intro-band intro-band-company">${company}<span class="intro-standard"><i></i></span></div></div></div><div class="intro-dim"></div><div class="intro-shade"></div></div>
 <label class="intro-language">Story / الحكاية<select aria-label="Opening language"><option value="en">English</option><option value="ar" ${language==='ar'?'selected':''}>العربية</option></select></label><div class="intro-copy"><p class="intro-kicker">${language==='ar'?'حكاية من بلاد الشام':INTRO_KICKER}</p>${INTRO_BEATS.map((beat,i)=>`<p class="intro-line" data-line="${i}" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}" aria-hidden="true">${beat[language]}</p>`).join('')}</div>
 <p id="intro-live" class="sr-only" aria-live="polite"></p>
 <div class="intro-pips" aria-hidden="true">${INTRO_BEATS.map(()=>'<i></i>').join('')}</div>
 <button type="button" class="intro-skip" data-intro="skip">${language==='ar'?'تخطّ':'Skip'}</button>`;
}
