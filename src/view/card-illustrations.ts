import {CARD_DEFS} from '../game/cards.ts';
import {path as p,ellipse as e,rect as r,line as l,gradient,documentSvg,dataSvg} from './illustration-kit.ts';
import {cardFrameSvg} from './card-frame.ts';
const gold='url(#gold)',metal='url(#metal)',warm='url(#warm)',blue='url(#blue)';
const wheel=(x:number,y:number,radius:number)=>e(x,y,radius,radius,gold,'#354f55',2)+e(x,y,radius*.65,radius*.65,'#6d857e')+l(`M${x-radius*.7} ${y}h${radius*1.4}M${x} ${y-radius*.7}v${radius*1.4}`,'#f3e1ac',3);
const vial=()=>p('M51 36H78V48L86 66V94Q63 105 43 94V66L51 48Z',metal)+p('M46 76Q64 67 82 76V92Q65 99 46 92Z',blue)+r(49,30,31,11,3,warm)+l('M50 64V75','#fff9d2',3);
function object(index:number):string {
 const objects=[
  ()=>p('M30 92Q23 33 63 24Q105 31 100 93L66 109Z',blue)+p('M51 47H77L88 68 75 89H51L39 68Z',gold)+l('M51 48L37 37M77 48L89 37M88 68L101 68M76 89L88 98M51 89L41 100M39 68L26 68','#c3ebd1',3),
  ()=>l('M33 101L90 85M38 86L94 103',warm,12)+p('M40 84Q21 63 49 46L59 24Q64 49 78 36Q102 63 86 85Z','#e89a4e')+p('M53 86Q37 68 63 54Q81 69 72 89Z',gold),
  ()=>l('M63 27V103','#354f55',10)+l('M63 27V103',gold,6)+[0,1,2,3].map(i=>{const rib=`M61 ${36+i*17}Q${31-i*3} ${22+i*16} 31 ${52+i*14}M67 ${36+i*17}Q${96+i*3} ${22+i*16} 97 ${52+i*14}`;return l(rib,'#354f55',8)+l(rib,metal,5);}).join(''),
  ()=>p('M31 69L79 40 98 75 51 103Z',metal)+e(38,78,19,22,gold,'#354f55',2)+e(38,78,10,12,'#a8b49c')+l('M64 54L78 83M74 49L89 77','#b3c8ba',4),
  ()=>r(39,36,53,65,7,metal)+e(65,36,26,7,gold,'#354f55',2)+r(41,53,49,30,2,warm)+p('M56 71l6-10 9 1 5 8-7 8H60Z','#dfedbc')+e(65,100,26,5,'#9eaf9d'),
  ()=>r(30,44,68,58,5,warm)+r(37,52,52,36,6,'#3c5556')+p('M49 85Q40 64 59 62L66 48 73 70 82 75 77 88Z',gold)+r(44,20,21,26,2,metal)+r(27,101,75,8,2,metal),
  ()=>p('M40 48L43 100Q67 111 90 99L88 47Z',warm)+e(64,46,26,8,gold,'#354f55',2)+l('M49 61Q64 55 80 62','#ffe8b5',3)+p('M61 81Q43 71 51 62Q68 63 65 78Q68 58 82 59Q87 75 67 81L67 95',blue)+l('M45 42L51 26 75 24 83 42',gold,4),
  ()=>e(64,67,37,39,gold,'#354f55',3)+e(64,65,28,29,warm,'#f7e9b1',2)+p('M62 40L75 63 64 91 49 65Z',blue)+l('M32 54H39M88 77H96M48 96L51 89M80 36L77 43','#fcebbe',3),
  ()=>l('M63 26V110M29 58H99',warm,10)+p('M45 45Q62 37 82 44L87 81 43 85Z',gold)+e(63,28,17,18,warm,'#354f55',2)+l('M55 22l5 5M72 22l-5 5M55 69l17-9','#f7e6ad',3),
  ()=>e(64,61,39,39,warm,'#354f55',3)+e(64,61,29,29,'#e7e4c1')+e(64,61,20,20,blue)+e(64,61,9,9,gold)+l('M43 99L36 112M83 99L91 112',warm,7)+l('M67 60L100 27',metal,3)+p('M99 29l6-11 1 10Z',gold),
  ()=>wheel(62,64,31)+p('M30 93H94L102 106H22Z',warm)+l('M89 59L105 52 112 62',gold,6),
  ()=>p('M25 87Q51 91 75 44L89 35 108 58 93 72Q63 108 23 101Z',gold)+e(94,51,13,21,warm,'#354f55',2)+e(96,50,8,14,'#3d5658')+l('M47 88L52 96M69 69L77 78','#fff2c9',4),
  ()=>l('M34 20V108',warm,6)+p('M36 25L95 30 86 51 97 73 68 83 36 73Z',blue)+p('M60 39L76 47 70 64 56 61Z',gold)+e(33,17,6,6,gold,'#354f55',2),
  ()=>vial()+e(65,80,6,7,'#e3f1c8')+l('M61 86L59 92M69 86L72 92','#e7edd0',2),
  ()=>p('M22 52H101L97 64 83 72 72 72 73 89 91 97V105H33V97L50 89 51 72 41 68Z',metal)+p('M21 49L104 42 105 52 42 59Z',gold)+l('M56 76V89','#c4dcce',4),
  ()=>l('M31 63H97',metal,12)+r(19,37,19,52,5,gold)+r(33,46,11,35,3,warm)+r(89,38,19,52,5,gold)+r(82,46,11,35,3,warm),
  ()=>l('M63 65L54 110','#728c68',6)+p('M58 96Q30 88 31 74Q54 73 59 95M59 88Q68 67 92 75Q88 93 59 94',blue)+p('M36 42Q28 25 51 27Q60 14 76 29Q104 29 92 50Q92 68 72 73Q44 72 36 57Z','#e7a186')+p('M49 37Q64 26 79 39L72 58 54 60 44 47Z','#bf5b62')+p('M58 40L74 40 64 54Z','#ffe0b1'),
  ()=>r(32,32,65,70,17,warm)+e(64,34,31,10,gold,'#354f55',2)+l('M36 47H93M35 88H94',metal,8)+p('M59 57l13 3-2 19-15-2Z','#f5dfaa')+l('M68 27Q92 8 102 32','#d4c099',3),
  ()=>p('M33 50Q32 24 69 29Q92 36 101 56L90 78 79 79 74 101 62 89 53 100 44 78 31 71Z',metal)+p('M42 53L55 51 55 66 41 65M72 51L86 56 82 68 70 64Z','#3e5c5f')+p('M43 77L48 105 57 77M74 77L77 105 86 76Z',gold)+p('M58 74l6-10 6 10Z','#567976'),
  ()=>p('M30 75L36 48 78 45 84 23 98 25 110 43 99 55 91 55 94 85 79 85 75 66 50 68 43 86Z',warm)+l('M46 42L65 25 83 44','#e0be7d',5)+wheel(41,97,13)+wheel(91,97,13)+e(99,36,2,3,'#263e48'),
  ()=>p('M35 50Q64 32 94 50L82 65H70V92H94L103 104H25L34 92H57V65H45Z',metal)+e(64,48,31,8,blue,'#45636c',2)+l('M64 46V21M63 26Q46 15 43 35M65 24Q83 15 86 36','#bef3e3',4)+e(43,39,3,5,'#bef3e3')+e(86,40,3,5,'#bef3e3'),
  ()=>p('M44 28L31 35 24 69 36 77 38 105H93L93 76 106 68 97 35 80 28 75 47 55 47Z',blue)+r(43,62,17,26,3,gold)+r(69,62,18,26,3,gold)+l('M63 54V97','#bedec7',3),
  ()=>vial()+l('M58 63L72 91M72 63L58 91M57 70H73M57 83H73','#e7f8e9',3),
  ()=>p('M27 60H102L96 91Q64 112 33 92Z',metal)+e(64,60,38,10,blue,'#365763',2)+l('M64 57L91 23',warm,12)+e(94,20,9,7,gold,'#365763',2),
  ()=>l('M37 40L89 88M89 40L37 88',metal,8)+e(33,35,18,7,blue,'#365763',2)+e(96,35,18,7,blue,'#365763',2)+e(33,92,18,7,blue,'#365763',2)+e(96,92,18,7,blue,'#365763',2)+r(49,45,30,36,11,gold)+e(64,71,9,8,'#3b5c63')+e(64,70,4,4,'#bef5e7'),
  ()=>p('M24 34L66 20 103 39 98 97 42 108 21 85Z',warm)+l('M39 54L59 47 76 54 84 42M43 56L42 78M63 55L71 75M74 54L91 54','#f3d5a4',4)+e(51,40,6,6,'#edb66f')+l('M30 87l19 5M69 89l15-8','#916c51',3),
  ()=>p('M45 105L48 42 66 20 84 42 89 105Z',metal)+p('M65 22V104H87L83 43Z',blue)+l('M58 53h13M59 64h11M59 75h9',gold,3)+r(36,104,64,8,2,gold),
  ()=>r(31,39,68,67,8,blue)+l('M44 39L38 13',metal,4)+r(42,48,45,15,3,gold)+e(64,83,14,14,'#486873','#acd2c1',2)+l('M55 79H73M53 84H75M57 89H71','#bedbc6',2)+e(90,76,4,4,gold),
  ()=>p('M24 50L37 30 68 24 96 34 108 57 102 76 89 78 80 100 58 104 42 86 23 79Z',gold)+p('M37 47L58 39 63 58 39 64M78 44L95 54 94 65 75 60Z','#3b5658')+p('M37 79l7 13 5-13 8 15 6-16 8 13 6-16 9 10 4-17','#f8edcb','#38585c',1.6)+e(29,71,3,3,'#647968'),
  ()=>r(27,30,76,71,15,metal)+r(34,46,62,24,8,blue)+e(47,57,7,7,'#b4fff0')+e(82,57,7,7,'#b4fff0')+r(44,81,44,9,3,'#547885')+l('M54 83v5M65 83v5M77 83v5','#b2e8d9',2)+r(17,55,12,24,5,gold)+r(103,55,10,24,5,gold)+l('M65 30V18',metal,4)+e(65,14,6,6,gold),
 ];
 return objects[index]();
}
const cache=new Map<number,string>();
export function cardIllustration(index:number):string {
 index=Number.isInteger(index)&&index>=0&&index<30?index:0;
 let value=cache.get(index);if(value)return value;
 const color=CARD_DEFS[index].color;
 const defs=gradient('gold','#fff0b5','#ca9950')+gradient('metal','#f3f0cf','#9bbfb9')+gradient('warm','#d6b077','#936e4c')+gradient('blue','#97dacf','#477d89');
 const rarity=CARD_DEFS[index].rarity;
 value=dataSvg(documentSvg(128,128,`${cardFrameSvg(rarity,color)}<g opacity=".1">${e(64,62,43,43,color)}</g><g data-layer="card-object">${object(index)}</g>`,defs));
 cache.set(index,value);return value;
}
