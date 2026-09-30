import { encounterForAge, type WaveIntent } from '../game/encounters.ts';
import type { Phase } from '../game/types.ts';
import { chapterPresentation } from './chapter-presentation.ts';

export interface ChapterScouting {
 readonly openingSeconds:number;
 readonly openingCounts:readonly [number,number,number];
 readonly opening:string;
 readonly threatSeconds:number;
 readonly threatIntent:WaveIntent;
 readonly threat:string;
 readonly counter:string;
}
const countsText=(counts:readonly number[])=>counts.flatMap((count,kind)=>count?[`${count} ${['melee','ranged','heavy'][kind]}`]:[]).join(', ');

/** Scouting reads the opponent schedule, never the player's army age. */
export function chapterScouting(chapter:number):ChapterScouting {
 const encounter=encounterForAge(chapter),opening=encounter.waves[0];
 const threat=encounter.waves.find(wave=>wave.intent!=='rush')??opening;
 const counts=(members:typeof opening.members):readonly [number,number,number]=>Object.freeze([
  members.filter(member=>member.kind===0).length,
  members.filter(member=>member.kind===1).length,
  members.filter(member=>member.kind===2).length,
 ]);
 const openingCounts=counts(opening.members);
 return Object.freeze({openingSeconds:opening.time,openingCounts,
  opening:`First wave: ${countsText(openingCounts)} in ${opening.time}s.`,
  threatSeconds:threat.time,threatIntent:threat.intent,
  threat:`${threat.intent==='bulwark'?'Heavy pressure':'Ranged pressure'} at ${threat.time}s: ${countsText(counts(threat.members))}.`,
  counter:threat.intent==='bulwark'?'Ranged troops pierce heavy enemies. Keep a front line ahead of them.':'Melee guards resist ranged attacks. Keep your ranged troops behind them.',
 });
}

export function chapterScoutingHtml(chapter:number):string {
 const view=chapterScouting(chapter);
 return `<details class="chapter-scouting"><summary>Scouting ${chapterPresentation(chapter).title}</summary><p>${view.opening}</p><p>${view.threat}</p><p>${view.counter}</p><small>Times are battle seconds. Each wave can arrive in a staggered group.</small></details>`;
}

/** Optional, repeatable help: no forced tutorial or persistent completion flag. */
export function battleTeachingHtml():string {
 return `<details class="chapter-scouting battle-teaching"><summary>How a battle works</summary><p>Tap Battle to begin. Food grows during battle. Spend it on warriors; they move and fight automatically. Destroy the enemy base to win.</p><p>Melee guards resist ranged attacks. Ranged troops pierce heavy enemies. Heavy troops can sweep two enemies at once. Unlock extra roles with coins, then protect your ranged troops with a front line.</p><p>Each skill works once per battle. Freeze starts immediately, even before enemies arrive: save it for a gathering group. Meteor hits living enemies in a group; Food Drop helps you deploy reinforcements.</p><p>Pause to think. Your coins stay after a defeat, so upgrade, change your formation and try again. Extra seals are optional challenges. Clear the chapter to continue.</p></details>`;
}

const voices:readonly (readonly [string,string])[]=[
 ['The hearth-keeper says: “The soup can wait. You cannot.”','The hearth-keeper says: “Same fire tomorrow. Bring a bigger spoon.”'],
 ['A voice from the press-house: “A fine watch. Even the olives approve.”','A voice from the press-house: “Bent branches still bear fruit. Try again.”'],
 ['The quay-keeper says: “Not a fish out of place. Mostly.”','The quay-keeper says: “A rough tide is still a tide. We will find our footing.”'],
 ['The lantern-maker says: “A bright evening. I shall take some credit.”','The lantern-maker says: “One wick at a time. Then another watch.”'],
 ['The hill watch says: “Tea first. Heroics after the kettle.”','The hill watch says: “The kettle is patient. So are we.”'],
 ['From the courtyard: “Strange stars. Familiar courage.”','From the courtyard: “The stars can wait. Begin again when you are ready.”'],
];
/** Authored fictional dialogue only; no resident simulation or economic effect. */
export function villageVoice(chapter:number,phase:Phase):string {
 if(phase!=='won'&&phase!=='lost')return '';
 const index=Number.isInteger(chapter)&&chapter>=0&&chapter<voices.length?chapter:0;
 return voices[index][phase==='won'?0:1];
}
