import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { Game } from '../src/game/simulation.ts';
import { defaultProfile } from '../src/game/save.ts';
import { legacyEffects } from '../src/game/prestige.ts';
import { skillCue } from '../src/ui/skill-cues.ts';

test('prestige native cast acceptance verifies active Freeze, badge and authoritative consumed state',async()=>{
 const source=readFileSync(new URL('../scripts/capture-prestige-review.mjs',import.meta.url),'utf8');
 const ast=ts.createSourceFile('prestige.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const fn=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='assertActiveFreeze');
 assert.ok(fn,'prestige acceptance must distinguish active Freeze from expired/spent');
 const verify=runInNewContext(`(${fn.getText(ast)})`,{assert});
 for(const selected of ['hearth','watch','stillness'] as const){
  const p=defaultProfile();p.legacy={rank:3,selected};const g=new Game(p);g.dispatch({type:'start'});
  const control=()=>{const cue=skillCue(g.profile,g.state,'freeze',g.canUseSkill('freeze'));return {
   getAttribute:async()=>cue.label,isDisabled:async()=>!g.canUseSkill('freeze'),
   locator:()=>({innerText:async()=>cue.badge}),evaluate:async()=>cue.activeEffect,
  };};
  const duration=legacyEffects(p.legacy).freezeSeconds;
  await assert.rejects(verify(control(),duration));
  assert.equal(g.dispatch({type:'skill',skill:'freeze'}),true);
  await verify(control(),duration);g.step(1/60);await verify(control(),duration);
  g.state.paused=true;await verify(control(),duration);g.state.paused=false;
  for(let i=0;i<duration*60+2;i++)g.step(1/60);
  await assert.rejects(verify(control(),duration));
 }
});
