/** Speak a changed decision once. Full progress remains in the inspectable field cue. */
export function fieldAnnouncement(message:string):string {
 if(message.startsWith('Flour cart '))return 'Protect the flour cart as it moves.';
 if(message.startsWith('Scout returning home'))return 'Scout returning home.';
 if(message.startsWith('Free the scout ·'))return 'Free the scout. Stand beside the cage.';
 if(/^Lantern \d+\/18 seconds/.test(message))return 'Hold the lantern, then break the gate.';
 if(message.startsWith('Bell Keeper ·'))return 'Bell Keeper. Interrupt the bell with a heavy strike.';
 return message
  .replace(/Food is piling up \(\d+\)/,'Food is piling up')
  .replace(/or wait \d+s\./,'or wait for food.')
  .replace(/More food in \d+s\./,'More food soon.')
  .replace(/Ready in \d+s\./,'Ready when more food arrives.')
  .replace(/ · \d+(?:\.\d+)? seconds (?:left|to take it)/,'')
  .replace(/for \d+(?:\.\d+)? seconds?/,'until it is claimed')
  .replace(/Bell ringing in \d+s/,'Bell ringing soon')
  .replace(/Gathering \d+\/6/,'Gathering the company');
}
