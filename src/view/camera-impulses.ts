export function createCameraImpulseLimiter() {
 let until=-Infinity,priority=-1;
 return {
  request(now:number,duration:number,intensity:number,rank:number,reduced:boolean) {
   if(reduced||![now,duration,intensity,rank].every(Number.isFinite)||duration<=0||intensity<=0)return null;
   if(now<until&&rank<=priority)return null;
   priority=rank;until=now+.25;
   return {duration:Math.min(180,duration),intensity:Math.min(.0025,intensity)};
  },
  reset():void {until=-Infinity;priority=-1;},
 };
}
