import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {createArmyUpdater} from '../src/ui/army-screen.ts';
import {defaultProfile} from '../src/game/save.ts';

const css=postcss.parse(readFileSync('src/ui/landscape-rail.css','utf8'));
const live='.battle-view:has(.world:is([data-phase="running"],[data-phase="paused"]))';
const shell='.game-shell:has(.world:is([data-phase="running"],[data-phase="paused"]))';
function declarations(selector:string){const result:Record<string,string>={};css.walkRules(selector,rule=>{rule.walkDecls(d=>{result[d.prop]=d.value;});});return result;}

// Wiring contracts only. The same-scene native browser probe separately
// measures actual arena gain, text geometry, touch reach and focus behavior.
test('live troop controls give the arena space without hiding name, role or price',()=>{
 const card=declarations(`${live} .unit-card`);
 assert.equal(card.height,'88px');assert.equal(card['min-height'],'88px');
 assert.equal(declarations(`${live} .unit-role`)['font-size'],'10px');
 assert.equal(declarations(`${live} .unit-name`)['font-size'],'12px');
 assert.equal(declarations(`${live} .unit-price`).height,'24px');
 for(const suffix of ['.unit-name','.unit-role','.unit-price'])assert.notEqual(declarations(`${live} ${suffix}`).display,'none');
});
test('live navigation keeps every labeled destination in a 44px touch row',()=>{
 assert.equal(declarations(`${shell} .bottom-nav`).height,'calc(44px + env(safe-area-inset-bottom,0px))');
 assert.equal(declarations(`${shell} .bottom-nav`)['border-top-width'],'0px');
 assert.equal(declarations(`${shell} .nav-item`)['min-height'],'44px');
 assert.equal(declarations(`${shell} .nav-item`)['flex-direction'],'row');
 assert.equal(declarations(`${shell} .secondary-screen`).bottom,'calc(44px + env(safe-area-inset-bottom,0px))');
 assert.equal(declarations(shell)['padding-bottom'],'calc(44px + env(safe-area-inset-bottom,0px))');
});
test('compact landscape rail remains wide enough for three direct troop choices',()=>{
 const rule=declarations(':root .game-shell');
 assert.equal(rule['--rail'],'clamp(300px,36vw,340px)');
 assert.notEqual(declarations(`${live} .unit-card`).display,'none');
});
test('temporary sessions reserve the notice as well as compact navigation below secondary screens',()=>{
 const notice=28,nav=44;
 assert.equal(declarations(`[data-save-session="temporary"] ${shell} .secondary-screen`).bottom,`calc(${notice+nav}px + env(safe-area-inset-bottom,0px))`);
});
test('the original native troop markup retains every cost, lock and accessible specialty in all chapters',()=>{
 for(let age=0;age<6;age++){
  const units={innerHTML:''},skills={innerHTML:''},stages={innerHTML:''};
  const update=createArmyUpdater({units,skills,stages},()=>'/original-portrait.webp');
  const profile=defaultProfile();profile.age=age;update(profile);
  assert.equal((units.innerHTML.match(/data-unit=/g)??[]).length,3);
  assert.equal((units.innerHTML.match(/class="unit-price"/g)??[]).length,3);
  for(const name of ['Guard','Pierce','Sweep'])assert.ok(units.innerHTML.includes(name));
  assert.ok(units.innerHTML.includes('Deploy '));assert.ok(units.innerHTML.includes('Unlock '));
  assert.ok(units.innerHTML.includes('food'));assert.ok(units.innerHTML.includes('coins'));
 }
});
