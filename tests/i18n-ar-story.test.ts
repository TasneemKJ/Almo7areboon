import test from 'node:test';
import assert from 'node:assert/strict';
import { setLang } from '../src/game/locale.ts';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { ROUTES, CAPTAINS, TALES, DISCOVERIES, createChronicle, routeDefinition, timelineVariant, commanderFor, veteranName, type RouteId } from '../src/game/chronicle.ts';
import { chronicleGuidance } from '../src/game/chronicle-combat.ts';
import { CARD_DEFS } from '../src/game/cards.ts';
import { ERAS, QUESTS } from '../src/game/data.ts';
import { chapterMastery } from '../src/game/mastery.ts';
import { importBackup } from '../src/game/backup.ts';
import { prestigePreview } from '../src/game/prestige.ts';
import { chronicleScreenHtml, chronicleResultHtml } from '../src/ui/chronicle-screen.ts';
import { chapterScouting, chapterScoutingHtml, battleTeachingHtml, villageVoice } from '../src/ui/chapter-scouting.ts';
import { chapterPresentation, unitPresentationName } from '../src/ui/chapter-presentation.ts';
import { cardsScreenHtml, cardPackPreview, summonedCardsHtml } from '../src/ui/cards-screen.ts';
import { masteryMarksHtml, masteryAttemptText, masteryAdvice } from '../src/ui/mastery-presentation.ts';
import { prestigeDetailsHtml, prestigeDialogHtml, legacyPreparationHtml, legacyLearningHtml, legacyCurrentHtml } from '../src/ui/prestige-presentation.ts';
import { journeyScreenHtml } from '../src/ui/journey-screen.ts';
import { battleSelectionHtml, evolutionDialogHtml } from '../src/ui/progression-screen.ts';
import { evolutionScreenHtml } from '../src/ui/evolution-screen.ts';
import type { BattleState, Profile } from '../src/game/types.ts';

/** Visible text plus aria-label, title and alt: everything a player sees or hears. */
function visible(html: string): string {
  const spoken = [...html.matchAll(/\s(?:aria-label|title|alt)="([^"]*)"/g)].map(match => match[1]);
  const text = html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ');
  return [text, ...spoken].join(' ');
}
// The game name, and compact-number suffixes from game/format.ts ("2.5k"), which this group does not own.
const ALLOWED = /Almo7areboon|(?<=\d)[kmbt]\b/g;
function assertArabic(label: string, html: string): void {
  const latin = visible(html).replace(ALLOWED, '').match(/[A-Za-z]+/g);
  assert.equal(latin, null, `${label} still shows English: ${latin?.slice(0, 8).join(' ')}`);
}

function storyGame(): Game {
  const p = defaultProfile();
  Object.assign(p, { furthestBattle: 5, enemyAge: 2, age: 2, coins: 500, wins: 4, kills: 30, deployed: 40, gems: 5000, summonCount: 40 });
  p.cards = p.cards.map((_, i) => (i % 3 === 0 ? 12 : i % 3 === 1 ? 1 : 0));
  p.cards[1] = 1000;
  p.chronicle = { ...createChronicle(p.timeline, 2), restoration: 7, discoveries: 7, choices: ['cart', 'scout', 'none', 'none', 'none', 'none'], veterans: [4, 1], clears: [3, 1, 1, 0, 0, 0], preparation: 'bread', captain: 'gatekeeper', tale: 'empty-bowl' };
  p.mastery.chapters[2].earnedMask = 1;
  return new Game(p);
}

test('story group: every screen and string speaks Arabic in Arabic mode', () => {
  setLang('ar');
  try {
    const g = storyGame(), p = g.profile, s = g.state;
    // Chronicle (storybook) and its result, with and without an expedition.
    for (let page = 0; page < 6; page++) assertArabic(`chronicle page ${page}`, chronicleScreenHtml(p, s, page));
    const won = { ...s, phase: 'won' } as BattleState, lost = { ...s, phase: 'lost' } as BattleState;
    assertArabic('chronicle result won', chronicleResultHtml(p, won));
    assertArabic('chronicle result lost', chronicleResultHtml(p, lost));
    const expedition: Profile = structuredClone(p);
    expedition.chronicle = { ...expedition.chronicle!, preparation: 'repair', expedition: { stage: 1, chapter: 2, reserve: 5, provision: 'supplies' } };
    assertArabic('chronicle with expedition', chronicleScreenHtml(expedition, s));
    assertArabic('expedition result', chronicleResultHtml(expedition, won));
    expedition.chronicle!.expedition!.stage = 2;
    assertArabic('expedition final result', chronicleResultHtml(expedition, won));
    const fresh = new Game(defaultProfile());
    assertArabic('fresh chronicle', chronicleScreenHtml(fresh.profile, fresh.state));
    // Story tables and generated names.
    for (const route of ROUTES) assertArabic(`route ${route.id}`, `${route.name} ${route.rule} ${route.reward} ${routeDefinition(route.id).name}`);
    for (const item of [...CAPTAINS, ...TALES]) assertArabic(`story choice ${item.id}`, `${item.name} ${item.description} ${'skill' in item ? item.skill : ''}`);
    for (const item of DISCOVERIES) assertArabic(`discovery ${item.id}`, `${item.name} ${item.text}`);
    for (let timeline = 1; timeline <= 4; timeline++) { const v = timelineVariant(timeline); assertArabic(`variant ${timeline}`, `${v.name} ${v.description}`); }
    for (const route of ['road', 'watch', 'scout', 'bell'] as RouteId[]) { const c = commanderFor({ ...createChronicle(), route }, 1); assertArabic(`commander ${route}`, `${c.name} ${c.description}`); }
    for (const role of [0, 1]) for (const wins of [0, 3]) assertArabic('veteran', veteranName(role, wins));
    // Battle guidance through every objective.
    for (const route of ROUTES) {
      const q = defaultProfile();q.chronicle = { ...createChronicle(q.timeline, 0), route: route.id, clears: [1, 0, 0, 0, 0, 0], discoveries: 7 };
      const battle = new Game(q);assertArabic(`guidance ready ${route.id}`, chronicleGuidance(battle.profile, battle.state));
      battle.dispatch({ type: 'start' });
      for (let i = 0; i < 4; i++) {
        assertArabic(`guidance ${route.id} ${i}`, chronicleGuidance(battle.profile, battle.state));
        battle.state.stats.deployedByKind[i % 2] = 1;battle.state.time += 9;
        if (battle.state.chronicle) { battle.state.chronicle.rescued = i > 1;battle.state.chronicle.boss.windupUntil = i === 2 ? battle.state.time + 3 : 0;battle.state.chronicle.rally = i === 3; }
      }
    }
    // Chapter presentation, scouting and village voices.
    for (let chapter = 0; chapter < 6; chapter++) {
      const view = chapterPresentation(chapter);
      assertArabic(`chapter ${chapter}`, `${view.title} ${view.subtitle} ${view.period} ${[0, 1, 2].map(kind => unitPresentationName(chapter, kind as 0 | 1 | 2)).join(' ')}`);
      const scout = chapterScouting(chapter);
      assertArabic(`scouting ${chapter}`, `${chapterScoutingHtml(chapter)} ${scout.opening} ${scout.threat} ${scout.counter}`);
      for (const phase of ['won', 'lost'] as const) for (const stats of [undefined, { maxFreezeTargets: 3 }, { meteorKills: 3 }, { deployedByKind: [1, 1, 1] }])
        assertArabic(`voice ${chapter} ${phase}`, villageVoice(chapter, phase, stats as never));
      assertArabic(`mastery marks ${chapter}`, masteryMarksHtml(p, chapter));
      const m = chapterMastery(p, chapter);assertArabic(`mastery ${chapter}`, `${m.thirdTitle} ${m.thirdRequirement}`);
      const attempt = structuredClone(p);attempt.enemyAge = chapter;
      assertArabic(`attempt ${chapter}`, masteryAttemptText(attempt, s));
    }
    assertArabic('battle teaching', battleTeachingHtml());
    // Mastery advice branches.
    const advice = new Game(defaultProfile());
    assertArabic('advice none deployed', masteryAdvice(advice.profile, advice.state));
    advice.state.stats.deployed = 3;advice.state.food = 99;
    assertArabic('advice food', masteryAdvice(advice.profile, advice.state));
    advice.state.food = 0;advice.state.stats.gateDamageTaken = 10;advice.state.stats.deployedByKind = [0, 3, 0];
    assertArabic('advice front line', masteryAdvice(advice.profile, advice.state));
    advice.state.stats.deployedByKind = [3, 0, 0];advice.profile.coins = 1e6;
    assertArabic('advice unlock', masteryAdvice(advice.profile, advice.state));
    advice.profile.unlocked = [true, true, true];advice.profile.mastery.chapters[0].earnedMask = 5;
    assertArabic('advice gate', masteryAdvice(advice.profile, advice.state));
    advice.profile.mastery.chapters[0].earnedMask = 7;
    assertArabic('advice mixed', masteryAdvice(advice.profile, advice.state));
    // Cards.
    for (const quantity of [1, 10, 50] as const) {
      assertArabic(`cards ${quantity}`, cardsScreenHtml(p, quantity));
      const pack = cardPackPreview(p, quantity);assertArabic('pack preview', `${pack.text} ${pack.label}`);
    }
    for (const card of CARD_DEFS) assertArabic(`card ${card.id}`, `${card.name} ${card.description}`);
    const before = p.cards.map((count, i) => (i < 6 ? Math.max(0, count - 2) : count));
    assertArabic('summoned', summonedCardsHtml(before, p));
    assertArabic('one summoned', summonedCardsHtml(p.cards.map((c, i) => (i === 2 ? c - 1 : c)), p));
    // Quests, troop roles, journey, battle selection and evolution.
    for (const quest of QUESTS) assertArabic(`quest ${quest.id}`, quest.title);
    for (const era of ERAS) for (const unit of era.units) assertArabic('troop role', unit.role);
    assertArabic('journey', journeyScreenHtml(p, s));
    const done = structuredClone(p);done.claimed = QUESTS.map(q => q.id);done.mastery.chapters[2].earnedMask = 7;
    assertArabic('journey complete', journeyScreenHtml(done, { ...s, phase: 'won' } as BattleState));
    assertArabic('battle selection', battleSelectionHtml(p, s));
    const recovering = new Game(storyGame().profile);recovering.profile.enemyAge = 3;recovering.profile.age = 3;
    assertArabic('battle selection recovery', battleSelectionHtml(recovering.profile, recovering.state, true));
    assertArabic('battle selection running', battleSelectionHtml(p, { ...s, phase: 'running' } as BattleState));
    const evolve = structuredClone(p);evolve.coins = 1e9;
    assertArabic('evolution dialog', evolutionDialogHtml(evolve, s)!);
    assertArabic('evolution screen', evolutionScreenHtml(p, s));
    assertArabic('evolution screen rich', evolutionScreenHtml(evolve, s));
    const final = structuredClone(p);final.age = 5;final.enemyAge = 5;
    assertArabic('evolution final', evolutionScreenHtml(final, s));
    assertArabic('evolution running', evolutionScreenHtml(p, { ...s, phase: 'running' } as BattleState));
    // Prestige and legacy.
    const legacy = defaultProfile();Object.assign(legacy, { timeline: 3, enemyAge: 5, furthestBattle: 5, age: 4, coins: 4321, unlocked: [true, true, true], gems: 900, legacy: { rank: 1, selected: 'hearth' } });
    legacy.mastery.timeline = 3;for (const record of legacy.mastery.chapters) record.earnedMask = 3;
    legacy.pendingVictory = { settlement: 'legacy', timeline: 3, battle: 5, earned: 4321, seconds: 80, playerHp: 100 };
    const lg = new Game(legacy);
    for (const choice of ['hearth', 'watch', 'stillness'] as const) {
      const preview = prestigePreview(lg.profile, lg.state, choice);
      assert.ok(preview, 'prestige preview available');
      assertArabic(`prestige ${choice}`, prestigeDetailsHtml(lg.profile, preview!) + prestigeDialogHtml(lg.profile, preview!));
    }
    assertArabic('legacy preparation', legacyPreparationHtml(lg.profile, lg.state) + legacyLearningHtml(lg.profile) + legacyCurrentHtml(lg.profile));
    const unranked = new Game(defaultProfile());
    assertArabic('legacy unranked', legacyPreparationHtml(unranked.profile, unranked.state) + legacyCurrentHtml(unranked.profile));
    const limit = structuredClone(unranked.profile);limit.timeline = 1000;
    assertArabic('legacy limit', legacyPreparationHtml(limit, unranked.state) + legacyLearningHtml(limit) + legacyCurrentHtml(limit) + prestigeDialogHtml(limit, prestigePreview(lg.profile, lg.state, 'hearth')!));
    // Backup errors.
    for (const text of ['x'.repeat(200_000), 'not json', '[]', '{"format":"other"}', '{"format":"almo7areboon-backup","version":1,"profile":null}', '{"cards":[]}'])
      { const result = importBackup(text);assert.equal(result.ok, false);if (!result.ok) assertArabic(`backup ${text.slice(0, 12)}`, result.error); }
  } finally {
    setLang('en');
  }
});

test('story group: English stays the default and unchanged after Arabic', () => {
  setLang('ar');setLang('en');
  assert.equal(chapterPresentation(0).title, 'First Fires');
  assert.equal(ROUTES[0].name, 'The old road');
  assert.equal(CARD_DEFS[0].name, 'Olive-wood Shield');
  assert.equal(CARD_DEFS[0].id, 'turtle-shell');
  assert.equal(QUESTS[0].title, 'Defeat 10 enemies');
  assert.equal(ERAS[0].units[0].role, 'Melee');
  assert.equal(ERAS[2].name, 'Spartan Age');
});
