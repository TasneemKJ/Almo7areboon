import { Game } from './simulation.ts';
import { decodeSave, MAX_SAVE_CHARS, saveProfile } from './save.ts';
import type { Profile } from './types.ts';
export const BACKUP_FORMAT = 'almo7areboon-backup';
export type BackupImport = { ok: true; profile: Profile } | { ok: false; error: string };

export function exportBackup(profile: Profile, createdAt = new Date()): string {
  const decoded = decodeSave(JSON.stringify(profile));
  if (!decoded.profile) throw new Error('This save version cannot be exported.');
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, createdAt: createdAt.toISOString(), profile: decoded.profile }, null, 2);
}

/** Parsing has no storage or game-state side effects. The interface confirms replacement separately. */
export function importBackup(text: string): BackupImport {
  if (typeof text !== 'string' || text.length > MAX_SAVE_CHARS) return { ok: false, error: 'Backup is too large. Choose an Almo7areboon JSON backup under 100 KB.' };
  try {
    // Editors on Windows can save JSON with a byte-order mark, which JSON.parse rejects.
    const input: unknown = JSON.parse(text.replace(/^\uFEFF/, ''));
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'This file does not contain a game save.' };
    const envelope = input as Record<string, unknown>;
    let candidate: unknown = envelope;
    if ('format' in envelope) {
      if (envelope.format !== BACKUP_FORMAT || envelope.version !== 1) return { ok: false, error: 'Unsupported backup format or version. Your current game was not changed.' };
      candidate = envelope.profile;
    }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { ok: false, error: 'The backup has no valid profile.' };
    const data = candidate as Record<string, unknown>;
    if (!Array.isArray(data.cards) || data.cards.length === 0 || !['timeline', 'age', 'enemyAge', 'coins'].every(key => typeof data[key] === 'number' && Number.isFinite(data[key]) && (data[key] as number) >= 0)) {
      return { ok: false, error: 'Required game progress is missing or invalid. Your current game was not changed.' };
    }
    const decoded = decodeSave(JSON.stringify(candidate));
    if (!decoded.profile) return { ok: false, error: decoded.problem === 'unsupported' ? 'This save needs a newer version of the game.' : 'The save could not be validated.' };
    return { ok: true, profile: decoded.profile };
  } catch { return { ok: false, error: 'Invalid JSON backup. Your current game was not changed.' }; }
}

export function restoreBackup(current: Game, candidate: Profile, storage?: Parameters<typeof saveProfile>[1]): { ok: boolean; game: Game } {
  const replacement = new Game(candidate);
  return saveProfile(replacement.profile, storage) ? { ok: true, game: replacement } : { ok: false, game: current };
}
