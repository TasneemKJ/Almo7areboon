import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game } from '../src/game/simulation.ts';
import { BACKUP_KEY, SAVE_KEY, decodeSave, defaultProfile, firstLaunchProfile, loadProfileWithStatus, saveProfile } from '../src/game/save.ts';
import { startOverProfile } from '../src/game/reset.ts';
import { INTRO_BEATS, INTRO_SETTLE_MS, introCues, introHtml, introLength } from '../src/ui/intro-screen.ts';
import { BEAT_FRAMES, HOME_FRAME, beatFrame, cameraSettled, coversScreen, createCamera, retarget, stepCamera, worldTransform } from '../src/ui/intro-camera.ts';
import { SCORE_BEATS, SCORE_BED, SCORE_PEAK_LIMIT, SCORE_RESOLVE, SKIP_FADE, noteAttack, type ScoreNote } from '../src/view/intro-score.ts';
import { preferencesHtml } from '../src/ui/preferences-screen.ts';
import * as audio from '../src/view/audio.ts';
import { recordedContext, installContext } from './helpers/audio-context.ts';
import { createIntro } from '../src/app/intro.ts';

const memory = () => { const entries = new Map<string, string>(); return { entries, getItem: (k: string) => entries.get(k) ?? null, setItem: (k: string, v: string) => { entries.set(k, v); } }; };

test('only a first launch owes the intro; old saves, backups and corrupt data never replay it', () => {
  assert.equal(loadProfileWithStatus(memory()).profile.introPending, true);
  const old = memory(); old.setItem(SAVE_KEY, JSON.stringify(defaultProfile()));
  assert.equal('introPending' in loadProfileWithStatus(old).profile, false, 'a save from before the intro existed stays as it was');
  const backupOnly = memory(); backupOnly.setItem(BACKUP_KEY, JSON.stringify(defaultProfile()));
  assert.equal(loadProfileWithStatus(backupOnly).status, 'recovered'); assert.equal('introPending' in loadProfileWithStatus(backupOnly).profile, false);
  const corrupt = memory(); corrupt.setItem(SAVE_KEY, '{broken');
  assert.equal('introPending' in loadProfileWithStatus(corrupt).profile, false);
  for (const value of [false, 1, 'yes', null, {}]) assert.equal('introPending' in decodeSave(JSON.stringify({ ...defaultProfile(), introPending: value })).profile!, false, String(value));
  assert.equal(decodeSave(JSON.stringify(firstLaunchProfile())).profile!.introPending, true);
  assert.equal('introPending' in startOverProfile(firstLaunchProfile()), false, 'Start over does not replay the tale');
});

test('the save key, its backup and the format survive a seen intro', () => {
  const store = memory(), game = new Game(firstLaunchProfile());
  assert.equal(saveProfile(game.profile, store), true);
  assert.equal(game.dispatch({ type: 'preference', preference: 'intro', value: false }), true);
  assert.equal(saveProfile(game.profile, store), true);
  const primary = JSON.parse(store.entries.get(SAVE_KEY)!), backup = JSON.parse(store.entries.get(BACKUP_KEY)!);
  assert.equal('introPending' in primary, false); assert.equal(backup.introPending, true, 'the backup keeps the previous save');
  assert.deepEqual(Object.keys(primary).sort(), Object.keys(defaultProfile()).sort(), 'a seen intro leaves the exact pre-intro shape');
});

test('the intro preference changes only through Game.dispatch with validated values', () => {
  const g = new Game(defaultProfile()); g.dispatch({ type: 'start' }); const battle = JSON.stringify(g.state);
  assert.equal(g.dispatch({ type: 'preference', preference: 'intro', value: true }), true); assert.equal(g.profile.introPending, true);
  assert.equal(g.dispatch({ type: 'preference', preference: 'intro', value: true }), false);
  assert.equal(g.dispatch({ type: 'preference', preference: 'intro', value: false }), true); assert.equal('introPending' in g.profile, false);
  for (const value of ['true', 1, null]) assert.equal(g.dispatch({ type: 'preference', preference: 'intro', value } as never), false);
  assert.equal(JSON.stringify(g.state), battle);
});

test('timing table: two or three beats, ten to twelve seconds, one short line per beat in English and Arabic', () => {
  assert.ok(INTRO_BEATS.length >= 2 && INTRO_BEATS.length <= 3);
  assert.ok(introLength() >= 10000 && introLength() <= 12000, String(introLength()));
  assert.deepEqual(introCues(), [INTRO_BEATS[0].ms, INTRO_BEATS[0].ms + INTRO_BEATS[1].ms]);
  for (const beat of INTRO_BEATS) {
    assert.ok(beat.en.split(' ').length <= 8 && /[.]$/.test(beat.en), beat.en);
    assert.match(beat.ar, /[؀-ۿ]/); assert.equal(beat.voice, undefined, 'no narrator yet');
  }
  const html = introHtml(0);
  assert.equal((html.match(/<button\b/g) || []).length, 1); assert.match(html, /data-intro="skip">Skip</);
  assert.match(html, /\/art\/storybook\/village\.webp/); assert.match(html, /pathkeeper-strip\.webp/);
  assert.doesNotMatch(html, /<video|\.mp4|\.webm/);
});

test('the score follows the beat table and never exceeds the game\'s cue level', () => {
  assert.deepEqual(Object.keys(SCORE_BEATS), INTRO_BEATS.map(beat => beat.id));
  for (const beat of INTRO_BEATS) {
    const notes = SCORE_BEATS[beat.id];
    assert.ok(notes.filter(n => n.bus === 'effects').length >= 1 && notes.filter(n => n.bus === 'effects').length <= 2, `${beat.id} has one or two accents`);
    for (const note of notes) assert.ok(note.at >= 0 && note.at * 1000 < beat.ms, `${beat.id} note at ${note.at} starts inside its beat`);
  }
  const all: ScoreNote[] = [...SCORE_BED, ...Object.values(SCORE_BEATS).flat(), ...SCORE_RESOLVE];
  for (const note of all) assert.ok(note.peak > 0 && note.peak <= SCORE_PEAK_LIMIT);
  // Sampled sum of every voice that can sound together inside a beat, bed included.
  const level = (note: ScoreNote, t: number) => { const a = noteAttack(note); if (t < note.at || t > note.at + note.dur) return 0; return t - note.at < a ? note.peak * (t - note.at) / a : note.peak * Math.pow(.0001 / note.peak, (t - note.at - a) / Math.max(1e-3, note.dur - a)); };
  const bed = SCORE_BED.reduce((sum, n) => sum + n.peak, 0);
  for (const notes of [...Object.values(SCORE_BEATS), SCORE_RESOLVE]) for (let t = 0; t < 3; t += .005) {
    const sum = bed + notes.reduce((s, n) => s + level(n, t), 0);
    assert.ok(sum <= SCORE_PEAK_LIMIT * 1.6, `summed level ${sum.toFixed(3)} at ${t.toFixed(2)}`);
  }
  assert.ok(SKIP_FADE >= .15 && SKIP_FADE <= .25, 'Skip fades the score, never a hard cut');
});

test('gesture gate: the score is silent until a tap unlocks audio, and respects Sound', () => {
  audio.disposeAudio();
  const c = recordedContext(), restore = installContext(c);
  try {
    assert.equal(audio.beginIntroScore(true, true), false, 'no gesture yet: nothing is created');
    assert.equal(c.oscillators.length, 0);
    audio.unlockAudio(true);
    assert.equal(audio.beginIntroScore(false, true), false, 'Sound off stays silent');
    assert.equal(audio.beginIntroScore(true, false), true);
    assert.equal(c.oscillators.length, 0, 'without Atmosphere the music bed is not played');
    audio.introScoreBeat('dusk');
    assert.equal(c.oscillators.length, SCORE_BEATS.dusk.filter(n => n.bus === 'effects').length);
    audio.endIntroScore('skip');
    assert.equal(audio.beginIntroScore(true, true), true);
    const before = c.oscillators.length; audio.introScoreBeat('rival');
    assert.equal(c.oscillators.length - before, SCORE_BEATS.rival.length);
    audio.endIntroScore('skip');
    const fades = c.gains.flatMap(g => g.gain.events).filter((e: any[]) => e[0] === 'linear' && e[1] === 0 && Math.abs(e[2] - (c.ctx.currentTime + SKIP_FADE)) < 1e-9);
    assert.ok(fades.length >= 2, 'both score buses ramp to silence over the skip fade');
    assert.ok(c.oscillators.every(o => o.stops.length > 0 && Math.min(...o.stops) >= c.ctx.currentTime), 'voices stop after the fade, not before');
    audio.unlockAudio(true); assert.equal(audio.beginIntroScore(true, true), true);
    const resolveFrom = c.oscillators.length; audio.endIntroScore('resolve');
    assert.equal(c.oscillators.length - resolveFrom, SCORE_RESOLVE.length, 'the hand-over plays the soft resolve');
  } finally { audio.disposeAudio(); restore(); }
});

test('camera: starts from rest on the home framing, never stops between beats and settles into the field', () => {
  const camera = createCamera();
  assert.deepEqual(camera.value, HOME_FRAME); assert.ok(Object.values(camera.velocity).every(v => v === 0), 'nothing starts at full speed');
  retarget(camera, BEAT_FRAMES.dusk.frame, BEAT_FRAMES.dusk.response);
  let t = 0, previous = 0; const speed = () => Math.hypot(camera.velocity.scale * 100, camera.velocity.x, camera.velocity.y);
  stepCamera(camera, 1 / 60); const first = speed();
  { const probe = createCamera(); retarget(probe, BEAT_FRAMES.dusk.frame, BEAT_FRAMES.dusk.response); let peak = 0; for (let i = 0; i < 180; i++) { stepCamera(probe, 1 / 60); peak = Math.max(peak, Math.hypot(probe.velocity.scale * 100, probe.velocity.x, probe.velocity.y)); } assert.ok(first < peak * .1, 'the first frame eases out of rest'); }
  for (const [index, at] of introCues().entries()) {
    while (t < at / 1000) { stepCamera(camera, 1 / 60); t += 1 / 60; }
    assert.ok(speed() > .05, `still moving when beat ${index + 1} begins`);
    previous = speed();
    const id = INTRO_BEATS[index + 1].id, carried = { ...camera.velocity }; retarget(camera, BEAT_FRAMES[id].frame, BEAT_FRAMES[id].response);
    assert.deepEqual(camera.velocity, carried, 'a retarget keeps the current velocity');
    const value = { ...camera.value }; stepCamera(camera, 1 / 60);
    assert.ok(Math.abs(camera.value.x - value.x) < .2 && Math.abs(camera.value.scale - value.scale) < .002, 'no jump at the seam');
    assert.ok(Math.abs(speed() - previous) < 2, 'velocity changes smoothly, by acceleration only');
  }
  // A Skip retargets from the current value and velocity; the value is continuous frame to frame.
  const before = { ...camera.value }; retarget(camera, BEAT_FRAMES.settle.frame, BEAT_FRAMES.settle.response); stepCamera(camera, 1 / 60);
  assert.ok(Math.abs(camera.value.scale - before.scale) < .01 && Math.abs(camera.value.x - before.x) < 1, 'no jump on Skip');
  // Critically damped: from rest it never overshoots its target.
  const rest = createCamera(); retarget(rest, BEAT_FRAMES.rival.frame, .4);
  for (let i = 0; i < 240; i++) { stepCamera(rest, 1 / 60); assert.ok(rest.value.scale <= BEAT_FRAMES.rival.frame.scale + 1e-6 && rest.value.x >= BEAT_FRAMES.rival.frame.x - 1e-6); }
  for (let i = 0; i < 600; i++) stepCamera(camera, 1 / 60);
  assert.ok(cameraSettled(camera)); assert.ok(Math.abs(camera.value.scale - 1) < 1e-3);
});

/** A tiny element stand-in for the intro factory. */
function element(): any {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  const self: any = { id: '', className: '', dataset: {}, style: {}, inert: false, innerHTML: '', removed: false, children: [] as any[], attrs: {} as Record<string, string>,
    setAttribute(k: string, v: string) { self.attrs[k] = v; }, addEventListener(type: string, fn: (e: any) => void) { (listeners[type] ??= []).push(fn); },
    dispatch(type: string, event: any) { for (const fn of listeners[type] ?? []) fn(event); }, append(child: any) { self.children.push(child); }, remove() { self.removed = true; },
    focus() {}, querySelector(selector: string) { return self.lookup?.(selector) ?? null; } };
  return self;
}
function harness(profile = firstLaunchProfile()) {
  const timers = new Map<number, { at: number; run: () => void }>(); let clock = 0, id = 0;
  const shell = element(), world = element(), battlefield = element(), layers: any[] = [];
  const root = element(); root.lookup = (s: string) => s === '.game-shell' ? shell : s === '#battlefield' ? battlefield : null;
  const game = new Game(profile), calls: string[] = [];
  const navState: any = { entryEntered: false, modal: null };
  const sessionState: any = { game, manualPaused: false, atmosphereEnabled: true };
  const dom: any = { root, lifetime: { add() {} }, hidden: () => false, now: () => clock, rootElement: () => ({ dataset: { motion: 'full' } }),
    createElement() { const layer = element(); const parts = new Map<string, any>(); layer.lookup = (s: string) => { if (!parts.has(s)) parts.set(s, element()); return parts.get(s); }; layers.push(layer); return layer; },
    setTimer(run: () => void, ms: number) { timers.set(++id, { at: clock + ms, run }); return id; }, clearTimer(t: number) { timers.delete(t); },
    requestFrame() { return 0; }, cancelFrame() {} };
  const ports: any = { navState, sessionState, playable: () => true, guardAction: () => true, entryReady: () => true, syncPause() {}, closeModal() { navState.modal = null; },
    action(a: any) { calls.push(`action:${a.preference}:${a.value}`); return game.dispatch(a); }, enterWorld() { calls.push('enter'); navState.entryEntered = true; }, showFieldPause() { calls.push('pause'); } };
  const intro = createIntro({ dom, ports });
  const advance = (ms: number) => { clock += ms; for (const [key, timer] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (timer.at <= clock && timers.has(key)) { timers.delete(key); timer.run(); } };
  return { intro, layers, shell, game, calls, navState, sessionState, advance, world, battlefield };
}

test('first launch: Play opens the tale, Skip on frame 1 records it and enters play, a reload does not replay', () => {
  const h = harness();
  assert.equal(h.intro.playIntro(), true); assert.equal(h.intro.introState.playing, true);
  assert.equal(h.shell.inert, true, 'the page below is inert while the tale owns input');
  assert.equal(h.layers[0].dataset.beat, 'dusk');
  h.layers[0].dispatch('click', { target: { closest: () => ({}) }, stopPropagation() {}, preventDefault() {} });
  assert.deepEqual(h.calls, ['action:intro:false', 'enter']); assert.equal(h.shell.inert, false);
  assert.equal(h.layers[0].dataset.leaving, 'true', 'Skip dissolves the layer rather than cutting it');
  assert.equal('introPending' in h.game.profile, false);
  const reload = harness(decodeSave(JSON.stringify(h.game.profile)).profile!);
  assert.equal(reload.intro.playIntro(), false, 'a seen intro never replays');
});

test('the tale runs its beats on one clock and enters the field when it ends', () => {
  const h = harness(); h.intro.playIntro();
  const beats: string[] = []; for (let t = 0; t < introLength(); t += 100) { h.advance(100); if (h.layers[0].dataset.beat && beats.at(-1) !== h.layers[0].dataset.beat) beats.push(h.layers[0].dataset.beat); }
  assert.deepEqual(beats, INTRO_BEATS.map(beat => beat.id)); assert.deepEqual(h.calls, ['action:intro:false', 'enter']);
  assert.ok(introLength() - INTRO_SETTLE_MS > INTRO_BEATS[0].ms + INTRO_BEATS[1].ms);
  assert.equal(h.layers[0].removed, true);
});

test('Watch intro asks through dispatch; from a live battle it keeps the battle paused and returns to the pause', () => {
  const h = harness(defaultProfile()); assert.equal(h.intro.playIntro(), false);
  h.navState.modal = 'settings'; h.navState.entryEntered = true; h.game.dispatch({ type: 'start' });
  h.intro.watchIntro();
  assert.equal(h.calls[0], 'action:intro:true'); assert.equal(h.sessionState.manualPaused, true); assert.equal(h.intro.introState.playing, true);
  h.intro.skipIntro();
  assert.deepEqual(h.calls, ['action:intro:true', 'action:intro:false', 'pause']); assert.equal(h.sessionState.manualPaused, false);
});

test('only taps open the tale, and Settings offers Watch intro', () => {
  const listeners = readFileSync(new URL('../src/app/listeners.ts', import.meta.url), 'utf8');
  assert.match(listeners, /if\(command==='enter-world'\)\{if\(!ports\.playIntro\(\)\)ports\.enterWorld\(\);return;\}/);
  assert.match(listeners, /'watch-intro':\(\)=>\{ports\.watchIntro\(\);\}/);
  // The click handler unlocks audio before any command runs, so the score always follows a gesture.
  assert.ok(listeners.indexOf('unlockAudio(ports.sessionState.game.profile.sound);') < listeners.indexOf("if(command==='enter-world')"));
  const app = readFileSync(new URL('../src/app/intro.ts', import.meta.url), 'utf8');
  assert.equal((app.match(/start\((false|replay)\)/g) || []).length, 2, 'the tale starts only from Play or Watch intro');
  assert.match(preferencesHtml(defaultProfile(), true, { effects: 100, atmosphere: 100 }, true, ''), /data-command="watch-intro">Watch intro</);
});

test('camera never shows an edge of the plate, on the way or at rest, in portrait or landscape', () => {
  for (const wide of [false, true]) {
    const camera = createCamera();
    for (const [i, beat] of INTRO_BEATS.entries()) {
      const aim = beatFrame(beat.id, wide); assert.ok(coversScreen(aim.frame), `${beat.id} target covers`);
      retarget(camera, aim.frame, aim.response);
      for (let t = 0; t < beat.ms / 1000; t += 1 / 60) { stepCamera(camera, 1 / 60); assert.ok(coversScreen(camera.value), `${wide ? 'landscape' : 'portrait'} ${beat.id} at ${t.toFixed(2)}s`); }
      if (i === INTRO_BEATS.length - 1) { retarget(camera, BEAT_FRAMES.settle.frame, BEAT_FRAMES.settle.response); for (let t = 0; t < 2; t += 1 / 60) { stepCamera(camera, 1 / 60); assert.ok(coversScreen(camera.value)); } }
    }
  }
  // The field's share of a mid-tale skip never zooms out or slides past its edges.
  const parse = (css: string) => css.replace('translate3d', '').match(/-?[\d.]+/g)!.map(Number);
  for (const frame of [BEAT_FRAMES.rival.frame, BEAT_FRAMES.rivalWide.frame, { scale: 1.1, x: -30, y: 25, dim: 0 }, { scale: .95, x: 4, y: 0, dim: 0 }]) {
    const [x, y, , scale] = parse(worldTransform(frame));
    assert.ok(scale >= 1 && Math.abs(x) <= (scale - 1) * 50 + 1e-9 && Math.abs(y) <= (scale - 1) * 50 + 1e-9, JSON.stringify(frame));
  }
});
