import {isArabic} from './i18n.ts';

/** Speak a changed decision once. Full progress remains in the inspectable field cue. */
export function fieldAnnouncement(message:string):string {
 if(isArabic())return arabicAnnouncement(message);
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

/**
 * The same rule in Arabic: known lines lose their countdowns, then any " · " part that
 * still carries a number (a Chronicle objective's progress or seconds) is dropped, so each passing second is not
 * spoken again. A line without " · " keeps its numbers (they are the content, "يضيف 10").
 */
function arabicAnnouncement(message:string):string {
 // Chronicle objective lines (game/chronicle-combat.ts), as the English branch above.
 if(message.startsWith('عربة الطحين '))return 'احمِ عربة الطحين وهي تسير.';
 if(message.startsWith('الكشّاف عائدٌ إلى البيت'))return 'الكشّاف عائدٌ إلى البيت.';
 if(message.startsWith('حرّر الكشّاف ·'))return 'حرّر الكشّاف. قف بجانب القفص.';
 if(/^القنديل \d+\/18/.test(message))return 'احرس القنديل، ثم حطّم البوّابة.';
 if(message.startsWith('حارس الجرس ·'))return 'حارس الجرس. اقطع رنينه بضربةٍ ثقيلة.';
 const plain=message
  .replace(/الجرس يرنّ بعد \d+ ث/,'الجرس يرنّ قريباً')
  .replace(/التجمّع \d+\/6/,'السريّة تتجمّع')
  .replace(/المؤونة تتكدّس \(\d+\)/,'المؤونة تتكدّس')
  .replace(/أو انتظر \d+ ث\./,'أو انتظر المؤونة.')
  .replace(/مؤونة أكثر بعد \d+ ث\./,'مؤونة أكثر قريباً.')
  .replace(/جاهز بعد \d+ ث\./,'جاهز حين تصل مؤونة أكثر.');
 const parts=plain.split(' · ');
 if(parts.length<2)return plain;
 const kept=parts.filter(part=>!/\d/.test(part));
 return kept.length?kept.join(' · '):parts[0].replace(/\s*[\d.,/%]+\s*/g,' ').trim();
}
