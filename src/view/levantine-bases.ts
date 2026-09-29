import type {Side} from '../game/types.ts';
import {path as p,ellipse as e,rect as r,line as l,gradient,documentSvg} from './illustration-kit.ts';
import {outpostDetailSvg} from './outpost-detail.ts';
const names=['stone-shelter','terrace-store','quay-gate','workshop-gate','hill-station','courtyard-station'];
const ink='#364f54';
function entry(x:number,y:number,w:number,h:number):string {
 return p(`M${x} ${y+h}V${y+w/2}Q${x+w/2} ${y-5} ${x+w} ${y+w/2}V${y+h}Z`,'url(#door)','#c5b595',3);
}
function masonry():string {
 let out='';
 for(let y=82;y<138;y+=13)out+=l(`M20 ${y}H51M110 ${y}H140`,'#6f827b',.8)+l(`M${y%2?27:39} ${y-11}v11M${y%2?118:129} ${y-11}v11`,'#778b80',.8);
 return out;
}
/** Gameplay outposts are fictional and are not religious or identifiable civilian monuments. */
export function baseSvg(input:number,side:Side):string {
 const age=Number.isInteger(input)&&input>=0&&input<6?input:0;
 const accent=side==='enemy'?'#e58b76':'#71bdd1',bright=side==='enemy'?'#ffe0b2':'#b6edf0';
 const defs=gradient('stone','#cfbd99','#859489')+gradient('wall','#b1b099','#5f7b78')+gradient('roof','#a09c7d','#5c766e')+
 gradient('wood','#9d8869','#536c68')+gradient('door','#1e3546','#2f525d')+gradient('metal','#dedaca','#6e9897')+
 gradient('trim',bright,accent)+'<radialGradient id="light"><stop stop-color="#efbd80" stop-opacity=".58"/><stop offset="1" stop-color="#ecc17e" stop-opacity="0"/></radialGradient>';
 let out=`<g data-outpost="${names[age]}"><g opacity=".25">${e(80,144,72,11,'#21433e')}</g>`;
 if(age===0){
  out+=p('M12 139L15 93 28 63 52 41 95 38 126 62 142 99 149 139Z','url(#stone)',ink,2.5)+p('M51 43L94 40 123 62 92 77 48 73Z','#e0cb9f',ink,1.2)+p('M94 78L124 66 140 102 146 136 122 132 114 99Z','#7d8e7d','none',0);
  out+=entry(46,85,65,54)+p('M35 63L46 76 31 99M124 105L134 115 130 137','none','#667c70',2)+p('M32 87L22 80 34 59 48 58 43 72Z','#73866c','none',0);
 }else if(age===1){
  out+=r(18,73,123,67,4,'url(#wall)',ink,2)+p('M17 76L30 61H127L147 75Z','url(#roof)',ink,2)+l('M24 72H139','#d7c5a2',3)+masonry()+entry(58,93,46,47);
  out+=r(30,89,17,24,2,'url(#door)',ink,1)+l('M32 94H44M32 100H44M32 106H44','#9f9b7c',2)+r(17,131,35,11,3,'#aaa885',ink,1.5)+l('M21 134H46','#d4c39c',2);
 }else if(age===2){
  out+=r(18,61,127,78,2,'url(#wall)',ink,2)+r(13,53,136,12,1,'url(#stone)',ink,2)+masonry()+entry(55,88,54,53)+r(19,129,25,13,2,'url(#wood)',ink,1.5);
  out+=r(34,72,12,20,2,'url(#door)',ink,1)+r(119,72,12,20,2,'url(#door)',ink,1)+l('M57 61V67M108 61V67','#e9d2a3',3)+e(130,126,11,5,'none','#b9ac87',3);
 }else if(age===3){
  out+=r(16,48,127,91,3,'url(#stone)',ink,2)+r(10,42,137,9,1,'url(#wood)',ink,1.5)+masonry()+entry(54,90,55,50);
  out+=p('M31 90V67Q38 54 46 67V90M111 90V67Q119 54 127 67V90','url(#door)',ink,1.5)+r(28,89,101,7,1,'url(#wood)',ink,1)+p('M34 92H121L136 105H21Z','#4e7680',ink,1.4)+l('M42 94L35 103M65 94L63 103M92 94L96 103M114 94L126 103','#a2b5a4',2);
  out+=l('M65 112V133M81 106V136M97 112V133','#8e9477',1.5);
 }else if(age===4){
  out+=r(17,63,127,77,3,'url(#stone)',ink,2)+r(12,57,137,9,1,'#bfb595',ink,1.5)+masonry()+r(46,33,46,24,4,'#7e9389',ink,1.5)+e(69,34,22,5,'#bbc2a8',ink,1.2);
  out+=entry(57,95,49,45)+r(30,80,16,23,2,'url(#door)',ink,1)+r(116,80,16,23,2,'url(#door)',ink,1)+l('M28 101H48M114 101H134','#e4d1a5',3)+l('M106 57L110 31M105 35H117',ink,2);
 }else{
  out+=p('M13 137L21 67 38 46H123L142 70 149 137Z','url(#metal)',ink,2.3)+p('M18 70L36 43H122L142 70Z','url(#stone)',ink,1.5)+entry(49,79,65,61)+r(19,132,123,9,2,'#a9bba7',ink,1.4);
  out+=p('M37 43L56 22H104L123 43Z','#4c7e88',ink,1.5)+l('M47 39H112M59 26L67 40M84 24V40M103 27L98 40','#a5d5c8',1.5)+l('M57 130V99Q81 67 107 99V130','#80c2bb',2)+r(28,81,10,39,4,'#5d868a',ink,1)+r(124,81,10,39,4,'#5d868a',ink,1);
 }
 out+=outpostDetailSvg(age,side);
 // Restrained reflected light, never a full-sprite yellow tint.
 out+=`<g data-layer="practical-light">${e(113,112,23,25,'url(#light)')}${r(110,103,6,13,2,'#e8c182',ink,1)}${l('M113 99V103',ink,1.4)}</g>`;
 out+=r(65,70,31,9,2,'url(#wood)',ink,1)+p('M77 72l5 2-1 4-5-2Z','url(#trim)','none',0)+l('M137 135V78',ink,2)+p('M138 81L155 85 149 92 155 100 138 96Z','url(#trim)',ink,1.2);
 out+=l('M41 140H115','#d9c79e',2);
 return documentSvg(160,160,`<g transform="translate(80 140) scale(0.96) translate(-80 -140)">${out}</g></g>`,defs);
}
