import test from 'node:test';
import assert from 'node:assert/strict';
import { runEncounter, encounterMatrix, POLICIES } from '../scripts/simulate-encounters.ts';

test('First Fires supports immediate and banked melee without a hidden opening penalty',()=>{
  const immediate=runEncounter(0,1,0,'immediate-melee'),banked=runEncounter(0,1,0,'banked-melee');
  assert.equal(immediate.outcome,'won');assert.equal(banked.outcome,'won');
  assert.ok(immediate.time<=120&&banked.time<=120);
  assert.ok(immediate.time<=banked.time*1.25,`${immediate.time} vs ${banked.time}`);
});
test('level two chapters retain melee progress and mixed wins within two minutes',()=>{
  for(let age=0;age<6;age++){
    const melee=POLICIES.slice(0,2).map(policy=>runEncounter(age,1,2,policy));
    assert.ok(melee.some(row=>row.outcome==='won'&&row.time<=180),`age ${age}: melee`);
    const mixed=POLICIES.slice(2).map(policy=>runEncounter(age,1,2,policy));
    assert.ok(mixed.some(row=>row.outcome==='won'&&row.time<=120),`age ${age}: mixed`);
  }
});
test('threat-aware composition has a practical advantage in at least two later chapters',()=>{
  const advantages=[];
  for(let age=1;age<6;age++){
    const aware=runEncounter(age,1,2,'threat-aware'),fixed=runEncounter(age,1,2,'fixed-mixed');
    if(aware.outcome==='won'&&(fixed.outcome!=='won'||aware.time<=fixed.time*.9||(aware.damageTaken<=fixed.damageTaken*.8&&aware.time<=fixed.time*1.1)))advantages.push(age);
  }
  assert.ok(advantages.length>=2,`qualifying ages: ${advantages}`);
});
test('matrix contains 144 valid policy rows and all 12 no-deployment controls lose',()=>{
  const rows=encounterMatrix();assert.equal(rows.filter(row=>row.policy!=='no-deployment').length,144);
  const controls=rows.filter(row=>row.policy==='no-deployment');assert.equal(controls.length,12);
  for(const row of controls)assert.equal(row.outcome,'lost',`age ${row.age} level ${row.upgrades}`);
  for(const row of rows){assert.ok(row.time<=180+1e-8);assert.ok(row.maxPlayerArmy<=60&&row.maxEnemyArmy<=60);assert.ok(row.valid);}
});

// Pin the documented chapters, rather than letting a different incidental pair hide regressions.
test('Hillside threat-aware takes twenty percent less damage without slower completion',()=>{
  const aware=runEncounter(4,1,2,'threat-aware'),fixed=runEncounter(4,1,2,'fixed-mixed');
  assert.equal(aware.outcome,'won');assert.equal(fixed.outcome,'won');
  assert.ok(aware.damageTaken<=fixed.damageTaken*.8);assert.ok(aware.time<=fixed.time*1.1);
});
test('Courtyards threat-aware finishes at least ten percent faster than fixed mixed',()=>{
  const aware=runEncounter(5,1,2,'threat-aware'),fixed=runEncounter(5,1,2,'fixed-mixed');
  assert.equal(aware.outcome,'won');assert.equal(fixed.outcome,'won');assert.ok(aware.time<=fixed.time*.9);
});
