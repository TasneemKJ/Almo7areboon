import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES} from '../src/game/chronicle.ts';
import {simulateChronicle,preparedChronicleProfile} from '../scripts/simulate-chronicle.ts';
for(const route of ROUTES)test(`prepared public-action company can complete ${route.id} without a stalled objective`,()=>{const game=simulateChronicle(route.id);assert.equal(game.state.phase,'won');assert.ok(game.state.time<=90);assert.ok(game.profile.pendingVictory);});
test('one expedition company finishes three different objectives with saved carryover',()=>{let p=preparedChronicleProfile();p.chronicle!.route='escort';p.chronicle!.expedition={stage:0,chapter:0,reserve:0,provision:'supplies'};for(let stage=0;stage<3;stage++){const game=simulateChronicle(p.chronicle!.route,p);assert.equal(game.state.phase,'won');assert.equal(game.dispatch({type:'chronicle-continue'}),true);p=game.profile;}assert.equal(p.chronicle!.expeditionsWon,1);assert.equal(p.chronicle!.expedition,null);});
