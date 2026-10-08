import type {GameEvent,Unit} from '../game/types.ts';
export const ARRIVAL_FOR=.3;
export function recruitArrivalFrame(kind:Unit['kind'],elapsed:number,reduced:boolean) {
 if(reduced||!Number.isFinite(elapsed)||elapsed<0||elapsed>=ARRIVAL_FOR)return {sx:1,sy:1,lift:0,forward:0};
 const p=elapsed/ARRIVAL_FOR,weight=kind===2?.045:kind===1?.075:.06;
 const settle=Math.sin(p*Math.PI)*(1-p);
 return {sx:1+weight*settle,sy:1-weight*settle,lift:Math.sin(p*Math.PI)*2*(1-p),forward:2*settle};
}
export interface Arrival {id:number;kind:Unit['kind'];x:number;lane:number;side:Unit['side'];at:number}
export class RecruitArrivals {
 private cues=new Map<number,Arrival>();
 record(event:GameEvent,units:readonly Unit[],at:number):boolean {
  if(event.type!=='spawn'||!Number.isFinite(event.x)||!Number.isFinite(event.lane)||!Number.isFinite(at))return false;
  const candidates=units.filter(u=>u.side===event.side&&u.lane===event.lane&&Math.abs(u.x-event.x!)<8&&!this.cues.has(u.id));
  const unit=candidates.sort((a,b)=>b.id-a.id)[0];if(!unit)return false;
  this.cues.set(unit.id,{id:unit.id,kind:unit.kind,x:event.x!,lane:unit.lane,side:unit.side,at});
  if(this.cues.size>120)this.cues.delete(this.cues.keys().next().value!);return true;
 }
 pose(id:number,now:number,reduced:boolean) {const cue=this.cues.get(id);return cue?recruitArrivalFrame(cue.kind,now-cue.at,reduced):{sx:1,sy:1,lift:0,forward:0};}
 entries(now:number):readonly Arrival[] {for(const [id,c]of this.cues)if(now-c.at>1)this.cues.delete(id);return [...this.cues.values()];}
 clear():void {this.cues.clear();}
}
