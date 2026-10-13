import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/game/simulation.ts';
import {defaultProfile} from '../src/game/save.ts';
import {ERAS} from '../src/game/data.ts';
import {evolutionScreenHtml} from '../src/ui/evolution-screen.ts';

const gameAt=(age:number,coins:number,enemyAge=age)=>{const p=defaultProfile();Object.assign(p,{age,enemyAge,furthestBattle:enemyAge,coins});return new Game(p);};

test('Evolution puts the decision, wallet and reset consequences before the chapter catalogue',()=>{
 const game=gameAt(0,1200),html=evolutionScreenHtml(game.profile,game.state);
 assert.ok(html.indexOf('class="evolution-decision"')<html.indexOf('class="era-list"'));
 assert.match(html,/Your coins:\s*<strong>1,200<\/strong>/);
 assert.match(html,/All coins, upgrades and troop unlocks reset/);
 assert.match(html,/selected opponent and unlocked battles stay/);
});

test('Evolution shows exact coin shortfall and disables an unaffordable evolution',()=>{
 const game=gameAt(0,ERAS[0].evolveCost-37),html=evolutionScreenHtml(game.profile,game.state);
 assert.match(html,/Needs 37 more coins\./);
 assert.match(html,/data-command="evolve" disabled/);
});

test('Evolution removes the shortfall at the exact price and leaves the action enabled',()=>{
 const game=gameAt(0,ERAS[0].evolveCost),html=evolutionScreenHtml(game.profile,game.state);
 assert.doesNotMatch(html,/camp-shortfall/);
 assert.match(html,/data-command="evolve"(?! disabled)/);
});

test('battle and opponent gates still explain why Evolution is blocked',()=>{
 const battle=gameAt(0,ERAS[0].evolveCost);battle.dispatch({type:'start'});
 assert.match(evolutionScreenHtml(battle.profile,battle.state),/Finish the current battle to evolve\./);
 const behind=gameAt(1,ERAS[1].evolveCost,0);
 assert.match(evolutionScreenHtml(behind.profile,behind.state),/Defeat the enemy to continue evolving\./);
});

test('the Camp sticky return paints its gutter without widening the scroll area',()=>{
 const css=readFileSync(new URL('../src/ui/camp.css',import.meta.url),'utf8');
 const start=css.indexOf('.camp-advanced-return::before');
 const rule=css.slice(start,css.indexOf('}',start)+1);
 assert.ok(start>=0);
 assert.doesNotMatch(rule,/left:-24px|right:-24px|inset-inline:-/);
 assert.match(rule,/box-shadow:/);
});

test('the existing protected Start over confirmation remains explicit',()=>{
 const listeners=readFileSync(new URL('../src/app/listeners.ts',import.meta.url),'utf8');
 assert.match(listeners,/data-command="confirm-reset"/);
 assert.match(listeners,/DELETE PROGRESS AND START OVER/);
 assert.match(listeners,/KEEP MY PROGRESS/);
});
