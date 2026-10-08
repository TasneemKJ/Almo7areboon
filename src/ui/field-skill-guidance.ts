/** Adapt the canonical teaching decision to physical enemy selection; do not
 * duplicate or broaden its wins, time, skill-use or enemy-count predicates. */
export function physicalSkillCue(canonical:string,supportName='Food Drop'):string {
 if(canonical.startsWith('Your base is in danger.'))return canonical;
 if(canonical.startsWith('Food is piling up'))return canonical;
 if(canonical.includes('Tap Freeze'))return 'Select an enemy, then Freeze to hold the group.';
 if(canonical.includes('Tap Meteor'))return 'Select an enemy, then Meteor to strike the group.';
 if(canonical.startsWith('Food Drop adds'))return 'Select supplies, then Food Drop for food now, once per battle.';
 if(canonical.startsWith('Try a skill:')&&canonical.includes(supportName))return `Select supplies, then ${supportName}. Each skill works once per battle.`;
 return '';
}
