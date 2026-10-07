import {preferencesHtml,saveRecoveryHtml} from '../src/ui/preferences-screen.ts';
import { flatStatements, mainSource } from './helpers/main-source.ts';
import {hasPriorPlay} from '../src/ui/entry-screen.ts';
import {chronicleScreenHtml,chronicleActionFromData} from '../src/ui/chronicle-screen.ts';
import {chronicleGuidance} from '../src/game/chronicle-combat.ts';
import {CAPTAINS,routeDefinition,createChronicle} from '../src/game/chronicle.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runInApp } from './helpers/run-app.ts';
import ts from 'typescript';
import {syncWeekly,weekId} from '../src/game/weekly.ts';
import {localDay} from '../src/game/data.ts';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile, SAVE_KEY, BACKUP_KEY } from '../src/game/save.ts';
import { createSaveSession, type SaveSessionLocks } from '../src/game/save-session.ts';
import { restoreBackup, restoreBackupWithSave } from '../src/game/backup.ts';
import { startOverProfile } from '../src/game/reset.ts';
import type { Profile } from '../src/game/types.ts';
import { saveSessionDialogHtml, temporarySessionNotice } from '../src/ui/save-session-screen.ts';
import { createModalTapGuard } from '../src/ui/modal-tap-guard.ts';

// Run the actual UI handler and ownership presentation with the real guarded writer.
const source = mainSource();
const ast = ts.createSourceFile('main.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const names = new Set(['handleCampInput','playable', 'guardAction', 'sessionPresentation', 'showSettings', 'showSaveRecovery', 'preferenceNotice', 'clearPrestigeContext', 'adoptRestoredGame', 'routeDataAction']);
const functions = flatStatements(ast).filter(node => ts.isFunctionDeclaration(node) && node.name && names.has(node.name.text));
const listener = flatStatements(ast).find(node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText(ast) === 'lifetime.listen' && node.expression.arguments[0]?.getText(ast) === 'root' && node.expression.arguments[1]?.getText(ast) === "'click'");
assert.equal(functions.length, names.size); assert.ok(listener);
const handlerTable = flatStatements(ast).find(node => ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'commandHandlers'));
assert.ok(handlerTable);
const code = ts.transpile([...functions, handlerTable, listener].map(node => node.getText(ast)).join('\n'), { target: ts.ScriptTarget.ES2022 });
const locks: SaveSessionLocks = { request: (name, _options, callback) => Promise.resolve(callback({ name })) };
async function harness(mode = 'active') {
  const old = defaultProfile();
  Object.assign(old, { timeline: 4, age: 3, enemyAge: 3, furthestBattle: 3, coins: 9000, gems: 777, sound: false, speed: 2, motion: 'reduced', dailyDay: 20000, dailyStreak: 5, kills: 90 });
  old.chronicle = createChronicle(old.timeline,old.enemyAge);
  old.mastery.timeline = 4;
  old.mastery.chapters[0] = { earnedMask: 7, bestSeconds: 60, bestGateDamage: 0 };
  old.cards[3] = 4;
  old.weekly={week:weekId(localDay()),baseSeals:3,claimed:true};
  const values = new Map([[SAVE_KEY, JSON.stringify(old)], [BACKUP_KEY, JSON.stringify(old)]]);
  let quota = false, foreignAfterCheck = false;
  const dialogs: string[] = [], messages: string[] = [];
  class ElementBoundary {
    disabled = false;
    dataset: Record<string, string>;
    constructor(command: string) { this.dataset = { command }; }
    closest(selector: string) { return selector === 'button' || selector === '#modal-layer' ? this : null; }
  }
  const nodes = new Map<string, any>();
  const node = (id: string) => {
    if (!nodes.has(id)) nodes.set(id, { hidden: false, querySelector: () => null });
    return nodes.get(id);
  };
  const context: any = {syncWeekly,weekId,localDay,chronicleScreenHtml,chronicleActionFromData,chronicleGuidance,CAPTAINS,routeDefinition,
    Element: ElementBoundary, root: { dataset: {} }, game: new Game(old), entryWelcome:null,entryEntered:true,sessionReady: true, retriedSession: false, pagePresent: true,
    campOwner:null,settingsOrigin:null,pendingImport: null, hasPlayed: true, savedWarning: false, lastSavedAt:0, manualPaused: true, lastPhase: 'won', resultDue: 99, resultShown: 'old', modal: 'settings', atmosphereEnabled: false, audioMix: { effects: 100, atmosphere: 100 }, evolutionFromResult: false, modalPointerSequence: false,prestigeOrigin:null,prestigeDraft:null,prestigeExpectedTimeline:null,
    lifetime: { disposed: false, listen: (_root: unknown, _event: string, handler: Function) => { context.click = handler; } },
    $: node, textIfChanged() {}, syncPause() {}, isolateModal() {}, icon: () => '', unlockAudio() {},
    blockModalTap:createModalTapGuard(),performance:{now:()=>100},
    saveSessionDialogHtml, temporarySessionNotice, preferencesHtml,saveRecoveryHtml,hasPriorPlay,restoreBackup, restoreBackupWithSave, startOverProfile,
    toast: (message: string) => messages.push(message), showModal: (id: string, html: string) => { context.modal = id; context.html = html; dialogs.push(id); },
    closeModal: () => { context.modal = null; }, rebuildArmy() {}, syncMotion() {}, switchTab: (tab: string) => { context.activeTab = tab; },
  };
  runInApp(code, context);
  const storage = {
    getItem(key: string) {
      const value = values.get(key) ?? null;
      if (foreignAfterCheck && key === BACKUP_KEY) { foreignAfterCheck = false; values.set(SAVE_KEY, JSON.stringify({ ...old, coins: 9001 })); }
      return value;
    },
    setItem(key: string, value: string) { if (quota && key === SAVE_KEY) throw Error('quota'); values.set(key, value); },
  };
  // Supply the browser's ambient storage boundary to the legacy writer, so bypasses really write.
  context.restoreBackup = (current: Game, candidate: Profile) => restoreBackup(current, candidate, storage);
  const session = createSaveSession({ storage, locks: mode === 'temporary' ? null : locks, onStatus: context.sessionPresentation });
  context.session = session;
  await session.acquire();
  if (mode === 'temporary') session.playTemporarily();
  if (mode === 'suspended') session.release();
  context.sessionReady = mode !== 'suspended';
  context.modal = 'settings'; dialogs.length = 0;
  return {
    context, session, values, dialogs, messages,
    click: (command: string) => context.click({ target: new ElementBoundary(command), detail: 1, preventDefault() {} }),
    quota: () => { quota = true; }, foreign: () => values.set(SAVE_KEY, JSON.stringify({ ...old, coins: 9001 })),
    writerConflict: () => { foreignAfterCheck = true; },
    bytes: () => [values.get(SAVE_KEY), values.get(BACKUP_KEY)],
  };
}
test('confirmed Start over commits fresh progress and keeps preferences and daily claim with a refreshed baseline', async () => {
  const h = await harness(), current = h.context.game, before = h.bytes();
  try {
    h.click('reset'); assert.equal(h.context.modal, 'reset'); assert.equal(h.context.game, current); assert.deepEqual(h.bytes(), before);
    h.click('confirm-reset'); const fresh = h.context.game.profile;
    assert.notEqual(h.context.game, current); assert.equal(h.context.entryEntered,false);assert.equal(h.context.entrySaved,false);assert.equal(h.context.game.profile.played,undefined);assert.equal(h.context.modal, null); assert.equal(h.context.activeTab, 'battle');
    assert.deepEqual([fresh.timeline, fresh.age, fresh.coins, fresh.gems, fresh.kills, fresh.cards[3]], [1, 0, 0, 100, 0, 0]);
    assert.equal(fresh.mastery.timeline, 1);
    assert.deepEqual(fresh.weekly,{week:weekId(localDay()),baseSeals:0,claimed:true});
    assert.deepEqual(JSON.parse(h.bytes()[0]!).weekly,fresh.weekly);
    assert.ok(fresh.mastery.chapters.every((chapter: Profile['mastery']['chapters'][number]) => chapter.earnedMask === 0 && chapter.bestSeconds === null && chapter.bestGateDamage === null), 'Start over clears all paid chapter seals and records');
    assert.deepEqual([fresh.sound, fresh.speed, fresh.motion, fresh.dailyDay, fresh.dailyStreak], [false, 2, 'reduced', 20000, 5]);
    assert.equal(h.context.game.dispatch({ type: 'daily', day: 20000 }), false);
    assert.equal(JSON.parse(h.bytes()[0]!).coins, 0); assert.equal(JSON.parse(h.bytes()[1]!).coins, 9000);
    fresh.coins = 12; assert.equal(h.session.save(fresh).ok, true); assert.equal(JSON.parse(h.bytes()[0]!).coins, 12);
    assert.deepEqual(h.messages, ['Started a new game.']);
  } finally { h.session.dispose(); }
});
for (const failure of ['foreign', 'writer-conflict', 'quota', 'temporary', 'suspended'] as const) test(`confirmed Start over preserves the Game and stored saves on ${failure}`, async () => {
  const h = await harness(failure), current = h.context.game, inMemory = JSON.stringify(current.profile);
  try {
    if (failure === 'foreign') h.foreign();
    if (failure === 'writer-conflict') h.writerConflict();
    if (failure === 'quota') h.quota();
    const before = h.bytes();
    h.context.modal='reset';h.click('confirm-reset');
    assert.equal(h.context.game, current); assert.equal(JSON.stringify(current.profile), inMemory);
    const expected = failure === 'writer-conflict' ? [JSON.stringify({ ...current.profile, coins: 9001 }), before[1]] : before;
    assert.deepEqual(h.bytes(), expected); assert.ok(!h.messages.includes('Started a new game.'));
    if (failure === 'foreign' || failure === 'writer-conflict') { assert.equal(h.session.status, 'conflict'); assert.equal(h.context.modal, 'session'); assert.deepEqual(h.dialogs, ['session']); }
    if (failure === 'quota') assert.deepEqual(h.messages, ['The new game could not be saved. Your current progress was not deleted.']);
    if (failure === 'temporary' || failure === 'suspended') {
      h.context.showSettings();
      assert.match(h.context.html, /data-command="reset" disabled/); if(failure==='temporary'){h.context.modal='settings';h.context.showSaveRecovery();assert.match(h.context.html, /data-command="import" disabled/);}else assert.equal(h.context.modal,'settings','a suspended writer cannot enter save recovery');
    }
  } finally { h.session.dispose(); }
});
