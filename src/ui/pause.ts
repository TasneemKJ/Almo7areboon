import type { Phase } from '../game/types.ts';
export interface PauseContext { phase: Phase; manual: boolean; tab: string; modal: string | null; hidden: boolean; }

/** Independent owners prevent closing a dialog from resuming a manually paused battle. */
export function pauseReason(context: PauseContext): 'hidden' | 'menu' | 'screen' | 'manual' | null {
  if (context.phase !== 'running') return null;
  if (context.hidden) return 'hidden';
  if (context.modal) return 'menu';
  if (context.tab !== 'battle') return 'screen';
  return context.manual ? 'manual' : null;
}
