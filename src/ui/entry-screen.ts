import type { Profile, BattleState } from '../game/types.ts';
import { chapterLandscape, chapterPresentation } from './chapter-presentation.ts';

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
 return {action:hasSavedProgress?'Continue':'Play',chapter:chapter.title,subtitle:chapter.subtitle};
}

/** The entry is a quiet invitation, never an alternate progression or save owner. */
export function entryScreenHtml(profile:Profile):string {
 const copy=entryCopy(profile,false);
 return `<section id="entry-screen" class="entry-screen" aria-labelledby="entry-title">
 <img id="entry-art" class="entry-art" src="${chapterLandscape(profile.enemyAge)}" alt=""/>
 <div class="entry-copy"><p class="entry-kicker">A LEVANTINE FOLKTALE</p><h1 id="entry-title">ALMO7AREBOON</h1><p id="entry-chapter">${copy.chapter}</p><p id="entry-subtitle">${copy.subtitle}</p></div>
 <div class="entry-actions"><button id="entry-play" class="big-button green" data-command="enter-world" disabled>Play</button><button id="entry-secondary" class="entry-settings" data-command="home-camp" hidden disabled>Camp</button><button id="entry-settings" class="entry-settings" data-command="settings" disabled>Settings</button></div>
 </section>`;
}
