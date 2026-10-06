import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/simulation.ts';
import { ERAS } from '../src/game/data.ts';
import { createFieldController } from '../src/ui/field-controller.ts';
import type { Unit } from '../src/game/types.ts';

class Node {
 ownerDocument={activeElement:null};dataset:Record<string,string>={};hidden=false;disabled=false;title='';innerHTML='';textContent='';clientWidth=390;clientHeight=600;
 attributes=new Map<string,string>();classes=new Set<string>();children=new Map<string,Node>();
 classList={toggle:(key:string,value:boolean)=>{if(value)this.classes.add(key);else this.classes.delete(key);},remove:(key:string)=>this.classes.delete(key)};
 getAttribute(key:string){return this.attributes.get(key)??null;} setAttribute(key:string,value:string){this.attributes.set(key,value);}
 querySelector(selector:string){if(!this.children.has(selector))this.children.set(selector,new Node());return this.children.get(selector)!;}
 querySelectorAll(){return [];} contains(){return false;} focus(){}
}
function harness(){
 const root=new Node(),recruits=[0,1,2].map(k=>{const n=new Node();n.dataset.fieldRecruit=String(k);return n;});
 const query=root.querySelector.bind(root);root.querySelectorAll=((selector:string)=>selector==='[data-field-recruit]'?recruits:[]) as any;
 const controller=createFieldController(root as any),g=new Game();g.dispatch({type:'start'});g.state.stats.deployed=1;g.state.food=26;g.state.time=30;
 g.state.units=[{id:1,side:'player',hp:10},{id:2,side:'enemy',hp:10,x:800,lane:0},{id:3,side:'enemy',hp:10,x:850,lane:1},{id:4,side:'enemy',hp:10,x:900,lane:2}] as Unit[];
 return {g,recruits,cue:query('#field-cue'),update(){controller.update(g);}};
}
test('actual physical controller points banked food at the waiting defender and gives that recruit the teaching ring',()=>{
 const h=harness(),before=JSON.stringify([h.g.profile,h.g.state]);h.update();
 assert.match(h.cue.textContent,/^Food is piling up \(26\)\. Tap the waiting defender again/);
 assert.doesNotMatch(h.cue.textContent,/card|Select an enemy|Freeze/);assert.equal(h.recruits[0].classes.has('teach'),true);
 assert.equal(h.recruits[1].classes.has('teach'),false);assert.equal(JSON.stringify([h.g.profile,h.g.state]),before,'presentation does not dispatch or spend');
});
test('physical piling cue and ring obey the canonical threshold, phase, pause, army and wins',()=>{
 for(const condition of ['below','paused','ready','experienced','army','no-enemy','undeployed']){
  const h=harness();
  if(condition==='below')h.g.state.food=ERAS[0].units[0].cost*8-0.01;
  if(condition==='paused')h.g.state.paused=true;if(condition==='ready')h.g.state.phase='ready';if(condition==='experienced')h.g.profile.wins=3;
  if(condition==='army')h.g.state.units.push({...h.g.state.units[0],id:5},{...h.g.state.units[0],id:6});
  if(condition==='no-enemy')h.g.state.units=h.g.state.units.filter(u=>u.side==='player');if(condition==='undeployed')h.g.state.stats.deployed=0;
  h.update();assert.doesNotMatch(h.cue.textContent,/Food is piling up/,condition);
  assert.equal(h.recruits[0].classes.has('teach'),condition==='undeployed',condition);
 }
});
