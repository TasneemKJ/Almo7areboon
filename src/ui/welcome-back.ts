/** Presentation only: a quiet line for a player who returns after a long time away. It grants nothing. */
export const AWAY_THRESHOLD_MS = 6 * 3_600_000;
const MAX_AWAY_MS = 365 * 86_400_000;

export function awayPhrase(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  if (days > 60) return 'many seasons';
  return days === 1 ? 'a day' : days < 14 ? `${days} days` : `${Math.floor(days / 7)} weeks`;
}

/** `lastSeen` and `now` are epoch milliseconds. Returns null for new players, short absences, bad or future timestamps. */
export function welcomeBackLine(lastSeen: number | undefined, now: number, wins: number): string | null {
  if (!(wins > 0) || typeof lastSeen !== 'number' || !Number.isFinite(lastSeen) || !Number.isFinite(now)) return null;
  const away = now - lastSeen;
  if (away < AWAY_THRESHOLD_MS || away > MAX_AWAY_MS * 20) return null;
  return `Welcome back. The village kept the lamps lit for ${awayPhrase(away)}.`;
}
