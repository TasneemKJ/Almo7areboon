import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, decodeSave } from '../src/game/save.ts';
import { startOverProfile } from '../src/game/reset.ts';
import { exportBackup, importBackup } from '../src/game/backup.ts';
import { weekId, weeklyStatus, syncWeekly, WEEKLY_TARGET, WEEKLY_GEMS } from '../src/game/weekly.ts';

const MONDAY = 20_000 - ((20_000 + 3) % 7); // a local day number that starts a week
const week = weekId(MONDAY);
function withSeals(game: Game, n: number) {
  let left = n;
  game.profile.mastery.chapters.forEach(record => { record.earnedMask = 0; for (let bit = 1; bit <= 4 && left > 0; bit <<= 1, left--) record.earnedMask |= bit; });
}

test('weeks start on Monday and rise by one every seven days', () => {
  assert.equal(weekId(MONDAY), weekId(MONDAY + 6));
  assert.equal(weekId(MONDAY + 7), weekId(MONDAY) + 1);
  assert.equal(weekId(MONDAY - 1), weekId(MONDAY) - 1);
  assert.equal(weekId(-1), -1);
  assert.equal(weekId(Number.NaN), -1);
});
test('the goal counts only seals earned after the week was first seen, then pays once', () => {
  const g = new Game(); withSeals(g, 2);
  assert.equal(g.dispatch({ type: 'weekly-sync', week }), true);
  assert.equal(g.dispatch({ type: 'weekly-sync', week }), false, 'second sync changes nothing');
  assert.equal(weeklyStatus(g.profile, week).progress, 0, 'seals from before the week do not count');
  assert.equal(g.dispatch({ type: 'weekly', week }), false);
  withSeals(g, 2 + WEEKLY_TARGET);
  assert.equal(weeklyStatus(g.profile, week).ready, true);
  const gems = g.profile.gems;
  assert.equal(g.dispatch({ type: 'weekly', week }), true);
  assert.equal(g.profile.gems, gems + WEEKLY_GEMS);
  assert.equal(g.dispatch({ type: 'weekly', week }), false, 'no second claim');
  assert.equal(weeklyStatus(g.profile, week).claimed, true);
  g.dispatch({ type: 'weekly-sync', week: week + 1 });
  assert.equal(weeklyStatus(g.profile, week + 1).claimed, false, 'a new week opens a new goal');
});
test('a stale or invalid week cannot be claimed or synced, and gems stay capped', () => {
  const g = new Game(); g.dispatch({ type: 'weekly-sync', week }); withSeals(g, WEEKLY_TARGET);
  assert.equal(g.dispatch({ type: 'weekly', week: week + 1 }), false, 'a claim never initializes another week');
  assert.equal(g.dispatch({ type: 'weekly-sync', week: -1 }), false);
  assert.equal(g.dispatch({ type: 'weekly-sync', week: 1e9 }), false);
  const h = new Game(); h.profile.gems = 1e7 - 10; h.dispatch({ type: 'weekly-sync', week }); withSeals(h, WEEKLY_TARGET);
  assert.equal(h.dispatch({ type: 'weekly', week }), true);
  assert.equal(h.profile.gems, 1e7);
});
test('a timeline reset that lowers the seal total rebases instead of going negative', () => {
  const g = new Game(); withSeals(g, 5); g.dispatch({ type: 'weekly-sync', week });
  withSeals(g, 0);
  assert.equal(syncWeekly(g.profile, week), true);
  assert.equal(g.profile.weekly!.baseSeals, 0);
  assert.equal(weeklyStatus(g.profile, week).progress, 0);
});
test('weekly is optional, normalized on load, preserved by export/import and by Start over', () => {
  assert.equal('weekly' in defaultProfile(), false);
  const g = new Game(); g.dispatch({ type: 'weekly-sync', week }); withSeals(g, WEEKLY_TARGET); g.dispatch({ type: 'weekly', week });
  const loaded = decodeSave(JSON.stringify(g.profile)).profile!;
  assert.deepEqual(loaded.weekly, { week, baseSeals: 0, claimed: true });
  for (const bad of [null, 5, 'x', [], {}, { week: -1, baseSeals: 0 }, { week: 1.5, baseSeals: 0 }, { week: 1e9, baseSeals: 0 }, { week: 3, baseSeals: 99 }, { week: 3, baseSeals: -1 }, { week: '3', baseSeals: 0 }]) {
    assert.equal('weekly' in decodeSave(JSON.stringify({ ...g.profile, weekly: bad })).profile!, false, JSON.stringify(bad));
  }
  assert.deepEqual(decodeSave(JSON.stringify({ ...g.profile, weekly: { week: 3, baseSeals: 2, claimed: 'yes' } })).profile!.weekly, { week: 3, baseSeals: 2 });
  const imported = importBackup(exportBackup(g.profile));
  assert.deepEqual((imported as any).profile?.weekly ?? (imported as any).weekly, { week, baseSeals: 0, claimed: true });
  assert.deepEqual(startOverProfile(g.profile).weekly, { week, baseSeals: 0, claimed: true }, 'a reset cannot reopen a claimed week');
  assert.equal('weekly' in startOverProfile(defaultProfile()), false);
});
test('fractional sync requests do not create weekly state that the save decoder will discard',()=>{
 const g=new Game(),before=JSON.stringify(g.profile);
 assert.equal(g.dispatch({type:'weekly-sync',week:week+.5}),false);
 assert.equal(JSON.stringify(g.profile),before);
});

test('an earlier weekly sync cannot erase a newer retained claimed week',()=>{
 const g=new Game();g.dispatch({type:'weekly-sync',week});withSeals(g,3);g.dispatch({type:'weekly',week});
 const before=JSON.stringify(g.profile);assert.equal(g.dispatch({type:'weekly-sync',week:week-1}),false);
 assert.equal(JSON.stringify(g.profile),before);
 withSeals(g,6);assert.equal(g.dispatch({type:'weekly-sync',week}),false);assert.equal(g.dispatch({type:'weekly',week}),false);
 assert.equal(g.profile.gems,160);
});
for(const kind of ['missing','older','newer','fractional','negative','nan','infinite','over-limit','rebase'])test(`rejected ${kind} weekly claim is mutation-free`,()=>{
  const g=new Game();if(kind!=='missing')g.dispatch({type:'weekly-sync',week});
  if(kind==='rebase'){withSeals(g,3);g.profile.weekly!.baseSeals=3;withSeals(g,0);}else withSeals(g,3);
  const requested=kind==='older'?week-1:kind==='newer'?week+1:kind==='fractional'?week+.5:kind==='negative'?-1:kind==='nan'?Number.NaN:kind==='infinite'?Infinity:kind==='over-limit'?200001:week;
  const before=JSON.stringify(g.profile);g.drainEvents();
  assert.equal(g.dispatch({type:'weekly',week:requested}),false,kind);assert.equal(JSON.stringify(g.profile),before,kind);assert.deepEqual(g.drainEvents(),[],kind);
});
test('forward weekly sync and same-week timeline rebasing preserve legitimate earning and claimed status',()=>{
 const g=new Game();g.dispatch({type:'weekly-sync',week});withSeals(g,3);g.dispatch({type:'weekly',week});
 assert.equal(g.dispatch({type:'weekly-sync',week:week+1}),true);assert.equal(g.profile.weekly!.claimed,undefined);assert.equal(g.profile.weekly!.baseSeals,3);
 withSeals(g,6);assert.equal(g.dispatch({type:'weekly',week:week+1}),true);assert.equal(g.profile.gems,220);
 withSeals(g,0);assert.equal(g.dispatch({type:'weekly-sync',week:week+1}),true);assert.equal(g.profile.weekly!.baseSeals,0);assert.equal(g.profile.weekly!.claimed,true);
 withSeals(g,3);assert.equal(g.dispatch({type:'weekly',week:week+1}),false);assert.equal(g.profile.gems,220);
});
