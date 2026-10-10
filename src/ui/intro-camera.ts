/**
 * The opening tale's camera: one critically damped spring per axis (scale, pan x/y in percent, dusk dim).
 * Retargeting keeps the current value and velocity, so beats chain without a dead stop, a Skip starts from
 * what is on screen, and the last velocity can be handed on to the live field. No DOM here.
 */
export interface CameraFrame { scale: number; x: number; y: number; dim: number }
export interface IntroCamera { value: CameraFrame; velocity: CameraFrame; target: CameraFrame; response: number }

const AXES = ['scale', 'x', 'y', 'dim'] as const;
/** The home screen's framing of the same plate: the tale opens from it and the field settles back to it. */
export const HOME_FRAME: Readonly<CameraFrame> = Object.freeze({ scale: 1, x: 0, y: 0, dim: 0 });

/**
 * Where each beat's camera heads, and how quickly (seconds; a spring's response, not a duration). Responses are
 * longer than the beats, so every beat change catches the camera still drifting: no stop, no start from rest.
 */
export const BEAT_FRAMES: Readonly<Record<'dusk' | 'rival' | 'rivalWide' | 'gather' | 'settle', { frame: CameraFrame; response: number }>> = Object.freeze({
  dusk: { frame: { scale: 1.2, x: 0, y: 1.5, dim: .16 }, response: 4.2 },
  // Toward the lantern road on the far hill, where the rival column walks down. A landscape screen crops the
  // plate's top away, so it tilts further up to find the same road.
  rival: { frame: { scale: 1.4, x: -20, y: 8, dim: .4 }, response: 3.8 },
  rivalWide: { frame: { scale: 1.4, x: -20, y: 30, dim: .4 }, response: 3.8 },
  gather: { frame: { scale: 1.05, x: 0, y: .5, dim: 0 }, response: 3.6 },
  settle: { frame: { ...HOME_FRAME }, response: .9 },
});

export function createCamera(from: CameraFrame = HOME_FRAME): IntroCamera {
  return { value: { ...from }, velocity: { scale: 0, x: 0, y: 0, dim: 0 }, target: { ...from }, response: 1 };
}

/** The camera aim for a beat on this screen shape. */
export function beatFrame(id: 'dusk' | 'rival' | 'gather', wide: boolean) {
  return BEAT_FRAMES[id === 'rival' && wide ? 'rivalWide' : id];
}

/** A new destination. Value and velocity are untouched: the move continues from the current motion. */
export function retarget(camera: IntroCamera, frame: CameraFrame, response: number): void {
  camera.target = { ...frame };
  camera.response = Math.max(.05, response);
}

/** Advances a critically damped spring (damping ratio 1). Small substeps keep long frames stable. */
export function stepCamera(camera: IntroCamera, dt: number): void {
  const omega = 2 * Math.PI / camera.response, stiffness = omega * omega, damping = 2 * omega;
  let left = Math.min(Math.max(dt, 0), .1);
  while (left > 1e-6) {
    const h = Math.min(left, 1 / 120);
    for (const axis of AXES) {
      const accel = stiffness * (camera.target[axis] - camera.value[axis]) - damping * camera.velocity[axis];
      camera.velocity[axis] += accel * h;
      camera.value[axis] += camera.velocity[axis] * h;
    }
    left -= h;
  }
  camera.value.dim = Math.min(1, Math.max(0, camera.value.dim));
}

/** True once the camera rests on its target. */
export function cameraSettled(camera: IntroCamera): boolean {
  return AXES.every(axis => Math.abs(camera.target[axis] - camera.value[axis]) < 1e-3 && Math.abs(camera.velocity[axis]) < 1e-2);
}

/** The plate's transform for a frame. */
export function plateTransform(frame: CameraFrame): string {
  return `translate3d(${frame.x.toFixed(3)}%,${frame.y.toFixed(3)}%,0) scale(${frame.scale.toFixed(4)})`;
}

/**
 * The field inherits a share of the camera's remaining move, so the hand-over keeps moving into play
 * instead of stopping at the seam. The same spring settles both to rest.
 */
export const WORLD_SHARE = .35;
export function worldTransform(frame: CameraFrame): string {
  return plateTransform({ scale: 1 + (frame.scale - 1) * WORLD_SHARE, x: frame.x * WORLD_SHARE, y: frame.y * WORLD_SHARE, dim: 0 });
}
