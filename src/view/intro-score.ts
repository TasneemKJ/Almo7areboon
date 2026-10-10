/**
 * The opening tale's score, as data: a low drone bed, a short Hijaz motif on D and one or two accents per
 * beat, then a soft resolve into play. Times are seconds from the start of their beat, so the visual beat
 * timer is the one clock both follow. Peaks stay at or below the game's loudest existing cue (0.045).
 */
export type IntroBeatId = 'dusk' | 'rival' | 'gather';
/** The envelope every score note uses: a short linear attack, then an exponential fall to silence. */
export const noteAttack = (note: Pick<ScoreNote, 'dur' | 'attack'>) => note.attack ?? Math.min(.04, note.dur / 4);
export type ScoreBus = 'effects' | 'atmosphere';
export interface ScoreNote {
  readonly at: number; readonly hz: number; readonly dur: number; readonly peak: number;
  readonly wave: OscillatorType; readonly bus: ScoreBus;
  /** Optional pitch glide target, for the low drum-like thuds. */
  readonly to?: number;
  /** A slower swell than the default pluck. */
  readonly attack?: number;
}

/** The loudest level an existing combat cue reaches; nothing in the intro is louder. */
export const SCORE_PEAK_LIMIT = .045;

// Hijaz on D: D Eb F# G A Bb. Familiar to Levantine ears; kept to a few notes.
const D3 = 146.83, D4 = 293.66, Eb4 = 311.13, Fs4 = 369.99, G4 = 392, A4 = 440, Bb4 = 466.16, D5 = 587.33;
const motif = (at: number, hz: number, dur = .55, peak = .02): ScoreNote => ({ at, hz, dur, peak, wave: 'triangle', bus: 'atmosphere' });

/** A quiet bed under the whole tale: a fifth on D, faded in and held until the hand-over. */
export const SCORE_BED: readonly ScoreNote[] = Object.freeze([
  { at: 0, hz: 73.42, dur: 0, peak: .011, wave: 'sine', bus: 'atmosphere' },
  { at: 0, hz: 110, dur: 0, peak: .008, wave: 'sine', bus: 'atmosphere' },
]);
export const BED_FADE_IN = 1.4;

/** One or two accents per beat, plus the motif phrase that carries the story. */
export const SCORE_BEATS: Readonly<Record<IntroBeatId, readonly ScoreNote[]>> = Object.freeze({
  // The lamps: one bell, then the motif rising.
  dusk: [{ at: .25, hz: G4, dur: .9, peak: .03, wave: 'sine', bus: 'effects' }, motif(.7, D4), motif(1.1, Eb4), motif(1.5, Fs4), motif(2.0, G4, .9)],
  // The rival column: two soft far drums under a motif that leans on the flat sixth.
  rival: [{ at: 0, hz: 95, to: 42, dur: .3, peak: .03, wave: 'triangle', bus: 'effects' }, { at: .45, hz: 95, to: 42, dur: .3, peak: .026, wave: 'triangle', bus: 'effects' }, motif(.9, A4), motif(1.3, Bb4, .7), motif(1.95, A4, .7)],
  // The gathering: a rally rise, and the motif climbing toward home.
  gather: [{ at: 0, hz: 240, to: 400, dur: .28, peak: .028, wave: 'triangle', bus: 'effects' }, motif(.45, D4), motif(.8, Fs4), motif(1.15, A4, .9)],
});

/** The hand-over: an open D chord swells softly while the bed fades with the picture. */
export const SCORE_RESOLVE: readonly ScoreNote[] = Object.freeze([
  { at: 0, hz: D3, dur: 1.6, peak: .008, attack: .35, wave: 'sine', bus: 'atmosphere' },
  { at: 0, hz: D4, dur: 1.6, peak: .008, attack: .35, wave: 'sine', bus: 'atmosphere' },
  { at: .06, hz: Fs4, dur: 1.5, peak: .007, attack: .35, wave: 'sine', bus: 'atmosphere' },
  { at: .12, hz: D5, dur: 1.4, peak: .006, attack: .35, wave: 'sine', bus: 'atmosphere' },
]);
/** How long the bed takes to leave after the resolve, and after a Skip (never a hard cut). */
export const RESOLVE_FADE = 1.2, SKIP_FADE = .2;
