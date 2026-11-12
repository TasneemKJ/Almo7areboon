import { Game } from './simulation.ts';
import { tr } from './locale.ts';
import { decodeSave, MAX_SAVE_CHARS, saveProfile } from './save.ts';
import type { Profile } from './types.ts';
export const BACKUP_FORMAT = 'almo7areboon-backup';
export type BackupImport = { ok: true; profile: Profile } | { ok: false; error: string };

export function exportBackup(profile: Profile, createdAt = new Date()): string {
  const decoded = decodeSave(JSON.stringify(profile));
  if (!decoded.profile) throw new Error(tr('This save version cannot be exported.', 'لا يمكن تصدير هذه النسخة من الحفظ.'));
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, createdAt: createdAt.toISOString(), profile: decoded.profile }, null, 2);
}

/** Parsing has no storage or game-state side effects. The interface confirms replacement separately. */
export function importBackup(text: string): BackupImport {
  if (typeof text !== 'string' || text.length > MAX_SAVE_CHARS) return { ok: false, error: tr('Backup is too large. Choose an Almo7areboon JSON backup under 100 KB.', 'النسخة الاحتياطية كبيرة جداً. اختر نسخةً من المحاربون أصغر من 100 كيلوبايت.') };
  try {
    // Editors on Windows can save JSON with a byte-order mark, which JSON.parse rejects.
    const input: unknown = JSON.parse(text.replace(/^\uFEFF/, ''));
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: tr('This file does not contain a game save.', 'هذا الملف لا يحوي حفظاً للعبة.') };
    const envelope = input as Record<string, unknown>;
    let candidate: unknown = envelope;
    if ('format' in envelope) {
      if (envelope.format !== BACKUP_FORMAT || envelope.version !== 1) return { ok: false, error: tr('Unsupported backup format or version. Your current game was not changed.', 'صيغة النسخة الاحتياطية أو إصدارها غير مدعوم. لعبتك الحالية لم تتغيّر.') };
      candidate = envelope.profile;
    }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { ok: false, error: tr('The backup has no valid profile.', 'النسخة الاحتياطية لا تحوي ملفّ لاعبٍ صالحاً.') };
    const data = candidate as Record<string, unknown>;
    if (!Array.isArray(data.cards) || data.cards.length === 0 || !['timeline', 'age', 'enemyAge', 'coins'].every(key => typeof data[key] === 'number' && Number.isFinite(data[key]) && (data[key] as number) >= 0)) {
      return { ok: false, error: tr('Required game progress is missing or invalid. Your current game was not changed.', 'تقدّم اللعبة المطلوب ناقص أو غير صالح. لعبتك الحالية لم تتغيّر.') };
    }
    const decoded = decodeSave(JSON.stringify(candidate));
    if (!decoded.profile) return { ok: false, error: decoded.problem === 'unsupported' ? tr('This save needs a newer version of the game.', 'هذا الحفظ يحتاج إصداراً أحدث من اللعبة.') : tr('The save could not be validated.', 'تعذّر التحقّق من الحفظ.') };
    return { ok: true, profile: decoded.profile };
  } catch { return { ok: false, error: tr('Invalid JSON backup. Your current game was not changed.', 'ملفّ النسخة الاحتياطية تالف. لعبتك الحالية لم تتغيّر.') }; }
}

export function restoreBackup(current: Game, candidate: Profile, storage: Parameters<typeof saveProfile>[1]): { ok: boolean; game: Game } {
  return restoreBackupWithSave(current, candidate, profile => saveProfile(profile, storage));
}

/** Replace the playable game only after the caller's guarded writer commits. */
export function restoreBackupWithSave(current: Game, candidate: Profile, commit: (profile: Profile) => boolean): { ok: boolean; game: Game } {
  try {
    const replacement = new Game(candidate);
    if (commit(replacement.profile)) return { ok: true, game: replacement };
  } catch { /* A rejected writer cannot replace the current in-memory game. */ }
  return { ok: false, game: current };
}
