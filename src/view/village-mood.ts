import type {BattleState,GameEvent,Phase} from '../game/types.ts';

export type VillageMoodName='quiet'|'alarmed'|'recovering';
export interface VillageAlarmInterval {enteredAt:number;endedAt:number}
export interface VillageMoodSnapshot {mood:VillageMoodName;alarmMix:number;alarmSerial:number;time:number;alarmEnteredAt:number|null;alarmHistory?:readonly Readonly<VillageAlarmInterval>[]}
export interface VillageMoodState extends VillageMoodSnapshot {alarmHistory:readonly Readonly<VillageAlarmInterval>[];pressureSeconds:number;quietSeconds:number;alarmSeconds:number;recoverySeconds:number;lastPhase:Phase}
export interface VillageMoodInput {phase:Phase;hpFraction:number;nearestEnemyX:number;playerBaseHit:boolean;paused:boolean}
export interface VillagePresentation {battle:Readonly<BattleState>;age:number;mood:VillageMoodState}

export function createVillageMood():VillageMoodState {
 return {mood:'quiet',alarmMix:0,alarmSerial:0,time:0,alarmEnteredAt:null,alarmHistory:[],pressureSeconds:0,quietSeconds:0,alarmSeconds:0,recoverySeconds:0,lastPhase:'ready'};
}
const reached=(value:number,target:number)=>value+1e-9>=target;

/** Real presentation seconds; callers pass the renderer's clamped delta, never game speed. */
export function advanceVillageMood(previous:Readonly<VillageMoodState>,input:VillageMoodInput,dt:number):VillageMoodState {
 const phase:Phase=['ready','running','won','lost'].includes(input.phase)?input.phase:'ready';
 const seconds=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
 if(phase==='ready'&&previous.lastPhase!=='ready')return createVillageMood();
 const next={...previous};
 if(input.paused)return next;
 next.lastPhase=phase;
 // A fresh hit/result batch is applied by the owner at dt=0 while still running.
 if(phase==='won'||phase==='lost')return next;
 next.time+=seconds;
 if(phase==='ready')return next;
 const hp=Number.isFinite(input.hpFraction)?Math.max(0,Math.min(1,input.hpFraction)):1;
 const enemy=Number.isFinite(input.nearestEnemyX)?Math.max(0,Math.min(1000,input.nearestEnemyX)):Infinity;
 const pressure=hp<=.30||enemy<=300;
 next.pressureSeconds=pressure?next.pressureSeconds+seconds:0;
 const enter=()=>{
  next.mood='alarmed';next.alarmSerial++;next.alarmEnteredAt=next.time;
  next.alarmSeconds=0;next.quietSeconds=0;next.recoverySeconds=0;next.pressureSeconds=0;
 };
 if(next.mood!=='alarmed'&&(input.playerBaseHit||reached(next.pressureSeconds,.6))){enter();return next;}
 if(next.mood==='alarmed'){
  next.alarmSeconds+=seconds;
  next.quietSeconds=!input.playerBaseHit&&hp>.42&&enemy>420?next.quietSeconds+seconds:0;
  next.alarmMix=Math.min(1,next.alarmMix+seconds/.8);
  if(reached(next.alarmMix,1))next.alarmMix=1;
  if(reached(next.alarmSeconds,3)&&reached(next.quietSeconds,6)){
   // At least six seconds separate completed alarms. Two closed intervals plus
   // the current alarm retain admission for every 7.5-second scheduled passage.
   if(next.alarmEnteredAt!==null)next.alarmHistory=[...next.alarmHistory.slice(-1),{enteredAt:next.alarmEnteredAt,endedAt:next.time}];
   next.mood='recovering';next.recoverySeconds=0;next.pressureSeconds=0;
  }
 }else if(next.mood==='recovering'){
  next.recoverySeconds+=seconds;
  next.alarmMix=Math.max(0,1-next.recoverySeconds/4);
  if(reached(next.recoverySeconds,4)){next.mood='quiet';next.alarmMix=0;next.pressureSeconds=0;next.quietSeconds=0;}
 }
 return next;
}

/** Main owns this transient record. Identity resets precede pause/result gates. */
export function advanceVillagePresentation(previous:Readonly<VillagePresentation>|null,battle:Readonly<BattleState>,age:number,dt:number,events:readonly GameEvent[]=[],blocked=false):VillagePresentation {
 let mood=previous&&previous.battle===battle&&previous.age===age?previous.mood:createVillageMood();
 let nearestEnemyX=Infinity;
 for(const unit of battle.units)if(unit.side==='enemy'&&unit.hp>0&&Number.isFinite(unit.x))nearestEnemyX=Math.min(nearestEnemyX,unit.x);
 const hit=events.some(event=>event.type==='hit'&&event.target==='base'&&event.side==='enemy');
 const input:VillageMoodInput={phase:battle.phase,hpFraction:battle.playerHp/Math.max(1,battle.playerMaxHp),nearestEnemyX,playerBaseHit:false,paused:blocked||battle.paused};
 // Drain fresh hits before holding the final composition. Results can share the lethal-hit batch.
 if(hit&&(battle.phase==='running'||mood.lastPhase==='running'))mood=advanceVillageMood(mood,{...input,phase:'running',playerBaseHit:true},0);
 mood=advanceVillageMood(mood,input,dt);
 return {battle,age,mood};
}
