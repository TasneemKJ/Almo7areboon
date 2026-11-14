/**
 * The battlefield renders at the display's own density, up to 3x (a 3x iPhone gets every pixel), and steps down only
 * when it cannot keep up: if the rolling frame time stays over 20 ms, half a density at a time, never below 1x.
 */
export const MAX_DENSITY = 3, SLOW_FRAME_MS = 20, DENSITY_STEP = .5, DENSITY_WINDOW = 90;

export function battleResolution(devicePixelRatio:number):number {
 if(!Number.isFinite(devicePixelRatio)||devicePixelRatio<1)return 1;
 return Math.min(MAX_DENSITY,devicePixelRatio);
}

/** Watches frame times; `frame` returns the new density when it steps down, otherwise null. Hitches (a hidden tab, a
 * stall over 250 ms) are not counted, so one slow moment never costs sharpness. */
export function createDensityGovernor(start:number){
 let density=battleResolution(start),sum=0,frames=0;
 return {
  get density(){return density;},
  frame(deltaMs:number):number|null{
   if(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>250)return null;
   sum+=deltaMs;frames++;
   if(frames<DENSITY_WINDOW)return null;
   const slow=sum/frames>SLOW_FRAME_MS;sum=0;frames=0;
   if(!slow||density<=1)return null;
   density=Math.max(1,density-DENSITY_STEP);return density;
  },
 };
}
