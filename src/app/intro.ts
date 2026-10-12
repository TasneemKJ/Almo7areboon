import { INTRO_BEATS, INTRO_SETTLE_MS, introCues, introHtml, introLength } from '../ui/intro-screen.ts';
import { BEAT_FRAMES, beatFrame, cameraSettled, createCamera, plateTransform, retarget, stepCamera, worldTransform, type IntroCamera } from '../ui/intro-camera.ts';
import { beginIntroScore, endIntroScore, introScoreBeat } from '../view/audio.ts';
import type { Runtime } from './runtime.ts';
import type { ShellApi } from './shell.ts';

/** State owned by the intro module. Siblings see only whether it is playing. */
export interface IntroState {
  playing: boolean;
  beat: number;
  /** Watched again from Settings while already in the world: it returns there instead of entering. */
  replay: boolean;
  /** The manual pause to restore after a replay over a live battle. */
  wasPaused: boolean;
  timers: number[];
  layer: HTMLElement | null;
  camera: IntroCamera | null;
  frame: number;
  lastTick: number;
}

/** What the intro needs: its own state, page operations through the dom port and sibling operations. */
export interface IntroDeps {
  dom: Pick<Runtime, 'root' | 'lifetime' | 'createElement' | 'setTimer' | 'clearTimer' | 'requestFrame' | 'cancelFrame' | 'now' | 'rootElement' | 'hidden'>;
  ports: Pick<ShellApi, 'action' | 'closeModal' | 'enterWorld' | 'entryReady' | 'guardAction' | 'navState' | 'playable' | 'sessionState' | 'showFieldPause' | 'syncPause'>;
}

/** Reduced motion keeps the beats as stills joined by short cross-fades; this is that fade. */
const STILL_FADE_MS = 300;

/**
 * The opening tale: three short beats over the chapter's own painted plate and walking troops, then a hand-over
 * into the field. It plays once on a first launch (the profile's optional `introPending`), or again from Settings.
 * One tap on Skip, or Escape, ends it at any frame. Seen or skipped is recorded through Game.dispatch.
 * One spring camera drives the plate, so beats chain without a stop, Skip starts from the frame on screen and
 * the field inherits the camera's remaining motion.
 */
export function createIntro(deps: IntroDeps) {
  const { ports, dom } = deps;
  const { root, lifetime } = dom;
  const introState: IntroState = { playing: false, beat: 0, replay: false, wasPaused: false, timers: [], layer: null, camera: null, frame: 0, lastTick: 0 };
  let language:'en'|'ar'='en';
  const reduced = () => dom.rootElement().dataset.motion === 'reduced';
  const schedule = (ms: number, run: () => void) => { introState.timers.push(dom.setTimer(run, ms)); };
  const shell = () => root.querySelector<HTMLElement>('.game-shell');
  const field = () => root.querySelector<HTMLElement>('#battlefield');

  /** Paints the camera on the plate, the dusk dim and, after the hand-over, the field. */
  function paint(camera: IntroCamera, layer: HTMLElement | null) {
    const world = layer?.querySelector<HTMLElement>('.intro-world'), dim = layer?.querySelector<HTMLElement>('.intro-dim');
    if (world) world.style.transform = plateTransform(camera.value);
    if (dim) dim.style.opacity = camera.value.dim.toFixed(3);
    if (!introState.playing && field()) field()!.style.transform = worldTransform(camera.value);
  }
  function tick() {
    const camera = introState.camera;
    if (!camera) return;
    const now = dom.now();
    stepCamera(camera, (now - introState.lastTick) / 1000);
    introState.lastTick = now;
    paint(camera, introState.layer);
    // After the hand-over the loop runs only until the field has settled with the camera.
    if (!introState.playing && !introState.layer && cameraSettled(camera)) { stopCamera(); return; }
    introState.frame = dom.requestFrame(tick);
  }
  function stopCamera() {
    dom.cancelFrame(introState.frame);
    introState.frame = 0; introState.camera = null;
    const scene = field();
    if (scene) scene.style.transform = '';
  }
  function setBeat(index: number) {
    const layer = introState.layer;
    if (!layer) return;
    // Recovery owns the page: a lost save session ends the tale without recording or entering anything.
    if (!ports.playable() || ports.navState.modal === 'session') { finish(false); return; }
    introState.beat = index;
    const beat = INTRO_BEATS[index];
    layer.dataset.beat = beat.id;
    if (introState.camera) { const aim = beatFrame(beat.id, layer.clientWidth > layer.clientHeight); retarget(introState.camera, aim.frame, aim.response); }
    const live = layer.querySelector<HTMLElement>('#intro-live');
    if (live) live.textContent = beat[language];
    // Sound follows the picture's clock: each beat's accents start when its frame does.
    introScoreBeat(beat.id);
  }
  function start(replay: boolean) {
    stopCamera();
    const layer = dom.createElement('div');
    layer.id = 'intro-layer'; layer.className = 'intro-layer';layer.lang=language;
    layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', language==='ar'?'الحكاية الافتتاحية':'Opening tale');
    layer.innerHTML = introHtml(ports.sessionState.game.profile.enemyAge,language);
    // The tale owns its input: nothing below it hears these events.
    layer.addEventListener('pointerdown', event => event.stopPropagation());
    layer.addEventListener('click', event => {
      event.stopPropagation();
      const target = (event.target as Element | null)?.closest?.('[data-intro="skip"]');
      if (target) { event.preventDefault(); finish(true); }
    });
    layer.querySelector('select')?.addEventListener('change',event=>{
      language=(event.target as HTMLSelectElement).value==='ar'?'ar':'en';layer.lang=language;
      layer.setAttribute('aria-label',language==='ar'?'الحكاية الافتتاحية':'Opening tale');
      const kicker=layer.querySelector<HTMLElement>('.intro-kicker');if(kicker){kicker.textContent=language==='ar'?'حكاية من بلاد الشام':'A LEVANTINE FOLKTALE';kicker.lang=language;}
      layer.querySelectorAll<HTMLElement>('.intro-line').forEach((line,index)=>{line.textContent=INTRO_BEATS[index][language];line.lang=language;line.dir=language==='ar'?'rtl':'ltr';});
      const skip=layer.querySelector<HTMLElement>('.intro-skip');if(skip)skip.textContent=language==='ar'?'تخطّ':'Skip';
      const live=layer.querySelector<HTMLElement>('#intro-live');if(live){live.textContent=INTRO_BEATS[introState.beat][language];live.lang=language;}
    });
    layer.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); finish(true); }
      if (event.key === 'Tab') { event.preventDefault(); const controls=Array.from(layer.querySelectorAll<HTMLElement>('select,button'));const index=controls.indexOf(layer.querySelector<HTMLElement>(':focus')!);controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length]?.focus(); }
    });
    // The camera opens on the home screen's framing of the same plate, so the first frame is not a cut.
    Object.assign(introState, { playing: true, replay, layer, beat: 0, timers: [], camera: reduced() ? null : createCamera(), lastTick: dom.now() });
    const page = shell();
    if (page) page.inert = true;
    root.dataset.intro = 'playing';
    root.append(layer);
    // Only a tap opens the tale, and that tap already unlocked audio; without it the score stays silent.
    beginIntroScore(ports.sessionState.game.profile.sound && ports.playable() && !dom.hidden(), ports.sessionState.atmosphereEnabled);
    setBeat(0);
    if (introState.camera) { paint(introState.camera, layer); introState.frame = dom.requestFrame(tick); }
    layer.querySelector<HTMLElement>('.intro-skip')?.focus({ preventScroll: true });
    introCues().forEach((at, i) => schedule(at, () => setBeat(i + 1)));
    schedule(introLength() - INTRO_SETTLE_MS, () => finish(true, false));
  }
  /** Ends the tale. A completed or skipped tale is recorded once, then hands over to the field. */
  function finish(completed: boolean, skipped = true) {
    if (!introState.playing) return;
    introState.playing = false;
    // The last beat resolves into play; a Skip or an interruption fades the score in a fifth of a second.
    endIntroScore(completed && !skipped ? 'resolve' : 'skip');
    for (const timer of introState.timers) dom.clearTimer(timer);
    introState.timers = [];
    const page = shell();
    if (page) page.inert = false;
    let entered = false;
    if (completed && ports.guardAction()) {
      if (ports.sessionState.game.profile.introPending) ports.action({ type: 'preference', preference: 'intro', value: false });
      if (!introState.replay) { ports.enterWorld(); entered = ports.navState.entryEntered; }
      else {
        ports.sessionState.manualPaused = introState.wasPaused;
        ports.syncPause();
        if (ports.sessionState.game.state.phase === 'running') ports.showFieldPause();
      }
    }
    delete root.dataset.intro;
    const layer = introState.layer;
    if (!layer) return;
    // Skip or the last beat: the camera turns toward the field's framing from its current value and velocity,
    // and the field below takes a share of that same motion while the painted layer dissolves.
    const camera = introState.camera;
    if (camera) {
      retarget(camera, BEAT_FRAMES.settle.frame, BEAT_FRAMES.settle.response);
      if (entered && field()) paint(camera, layer);
      else if (!entered) { dom.cancelFrame(introState.frame); introState.camera = null; }
    }
    layer.dataset.leaving = 'true';
    dom.setTimer(() => {
      layer.remove();
      if (introState.layer === layer) introState.layer = null;
    }, completed ? (reduced() ? STILL_FADE_MS : INTRO_SETTLE_MS) : 0);
  }
  /** Play on a first launch: the entry's Play opens the tale instead of the field. Returns whether it took the tap. */
  function playIntro(): boolean {
    if (introState.playing) return true;
    if (!ports.sessionState.game.profile.introPending || ports.navState.entryEntered || ports.navState.modal || !ports.guardAction() || !ports.entryReady()) return false;
    start(false);
    return true;
  }
  /** Settings' "Watch intro": asks for the tale through Game.dispatch, then plays it from where the player is. */
  function watchIntro() {
    if (introState.playing || ports.navState.modal !== 'settings' || !ports.guardAction()) return;
    ports.action({ type: 'preference', preference: 'intro', value: true });
    if (!ports.playable() || ports.navState.modal !== 'settings') return;
    const replay = ports.navState.entryEntered;
    if (!replay && !ports.entryReady()) return;
    introState.wasPaused = ports.sessionState.manualPaused;
    if (replay) ports.sessionState.manualPaused = true;
    ports.closeModal(false);
    ports.syncPause();
    start(replay);
  }
  lifetime.add(() => {
    for (const timer of introState.timers) dom.clearTimer(timer);
    introState.timers = []; introState.playing = false;
    stopCamera();
    introState.layer?.remove(); introState.layer = null;
  });
  return { playIntro, watchIntro, skipIntro: () => finish(true), introState: introState as Pick<IntroState, 'playing' | 'beat'> };
}
