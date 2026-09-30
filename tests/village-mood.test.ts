import test from 'node:test';
import assert from 'node:assert/strict';

async function model(){const m=await import('../src/view/village-mood.ts').catch(()=>null);assert.ok(m,'shared village mood is missing');return m;}
const calm={phase:'running',hpFraction:1,nearestEnemyX:Infinity,playerBaseHit:false,paused:false} as const;
function elapsed(m:any,state:any,input:any,seconds:number){while(seconds>1e-9){const dt=Math.min(.05,seconds);state=m.advanceVillageMood(state,input,dt);seconds-=dt;}return state;}

// Catches early alarm entry, lost fractional elapsed time and exclusive pressure thresholds.
test('debouncedPressure',async()=>{const m=await model();for(const pressure of [{nearestEnemyX:299},{nearestEnemyX:300},{hpFraction:.30}]){let s=elapsed(m,m.createVillageMood(),{...calm,...pressure},.59);assert.equal(s.mood,'quiet');s=m.advanceVillageMood(s,{...calm,...pressure},.01);assert.equal(s.mood,'alarmed');assert.equal(s.alarmSerial,1);}assert.equal(elapsed(m,m.createVillageMood(),{...calm,nearestEnemyX:301,hpFraction:.31},5).mood,'quiet');});
// Catches duplicate signals and a dt=0 hit being discarded.
test('baseHitImmediate',async()=>{const m=await model();let s=m.advanceVillageMood(m.createVillageMood(),{...calm,playerBaseHit:true},0);assert.equal(s.mood,'alarmed');assert.equal(s.alarmSerial,1);assert.equal(s.alarmEnteredAt,0);s=m.advanceVillageMood(s,{...calm,playerBaseHit:true},0);assert.equal(s.alarmSerial,1);s=elapsed(m,s,calm,.8);assert.equal(s.alarmMix,1);});
// Catches an early recovery, failure to reset the uninterrupted quiet timer and critical-HP release.
test('recoveryHysteresis',async()=>{const m=await model();let s=m.advanceVillageMood(m.createVillageMood(),{...calm,playerBaseHit:true},0);s=elapsed(m,s,calm,2.99);assert.equal(s.mood,'alarmed');s=elapsed(m,s,{...calm,nearestEnemyX:420},4);assert.equal(s.mood,'alarmed');s=elapsed(m,s,{...calm,hpFraction:.42},6);assert.equal(s.mood,'alarmed');s=elapsed(m,s,calm,5.99);assert.equal(s.mood,'alarmed');s=m.advanceVillageMood(s,calm,.01);assert.equal(s.mood,'recovering');s=elapsed(m,s,calm,3.99);assert.equal(s.mood,'recovering');assert.ok(s.alarmMix>0&&s.alarmMix<.01);s=m.advanceVillageMood(s,calm,.01);assert.equal(s.mood,'quiet');assert.equal(s.alarmMix,0);});
test('recovery pressure re-enters alarm once after its debounce',async()=>{const m=await model();let s=m.advanceVillageMood(m.createVillageMood(),{...calm,playerBaseHit:true},0);s=elapsed(m,s,calm,6);assert.equal(s.mood,'recovering');s=elapsed(m,s,{...calm,nearestEnemyX:300},.59);assert.equal(s.mood,'recovering');s=m.advanceVillageMood(s,{...calm,nearestEnemyX:300},.01);assert.equal(s.mood,'alarmed');assert.equal(s.alarmSerial,2);});
test('pause and result hold clocks, while ready resets alarm without mutating previous',async()=>{const m=await model();const initial=m.createVillageMood();let s=m.advanceVillageMood(initial,{...calm,playerBaseHit:true},0);const frozen=structuredClone(s);assert.deepEqual(m.advanceVillageMood(s,{...calm,paused:true,playerBaseHit:true},.05),frozen);s=m.advanceVillageMood(s,{...calm,phase:'lost'},.05);assert.equal(s.time,0);assert.equal(s.alarmSerial,1);assert.equal(m.advanceVillageMood(s,{...calm,phase:'ready'},0).mood,'quiet');assert.equal(initial.mood,'quiet');});
test('malformed deltas and pressure fail safely and large deltas are bounded',async()=>{const m=await model();for(const dt of [NaN,Infinity,-1])assert.equal(m.advanceVillageMood(m.createVillageMood(),calm,dt).time,0);const s=m.advanceVillageMood(m.createVillageMood(),{...calm,hpFraction:NaN,nearestEnemyX:NaN},100);assert.ok(s.time<=.1);assert.equal(s.mood,'quiet');});
test('recent completed alarms retain only the bounded history needed by a current passage and reset with ready',async()=>{
 const m=await model();let state=m.createVillageMood();
 for(let alarm=0;alarm<12;alarm++){
  state=m.advanceVillageMood(state,{...calm,playerBaseHit:true},0);state=elapsed(m,state,calm,6);
  assert.equal(state.mood,'recovering');assert.ok(Array.isArray(state.alarmHistory));
  assert.equal(state.alarmHistory.length,Math.min(2,alarm+1));
 }
 assert.ok(Math.abs(state.alarmHistory[0].enteredAt-60)<1e-8);assert.ok(Math.abs(state.alarmHistory[1].endedAt-72)<1e-8);
 assert.deepEqual(m.advanceVillageMood(state,{...calm,phase:'ready'},0).alarmHistory,[]);
});
