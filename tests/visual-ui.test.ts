import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultProfile} from '../src/game/save.ts';
import {Game} from '../src/game/simulation.ts';
import {ERAS} from '../src/game/data.ts';
import {chapterPresentation} from '../src/ui/chapter-presentation.ts';

async function evolution() {
 const path='../src/ui/evolution-screen.ts';
 const module=await import(path).catch(()=>null);
 assert.ok(module,'the era journey must render the actual six illustrated ages');
 return module;
}
test('era journey shows all six landscapes and preserves the actual evolution gates',async()=>{
 const m=await evolution();const g=new Game();
 let html=m.evolutionScreenHtml(g.profile,g.state);
 assert.equal((html.match(/class="era-landscape"/g)??[]).length,6);
 assert.equal((html.match(/class="era-picture"/g)??[]).length,6);
 for(let age=0;age<ERAS.length;age++)assert.ok(html.includes(chapterPresentation(age).title));
 assert.match(html,/data-command="evolve" disabled/);
 g.profile.coins=ERAS[0].evolveCost;
 html=m.evolutionScreenHtml(g.profile,g.state);
 assert.match(html,/data-command="evolve" >/);
 assert.match(html,/All coins, upgrades and troop unlocks reset/);assert.match(html,/selected opponent and unlocked battles stay/);
 g.dispatch({type:'start'});
 assert.match(m.evolutionScreenHtml(g.profile,g.state),/data-command="evolve" disabled/);
});
test('journey reuses immutable landscape illustrations and handles final age without invalid content',async()=>{
 const m=await evolution();const g=new Game({...defaultProfile(),age:5});
 const html=m.evolutionScreenHtml(g.profile,g.state);
 assert.match(html,/FINAL AGE/);assert.doesNotMatch(html,/undefined|NaN/);
 assert.equal(m.evolutionScreenHtml(g.profile,g.state),html);
});
test('visual UI source contract: shared illustrated assets are not stretched or greyed out',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 for(const selector of ['.world-loader','.unit-role','.era-landscape','.card-art img','.summon-results img'])assert.ok(css.includes(selector),`styles for ${selector}`);
 assert.match(css,/object-fit:\s*contain/);
 assert.doesNotMatch(css,/grayscale\(1\)/);
});
test('visual UI source contract: primary small-phone controls remain at least 44px',()=>{
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(css,/--touch:\s*44px/);
 assert.match(css,/\.square-button[\s\S]*?var\(--touch\)/);
 assert.match(css,/\.battle-toggles button[\s\S]*?var\(--touch\)/);
 assert.match(css,/\.skill-circle[\s\S]*?var\(--touch\)/);
 assert.match(css,/\.buy-button[\s\S]*?var\(--touch\)/);
});
