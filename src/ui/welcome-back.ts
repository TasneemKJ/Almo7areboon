import { plural, tr } from './i18n.ts';

/** Presentation only: a quiet line for a player who returns after a long time away. It grants nothing. */
export const AWAY_THRESHOLD_MS = 6 * 3_600_000;
const MAX_AWAY_MS = 365 * 86_400_000;

export function awayPhrase(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return tr(`${hours} hours`, `${hours} ${plural(hours, ['', ''], ['ساعة', 'ساعتين', 'ساعات', 'ساعة'])}`);
  const days = Math.floor(hours / 24);
  if (days > 60) return tr('many seasons', 'مواسم كثيرة');
  const weeks = Math.floor(days / 7);
  return days === 1 ? tr('a day', 'يوماً') : days < 14 ? tr(`${days} days`, days === 2 ? 'يومين' : `${days} ${plural(days, ['', ''], ['يوم', 'يومين', 'أيام', 'يوماً'])}`) : tr(`${weeks} weeks`, weeks === 2 ? 'أسبوعين' : `${weeks} ${plural(weeks, ['', ''], ['أسبوع', 'أسبوعين', 'أسابيع', 'أسبوعاً'])}`);
}

/** `lastSeen` and `now` are epoch milliseconds. Returns null for new players, short absences, bad or future timestamps. */
export function welcomeBackLine(lastSeen: number | undefined, now: number, wins: number): string | null {
  if (!(wins > 0) || typeof lastSeen !== 'number' || !Number.isFinite(lastSeen) || !Number.isFinite(now)) return null;
  const away = now - lastSeen;
  if (away < AWAY_THRESHOLD_MS || away > MAX_AWAY_MS * 20) return null;
  return tr(`Welcome back. The village kept the lamps lit for ${awayPhrase(away)}.`, `أهلاً بعودتك. أبقت القرية القناديل مضاءة ${awayPhrase(away)}.`);
}
