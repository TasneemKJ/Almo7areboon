import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLang } from '../src/game/locale.ts';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { createChronicle } from '../src/game/chronicle.ts';
import { syncWeekly, weekId } from '../src/game/weekly.ts';
import { resultsHtml, compactResultsHtml, expeditionChoiceHtml, defeatRecapHtml, timelineResetCopy } from '../src/ui/results-screen.ts';
import { campRootHtml, campFocusHtml, campGoalText } from '../src/ui/camp-screen.ts';
import { troopControlLabel, troopUnlockMessage, createArmyUpdater, troopSpecialty } from '../src/ui/army-screen.ts';
import { questRecords, questRecordsHtml, questRecordLabel, questRecordDetailHtml, selectedQuestRecord } from '../src/ui/quest-records.ts';
import { saveSessionDialogHtml, temporarySessionText } from '../src/ui/save-session-screen.ts';
import { appShellHtml } from '../src/ui/app-shell.ts';
import { welcomeBackLine } from '../src/ui/welcome-back.ts';
import { entryCopy, entryScreenHtml, documentTitle } from '../src/ui/entry-screen.ts';
import { createQuests } from '../src/app/quests.ts';
// Other owners' helpers: their output is removed before checking, so this test checks only this group's words.
import { chapterPresentation, unitPresentationName } from '../src/ui/chapter-presentation.ts';
import { villageVoice } from '../src/ui/chapter-scouting.ts';
import { masteryMarksHtml, masteryAttemptText, masteryAdvice } from '../src/ui/mastery-presentation.ts';
import { regroupLearningHtml } from '../src/ui/regroup-learning.ts';
import { chronicleResultHtml } from '../src/ui/chronicle-screen.ts';
import { nextGoalLabel } from '../src/ui/next-goal.ts';
import { fieldControlsHtml } from '../src/ui/field-controls.ts';
import { localDay, QUESTS } from '../src/game/data.ts';
import { compactNumber } from '../src/ui/battle-hud.ts';
import { battleStats } from '../src/game/statistics.ts';

const DAY = 20720;
const text = (html: string) => html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
const labels = (html: string) => [...html.matchAll(/\b(?:aria-label|title|alt)="([^"]*)"/g)].map(m => m[1]);
/** Text other agents own; their own Arabic tests check it. */
function foreign(profile = defaultProfile(), state?: Game['state']): string[] {
  const out: string[] = [];
  for (let age = 0; age < 6; age++) {
    const c = chapterPresentation(age); out.push(c.title, c.subtitle);
    for (const kind of [0, 1, 2] as const) out.push(unitPresentationName(age, kind));
  }
  const goal = nextGoalLabel(profile, DAY); out.push(goal.text, goal.label);
  const today = nextGoalLabel(profile, localDay()); out.push(today.text, today.label);
  out.push(text(fieldControlsHtml()), ...labels(fieldControlsHtml()));
  if (state) {
    const stats = battleStats(state.stats);
    out.push(...[state.earned, stats.foodSpent, stats.damageDealt].map(compactNumber).filter(v => /[A-Za-z]/.test(v)));
    for (const s of [stats, undefined]) out.push(text(villageVoice(profile.enemyAge, state.phase, s)));
    out.push(text(masteryMarksHtml(profile, profile.enemyAge)), ...labels(masteryMarksHtml(profile, profile.enemyAge)));
    out.push(text(masteryAttemptText(profile, state, false)), text(masteryAdvice(profile, state)));
    out.push(text(regroupLearningHtml(profile, state)), ...labels(regroupLearningHtml(profile, state)));
    out.push(text(chronicleResultHtml(profile, state)), ...labels(chronicleResultHtml(profile, state)));
  }
  return out.flatMap(s => s.split(/\s{2,}/)).map(s => s.trim()).filter(s => s.length > 2).sort((a, b) => b.length - a.length);
}
function latin(html: string, skip: string[]): string[] {
  let visible = `${text(html)} ${labels(html).join(' ')}`.replace(/\s+/g, ' ');
  for (const s of skip) visible = visible.split(s.replace(/\s+/g, ' ')).join(' ');
  visible = visible.replace(/Almo7areboon/gi, ' ').replace(/\b(?:Tab|Enter|Esc)\b/g, ' ');
  return visible.match(/[A-Za-z][^،.]{0,30}/g) ?? [];
}
const clean = (html: string, skip: string[], what: string) => assert.deepEqual(latin(html, skip), [], `${what} still shows English`);

test('meta screens speak Arabic in Arabic mode', () => {
  setLang('ar');
  try {
    // Results: won, lost, compact, expedition, timeline, terminal.
    for (const phase of ['won', 'lost'] as const) for (const variant of ['plain', 'timeline', 'terminal', 'expedition', 'settled'] as const) {
      const p = defaultProfile();
      if (variant === 'timeline') { p.enemyAge = 5; p.furthestBattle = 5; }
      if (variant === 'terminal') { p.timeline = 1000; p.enemyAge = 5; p.furthestBattle = 5; p.mastery.timeline = 1000; }
      if (variant === 'expedition') { p.chronicle = createChronicle(); p.chronicle.expedition = { stage: 0, chapter: 0, reserve: 4, provision: 'supplies' }; }
      if (variant === 'settled' && phase === 'won') p.pendingVictory = { settlement: 'mastery-v1', eligibleMask: 3, newMask: 3, masteryCoins: 200, masteryGems: 35 } as never;
      p.coins = 10; p.age = 0;
      const g = new Game(p); g.state.phase = phase; g.state.earned = 1234; g.state.time = 75;
      g.state.stats.damageByKind = [40, 30, 30] as never;
      const skip = foreign(g.profile, g.state);
      clean(resultsHtml(g.profile, g.state), skip, `results ${phase} ${variant}`);
      clean(compactResultsHtml(g.profile, g.state), skip, `compact ${phase} ${variant}`);
      clean(defeatRecapHtml(g.profile.age, g.state), skip, 'defeat recap');
    }
    clean(expeditionChoiceHtml(), [], 'expedition choice');
    clean(timelineResetCopy(), [], 'timeline reset');

    // Camp: root and every focus, with and without a captain and preparations.
    for (const age of [0, 3]) for (const story of [false, true]) {
      const p = defaultProfile(); Object.assign(p, { age, enemyAge: age, furthestBattle: age, coins: 40 });
      if (story) { p.chronicle = createChronicle(); p.chronicle.enabled = true; p.chronicle.captain = 'gatekeeper'; p.chronicle.route = 'escort'; }
      const g = new Game(p), skip = foreign(g.profile);
      clean(campRootHtml(g.profile, DAY), skip, 'camp root');
      clean(campGoalText(g.profile, DAY), skip, 'camp goal');
      for (const focus of ['storehouse', 'gate', 'company', 'journal', { recruit: 0 }, { recruit: 1 }, { recruit: 2 }] as const) clean(campFocusHtml(g, focus, temporarySessionText()), skip, `camp ${JSON.stringify(focus)}`);
    }

    // Army: labels, unlock messages, unit cards and skill buttons.
    {
      const g = new Game(), skip = foreign(g.profile);
      for (const kind of [0, 1, 2] as const) {
        clean(troopControlLabel(g.profile, kind, g.deploymentStatus(kind)), skip, 'troop label');
        clean(troopUnlockMessage(g.profile, 'ready', kind, g.deploymentStatus(kind)), skip, 'unlock message');
        clean(troopSpecialty(kind).name + ' ' + troopSpecialty(kind).effect, [], 'specialty');
      }
      for (const reason of ['available', 'food', 'blocked', 'capacity', 'paused', 'ready', 'other'] as const) {
        g.profile.unlocked = [true, true, false];
        clean(troopControlLabel(g.profile, 1, { reason, waitSeconds: 3 } as never), skip, `troop label ${reason}`);
        for (const phase of ['ready', 'running', 'won'] as const) clean(troopUnlockMessage(g.profile, phase, 1, { reason, waitSeconds: 3 } as never), skip, `unlock ${reason}`);
      }
      const t = { units: { innerHTML: '' }, skills: { innerHTML: '' }, stages: { innerHTML: '' } };
      createArmyUpdater(t, () => 'x.png')(g.profile);
      clean(t.units.innerHTML + t.skills.innerHTML + t.stages.innerHTML, skip, 'army cards');
      const p = defaultProfile(); p.chronicle = createChronicle(); p.chronicle.enabled = true; p.chronicle.captain = 'lantern';
      const t2 = { units: { innerHTML: '' }, skills: { innerHTML: '' }, stages: { innerHTML: '' } };
      createArmyUpdater(t2, () => 'x.png')(p);
      clean(t2.skills.innerHTML, skip, 'captain skills');
    }

    // Quests: every record in several states, the list and the save notice.
    for (const setup of [(p: ReturnType<typeof defaultProfile>) => { p.kills = 11; p.wins = 2; p.deployed = 8; }, (p: ReturnType<typeof defaultProfile>) => { p.dailyDay = DAY; p.kills = 1000; p.wins = 100; p.deployed = 1000; p.claimed = ['first-blood']; }, (p: ReturnType<typeof defaultProfile>) => { p.dailyDay = DAY + 3; }]) {
      const p = defaultProfile(); syncWeekly(p, weekId(DAY)); setup(p);
      for (const day of [DAY, Number.NaN]) {
        const records = questRecords(p, day);
        for (const r of records) { clean(questRecordLabel(r), [], `quest label ${r.key}`); clean(questRecordDetailHtml(r, 1), [], `quest ${r.key}`); }
        clean(questRecordsHtml(records, selectedQuestRecord(records), 1, temporarySessionText()), [], 'quests');
      }
    }
    for (const status of ['temporary', 'active'] as const) for (const savedWarning of [true, false]) {
      const q = createQuests({ dom: { $: () => ({}) as never, activeElement: () => null }, ports: { sessionState: { session: { status }, savedWarning } } as never });
      clean(q.questSaveNotice(), [], 'quest save notice');
    }

    // Save session, shell, welcome back, entry.
    for (const status of ['blocked', 'conflict', 'unavailable', 'unsupported'] as const) for (const retried of [false, true]) clean(saveSessionDialogHtml(status, retried), [], `session ${status}`);
    clean(temporarySessionText(), [], 'temporary notice');
    const p = defaultProfile();
    clean(appShellHtml(p), foreign(p), 'app shell');
    for (const away of [7, 30, 24 * 20, 24 * 100]) clean(welcomeBackLine(0, away * 3_600_000, 3) ?? '', [], 'welcome back');
    clean(entryScreenHtml(p), foreign(p), 'entry');
    for (const saved of [false, true]) clean(entryCopy(p, saved).action, [], 'entry action');
    clean(documentTitle(), [], 'document title');

    // With nothing left to claim, the goal falls back to «Your journey»: Camp shows no goal and Results names the journal.
    const done = defaultProfile(); done.dailyDay = localDay(); done.claimed = QUESTS.map(q => q.id);
    assert.equal(campGoalText(done, localDay()), '');
    const g = new Game(done); g.state.phase = 'lost';
    assert.match(resultsHtml(g.profile, g.state), /رحلتك · الأهداف والمكافآت/);
  } finally { setLang('en'); }
});

test('shell toasts and notices are written as tr() pairs', () => {
  for (const file of ['src/app/lifecycle.ts', 'src/app/quests.ts']) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const call of source.matchAll(/toast\('([^']*)'/g)) assert.fail(`${file}: toast('${call[1]}') is English only`);
    assert.doesNotMatch(source, /:'(?:Saving is unavailable|Opening your saved game)/, `${file}: notice must be tr()`);
  }
});
