import type { CampCounsel } from '../game/counsel.ts';
import { unitPresentationName } from './chapter-presentation.ts';
import { tr } from './i18n.ts';

/**
 * What the defeat card says when Camp has one place worth a visit. The village speaks, not a tutorial: it names why the
 * battle was lost in the journey's own words (bread, the home gate, a troop waiting by the fire) and where to go.
 */
export function counselCopy(counsel: CampCounsel, age: number): { line: string; button: string } {
  if (counsel.station === 'storehouse') return {
    line: tr('Courage was not short; bread was. Their waves came faster than your food. You have the coins to fill the storehouse.', 'لم تنقصك الشجاعة، نقصك الخبز: جاءت موجاتهم أسرع من مؤونتك. ومعك من النقود ما يملأ المخزن.'),
    button: tr('To the storehouse', 'إلى المخزن'),
  };
  if (counsel.station === 'gate') return {
    line: tr('Your company held; the home gate fell first. You have the coins to strengthen it.', 'صمدت سريّتك، وسقطت بوّابة الديار أوّلاً. ومعك من النقود ما يقوّيها.'),
    button: tr('To the home gate', 'إلى بوّابة الديار'),
  };
  const name = unitPresentationName(age, counsel.kind);
  return {
    line: tr(`${name} waits by the fire to walk with you. You have the coins to invite them.`, `${name} ينتظر عند النار ليمشي معك. ومعك من النقود ما يدعوه.`),
    button: tr('To your company', 'إلى سريّتك'),
  };
}

/** The Camp place a counsel opens, as the data attribute the result button carries. */
export const counselStation = (counsel: CampCounsel) => counsel.station === 'company' ? `company-${counsel.kind}` : counsel.station;
