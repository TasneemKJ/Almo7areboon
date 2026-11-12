import type { SaveSessionStatus } from '../game/save-session.ts';
import { tr } from './i18n.ts';

/** English, kept for readers of the constant; show `temporarySessionText()` instead. */
export const temporarySessionNotice = 'Temporary play — progress is not saved.';
/** The temporary-play notice in the current language. */
export function temporarySessionText(): string { return tr(temporarySessionNotice, 'لعب مؤقّت — لن يُحفظ تقدّمك.'); }
/** The "saving failed" notice shown on Quests and Camp, in the current language. */
export function savingUnavailableText(): string {
  return tr('Saving is unavailable. Return Home, then open Settings to export a backup before closing.', 'الحفظ غير متاح. عُد إلى الرئيسية، ثم افتح الإعدادات وصدّر نسخة احتياطية قبل الإغلاق.');
}

/** Recovery is deliberately non-dismissable; main owns modal isolation and focus. */
const stillMessage = (): Partial<Record<SaveSessionStatus, string>> => ({
  blocked: tr('Still open in another tab. Close that tab, then try again.', 'ما تزال اللعبة مفتوحة في تبويب آخر. أغلقه ثم حاول مجدّداً.'),
  unavailable: tr('Saving is still unavailable in this browser.', 'ما يزال الحفظ غير متاح في هذا المتصفّح.'),
});

/** `retried` is true after the player pressed the retry button and the same problem came back, so the press is acknowledged. */
export function saveSessionDialogHtml(status: SaveSessionStatus, retried = false): string {
  const content = {
    blocked: [tr('Game open in another tab', 'اللعبة مفتوحة في تبويب آخر'), tr('Close the other game tab, then continue here. Your saved progress is protected.', 'أغلق تبويب اللعبة الآخر، ثم تابع هنا. تقدّمك المحفوظ في أمان.'), tr('CONTINUE HERE', 'تابع هنا')],
    conflict: [tr('Your save changed in another tab', 'تغيّر حفظك في تبويب آخر'), tr('This tab is paused to protect your progress. Reload the saved game before continuing.', 'توقّف هذا التبويب ليحمي تقدّمك. حمّل اللعبة المحفوظة قبل أن تتابع.'), tr('LOAD SAVED PROGRESS', 'حمّل التقدّم المحفوظ')],
    unavailable: [tr('Saving is unavailable', 'الحفظ غير متاح'), tr('This browser cannot safely save this session. You can play temporarily and export a backup.', 'لا يستطيع هذا المتصفّح حفظ الجلسة بأمان. يمكنك اللعب مؤقّتاً وتصدير نسخة احتياطية.'), tr('TRY SAVING AGAIN', 'حاول الحفظ مجدّداً')],
    unsupported: [tr('This save needs a newer game version', 'هذا الحفظ يحتاج نسخة أحدث من اللعبة'), tr('Your existing save is protected. Temporary play will not replace it.', 'حفظك الحاليّ في أمان، واللعب المؤقّت لن يستبدله.'), null],
  };
  if (!(status in content)) return '';
  const [title, explanation, retry] = content[status as keyof typeof content], still = stillMessage()[status];
  return `<span class="eyebrow">${tr('SAVED PROGRESS', 'التقدّم المحفوظ')}</span><h2 id="dialog-title">${title}</h2><p>${explanation}</p>${retried && still ? `<p class="session-retry" role="status">${still}</p>` : ''}
    <div class="session-actions">${retry ? `<button class="big-button blue" data-command="session-continue">${retry}</button>` : ''}
    ${status === 'unavailable' || status === 'unsupported' ? `<button class="big-button secondary" data-command="session-temporary">${tr('PLAY WITHOUT SAVING', 'العب دون حفظ')}</button>` : ''}
    <button class="big-button secondary" data-command="export">${tr('EXPORT THIS SESSION', 'صدّر هذه الجلسة')}</button></div>`;
}
