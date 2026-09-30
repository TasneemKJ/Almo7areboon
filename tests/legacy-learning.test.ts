import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { currentSealCount, legacyCandidateRank } from '../src/game/prestige.ts';
import { legacyPreparationHtml } from '../src/ui/prestige-presentation.ts';

test('fresh preparation teaches optional legacy goals without granting or offering a reset',()=>{
 const game=new Game(),before=JSON.stringify(game),html=legacyPreparationHtml(game.profile,game.state);
 assert.match(html,/<details class="chapter-scouting legacy-learning"><summary>How legacies grow<\/summary>/);
 assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
 for(const text of ['This timeline: 0 / 18 seals','Rank 1','Rank 2','12 seals','Rank 3','18 seals','final chapter','confirm a new timeline','One legacy is active','Cards, gems and your earned rank stay','Seals from different timelines are not added together'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/data-command|type="radio"/);
 assert.equal(JSON.stringify(game),before);
 assert.deepEqual([legacyCandidateRank(11),legacyCandidateRank(12),legacyCandidateRank(17),legacyCandidateRank(18)],[1,2,2,3]);
});

test('prepared historical rank and masks are explained without combining old timelines',()=>{
 const game=new Game();game.profile.legacy={rank:2,selected:'watch'};
 for(let i=0;i<4;i++)game.profile.mastery.chapters[i].earnedMask=7;
 game.profile.mastery.chapters[0].bestSeconds=NaN;
 const before=JSON.stringify(game),html=legacyPreparationHtml(game.profile,game.state);
 assert.equal(currentSealCount(game.profile),12);
 assert.match(html,/This timeline: 12 \/ 18 seals/);
 assert.match(html,/Your earned rank never goes down/);
 assert.match(html,/Coins, age upgrades, troop unlocks and this timeline's seals reset/);
 assert.equal((html.match(/type="radio"/g)??[]).length,3,'existing selection group remains the only choices');
 assert.equal(JSON.stringify(game),before);
});

test('terminal rank-zero preparation never promises an unavailable first legacy',()=>{
 const game=new Game();game.profile.timeline=1000;game.profile.mastery.timeline=1000;
 const before=JSON.stringify(game),html=legacyPreparationHtml(game.profile,game.state);
 assert.match(html,/Timeline limit reached: no further reset or rank upgrade through a reset/);
 assert.doesNotMatch(html,/Your first legacy is earned when you begin the next timeline/);
 assert.doesNotMatch(html,/Complete a timeline to carry one forward/);
 assert.doesNotMatch(html,/data-command|type="radio"/);
 assert.equal(JSON.stringify(game),before);
});

test('terminal earned legacy keeps ordinary ready selection alongside truthful notes',()=>{
 const game=new Game();game.profile.timeline=1000;game.profile.mastery.timeline=1000;game.profile.legacy={rank:3,selected:'stillness'};
 const html=legacyPreparationHtml(game.profile,game.state);
 assert.match(html,/Timeline limit reached: no further reset or rank upgrade through a reset/);
 assert.match(html,/name="ready-legacy"/);
 assert.match(html,/Freeze: 10 seconds/);
 assert.doesNotMatch(html,/confirm-prestige|data-command="next"/);
});
