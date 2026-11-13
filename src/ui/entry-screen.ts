import type { Profile, BattleState } from '../game/types.ts';
import { chapterLandscape, chapterPresentation } from './chapter-presentation.ts';
import { n, tr } from './i18n.ts';

/** The page title in the current language (index.html carries the English one until boot). */
export function documentTitle():string { return tr('Almo7areboon — Through the Levant','المحاربون — عبر بلاد الشام'); }

/** A settings-only save is not evidence of play; older saves retain their real history. */
export function hasPriorPlay(profile:Profile):boolean {
 return profile.played===true||profile.deployed>0||profile.kills>0||profile.wins>0||profile.pendingVictory!==null;
}
export function entrySecondary(profile:Profile,state:BattleState):'camp'|'leave'|null {
 if(profile.pendingVictory||state.phase==='won'||state.phase==='lost')return null;
 if(state.phase==='running')return 'leave';
 return state.phase==='ready'&&hasPriorPlay(profile)?'camp':null;
}
export function entryCopy(profile:Profile,hasSavedProgress:boolean):{action:string;chapter:string;subtitle:string} {
 const chapter=chapterPresentation(profile.enemyAge);
 return {action:hasSavedProgress?tr('Continue','تابع'):tr('Play','العب'),chapter:chapter.title,subtitle:chapter.subtitle};
}

/** The entry is a quiet invitation, never an alternate progression or save owner. */
export function entryScreenHtml(profile:Profile):string {
 const copy=entryCopy(profile,false);
 return `<section id="entry-screen" class="entry-screen" aria-labelledby="entry-title">
 <img id="entry-art" class="entry-art" src="${chapterLandscape(profile.enemyAge)}" alt=""/>
 <div class="entry-copy"><p class="entry-kicker">${tr('A LEVANTINE FOLKTALE','حكاية من بلاد الشام')}</p><h1 id="entry-title">${tr('ALMO7AREBOON','المحاربون')}</h1><p id="entry-chapter">${copy.chapter}</p><p id="entry-subtitle">${copy.subtitle}</p><div id="entry-path">${journeyPathHtml(profile.enemyAge,false)}</div></div>
 <div class="entry-actions"><button id="entry-play" class="big-button green" data-command="enter-world" disabled>${tr('Play','العب')}</button><button id="entry-secondary" class="entry-settings" data-command="home-camp" hidden disabled>${tr('Camp','المخيّم')}</button><button id="entry-settings" class="entry-settings" data-command="settings" disabled>${tr('Settings','الإعدادات')}</button></div>
 </section>`;
}

/**
 * Where the player is on the six-chapter journey, under the chapter name on the entry screen. In the app without Full
 * Journey, chapters 3-6 are drawn as a locked stretch and the free scope is named; tapping it opens the card that says
 * exactly what Full Journey adds. On the web (and once owned) it is only the path.
 */
export function journeyPathHtml(chapterIndex:number,locked:boolean):string {
 const here=Math.max(0,Math.min(5,Math.floor(Number.isFinite(chapterIndex)?chapterIndex:0)));
 const dots=Array.from({length:6},(_,i)=>`<li class="${i<here?'path-done':i===here?'path-here':locked&&i>=2?'path-locked':'path-ahead'}"></li>`).join('');
 const label=tr(`Chapter ${here+1} of 6`,`الفصل ${here+1} من 6`);
 const note=locked
  ?`<button class="entry-path-note" data-command="full-journey">${tr('Chapters 1–2 free · 3–6 with Full Journey',`الفصلان ${n('1–2')} مجّاناً · ${n('3–6')} مع الرحلة كاملة`)}</button>`
  :`<span class="entry-path-note">${tr(`Chapter ${n(here+1)} of ${n(6)}`,`الفصل ${n(here+1)} من ${n(6)}`)}</span>`;
 return `<ol class="entry-path" aria-label="${label}">${dots}</ol>${note}`;
}
