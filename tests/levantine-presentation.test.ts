import test from 'node:test';
import { mainSource } from './helpers/main-source.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game} from '../src/game/simulation.ts';
import {ERAS,unlockCost} from '../src/game/data.ts';
import {createArmyUpdater} from '../src/ui/army-screen.ts';
import {evolutionScreenHtml} from '../src/ui/evolution-screen.ts';
import {battleSelectionHtml,evolutionDialogHtml} from '../src/ui/progression-screen.ts';
import {resultsHtml} from '../src/ui/results-screen.ts';

const titles=['First Fires','Olive Terraces','Harbor Watch','Lantern Quarter','Hillside Watch','Courtyards Beyond'];
async function presentation(){
 const path='../src/ui/chapter-presentation.ts';
 const m=await import(path).catch(()=>null);
 assert.ok(m,'a presentation-only chapter mapping must connect the Levantine art and interface');
 return m;
}

test('six fictional chapter labels replace reference-game names without editing game data',async()=>{
 const m=await presentation(),before=JSON.stringify(ERAS);
 for(let age=0;age<6;age++){
  const chapter=m.chapterPresentation(age);
  assert.equal(chapter.title,titles[age]);assert.ok(chapter.title.length<=22);
  assert.ok(chapter.subtitle.length<=48);assert.equal(chapter.units.length,3);
  for(const name of chapter.units)assert.ok(name.length<=12);
 }
 assert.equal(JSON.stringify(ERAS),before);
 assert.equal(ERAS[2].name,'Spartan Age');
});

test('chapter labels, unit names and scene cache use the same safe fallback',async()=>{
 const m=await presentation(),first=m.chapterPresentation(0);
 assert.ok(Object.isFrozen(first)&&Object.isFrozen(first.units));
 for(const bad of [-1,6,1.5,NaN,Infinity]){
  assert.equal(m.chapterPresentation(bad),first);
  assert.equal(m.unitPresentationName(bad,bad),first.units[0]);
  assert.equal(m.chapterLandscape(bad),m.chapterLandscape(0));
 }
});

test('selection and evolution identify the same six chapters with real illustrated thumbnails',async()=>{
 const m=await presentation(),g=new Game(),before=JSON.stringify(g.profile);
 const journey=evolutionScreenHtml(g.profile,g.state),selection=battleSelectionHtml(g.profile,g.state);
 for(let age=0;age<6;age++){
  assert.ok(journey.includes(titles[age]));assert.ok(selection.includes(titles[age]));
  assert.ok(journey.includes(m.chapterLandscape(age)));assert.ok(selection.includes(m.chapterLandscape(age)));
  assert.ok(selection.includes(`data-battle="${age}"`));
 }
 assert.equal((selection.match(/class="battle-option"/g)||[]).length,6);
 assert.equal((selection.match(/ disabled/g)||[]).length,5);
 assert.equal(JSON.stringify(g.profile),before);
});

test('the original prices and troop action IDs survive every presentation-name substitution',async()=>{
 const m=await presentation();
 for(let age=0;age<6;age++){
  const g=new Game();g.profile.age=age;
  const targets={units:{innerHTML:''},skills:{innerHTML:''},stages:{innerHTML:''}};
  const render=createArmyUpdater(targets,()=>'/portrait.svg');render(g.profile);
  for(const kind of [0,1,2] as const){
   const unit=ERAS[age].units[kind],name=m.unitPresentationName(age,kind);
   assert.ok(targets.units.innerHTML.includes(`data-unit="${kind}"`));
   assert.ok(targets.units.innerHTML.includes(kind===0?`Deploy ${name}, ${unit.cost} food`:`Unlock ${name}, ${unlockCost(kind,g.profile)} coins`));
   assert.ok(targets.units.innerHTML.includes(`<span class="unit-name">${name}</span>`));
  }
  assert.equal(render(g.profile),false,'unchanged wallet ticks must preserve nodes');
 }
});

test('evolution title changes do not weaken the spending, active battle or final-era gates',async()=>{
 const m=await presentation(),g=new Game();
 let html=evolutionDialogHtml(g.profile,g.state)!;
 assert.ok(html.includes(`Evolve to ${m.chapterPresentation(1).title}?`));
 assert.match(html,/confirm-evolve" disabled/);
 g.profile.coins=ERAS[0].evolveCost;
 html=evolutionDialogHtml(g.profile,g.state)!;assert.doesNotMatch(html,/confirm-evolve" disabled/);
 assert.match(html,/remaining coins are also cleared/);
 g.dispatch({type:'start'});assert.equal(evolutionDialogHtml(g.profile,g.state),null);
 g.state.paused=true;assert.equal(evolutionDialogHtml(g.profile,g.state),null);
 g.profile.age=5;g.state.phase='ready';assert.equal(evolutionDialogHtml(g.profile,g.state),null);
 assert.match(evolutionScreenHtml(g.profile,g.state),/FINAL AGE/);
});

test('results show the next opponent chapter, not the player army or a fictional reward',async()=>{
 const m=await presentation(),g=new Game();
 g.profile.age=3;g.profile.enemyAge=0;g.state.phase='won';
 const before=JSON.stringify(g.profile),html=resultsHtml(g.profile,g.state);
 assert.ok(html.includes(`${m.chapterPresentation(1).title} is next.`));
 assert.ok(html.includes(m.chapterLandscape(1)));
 assert.match(html,/Already added/);assert.match(html,/data-command="next"/);
 assert.equal(JSON.stringify(g.profile),before);
 g.profile.enemyAge=5;
 const final=resultsHtml(g.profile,g.state);
 assert.match(final,/Next Timeline/);assert.doesNotMatch(final,/undefined|NaN/);
});

test('HUD, unlock notifications and import previews share the presentation boundary (source contract)',()=>{
 const main=mainSource();
 assert.match(main,/chapterPresentation\(p.age\)\.title/);
 assert.match(main,/chapterPresentation\(pendingImport.age\)\.title/);
 assert.match(main,/troopUnlockMessage\(game.profile,game.state.phase,kind,game.deploymentStatus\(kind\)\)/);
 const army=readFileSync(new URL('../src/ui/army-screen.ts',import.meta.url),'utf8');
 assert.match(army,/unitPresentationName\(profile.age, kind\)/);
 assert.doesNotMatch(main,/ERAS\[(?:p|game.profile|pendingImport)\.age\]\.name/);
});

test('new chapter artwork has bounded decorative slots and cannot intercept controls (source contract)',()=>{
 const css=readFileSync(new URL('../src/ui/continuation.css',import.meta.url),'utf8');
 assert.match(css,/\.battle-preview\s*\{[^}]*width:\s*46px/);
 assert.match(css,/\.battle-preview\s*\{[^}]*height:\s*48px/);
 assert.match(css,/\.battle-preview\s*\{[^}]*object-fit:\s*cover/);
 assert.match(css,/\.result-landscape\s*\{[^}]*position:\s*absolute/);
 assert.match(css,/\.result-landscape\s*\{[^}]*pointer-events:\s*none/);
});
