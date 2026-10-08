import type Phaser from 'phaser';import type {Arrival} from './recruit-arrival.ts';
export function recruitFootprint(cue:Arrival,now:number,reduced:boolean) {
 const age=now-cue.at;if(!Number.isFinite(age)||age<0||now>=cue.at+.6)return null;
 return {alpha:(1-age/.6)*.34,width:cue.kind===2?6:3,height:cue.kind===2?2.3:1.5,
  spread:reduced?5:5+Math.min(1,age/.2)*3};
}
export function paintRecruitFootprints(layers:Phaser.GameObjects.Graphics[],cues:readonly Arrival[],now:number,groundY:number,gap:number,reduced:boolean):void {
 for(const cue of cues){const f=recruitFootprint(cue,now,reduced);if(!f)continue;
  const g=layers[cue.lane];if(!g)continue;const x=cue.x*.45,y=groundY+cue.lane*gap;
  g.fillStyle(0xd1b990,f.alpha);g.fillEllipse(x-f.spread,y,f.width,f.height);g.fillEllipse(x+f.spread,y+2,f.width,f.height);
 }
}
