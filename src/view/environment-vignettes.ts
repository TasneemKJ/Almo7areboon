import {path as p,ellipse as e,rect as r,line as l} from './illustration-kit.ts';

const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const ink='#304c52';
const wood='#735f4d';
const brass='#b39a68';
const clay='#9e7658';
const linen='#c7b996';
const leaf='#6f8a72';
const water='#77a3a0';

const vignette=(name:string,y:number,body:string)=>`<g data-vignette="${name}" data-y="${y}">${body}</g>`;
const pot=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M-8-7Q0-11 8-7L6 8Q0 13-6 8Z',clay,ink,1)}${e(0,-7,8,2.4,'#c39b73',ink,.7)}${l('M-5 1Q0 3 5 1','#d9b68a',1)}</g>`;
const crate=(x:number,y:number,w=28,h=18)=>r(x,y,w,h,2,wood,ink,1)+l(`M${x+3} ${y+4}l${w-6} ${h-8}M${x+w-3} ${y+4}L${x+3} ${y+h-4}`,'#aa8c68',1);
const basket=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M-13-3Q0 6 13-3L10 11Q0 16-10 11Z','#9b815c',ink,1)}${l('M-9 1H9M-7 6H7M-4-4Q0-14 5-4','#d2b787',1)}</g>`;
const ropeCoil=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${e(0,0,14,8,'none','#a79068',3)}${e(0,0,8,4,'none','#d1b786',2)}${l('M10 4q11 7 18 2','#a79068',2)}</g>`;
const stool=(x:number,y:number)=>r(x,y,28,5,1,wood,ink,1)+l(`M${x+4} ${y+4}l-3 16M${x+24} ${y+4}l3 16`,wood,3);
const jarPair=(x:number,y:number)=>pot(x,y,.8)+pot(x+17,y+1,.6);

function firstFires():string {
  const jars=vignette('water-jars',553,jarPair(326,553)+jarPair(352,554));
  const firewood=vignette('firewood',560,
    l('M570 560l33-13M574 565l34-12M579 570l32-11','#6f5440',5)+
    l('M571 560l31-11M576 565l30-10','#b58c62',1.2));
  const mat=vignette('woven-mat',545,
    p('M222 548l54-10 25 17-56 11Z','#a78d67',ink,1)+
    l('M232 547l47 12M245 544l43 11M251 541l39 9','#d2bc91',1));
  const rack=vignette('herb-rack',520,
    l('M686 524V486M742 524V486M682 490H746',wood,3)+
    [696,713,730].map((x,i)=>l(`M${x} 491q-5 13 1 23M${x+4} 491q6 13 0 24`,i%2?leaf:'#87916d',2)).join(''));
  return jars+firewood+mat+rack;
}
function oliveTerraces():string {
  const baskets=vignette('olive-baskets',552,basket(255,552,.9)+basket(286,551,.75)+[249,257,265,280,288].map((x,i)=>e(x,545-i%2*2,2,2,'#536a55')).join(''));
  const bucket=vignette('irrigation-bucket',535,
    p('M654 533l18-2-3 18-13 1Z','#758b82',ink,1)+l('M657 531q4-13 11 0',brass,1.5)+l('M674 539h18','#789b97',2));
  const ladder=vignette('terrace-ladder',510,
    l('M748 521l22-54M766 525l22-54','#856b52',3)+[0,1,2,3,4].map(i=>l(`M${753+i*4} ${509-i*10}l20 2`,'#b29770',2)).join(''));
  const crates=vignette('press-crates',564,crate(377,547,33,19)+crate(413,551,28,17)+e(393,545,5,3,'#546c57')+e(425,549,4,2,'#546c57'));
  return baskets+bucket+ladder+crates;
}
function harborWatch():string {
  const rope=vignette('rope-coil',550,ropeCoil(266,550,1)+ropeCoil(299,555,.7));
  const net=vignette('fishing-net',510,
    l('M690 488Q720 507 756 490M696 494Q720 514 750 496M704 500Q720 519 744 502','#87947b',1.2)+
    [704,720,736].map(x=>l(`M${x} 492v18`,'#65796d',1)).join('')+
    e(696,494,2.5,2.5,'#c19362')+e(752,495,2.5,2.5,'#c19362'));
  const crates=vignette('quay-crates',565,crate(470,548,31,18)+crate(505,544,34,22)+r(514,549,6,5,1,'#a8895f',ink,.6));
  const jars=vignette('harbor-jars',558,jarPair(610,558)+pot(642,557,.72));
  return rope+net+crates+jars;
}
function lanternQuarter():string {
  const copper=vignette('copper-tray',545,
    e(314,545,17,5,'#a97855',ink,1)+e(314,543,12,3,'#d0a06e')+l('M300 543h28','#efd09b',1));
  const tools=vignette('tool-rack',505,
    l('M681 506v-43M731 506v-43M678 466h57',wood,3)+
    l('M691 468v22M706 468l5 23M722 468l-4 22','#b2a084',2)+
    e(691,493,3,5,'#82938a')+p('M708 491l5-2 3 5-5 3Z','#84978f',ink,.7));
  const rolls=vignette('fabric-rolls',559,
    [0,1,2].map((i)=>r(397+i*16,543-i*2,12,22,4,i===0?'#617d88':i===1?'#9b7b69':'#778b6f',ink,.8)).join('')+
    l('M398 551h10M414 549h10M430 547h10','#d9c79e',1));
  const bench=vignette('workbench',570,
    stool(548,548)+r(551,541,10,7,1,'#8d7258',ink,.8)+e(570,543,5,3,'#c4a570')+l('M579 541l10-8','#87958b',2));
  return copper+tools+rolls+bench;
}
function hillsideWatch():string {
  const tank=vignette('water-tank',500,
    r(237,464,42,31,9,'#758b87',ink,1)+e(258,464,21,5,'#a6ad91',ink,.8)+l('M242 476h32M243 486h30','#b8b493',1.2));
  const antenna=vignette('antenna',455,
    l('M700 471V405M681 428l19-12 19 12M688 447l12-8 12 8','#63777a',2)+e(700,403,3,3,'#d1b97f',ink,.7));
  const spool=vignette('cable-spool',555,
    e(328,555,14,14,'#876e55',ink,1)+e(328,555,7,7,'#465d61')+l('M314 555h28M328 541v28','#bea174',1.4)+l('M342 560q20 8 34-1','#485f63',2));
  const box=vignette('utility-box',558,
    r(605,535,35,28,3,'#6f837b',ink,1)+r(611,541,10,7,1,'#aab391',ink,.6)+l('M630 539v20M608 558h29','#50686a',1)+e(633,548,2,2,'#d0a96c'));
  return tank+antenna+spool+box;
}
function futureCourtyards():string {
  const planter=vignette('garden-planter',557,
    p('M254 556l12-21h50l12 21Z','#64847f',ink,1)+r(266,538,50,7,3,'#8eaa91',ink,.7)+
    [275,289,303].map((x,i)=>l(`M${x} 538q${i%2?-8:8}-17 ${i%2?2:13}-27`,'#7fae8e',2)+e(x+(i%2?-5:6),518-i*2,6,3,'#9ec09b')).join(''));
  const node=vignette('water-node',544,
    e(455,544,24,7,'#557c82',ink,1)+e(455,543,15,4,'#8fc6bc')+p('M451 536l4-14 4 14Z','#b6e7d9',ink,.7)+e(455,523,2.5,2.5,'#e4fff5'));
  const canopy=vignette('solar-canopy',495,
    l('M625 500v-45M703 500v-45','#536f75',3)+p('M614 456l52-13 47 13-51 14Z','#527b87',ink,1)+
    l('M631 452l12 14M655 446l12 17M680 448l10 13','#a9d1c6',1));
  const pod=vignette('service-pod',566,
    r(747,535,42,30,9,'#607f89',ink,1)+r(754,542,28,12,5,'#3d626e',ink,.7)+e(761,548,3,3,'#b9fff0')+e(776,548,3,3,'#b9fff0')+l('M757 560h22','#9ac5bc',1.5));
  return planter+node+canopy+pod;
}

export function environmentVignettesSvg(input:number):string {
  const age=validAge(input);
  const body=[firstFires,oliveTerraces,harborWatch,lanternQuarter,hillsideWatch,futureCourtyards][age]();
  return `<g data-layer="environment-vignettes" data-chapter="${age}">${body}</g>`;
}
