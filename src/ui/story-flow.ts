import type {Phase} from '../game/types.ts';

/** What the shell shows after an accepted Chronicle action. */
export type StoryFollowUp='stay'|'discoveries'|'chronicle'|'battle'|'battle-chronicle'|'company';

/** Decides the screen that follows a Chronicle action from its type and the battle phase; no DOM involved. */
export function storyFollowUp(type:string,phase:Phase):StoryFollowUp {
  if(type==='rally')return 'stay';
  if(type==='chronicle-discover'||type==='chronicle-provision')return phase==='won'||phase==='lost'?'discoveries':'chronicle';
  if(type==='chronicle-abandon')return 'battle-chronicle';
  if(type==='chronicle-route'||type==='chronicle-expedition'||type==='chronicle-continue')return 'battle';
  return 'company';
}
