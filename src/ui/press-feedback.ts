import { playPressAudio } from '../view/audio.ts';

export interface PressEnv { vibrate(pattern: number | number[]): unknown; tick(enabled: boolean): void }

const defaultEnv: PressEnv = {
  vibrate: pattern => (globalThis.navigator as Navigator | undefined)?.vibrate?.(pattern),
  tick: enabled => playPressAudio(enabled),
};

/**
 * What a finger feels and hears on every press: a short Taptic tap (in the iPhone app TasKit turns
 * `navigator.vibrate` into the Taptic Engine; iOS's own haptics setting decides) and a soft wooden tick when sound is
 * on. A recruit is a firmer tap and keeps its own deployment cue instead of the tick.
 */
export function pressFeedback(press: { sound: boolean; kind: 'press' | 'deploy' }, env: PressEnv = defaultEnv): void {
  try { env.vibrate(press.kind === 'deploy' ? 14 : 8); } catch { /* haptics are optional */ }
  if (press.kind === 'press') { try { env.tick(press.sound); } catch { /* audio is optional */ } }
}
