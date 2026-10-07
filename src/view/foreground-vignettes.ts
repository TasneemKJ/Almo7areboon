import {path as p,ellipse as e,rect as r,line as l} from './illustration-kit.ts';

const ink='#29464f';
const stone='#74877d';
const stoneHi='#a9aa8f';
const wood='#735f4d';
const clay='#9b7358';
const leaf='#567765';
const blue='#567d8c';
const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const vg=(side:'left'|'right',name:string,x:number,y:number,body:string)=>`<g data-side="${side}" data-vignette="${name}" data-x="${x}" data-y="${y}">${body}</g>`;
const pot=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M-8-8Q0-12 8-8L6 9Q0 14-6 9Z',clay,ink,1)}${e(0,-8,8,2.4,'#c39870',ink,.8)}${l('M-5 1Q0 3 5 1','#d5b187',1)}</g>`;
const basket=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M-14-2Q0 8 14-2L10 13Q0 18-10 13Z','#9b815d',ink,1)}${l('M-10 2H10M-8 7H8M-5-3Q0-15 6-3','#d1b684',1)}</g>`;
const stonePile=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M-24 8L-14-9 3-12 14-5 25 8Z',stone,ink,1)}${p('M-12-7L1-10 8-4-3 1Z',stoneHi,'none',0)}</g>`;
const lantern=(x:number,y:number,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${l('M0-24V-13',ink,2)}${p('M-7-10L0-16 7-10 6 10-6 10Z','#a6875b',ink,1.2)}${r(-3,-8,6,14,1,'#f1c77e','none',0)}</g>`;
const crate=(x:number,y:number,w=34,h=21)=>r(x,y,w,h,2,wood,ink,1)+l(`M${x+3} ${y+4}l${w-6} ${h-8}M${x+w-3} ${y+4}L${x+3} ${y+h-4}`,'#ad8d69',1);

function firstFires():string {
 let out='';
 out+=vg('left','lantern-shelf',118,824,
   r(57,842,88,8,2,wood,ink,1)+l('M66 850v31M134 850v31',wood,4)+lantern(91,833,.9)+pot(126,838,.7));
 out+=vg('left','reed-basket',146,938,basket(142,938,1.05)+l('M119 949q12-26 4-51M128 949q20-29 12-55','#597462',2));
 out+=vg('right','olive-rock',788,851,stonePile(796,857,1.25)+l('M811 850q18-44 8-68M814 814q-21-13-25-2 11 15 25 8M817 798q18-16 26-4-8 14-25 11',leaf,2));
 out+=vg('right','jar-step',842,948,pot(832,945,.95)+pot(855,950,.72)+r(807,963,70,8,2,stone,ink,1));
 return out;
}
function oliveTerraces():string {
 let out='';
 out+=vg('left','harvest-basket',125,925,basket(104,932,1.05)+basket(137,925,.8)+[95,107,116,129,140].map((x,i)=>e(x,914-i%2*3,2.4,2.4,'#536b55')).join(''));
 out+=vg('left','terrace-stone',70,845,stonePile(73,858,1.2)+l('M46 875h61','#a4a389',2));
 out+=vg('right','vine-post',817,823,l('M823 862V783M856 864V791M821 801h38',wood,3)+l('M824 816q20-32 32-17M833 833q13-22 25-11',leaf,2)+e(849,805,4,5,'#6d7280'));
 out+=vg('right','grape-crate',862,946,crate(827,933,52,27)+[839,850,861,871].map((x,i)=>e(x,929-i%2*4,3.1,3.1,'#6b667c')).join(''));
 return out;
}
function harborWatch():string {
 let out='';
 out+=vg('left','rope-post',92,821,l('M92 875V774',wood,7)+l('M80 786h24','#c2a67a',2)+e(91,852,20,11,'none','#ad9368',4)+e(91,852,12,6,'none','#d0b889',2));
 out+=vg('left','mooring-jar',148,949,pot(130,947,1)+pot(158,954,.75)+l('M118 963h58','#7c8171',3));
 out+=vg('right','net-bundle',806,842,
   l('M771 808Q815 842 855 808M780 817Q815 850 846 818M789 826Q814 855 838 828','#7d8d78',1.3)+
   [790,807,824,841].map(x=>l(`M${x} 812v34`,'#68796b',1)).join('')+e(774,811,3,3,'#c18c5f')+e(851,813,3,3,'#c18c5f'));
 out+=vg('right','sail-cloth',873,937,p('M826 966L850 900 884 934 879 969Z','#839b9b',ink,1)+l('M850 901v65M837 936l39 2','#c8bea0',1.5));
 return out;
}
function lanternQuarter():string {
 let out='';
 out+=vg('left','pottery-step',120,949,r(51,960,105,10,2,stone,ink,1)+pot(86,947,.95)+pot(115,950,.7)+pot(140,953,.55));
 out+=vg('left','brass-lantern',60,817,lantern(62,817,1.25)+l('M61 790q-27-8-39 8','#5a6c62',2));
 out+=vg('right','awning-edge',826,810,p('M746 825Q808 787 891 805L884 838Q813 816 752 847Z','#718794',ink,1.2)+l('M754 826Q814 799 884 814','#d2bf96',2));
 out+=vg('right','tool-crate',858,956,crate(823,939,56,28)+l('M834 939l11-25M853 938l-4-29M869 940l12-21','#8c9685',2));
 return out;
}
function hillsideWatch():string {
 let out='';
 out+=vg('left','railing-utility',91,816,l('M34 858V789M66 858V799M98 858V792M130 858V803M32 817h101',ink,3)+r(55,823,35,22,3,'#71857d',ink,1)+e(82,831,3,3,'#c7a46d'));
 out+=vg('left','planter-box',146,951,r(103,940,67,28,3,'#6c7e6f',ink,1)+[116,132,149,161].map((x,i)=>l(`M${x} 941q${i%2?8:-7}-22 ${i%2?13:-1}-31`,leaf,2)+e(x+(i%2?8:-4),916-i%2*3,5,3,'#8da280')).join(''));
 out+=vg('right','antenna-edge',825,807,l('M847 861V753M812 789l35-21 34 21M824 819l23-14 24 14','#607579',2.5)+e(847,751,4,4,'#d0ae74',ink,.8));
 out+=vg('right','cable-rail',874,947,l('M820 966V918M850 966V925M880 966V915M817 941h67',ink,3)+e(842,947,16,16,'#75624f',ink,1)+e(842,947,7,7,'#435b60')+l('M858 951q18 9 29 1','#4c6366',2));
 return out;
}
function futureCourtyards():string {
 let out='';
 out+=vg('left','garden-arch',108,815,p('M33 870V824Q53 780 87 796Q121 774 153 825V870H139V827Q117 797 88 813Q58 797 47 830V870Z','#587d80',ink,1.3)+l('M48 844Q90 818 139 843','#a8cec0',2));
 out+=vg('left','light-stone',148,952,stonePile(133,958,.9)+p('M130 952l10-26 11 26-11 18Z','#6d9fa0',ink,1)+e(140,946,3,3,'#d8fff0'));
 out+=vg('right','luminous-planter',810,930,p('M759 957l14-36h69l16 36Z','#5a7f7e',ink,1)+r(775,925,66,8,3,'#8db2a0',ink,.8)+[786,804,824].map((x,i)=>l(`M${x} 925q${i%2?-9:8}-21 ${i%2?0:15}-31`,'#7eb38d',2)+e(x+(i%2?-5:7),902,6,3,'#a9caa2')).join(''));
 out+=vg('right','service-rail',868,811,l('M815 864V788M849 864V798M884 864V783M813 826h75','#51727a',3)+r(829,832,39,20,8,blue,ink,1)+e(840,841,3,3,'#c8fff1')+e(856,841,3,3,'#c8fff1'));
 return out;
}

export function foregroundVignettesSvg(input:number):string {
 const age=validAge(input);
 const body=[firstFires,oliveTerraces,harborWatch,lanternQuarter,hillsideWatch,futureCourtyards][age]();
 return `<g data-layer="foreground-vignettes" data-chapter="${age}">${body}</g>`;
}
