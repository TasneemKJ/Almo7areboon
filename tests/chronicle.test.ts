import test from 'node:test';
import assert from 'node:assert/strict';
import { createChronicle, normalizeChronicle, ROUTES, routeAvailable, chooseRoute, recordChronicleWin, chooseCaptain, chooseTale, discover, beginExpedition, continueExpedition, timelineVariant, commanderFor, chronicleEncounter, preparationAvailable } from '../src/game/chronicle.ts';
const context = { timeline: 1, enemyAge: 0, furthestBattle: 5 };
const victory = { deployedByKind: [2,2,1] as [number,number,number], survivingRoles: [true,true] as [boolean,boolean] };
test('chronicle has bounded defaults and six objective types and an optional epilogue', () => {
 const c=createChronicle(); assert.equal(c.version,1); assert.equal(c.route,'road'); assert.equal(c.captain,'none'); assert.equal(c.tale,'none'); assert.equal(ROUTES.length,7); assert.equal(new Set(ROUTES.map(r=>r.objective)).size,6); assert.equal(c.clears.length,6);
});
test('malformed imports cannot inject routes, NaN, growing arrays or HTML', () => {
 const c=normalizeChronicle({version:1,route:'<script>',captain:'bad',tale:'bad',clears:Array(200).fill(Infinity),veterans:[NaN,100000],discoveries:999,restoration:Infinity,expedition:{stage:90}},1,0);
 assert.equal(c.route,'road'); assert.equal(c.captain,'none'); assert.equal(c.clears.length,6); assert.deepEqual(c.clears,[0,0,0,0,0,0]); assert.deepEqual(c.veterans,[0,99]); assert.equal(c.expedition,null); assert.equal(c.discoveries,0);
});
test('future extension version is not mistaken for current progress', () => { assert.deepEqual(normalizeChronicle({version:7,restoration:7},1,0),createChronicle(1,0)); });
test('route selection validates chapter access and boss prerequisites', () => {
 const c=createChronicle(); assert.equal(routeAvailable(c,'bell',0,0),false); assert.equal(chooseRoute(c,'escort',4,0),null); assert.equal(chooseRoute(c,'evil' as never,0,0),null);
 const selected=chooseRoute(c,'escort',0,0)!; assert.equal(selected.route,'escort'); assert.equal(c.route,'road');
 const won=recordChronicleWin(selected,context,victory); assert.equal(routeAvailable(won,'bell',0,0),true);
});
test('wins restore a settlement and repeat victories do not add distinct clears', () => {
 let c=createChronicle(); for(const [chapter,route] of [[0,'road'],[0,'escort'],[0,'watch'],[1,'road'],[1,'escort'],[1,'watch']] as const){c=chooseRoute(c,route,chapter,5)!; c=recordChronicleWin(c,{...context,enemyAge:chapter},victory);}
 assert.equal(c.restoration,7); assert.equal(preparationAvailable(c,'bread'),true); assert.equal(preparationAvailable(c,'repair'),true);
 const repeat=recordChronicleWin(c,{...context,enemyAge:1},victory); assert.deepEqual(repeat.clears,c.clears); assert.deepEqual(c.veterans,[6,6]); assert.deepEqual(repeat.veterans,[7,7]);
});
test('first rescued cart or scout determines the chapter consequence', () => {
 let c=chooseRoute(createChronicle(),'escort',0,0)!; c=recordChronicleWin(c,context,victory); assert.equal(c.choices[0],'cart');
 c=chooseRoute(c,'scout',0,0)!; c=recordChronicleWin(c,context,victory); assert.equal(c.choices[0],'cart');
 let scout=chooseRoute(createChronicle(),'scout',0,0)!; scout=recordChronicleWin(scout,context,victory); assert.equal(scout.choices[0],'scout');
});
test('captains and tales require earned unlocks; selection is exclusive', () => {
 let c=createChronicle(); assert.equal(chooseCaptain(c,'lantern'),null); assert.equal(chooseTale(c,'empty-bowl'),null); assert.equal(chooseCaptain(c,'gatekeeper')!.captain,'gatekeeper');
 c=recordChronicleWin(chooseRoute(c,'scout',0,0)!,context,victory); assert.equal(chooseCaptain(c,'lantern')!.captain,'lantern');
 c=chooseTale(c,'empty-bowl')!; assert.equal(c.tale,'empty-bowl'); assert.equal(chooseTale(c,'none')!.tale,'none');
});
test('three safe discoveries unlock a connected optional tale', () => {
 let c=createChronicle(); assert.equal(discover(c,'door',false),null); c=discover(c,'door',true)!; assert.equal(discover(c,'door',true),null); c=discover(c,'roof',true)!; c=discover(c,'cat',true)!; assert.equal(c.discoveries,7); assert.equal(chooseTale(c,'olive-thread')!.tale,'olive-thread');
});
test('expedition is a three-stage saved checkpoint and cannot be restarted over itself', () => {
 let c=recordChronicleWin(createChronicle(),context,victory); c=beginExpedition(c,0,0)!; assert.equal(c.expedition?.stage,0); assert.equal(c.route,'escort'); assert.equal(beginExpedition(c,0,0),null);
 assert.equal(continueExpedition(c,false),null); c=continueExpedition(c,true)!; assert.equal(c.expedition?.stage,1); assert.equal(c.route,'watch');
 const restored=normalizeChronicle(JSON.parse(JSON.stringify(c)),1,0); assert.deepEqual(restored,c);
 c=continueExpedition(restored,true)!; assert.equal(c.expedition?.stage,2); assert.equal(c.route,'bell'); c=continueExpedition(c,true)!; assert.equal(c.expedition,null); assert.equal(c.expeditionsWon,1); assert.equal(c.route,'road');
});
test('new timeline retains people and restoration but resets current choices and routes', () => {
 let c=recordChronicleWin(chooseRoute(createChronicle(),'scout',0,0)!,context,victory); c=normalizeChronicle(c,2,0); assert.equal(c.timeline,2); assert.equal(c.restoration,1); assert.deepEqual(c.veterans,[1,1]); assert.deepEqual(c.clears,[0,0,0,0,0,0]); assert.equal(c.choices[0],'none');
});
test('alternate timelines have authored identities rather than just power multipliers', () => {
 assert.equal(timelineVariant(1).id,'hearth'); assert.equal(timelineVariant(2).id,'unlit'); assert.equal(timelineVariant(3).id,'overgrown'); assert.equal(timelineVariant(4).id,'ally'); assert.equal(timelineVariant(NaN).id,'hearth');
});
test('commanders transform finite waves deterministically without mutating the source', () => {
 const base={age:0,waves:[{time:3,intent:'rush' as const,members:[{kind:0 as const,delay:0}]}]};
 const a=chronicleEncounter(base,createChronicle(),0); assert.deepEqual(a,base);
 const c=chooseRoute(createChronicle(),'watch',0,0)!; const b=chronicleEncounter(base,c,0); assert.deepEqual(b,chronicleEncounter(base,c,0)); assert.equal(base.waves[0].members.length,1); assert.ok(b.waves.every(w=>w.time>=0&&w.members.length<=5)); assert.ok(commanderFor(c,0).name.length>0);
});
test('the three discovered fragments open a separate optional encounter',()=>{let c=createChronicle();assert.equal(routeAvailable(c,'whisper' as never,0,0),false);for(const id of ['door','roof','cat'] as const)c=discover(c,id,true)!;assert.equal(routeAvailable(c,'whisper' as never,0,0),true);});
