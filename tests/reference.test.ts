import test from 'node:test';
import assert from 'node:assert/strict';
import {ERAS} from '../src/game/data.ts';

// These assertions pin independently researched reference facts, not calculated
// outputs of the implementation. Sources and unresolved tuning are in FIDELITY.md.
test('timeline one follows the reference roster through Space Age',()=>{
  assert.deepEqual(ERAS.map(e=>e.name),['Stone Age','Farm Age','Spartan Age','Renaissance','Modern Age','Space Age']);
  assert.deepEqual(ERAS.map(e=>e.units.map(u=>u.name)),[
    ['Caveman','Thrower','Dino'],['Farmer','Slinger','Scythe'],
    ['Spartan','Archer','Rider'],['Swordsman','Musketeer','Cannon'],
    ['Soldier','Rifleman','Tank'],['Astro-Knight','Trooper','Spaceship'],
  ]);
});

test('Stone Age troop costs and relative strengths match the documented reference',()=>{
  const [caveman,thrower,dino]=ERAS[0].units;
  assert.deepEqual([caveman.cost,thrower.cost,dino.cost],[3,5,7]);
  assert.ok(Math.abs(caveman.hp/thrower.hp-3)<.0001);
  assert.equal(caveman.damage,thrower.damage);
  assert.equal(dino.hp,caveman.hp*5);
  assert.equal(dino.damage,caveman.damage*2);
});

test('documented first timeline evolution prices replace prototype shortcuts',()=>{
  assert.deepEqual(ERAS.slice(0,5).map(e=>e.evolveCost),[2500,20000,170000,1300000,13000000]);
});
