import type { SaveSessionStatus } from '../game/save-session.ts';

export const temporarySessionNotice = 'Temporary play — progress is not saved.';

/** Recovery is deliberately non-dismissable; main owns modal isolation and focus. */
export function saveSessionDialogHtml(status: SaveSessionStatus): string {
  const content = {
    blocked: ['Game open in another tab', 'Close the other game tab, then continue here. Your saved progress is protected.', 'CONTINUE HERE'],
    conflict: ['Your save changed in another tab', 'This tab is paused to protect your progress. Reload the saved game before continuing.', 'LOAD SAVED PROGRESS'],
    unavailable: ['Saving is unavailable', 'This browser cannot safely save this session. You can play temporarily and export a backup.', 'TRY SAVING AGAIN'],
    unsupported: ['This save needs a newer game version', 'Your existing save is protected. Temporary play will not replace it.', null],
  } as const;
  if (!(status in content)) return '';
  const [title, explanation, retry] = content[status as keyof typeof content];
  return `<span class="eyebrow">SAVED PROGRESS</span><h2 id="dialog-title">${title}</h2><p>${explanation}</p>
    <div class="session-actions">${retry ? `<button class="big-button blue" data-command="session-continue">${retry}</button>` : ''}
    ${status === 'unavailable' || status === 'unsupported' ? '<button class="big-button secondary" data-command="session-temporary">PLAY WITHOUT SAVING</button>' : ''}
    <button class="big-button secondary" data-command="export">EXPORT THIS SESSION</button></div>`;
}
