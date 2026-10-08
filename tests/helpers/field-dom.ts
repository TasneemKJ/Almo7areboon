import {Game} from '../../src/game/simulation.ts';
import {createFieldController} from '../../src/ui/field-controller.ts';

export class FieldNode {
 dataset:Record<string,string>={};hidden=false;disabled=false;title='';textContent='';clientWidth=390;clientHeight=600;isConnected=true;
 attributes=new Map<string,string>();classes=new Set<string>();children=new Map<string,FieldNode>();buttons:FieldNode[]=[];
 ownerDocument:{activeElement:FieldNode|null};html='';
 constructor(document={activeElement:null as FieldNode|null}){this.ownerDocument=document;}
 classList={toggle:(key:string,value:boolean)=>{if(value)this.classes.add(key);else this.classes.delete(key);},remove:(key:string)=>this.classes.delete(key)};
 get innerHTML(){return this.html;}
 set innerHTML(value:string){
  this.html=value;this.buttons=[...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match=>{
   const button=new FieldNode(this.ownerDocument);button.textContent=match[2];
   for(const attr of match[1].matchAll(/data-([\w-]+)="([^"]*)"/g))button.dataset[attr[1].replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase())]=attr[2];
   return button;
  });
 }
 getAttribute(key:string){return this.attributes.get(key)??null;}
 setAttribute(key:string,value:string){this.attributes.set(key,value);}
 querySelector(selector:string){if(!this.children.has(selector))this.children.set(selector,new FieldNode(this.ownerDocument));return this.children.get(selector)!;}
 querySelectorAll(selector:string){return selector==='[data-skill]'?this.buttons.filter(button=>button.dataset.skill):[];}
 contains(node:unknown){return this.buttons.includes(node as FieldNode);}
 closest(){return null;}
 getClientRects(){return this.hidden?[]:[{}];}
 focus(){this.ownerDocument.activeElement=this;}
}

/** Runs the real controller; the native DOM is the only substituted boundary. */
export function fieldHarness(game=new Game()){
 const root=new FieldNode(),recruits=[0,1,2].map(kind=>{const node=new FieldNode(root.ownerDocument);node.dataset.fieldRecruit=String(kind);return node;});
 const gates=['hold','advance'].map(kind=>{const node=new FieldNode(root.ownerDocument);node.dataset.fieldGate=kind;return node;});
 root.querySelectorAll=(selector:string)=>selector==='[data-field-recruit]'?recruits:selector==='[data-field-gate]'?gates:[];
 const controller=createFieldController(root as unknown as HTMLElement);
 if(game.state.phase==='ready')game.dispatch({type:'start'});
 game.state.stats.deployed=1;
 return {game,root,controller,node:(id:string)=>root.querySelector(`#${id}`),update:()=>controller.update(game)};
}
