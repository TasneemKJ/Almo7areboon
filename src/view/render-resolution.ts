/** Raise canvas pixel density on phones without unbounded backing-store cost. */
export function battleResolution(devicePixelRatio:number):number {
 if(!Number.isFinite(devicePixelRatio)||devicePixelRatio<1)return 1;
 return Math.min(2,devicePixelRatio);
}
