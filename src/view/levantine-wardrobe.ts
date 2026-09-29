import type {Side,UnitKind} from '../game/types.ts';
import {path as p,ellipse as e,rect as r,line as l,INK} from './illustration-kit.ts';

// Fictional chapter costumes, not historical reconstructions. The fourth chapter's
// open coat takes its cut/material cue from the Met's Syrian damir coat C.I.39.91.26.
// Original geometric trim is not a copied Palestinian embroidery pattern.
const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const faction=(side:Side)=>side==='enemy'?'#e58b76':'#71bdd1';
const fabrics=[['#e3cc9e','#a98661'],['#e6d7ad','#948d64'],['#cfba84','#766b51'],['#587888','#304658'],['#bec1a2','#677968'],['#ede6c8','#88a39e']] as const;
const skin=[['#efd0ad','#b78362'],['#dcb28a','#97664b'],['#bf906b','#79553f'],['#f0c5a0','#b57e5b']] as const;
export function clothingPalette(age:number):readonly [string,string] {return fabrics[validAge(age)];}
export function skinPalette(age:number,kind:number):readonly [string,string] {
 const role=Number.isInteger(kind)&&kind>=0&&kind<3?kind:0;
 return skin[(validAge(age)+role)%skin.length];
}
function sash(side:Side,y=99):string {
 const color=faction(side);
 return `<g data-detail="woven-sash">${p(`M37 ${y}Q58 ${y+4} 77 ${y-1}L78 ${y+6}Q57 ${y+11} 37 ${y+6}Z`,color)}${l(`M39 ${y+3}Q59 ${y+7} 74 ${y+2}`,'#e6d4a6',1)}${p(`M67 ${y+5}l8 0-2 15-5-2Z`,color,INK,1.2)}${l(`M69 ${y+10}l3 1M69 ${y+14}l3 1`,'#f1dec0',1)}</g>`;
}
function seams():string {return l('M45 83L42 100M67 81L70 99','#f0dfb7',1.2);}
export function garmentSvg(input:number,kind:UnitKind,side:Side,id:string):string {
 const age=validAge(input),cloth=`url(#${id}c)`,metal=`url(#${id}m)`,gold=`url(#${id}g)`,color=faction(side);
 let svg='';
 if(age===0){
  svg=p('M39 71L55 67 71 70 76 102 73 114 53 118 37 107Z',cloth)+p('M42 70L56 73 67 112 52 114 39 96Z','#bf9b75',INK,1.4);
  svg+=l('M46 76L59 108','#f0dcb3',2)+l('M39 85l5-2M42 93l4-2M46 102l4-2','#735b46',1.3)+r(38,99,37,6,2,'#695740')+p('M60 101l7-1 3 6-7 3Z',color,INK,1.2);
 }else if(age===1){
  svg=p('M39 70L52 68 59 76 66 68 76 73 78 112 66 116 56 112 45 116 34 111Z',cloth)+p('M38 74L49 71 53 103 39 101Z','#6d7560')+p('M67 72L76 74 76 103 64 104Z','#6d7560');
  svg+=l('M48 76L51 98M68 76L66 98','#d8cba2',1.5)+seams()+sash(side)+l('M45 113L48 106M66 113L64 108','#7f8060',1.1);
 }else if(age===2){
  svg=p('M39 70L51 68 58 76 66 68 77 73 76 96 81 112 37 112Z',cloth);
  svg+=p('M39 74Q59 66 75 74L75 92 39 92Z',gold)+l('M41 78H72M40 86H74','#ecdeb3',1.8);
  for(let row=0;row<2;row++)for(let col=0;col<5;col++)svg+=p(`M${42+col*6} ${79+row*6}l3 3 3-3`, 'none','#8e7c52',1);
  svg+=sash(side,94)+p('M37 109L41 102H75L80 110 78 116H36Z','#8c7960')+l('M44 105V114M52 105V115M60 105V115M69 105V114','#c5b385',2);
 }else if(age===3){
  svg=`<g data-cut="open-coat">${p('M37 72L48 68 60 77 69 68 77 74 81 113 66 118 59 104 53 119 33 112Z',cloth)}${p('M49 70L59 79 68 70 66 110 54 113Z','#e3d4b1')}${p('M46 70L51 84 47 112 37 111 41 87Z','#3a4b5b')}${p('M68 70L64 85 70 112 78 108 73 85Z','#3a4b5b')}${l('M46 74L49 85 44 111M68 74L65 86 72 111','#d9bf82',1.7)}${l('M41 79l2 3-2 3M73 80l-2 3 2 3','#bba77b',1.2)}${sash(side,98)}</g>`;
 }else if(age===4){
  svg=p('M39 70L53 69 61 76 68 70 78 75 78 109 68 114 53 113 36 108Z',cloth)+p('M39 77L52 73 52 105 37 104Z','#5e7265')+p('M65 73L76 77 77 104 65 105Z','#5e7265');
  svg+=r(39,85,12,12,2,'#99a285')+r(65,85,11,12,2,'#99a285')+l('M59 79V107','#e9dcc1',2)+r(37,103,40,5,1,'#45554d');
  if(kind===1)svg+=p('M43 68Q58 75 73 68L69 83 56 80 49 86Z',color)+l('M49 73Q60 80 69 73','#e9dfbe',1.1);
  else svg+=r(39,75,11,6,1,color);
 }else{
  svg=p('M36 74L49 66 59 73 69 66 80 76 78 101 71 114 47 114 35 99Z',metal)+p('M48 74L59 80 70 74 70 93 48 93Z','#345961');
  svg+=l('M40 80L42 96M75 80L74 97','#fbebc8',2)+p('M55 81l5-4 5 5-5 6Z',color)+l('M60 79V85','#d2fff1',1.2)+sash(side,99)+r(33,70,13,12,4,metal)+r(69,70,13,12,4,metal);
 }
 return `<g data-wardrobe="${age}">${svg}</g>`;
}
export function headwearSvg(input:number,kind:UnitKind,side:Side,id:string):string {
 const age=validAge(input),color=faction(side),gold=`url(#${id}g)`,metal=`url(#${id}m)`;
 const hair=p('M34 48L31 35Q34 20 55 20Q77 16 85 34L79 39 70 34 63 37 55 32 43 38 42 48Z','#423e39')+l('M39 30Q56 22 73 29','#74614b',2);
 if(age===0)return hair+l('M34 36Q54 29 80 36','#8a7150',4)+p('M34 38L24 44 26 48 37 42Z',color,INK,1.1);
 if(age===1){
  if(kind===1)return hair+l('M35 37Q57 29 80 36',color,3)+p('M33 40L25 47 28 50 38 43Z','#d8cbad');
  return p('M32 50L31 31Q37 17 59 19Q82 19 86 34L83 45 77 34Q56 29 42 39L42 65 32 69Z','#d4ccb0')+l('M35 32Q55 23 78 31M36 38Q58 30 80 36','#f6e6c2',2.5)+l('M33 34Q56 26 82 35',color,3)+l('M35 46L36 61','#9c9b82',1.3);
 }
 if(age===2)return p('M31 46L33 30 46 19 58 13 72 22 82 30 86 43 71 39 59 35 45 40 41 59 34 58Z',gold)+l('M37 32L51 25 58 20 68 27','#f8e9be',2.1)+l('M32 44Q55 32 85 42','#725c43',3)+p('M37 43L46 40 44 62 36 58Z',gold)+r(51,34,13,4,1,color);
 if(age===3)return hair+p('M34 35L37 20Q57 11 78 21L82 36Q58 28 34 35Z','#7d5146')+l('M40 22Q58 17 75 23','#b58366',2)+l('M34 36Q56 27 82 36','#d7c69c',5)+l('M36 34Q58 27 78 33',color,1.7)+l('M74 22L82 24 84 40','#373e3f',2.2)+e(84,41,1.7,3,'#d4bc81');
 if(age===4)return kind===1?hair+p('M34 34L43 20 65 20 79 29 91 34 83 40 71 34Z','#6e7c6a')+l('M36 33L76 30',color,3):p('M31 46L31 32Q37 18 59 18Q79 19 85 37L85 44Z','#6c806e')+p('M35 31Q49 21 67 24L63 31Z','#b5bea0','none',0)+l('M31 44Q56 35 85 42','#3d544e',4)+r(37,28,13,6,2,color);
 return p('M32 58L28 39 33 24 47 15 67 15 82 26 89 40 79 43 72 31 48 30 41 45 42 60Z',metal)+l('M40 25L49 21 65 21','#fff0d1',2)+p('M44 35L75 36 80 40 43 41Z','#42656c')+l('M48 38H70',color,2.5)+e(34,47,7,8,gold,INK,1.4)+p('M32 42l4 4-3 5-3-4Z',color);
}
