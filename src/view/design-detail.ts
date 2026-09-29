import type {Side,UnitKind} from '../game/types.ts';
import {path as p,ellipse as e,rect as r,line as l,INK} from './illustration-kit.ts';

const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const validKind=(kind:number):UnitKind=>(Number.isInteger(kind)&&kind>=0&&kind<3?kind:0) as UnitKind;
const team=(side:Side)=>side==='enemy'?'#e58b76':'#71bdd1';
const cluster=(y:number,body:string)=>`<g data-y="${y}">${body}</g>`;
const stone=(x:number,y:number,w:number,h:number)=>cluster(y,
  r(x,y,w,h,2,'#71837a','#314d52',1)+
  l(`M${x+3} ${y+Math.max(4,h*.34)}h${w*.42}M${x+w*.54} ${y+Math.max(6,h*.62)}h${w*.35}`,'#b3ad8f',.8)+
  l(`M${x+w*.27} ${y+1}v${Math.min(h-2,9)}M${x+w*.68} ${y+Math.max(2,h*.37)}v${Math.min(h*.45,8)}`,'#455f5c',.7));
const pot=(x:number,y:number,s=1)=>cluster(y,
  `<g transform="translate(${x} ${y}) scale(${s})">${p('M-8-7Q0-11 8-7L6 8Q0 13-6 8Z','#9d7659','#334e52',1)}${e(0,-7,8,2.3,'#c59a70','#334e52',.8)}${l('M-5 1Q0 3 5 1','#e0ba86',1)}</g>`);
const cypress=(x:number,y:number,s=1)=>cluster(y,
  `<g transform="translate(${x} ${y}) scale(${s})">${p('M0-55Q-18-27-10-3Q-3 8 8-2Q17-27 0-55Z','#315453','#223d46',1)}${l('M0-48V4','#7f806d',1.2)}</g>`);
const awning=(x:number,y:number,w:number,color:string)=>cluster(y,
  p(`M${x} ${y}Q${x+w*.5} ${y-8} ${x+w} ${y}L${x+w-4} ${y+13}Q${x+w*.5} ${y+6} ${x+4} ${y+13}Z`,color,'#304c52',1)+
  l(`M${x+4} ${y+4}Q${x+w*.5} ${y-2} ${x+w-4} ${y+4}`,'#e2d0a6',1));
const banner=(x:number,y:number,s:number,color:string)=>cluster(y,
  `<g transform="translate(${x} ${y}) scale(${s})">${l('M0 18V-24','#344d52',2)}${p('M1-22L24-18 18-5 1-9Z',color,'#30464c',1)}${p('M8-18l4 4-4 4-4-4Z','#d8c594','none',0)}</g>`);
const potteryShelf=(x:number,y:number)=>cluster(y,
  l(`M${x} ${y}h54`,'#765f4b',3)+potRaw(x+9,y-2,.6)+potRaw(x+27,y-2,.48)+potRaw(x+44,y-2,.7));
function potRaw(x:number,y:number,s:number){return `<g transform="translate(${x} ${y}) scale(${s})">${p('M-8-7Q0-11 8-7L6 8Q0 13-6 8Z','#9d7659','#334e52',1)}${e(0,-7,8,2.3,'#c59a70','#334e52',.8)}</g>`;}
const oliveBranch=(x:number,y:number,s=1)=>cluster(y,
  `<g transform="translate(${x} ${y}) scale(${s})">${l('M0 0Q17-23 39-37','#596e5f',2)}${[0,1,2,3,4].map(i=>p(`M${8+i*7} ${-9-i*6}q-11-4-10 3 6 6 10-3ZM${13+i*7} ${-14-i*6}q10-7 12-1-4 8-12 5Z`,i%2?'#8fa07f':'#738b75','none',0)).join('')}</g>`);

/** Selective material detail: clustered around landmarks and edges, never the battle road. */
export function sceneMaterialDetailSvg(input:number):string {
 const age=validAge(input),blue='#55788a',coral='#b77868';
 let out='';
 if(age===0){
  out+=stone(199,528,38,17)+stone(565,528,48,19)+pot(365,547,.9)+pot(390,550,.62)+banner(278,494,.66,blue)+banner(626,486,.58,coral)+cypress(188,520,.54)+oliveBranch(746,526,.8)+potteryShelf(468,548);
 }else if(age===1){
  out+=stone(112,522,52,16)+stone(758,506,56,18)+pot(439,520,.78)+pot(574,527,.68)+banner(383,450,.62,blue)+banner(656,478,.53,coral)+cypress(338,470,.43)+oliveBranch(694,460,.82)+awning(502,458,72,'#6c8790');
 }else if(age===2){
  out+=stone(279,536,56,17)+stone(686,531,51,18)+pot(424,500,.7)+pot(533,507,.54)+banner(356,425,.62,blue)+banner(573,428,.6,coral)+cypress(312,468,.44)+oliveBranch(695,472,.7)+awning(479,444,82,'#657f91')+potteryShelf(519,520);
 }else if(age===3){
  out+=stone(267,548,48,18)+stone(625,541,52,17)+pot(346,535,.68)+pot(551,532,.72)+banner(326,395,.64,blue)+banner(585,397,.62,coral)+cypress(265,505,.42)+oliveBranch(653,490,.76)+awning(478,389,86,'#6f8190')+potteryShelf(507,535);
 }else if(age===4){
  out+=stone(135,530,56,18)+stone(703,526,58,17)+pot(301,532,.58)+pot(631,531,.62)+banner(251,414,.55,blue)+banner(660,405,.57,coral)+cypress(214,500,.48)+cypress(733,498,.5)+oliveBranch(532,463,.72)+awning(417,454,78,'#687f84');
 }else{
  out+=stone(149,533,50,16)+stone(711,529,53,16)+pot(330,539,.52)+pot(611,538,.55)+banner(274,426,.58,blue)+banner(631,421,.58,coral)+cypress(217,498,.38)+oliveBranch(671,481,.64)+awning(420,450,86,'#5c8992')+cluster(505,l('M742 505l12-17 12 17-12 17Z','#a6d9d3',2)+e(754,505,3,3,'#effff4'));
 }
 return `<g data-design-layer="material-detail" data-principle="hierarchy">${out}</g>`;
}

const stitch=(x:number,y:number,w:number,color:string)=>{
 let out='';for(let i=0;i<5;i++){const xx=x+i*w/4;out+=l(`M${xx} ${y}l${w/11} 1.6`,color,.7);}return out;
};
/** Micro-detail is role-readable at portrait scale but does not change the silhouette envelope. */
export function unitMaterialDetailSvg(input:number,inputKind:number,side:Side,id:string):string {
 const age=validAge(input),kind=validKind(inputKind),color=team(side),metal=`url(#${id}m)`,gold=`url(#${id}g)`;
 let out=stitch(43,95,27,'#ead8b0')+r(47,101,22,3,1,'#574f45','none',0)+e(64,102,2.2,2.2,gold,'#394b4d',.8);
 if(kind===0){
  out+=l('M37 82Q45 91 48 105','#5c483c',2)+p('M34 88l8-3 4 15-8 3Z','#806044','#35494a',1)+r(71,94,8,10,2,'#695445','#374c4d',.9);
 }else if(kind===1){
  out+=l('M41 76Q53 84 71 99','#6a513d',2)+p('M42 85l7-2 2 11-7 2Z','#8a684c','#374b4d',1)+l('M48 89l4 3M46 93l5 3','#d6bb8e',1);
 }else{
  out+=p('M38 79L45 73 52 79 50 91 41 91Z',metal,'#354e53',1)+p('M68 78L75 73 81 79 79 91 70 91Z',metal,'#354e53',1)+e(45,82,1.5,1.5,color)+e(74,82,1.5,1.5,color);
 }
 if(age===0){out+=p('M55 91l4-5 5 5-5 4Z','#e0c39a','#5a4a3d',.8)+l('M39 106l6 3M49 109l5 2','#d8ba8b',1);}
 else if(age===1){out+=l('M43 89h31','#d7c49b',1)+p('M55 88l4-3 4 3-4 3Z',color,'#455657',.7);}
 else if(age===2){for(const x of [47,54,61,68])out+=e(x,84,1.4,1.4,gold,'#655a49',.6);out+=l('M45 92H72','#f0deb0',1);}
 else if(age===3){out+=p('M48 86l4-3 4 3-4 3ZM61 86l4-3 4 3-4 3Z',color,'none',0)+l('M43 105Q58 110 75 104','#c8aa76',1);}
 else if(age===4){out+=r(51,84,9,7,1,'#7d8c74','#455a56',.8)+l('M54 87h4M66 84v15','#dbe0bd',1)+p('M68 92l7 0-1 8-6-1Z','#556a5d','#334d4e',.8);}
 else{out+=l('M45 86H73','#a5fbec',1.2)+l('M50 91h17','#5fa9a9',1)+e(59,86,1.8,1.8,color)+p('M69 98l4-2 3 4-4 3Z','#bfded1','#46636a',.8);}
 return `<g data-design-layer="character-material" data-principle="silhouette-first">${out}</g>`;
}
