import {storybookArt} from './storybook-art.ts';
import type {Side,UnitKind} from '../game/types.ts';
import {path as p,ellipse as e,rect as r,line as l,gradient,documentSvg,dataSvg,INK} from './illustration-kit.ts';
import {garmentSvg,headwearSvg,clothingPalette,skinPalette} from './levantine-wardrobe.ts';
import {unitMaterialDetailSvg} from './design-detail.ts';
import {characterExpressionSvg} from './character-expression.ts';
export const TROOP_FRAME={width:128,height:144,count:6} as const;
const team=(side:Side)=>side==='player'?['#8ce2f3','#309ddb','#16658e']:['#ffd0ad','#e66b50','#a93839'];
function defs(age:number,kind:UnitKind,side:Side,id:string){const t=team(side),cloth=clothingPalette(age),skin=skinPalette(age,kind);return gradient(`${id}s`,skin[0],skin[1])+gradient(`${id}c`,cloth[0],cloth[1])+gradient(`${id}t`,t[0],t[2])+gradient(`${id}g`,'#e9d4a2','#998057')+gradient(`${id}m`,'#e8ecda','#708b90')+gradient(`${id}d`,'#a9c080','#547961')+gradient(`${id}w`,'#bc9971','#74624d');}
function human(age:number,kind:UnitKind,side:Side,frame:number,id:string,mounted=false):string {
 const t=team(side),skin=`url(#${id}s)`,body=`url(#${id}c)`,gold=`url(#${id}g)`,metal=`url(#${id}m)`,accent=`url(#${id}t)`;
 const rangedVisual=kind===1||(age===4&&kind===0),longPole=age===1&&kind===0;
 const stride=frame===1?-9:frame===3?9:frame===4?(rangedVisual?-2:-5):frame===5?(rangedVisual?3:6):0;
 const attack=frame===4?(rangedVisual?-8:-28):frame===5?(rangedVisual?6:longPole?10:22):0;
 const boots=age>=3?'#35494c':'#8e6649';
 let out=p('M44 75Q25 87 27 116L47 108Z',accent)+l('M42 81L32 107',t[0],2);
 out+=`<g transform="rotate(${-stride} 49 105)">${p('M43 101L42 121 53 123 57 103Z',skin)+r(39,119,18,9,4,boots)+l('M41 120H53','#d9bb87',2)}</g>`;
 out+=`<g transform="rotate(${stride} 65 105)">${p('M59 102L61 122 73 122 72 100Z',skin)+r(60,120,22,9,4,boots)+l('M63 122H76','#d9bb87',2)}</g>`;
 out+=garmentSvg(age,kind,side,id);
 out+=l('M40 77Q24 87 32 99',INK,13)+l('M40 77Q24 87 32 99',skin,9)+e(34,99,5.5,6,skin,INK,1.7);
 // Oversized, shaded head with a clear 3/4 gaze; never a blank alien face.
 out+=e(38,51,6,8,skin,INK,1.8)+p('M36 44Q33 24 57 23Q82 23 83 43L82 58Q80 72 60 73Q41 73 37 60Z',skin)+p('M41 37Q47 29 62 29', 'none','#fff2d4',4);
 out+=p('M81 54Q87 58 81 61',skin,INK,1)+e(52,60,4,1.3,'#c39476');
 out+=characterExpressionSvg(kind,frame,skin);
 out+=headwearSvg(age,kind,side,id);
 // Front arm and weapon form a second, readable action silhouette.
 out+=`<g transform="rotate(${attack} 73 78)">${l('M72 78L86 90 95 87',INK,13)+l('M72 78L86 90 95 87',skin,9)}`;
 if(mounted){out+=l('M92 105L110 30','#805e42',4)+p('M106 32L115 16 116 36Z',metal)+l('M108 33L111 23','#fff4c9',1.4);}
 else if(kind===1){
  if(age===0)out+=p('M88 81L82 69 88 56 103 53 114 65 111 81 101 89Z',metal)+p('M88 57L102 54 108 63 93 69Z','#ecf3db','none',0)+l('M88 70L91 81M99 69L108 65','#6f8888',1.5);
  if(age===1)out+=l('M99 95L99 70 88 53M99 70L112 54','#855c3c',5)+l('M88 53L101 66 112 54','#eddbc0',2)+e(101,65,4,4,metal,INK,1.5);
  if(age===2)out+=l('M97 42Q122 58 110 91Q107 105 97 114','#996637',4)+l('M97 43V113','#fcf0c5',1.5)+l('M89 77H121','#754a2c',2.2)+p('M124 77L116 72 116 82Z',metal,INK,1.3);
  if(age===3)out+=p('M87 84L104 78 107 85 94 91 92 97 86 94Z','#9b643d')+l('M102 79L123 75',metal,5)+r(98,75,8,5,1,gold)+l('M105 83L119 80','#31494e',2);
  if(age===4)out+=p('M87 80L119 77 124 83 109 87 105 99 97 96 99 86 88 89Z','#33474b')+l('M105 76L118 75',metal,3)+r(91,81,15,5,1,'#81916d');
  if(age===5)out+=p('M88 77L116 74 125 80 123 88 104 89 101 98 94 96 94 88 86 86Z',metal)+l('M104 79L121 79',t[1],4)+l('M103 80L119 80','#e9ffff',1.5)+r(91,79,8,5,1,'#476179');
 }else if(age===0){out+=l('M95 96L101 65','#73533d',7)+p('M96 71L91 49 96 38 109 37 116 48 110 71Z','url(#'+id+'w)')+l('M98 46L103 62','#e2b67a',3)+e(108,49,2,2,'#82573b');}
 else if(age===1){out+=l('M99 124L104 38','#886644',5);if(kind===2)out+=p('M104 41Q89 12 58 22L49 31Q79 14 100 53Z',metal)+l('M62 24Q86 19 99 39','#fff4cf',2);else out+=l('M93 14V37H115V14M104 13V37',metal,4);}
 else if(age===2||age===3){out+=p('M101 91L101 47 106 34 110 47 109 91Z',metal)+l('M103 48V83','#ffffff',1.6)+l('M95 92H116',gold,5)+l('M105 95V104','#80573e',4);}
 else if(age===4)out+=p('M87 83L120 81 123 86 111 89 108 96 101 96 102 89 88 91Z','#354849')+l('M96 85H113','#97a87d',3);
 else out+=l('M102 99V88','#536f88',7)+l('M102 86L109 39',t[1],9)+l('M102 86L109 39','#e3ffff',3)+l('M96 90H110',metal,4);
 out+='</g>';
 if(kind!==1&&(age===2||age===5)){out+=e(32,94,17,20,age===2?gold:metal,INK,2)+e(32,92,12,14,accent,INK,1.4)+p('M30 80L37 93 32 104 26 94Z',age===2?gold:'#ccffff',INK,1)+e(30,85,2,2,'#fff2ba');}
 return out;
}
function mount(age:number,side:Side,frame:number,id:string){
 const t=team(side),stride=frame===1?-5:frame===3?5:0;
 let out='';
 if(age===0){
  out=p('M35 109Q13 99 6 81Q7 112 39 123Z',`url(#${id}d)`)+e(59,109,40,21,`url(#${id}d)`,INK,2);
  for(const x of [37,78])out+=p(`M${x} 117l${stride} 13 13 2 4-4-9-4 2-9Z`,'#538759')+l(`M${x+5+stride} 129l4-1 3 3`,'#e4e6b2',2);
  out+=p('M79 108L88 76Q99 64 115 73L122 89 119 102 106 111Z',`url(#${id}d)`)+p('M103 94L121 94 117 105 106 107 96 102Z','#d3dda0')+e(110,83,4,5,INK)+e(111,81,1.5,1.8,'#fff')+e(119,91,1.4,1.2,INK)+p('M109 100l3 5 3-5','#fff5d5',INK,1);
  for(const [x,y]of [[28,94],[41,87],[57,87],[77,82],[88,72]])out+=p(`M${x} ${y}l4-11 9 10Z`,'#e8a15a',INK,1.6);
  out+=e(68,113,14,7,'#d3d690')+l('M93 98Q92 88 100 78','#cfebaf',2);
 }else{
  out=p('M35 109Q18 89 12 105L10 123Q19 112 27 119Z','#3d4742')+e(63,109,36,18,`url(#${id}w)`,INK,2);
  for(const x of [39,80])out+=p(`M${x} 115l${stride} 14 2 8 11 0-3-5-2-17Z`,'#ac825c')+r(x+stride,132,14,6,2,'#354342');
  out+=p('M84 111L86 82 98 67 111 75 122 94 118 103 100 101 97 116Z',`url(#${id}w)`)+p('M87 89L91 73 93 65 99 71 104 61 106 74 101 79 97 105Z','#474c42')+e(113,87,2.3,3.4,INK)+p('M110 98L119 99 120 104 114 107 106 101Z','#d3b38e')+l('M94 80L113 97 89 107 70 101','#d8c5a0',2);
 }
 out+=p('M41 91L77 91 82 114 43 113Z',`url(#${id}t)`)+l('M46 93L45 107 76 109',t[0],2)+r(52,85,25,8,3,'#81503a');
 return out;
}
function vehicle(age:number,side:Side,frame:number,id:string){
 const t=team(side),metal=`url(#${id}m)`,gold=`url(#${id}g)`;
 const recoil=frame===5?-4:frame===4?-1:0;
 if(age===3){
  let out=`<g transform="translate(5 37) scale(.57)">${human(3,0,side,0,id)}</g>`;
  out+=p('M28 115L86 105 108 125 94 130 75 117 32 126Z',`url(#${id}w)`);
  out+=`<g transform="translate(${recoil} 0)">`+p('M40 82L113 69 119 87 45 102Z','#4a6265')+p('M40 82L111 70 112 77 43 94Z',metal)+e(116,79,6,10,'#233945',INK,2)+e(117,79,3,6,'#102735')+'</g>';
  for(const x of [48,96]){out+=e(x,120,16,17,gold,INK,2)+e(x,120,12,13,'#835d3c',INK,1.2);for(let i=0;i<6;i++){const a=i*Math.PI/3+frame*.2;out+=l(`M${x} 120l${Math.cos(a)*11} ${Math.sin(a)*11}`,'#efcd89',2);}out+=e(x,120,4,4,metal,INK,1.5);}
  return out+r(64,86,12,7,1,`url(#${id}t)`);
 }
 if(age===4){
  let out=r(14,105,107,31,14,'#304a46')+r(20,111,96,19,9,'#172c30');
  for(let x=29;x<=107;x+=19)out+=e(x,121,7,8,'#92a687',INK,1.2)+e(x,120,3,3,'#42625a');
  out+=p('M14 105L29 83 93 82 119 104Z',`url(#${id}c)`)+p('M30 85H94L100 93H23Z','#cfdbab','none',0)+r(47,61,48,23,8,'#9bae7c')+e(69,63,15,5,'#c8d3a2',INK,1.6)+`<g transform="translate(${recoil} 0)">`+r(80,70,44,9,2,'#627b61')+r(120,68,7,13,2,'#304d49')+'</g>'+r(55,75,17,6,1,`url(#${id}t)`)+l('M47 63L40 32','#374c4b',2)+e(40,31,2,3,t[0]);
  out+=r(18,104,102,7,2,'#8ca27d')+e(26,99,4,3,'#fff0b8',INK,1)+e(107,99,4,3,'#ffae72',INK,1)+p('M66 93l3-5 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3Z',t[0],'none',0);
  return out;
 }
 let out=`<g opacity="${frame===5?1:frame===4?.85:.55+(frame%2)*.18}">`+e(66,134,32,5,'#93f7ee')+'</g>'+p('M40 125L45 135 57 134 60 121M80 122L82 134 94 135 99 126','#98dff0','none',0);
 out+=e(66,77,29,33,`url(#${id}t)`,INK,2)+e(66,78,23,26,'#74bbce')+e(69,83,12,15,`url(#${id}s)`,INK,1.5)+e(72,81,2,3,INK)+e(81,81,2,3,INK)+p('M43 63Q55 43 72 50L65 56Q48 55 48 69Z','#d1ffff','none',0);
 out+=e(66,106,52,22,'#557c9b',INK,2.4)+e(66,97,50,17,metal,INK,2)+p('M19 97Q63 112 115 97L111 105Q63 121 21 107Z','#cfedf1',INK,1.5);
 for(const x of [32,52,73,94])out+=e(x,109,4,3,t[1],INK,1)+l(`M${x-2} 108h3`,'#e2ffff',1.5);
 return out+l('M59 114H79',t[0],3)+`<g transform="translate(${recoil} 0)">`+r(106,100,19,7,2,'#4c788c')+e(124,102,2,3,'#caffff')+'</g>';
}
function validated(age:number,kind:UnitKind){return {age:Number.isInteger(age)&&age>=0&&age<6?age:0,kind:([0,1,2].includes(kind)?kind:0)as UnitKind};}
function art(age:number,kind:UnitKind,side:Side,frame:number,id:string){
 const detail=unitMaterialDetailSvg(age,kind,side,id);
 if(kind===2&&age>=3)return vehicle(age,side,frame,id)+detail;
 if(kind===2&&(age===0||age===2))return mount(age,side,frame,id)+`<g transform="translate(17 -4) scale(.72)">${human(age,0,side,frame,id,true)}</g>`+detail;
 return `<g transform="${age===1&&kind===2?'translate(-5 -3) scale(1.08)':'translate(0 7)'}">${human(age,kind,side,frame,id)}${detail}</g>`;
}
// Inset around the shared foot anchor: tilted weapons and cavalry crests stay
// inside their own texture frame, with room for linear texture sampling.
function safeArt(age:number,kind:UnitKind,side:Side,frame:number,id:string):string {
 return `<g transform="translate(64 136) scale(0.94) translate(-64 -136)">${art(age,kind,side,frame,id)}</g>`;
}
export function unitSvg(age:number,kind:UnitKind,side:Side='player',frame=0):string {
 ({age,kind}=validated(age,kind));const id='u',pose=Number.isInteger(frame)&&frame>=0&&frame<6?frame:0;
 return documentSvg(128,144,safeArt(age,kind,side,pose,id),defs(age,kind,side,id));
}
export function unitSheetSvg(age:number,kind:UnitKind,side:Side):string {
 ({age,kind}=validated(age,kind));
 return documentSvg(768,144,Array.from({length:6},(_,frame)=>`<g data-frame="${frame}" transform="translate(${frame*128} 0)"><g clip-path="url(#unit-frame)">${safeArt(age,kind,side,frame,'u')}</g></g>`).join(''),defs(age,kind,side,'u')+'<clipPath id="unit-frame"><rect width="128" height="144"/></clipPath>');
}
const portraits=new Map<string,string>();
/** Battle sheets and DOM portraits use the same source, colors and anchor. */
export function unitPortrait(age:number,kind:UnitKind):string {
 const art=storybookArt(age);
 if(art&&[0,1,2].includes(kind))return `${art.folder}/${art.roles[kind]}-portrait.webp`;
 const key=`${age}:${kind}`;let value=portraits.get(key);if(!value){value=dataSvg(unitSvg(age,kind));portraits.set(key,value);}return value;
}
