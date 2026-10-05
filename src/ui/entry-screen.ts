import type { Profile } from '../game/types.ts';
import { chapterLandscape, chapterPresentation } from './chapter-presentation.ts';

export function entryCopy(profile:Profile,hasSavedProgress:boolean):{action:string;chapter:string;subtitle:string} {
 const chapter=chapterPresentation(profile.enemyAge);
 return {action:hasSavedProgress?'Continue':'Play',chapter:chapter.title,subtitle:chapter.subtitle};
}

/** The entry is a quiet invitation, never an alternate progression or save owner. */
export function entryScreenHtml(profile:Profile):string {
 const copy=entryCopy(profile,false);
 return `<section id="entry-screen" class="entry-screen" aria-labelledby="entry-title">
 <img id="entry-art" class="entry-art" src="${chapterLandscape(profile.enemyAge)}" alt=""/>
 <div class="entry-copy"><p class="entry-kicker">A LEVANTINE FOLKTALE</p><h1 id="entry-title">ALMO7AREBOON</h1><p id="entry-chapter">${copy.chapter}</p><p id="entry-subtitle">${copy.subtitle}</p></div>
 <div class="entry-actions"><button id="entry-play" class="big-button green" data-command="enter-world" disabled>Play</button><button id="entry-settings" class="entry-settings" data-command="settings" disabled>Settings</button></div>
 </section>`;
}
