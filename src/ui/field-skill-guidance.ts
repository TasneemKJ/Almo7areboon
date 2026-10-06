/** Adapt the canonical teaching decision to physical enemy selection; do not
 * duplicate or broaden its wins, time, skill-use or enemy-count predicates. */
export function physicalSkillCue(canonical:string):string {
 if(canonical.startsWith('Food is piling up'))return canonical;
 if(canonical.includes('Tap Freeze'))return 'Select an enemy, then Freeze to hold the group.';
 if(canonical.includes('Tap Meteor'))return 'Select an enemy, then Meteor to strike the group.';
 return '';
}
