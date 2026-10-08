/** A narrow DOM boundary for exercising the actual physical controller. */
export class FieldNode {
 ownerDocument:{activeElement:FieldNode|null};dataset:Record<string,string>={};hidden=false;disabled=false;title='';clientWidth=390;clientHeight=844;isConnected=true;
 attributes=new Map<string,string>();classes=new Set<string>();children=new Map<string,FieldNode>();buttons:FieldNode[]=[];writes=0;
 private text='';private markup='';
 constructor(document={activeElement:null as FieldNode|null}){this.ownerDocument=document;}
 get textContent(){return this.text;}set textContent(value:string){this.text=value;this.writes++;}
 get innerHTML(){return this.markup;}set innerHTML(value:string){
  this.markup=value;this.buttons=[];
  for(const [,attrs,content]of value.matchAll(/<button([^>]*)>(.*?)<\/button>/g)){
   const button=new FieldNode(this.ownerDocument);button.textContent=content;
   for(const [,key,value]of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g))button.dataset[key.replace(/-([a-z])/g,(_,c:string)=>c.toUpperCase())]=value;
   this.buttons.push(button);
  }
 }
 classList={toggle:(key:string,value:boolean)=>{if(value)this.classes.add(key);else this.classes.delete(key);},remove:(key:string)=>this.classes.delete(key)};
 getAttribute(key:string){return this.attributes.get(key)??null;}setAttribute(key:string,value:string){this.attributes.set(key,value);}
 querySelector(selector:string){if(!this.children.has(selector))this.children.set(selector,new FieldNode(this.ownerDocument));return this.children.get(selector)!;}
 querySelectorAll(selector:string):FieldNode[]{return selector==='[data-skill]'?this.buttons.filter(node=>node.dataset.skill):[];}
 contains(node:unknown){return this.buttons.includes(node as FieldNode);}closest(){return this.hidden?this:null;}getClientRects(){return this.hidden?[]:[{}];}focus(){this.ownerDocument.activeElement=this;}
}
export function fieldDom(){
 const root=new FieldNode(),recruits=[0,1,2].map(kind=>{const node=new FieldNode(root.ownerDocument);node.dataset.fieldRecruit=String(kind);return node;});
 const gates=['hold','advance'].map(kind=>{const node=new FieldNode(root.ownerDocument);node.dataset.fieldGate=kind;return node;});
 root.querySelectorAll=selector=>selector==='[data-field-recruit]'?recruits:selector==='[data-field-gate]'?gates:[];
 return {root,recruits,gates,node:(id:string)=>root.querySelector(`#${id}`)};
}
