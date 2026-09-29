import {path as p,ellipse as e,rect as r,line as l,gradient,documentSvg} from './illustration-kit.ts';
import {sceneMaterialDetailSvg} from './design-detail.ts';
import {cinematicDepthSvg} from './cinematic-depth.ts';
import {environmentVignettesSvg} from './environment-vignettes.ts';
import {foregroundVignettesSvg} from './foreground-vignettes.ts';

// Fictional chapters, not reconstructions of monuments or a historical chronology.
// Reference contexts and deliberate fantasy are recorded in docs/levantine-40.
const settings=['shelter-valley','olive-terraces','coastal-quay','courtyard-quarter','hillside-homes','future-courtyards'] as const;
const palettes=[
 ['#1b354f','#b6aba0','#7c8991','#3c6470','#729380','#b8af91'],
 ['#263751','#b5a899','#788b86','#365e60','#657c66','#c2b391'],
 ['#203653','#99adb0','#729399','#346473','#617f7c','#c5b9a0'],
 ['#272e4b','#baaa9d','#849295','#355963','#627c76','#bcae94'],
 ['#1e354e','#a7b0ab','#809794','#3f686e','#738777','#bbb39b'],
 ['#142943','#7d9d9f','#5d808b','#31586b','#587a78','#b1c1ad'],
] as const;
const ageOf=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const noise=(n:number)=>{const s=Math.sin(n*93.17+5.6)*43758.5453;return s-Math.floor(s);};
const group=(x:number,y:number,scale:number,body:string)=>`<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`;
const no='#243e4a';

function definitions(age:number):string {
 const c=palettes[age];
 return gradient('sky',c[0],c[1])+gradient('far',c[2],c[1])+gradient('ridge',c[3],c[2])+gradient('earth',c[4],'#304b50')+
 gradient('road',c[5],age===5?'#718b87':'#829084')+gradient('stone','#d4bf99','#748880')+
 gradient('wall','#c6b494','#536e72')+gradient('wood','#958468','#355863')+gradient('leaf','#91a184','#284e57')+
 gradient('door','#183546','#324f56')+gradient('water','#497c86','#234858')+
 '<radialGradient id="lamp"><stop stop-color="#ffd18a" stop-opacity=".56"/><stop offset="1" stop-color="#ffc58a" stop-opacity="0"/></radialGradient>';
}
function windowAt(x:number,y:number,w=10,h=18,lit=false):string {
 const body=r(x,y,w,h,2,lit?'#e6b87b':'#2b4c58','none',0)+l(`M${x+w/2} ${y+2}V${y+h-1}`,'#65776c',1.5);
 return lit?`<g data-layer="practical-light">${e(x+w/2,y+h/2,w*3,h*1.7,'url(#lamp)')}${p(`M${x} ${y+h}l-6 13 ${w+13} 0-7-13Z`,'#d9b27e','none',0)}${body}</g>`:body;
}
function lantern(x:number,y:number,scale=1):string {
 return group(x,y,scale,`<g data-layer="practical-light">${e(0,0,30,37,'url(#lamp)')}${l('M0-22V-13',no,2)}${p('M-6-9L0-15 6-9 5 9-5 9Z','#c7a773',no,1.5)}${r(-3,-7,6,13,1,'#ffdc92','none',0)}${l('M-6-8H6M-5 8H5',no,1.4)}</g>`);
}
function arch(x:number,y:number,w:number,h:number,fill='url(#door)'):string {
 return p(`M${x} ${y+h}V${y+w/2}Q${x} ${y} ${x+w/2} ${y}Q${x+w} ${y} ${x+w} ${y+w/2}V${y+h}Z`,fill,'#a2a38a',2);
}
function wallJoints(x:number,y:number,w:number,h:number):string {
 let out='';
 for(let row=1;row<h/14;row++){
  out+=l(`M${x} ${y+row*14}h${w}`,'#657974',.8);
  for(let col=0;col<w/25;col++){const xx=x+col*25+(row%2)*12;if(xx>x&&xx<x+w)out+=l(`M${xx} ${y+(row-1)*14}v14`,'#798b7e',.8);}
 }
 return `<g opacity=".42">${out}</g>`;
}
function house(x:number,y:number,scale:number,variant=0,lit=false):string {
 let body=p('M-42 0V-81L37-81 51-68V0Z','url(#wall)',no,1.2)+p('M37-81L51-68V0H37Z','#536e70','none',0);
 body+=p('M-42-81L-29-96 49-94 37-81Z','#889e91',no,1)+r(-47,-87,87,9,1,'url(#stone)',no,1)+l('M-45-85H38','#e5d2a9',2)+wallJoints(-42,-74,78,73);
 for(const bx of [-30,-8,15,35])body+=r(bx,-79,4,7,1,'#667967','none',0);
 body+=r(-44,-3,84,5,1,'#adb59a',no,1)+l('M-10-1H15','#dec89d',2);
 body+=arch(-11,-39,24,39)+windowAt(-32,-65,11,20,lit)+windowAt(13,-65,11,20,variant===2);
 if(variant===1)body+=p('M-37-91L-30-103H17L32-91Z','#6b8a82','none',0)+l('M-31-95H23','#b3c0a1',2);
 if(variant===2){body+=r(-32,-33,61,5,0,'#a6a88a',no,1)+l('M-30-44V-33M-16-44V-33M-2-44V-33M12-44V-33M26-44V-33M-31-44H28','#314e59',2);}
 return group(x,y,scale,body);
}
function olive(x:number,y:number,scale=1):string {
 let out=e(0,2,49,10,'#294d52')+p('M-7 0L-4-33-17-55-34-68-32-73-12-65 1-44 13-66 29-78 32-74 20-59 9-34 8 0Z','#6e7666','#314e54',2);
 out+=l('M-2-3L2-28 0-38M5-41L14-59','#a2a18b',2);
 for(const [cx,cy,rx,ry] of [[-38,-79,24,14],[-12,-86,25,16],[21,-91,25,16],[41,-74,21,14],[4,-67,30,17]]){
  out+=e(cx,cy,rx,ry,'url(#leaf)','#406366',1);
  for(let i=0;i<6;i++){const xx=cx-rx*.7+noise(i+cx)*rx*1.4,yy=cy-ry*.5+noise(i+cy)*ry;out+=p(`M${xx} ${yy}q4-5 8-3-3 5-8 3Z`,'#a2ac8e','none',0);}
 }
 return group(x,y,scale,out);
}
function ridge(age:number):string {
 if(age===1||age===3||age===4||age===5)return p('M0 552V402Q94 345 183 382Q327 317 448 400Q553 349 662 381Q780 299 900 362V571Z','url(#far)','none',0)+p('M0 570V467Q169 379 319 464Q484 386 623 458Q780 379 900 458V580Z','url(#ridge)','none',0);
 return p('M0 554V386L74 369 132 391 202 329 264 346 341 411 389 392 442 359 512 401 588 352 657 372 730 321 779 337 840 391 900 367V578Z','url(#far)','none',0)+
 p('M0 569V475Q142 373 275 484Q376 421 473 479Q606 397 715 466Q810 399 900 465V583Z','url(#ridge)','none',0);
}
function shelterValley():string {
 let out=p('M0 578L0 390 49 368 74 398 98 344 145 329 178 363 186 491 238 555Z','url(#stone)','#596e6d',2)+
 p('M95 361L140 343 134 453 174 514 94 501Z','#829187','none',0)+l('M26 417L60 427 64 502M147 383L163 476','#6f7f76',2)+
 p('M611 576L671 492 684 398 720 362 766 368 792 391 821 478 900 464V577Z','url(#stone)','#596e6d',2)+p('M744 372L772 382 765 465 793 507 732 497Z','#7c8980','none',0);
 out+=l('M15 403L58 394 75 411M105 380L158 367M112 419L165 409M681 443L733 431M779 422L805 458M27 482L50 474M798 499L872 486','#c0baa2',2)+p('M185 551Q278 526 338 544L320 562 210 567Z','#647e71','none',0);
 out+=p('M698 526V483Q718 446 743 478L754 526Z','url(#door)','#8f9a8c',3);
 for(const [x,y,s] of [[253,532,.8],[329,516,.63],[541,521,.7]]){
  out+=group(x,y,s,p('M-43 0L-40-43Q-26-68 0-65Q30-69 44-43L47 0Z','url(#stone)','#506e6c',2)+arch(-10,-33,25,34)+p('M-43-38Q-24-64 2-64L43-40Z','#a69b7b','none',0)+l('M-31-39L-8-59M-16-35L7-61M5-36L23-53','#c5b79b',2));
 }
 out+=`<g data-layer="practical-light">${e(425,540,51,32,'url(#lamp)')}${p('M409 547Q405 530 417 520L424 505 431 524 438 532 434 548Z','#bd8766','none',0)}${p('M420 546Q416 531 426 520L433 541Z','#efc68b','none',0)}</g>`;
 return out+l('M349 558Q417 550 474 556Q514 563 565 552','#84a29b',4);
}
function terraces():string {
 let out='';
 for(let i=0;i<4;i++){
  const y=411+i*43;
  out+=p(`M0 ${y+48}Q182 ${y-7} 390 ${y+16}Q657 ${y-40} 900 ${y+15}V${y+48}Q660 ${y-4} 386 ${y+45}Q150 ${y+29} 0 ${y+77}Z`,i%2?'#798975':'#657f72','none',0);
  out+=l(`M0 ${y+45}Q182 ${y-10} 390 ${y+13}Q657 ${y-43} 900 ${y+12}`,'#a9a88d',9);
  out+=l(`M0 ${y+51}Q182 ${y-4} 390 ${y+19}Q657 ${y-37} 900 ${y+18}`,'#405f60',3);
  for(let j=0;j<14;j++)out+=l(`M${j*66} ${y+41+Math.sin(j*.9)*14}l4 8`,'#4d6863',1.3);
 }
 for(const [x,y,s] of [[176,410,.45],[329,451,.53],[553,411,.5],[715,453,.58],[222,517,.6],[611,536,.55],[824,531,.55]])out+=olive(x,y,s);
 out+=house(471,498,.84,1,true)+house(548,484,.51,0,false)+l('M416 494V455M475 494V449M414 454L478 448','#536659',3)+p('M412 451Q439 432 478 446L480 459 418 466Z','#547263','none',0)+l('M488 533L548 552 731 548','#365969',8)+l('M488 531L548 549 731 545','#abc1ad',3)+lantern(433,486,.55);
 return out;
}
function coast():string {
 let out=p('M0 458Q275 421 512 445Q748 413 900 449V583H0Z','url(#water)','none',0);
 for(let i=0;i<18;i++){const x=noise(i)*900,y=459+noise(i+40)*82;out+=l(`M${x} ${y}h${15+noise(i+5)*88}`,'#85a7a2',1.2);}
 out+=p('M336 503L389 397 485 378 576 407 605 489 729 534 707 559 429 548Z','url(#wall)','#547371',2);
 for(let i=0;i<4;i++)out+=house(391+i*60,450-i%2*26,.65+(i===1?.25:0),0,i===2);
 out+=l('M336 489L386 438M601 496L609 444','#b5b69b',3)+r(373,453,29,40,1,'#657e7a',no,1)+r(566,467,31,34,1,'#748c80',no,1)+wallJoints(378,454,18,36);
 out+=p('M261 536L386 468 603 493 755 537 685 550 397 510 280 548Z','#8e9885','#4f6f71',2)+l('M396 493L690 540','#b7b69b',3);
 for(const [x,y,s] of [[178,501,.66],[762,488,.52]]){
  out+=group(x,y,s,p('M-44 0Q-25 25 36 15L53-6 30 1-44 0Z','#7d8370',no,2)+l('M4 0V-66M-20-52H31','#bab89a',3)+p('M4-59Q26-55 31-36L6-43Z','#9bada6',no,1)+l('M-30 5L18 8','#c1b797',2));
 }
 out+=l('M285 533V510M329 519V494M371 505V478M610 528V506M649 538V516','#607a76',4)+l('M285 514Q326 519 329 498Q356 500 371 482M610 510Q631 532 649 520','#b3b798',2);
 return out+lantern(387,475,.5)+lantern(604,510,.65);
}
function quarter():string {
 let out=house(185,553,1.8,2,true)+house(708,557,1.75,2,false);
 out+=p('M51 568L81 498H105V568Z','#607d77',no,1)+l('M65 541H105M72 524H105M78 510H105','#c3b28e',3)+p('M220 550L258 461H274V560Z','#3a5c64',no,1)+l('M231 529H272M240 508H272M247 489H272','#8ca291',3);
 out+=p('M296 564V370H610V565Z','url(#stone)',no,2)+p('M315 546V398H589V546Z','#506d73','none',0)+r(286,362,337,13,2,'#a2a38d',no,2)+l('M297 365H613','#e1ceb0',2);
 for(const x of [325,391,457,523])out+=arch(x,408,44,105)+l(`M${x-3} 514H${x+48}`,'#d1c09e',3);
 for(const x of [310,598])out+=l(`M${x} 398v160`,'#c9b590',5);
 for(let i=0;i<14;i++)out+=r(301+i*22,383,11,7,0,'#61766f','none',0);
 out+=p('M586 420L628 415 648 437 590 441Z','#6f817e',no,1)+l('M602 422L611 435M619 420L633 435','#a9b999',2);
 out+=wallJoints(296,375,314,22)+p('M420 567V491Q450 464 480 491V567Z','#173845','#7f9286',3)+p('M430 557V498Q450 483 470 498V557Z','#37575e','none',0)+l('M450 493V556','#ac9b7f',2);
 out+=l('M285 385Q446 433 630 382','#314650',3)+p('M307 393Q415 442 476 423L470 447Q382 449 318 416Z','#6e8790',no,1);
 out+=r(377,551,143,15,2,'#899b90',no,2)+e(450,551,67,12,'#51747b','#bcb294',3)+e(450,551,47,5,'#93b9b0');
 out+=p('M320 546L319 527 331 519 343 527 340 546Z','#a58f74',no,1)+e(331,527,8,3,'#617b70')+p('M558 546L560 524 576 524 578 546Z','#b39c7f',no,1)+l('M325 522l-4-16M330 521l2-20M338 522l8-16','#66826d',2);
 return out+lantern(404,426,.7)+lantern(533,426,.7)+windowAt(179,414,13,28,true);
}
function hillside(future=false):string {
 let out='';
 for(let row=0;row<3;row++){
  const y=408+row*71;
  out+=p(`M0 ${y}Q255 ${y-45} 428 ${y-15}Q622 ${y-66} 900 ${y-21}V${y+24}Q621 ${y-26} 428 ${y+15}Q255 ${y-5} 0 ${y+35}Z`,'#657f79','none',0)+l(`M0 ${y}Q255 ${y-45} 428 ${y-15}Q622 ${y-66} 900 ${y-21}`,'#a5af95',3);
 }
 for(let row=0;row<3;row++)for(let j=0;j<6;j++){
  const x=77+j*141+row*27,y=399+row*76-Math.sin(j*1.27)*28,s=.53+row*.19+(j%3===0?.1:0);
  out+=house(x,y,s,future?1:2,(j+row)%3===1);
  if(future)out+=group(x,y,s,l('M-42-95L15-106 42-94','#92bdb7',4)+p('M-36-98L8-107 35-98 8-95Z','#547f89',no,1)+l('M-30-100L8-102 26-99','#b0dad0',1.5));
  else if((j+row)%2===0)out+=group(x,y,s,r(-20,-110,26,22,5,'#788e8b',no,1)+e(-7,-110,13,4,'#bbc1a6',no,1));
 }
 out+=p('M458 558L497 470 523 471 494 560Z','#526f70','#8b9e8e',1.5);
 for(let i=0;i<9;i++){const y=481+i*9;out+=l(`M${497-i*4} ${y}h25`,'#c8bd9a',2);}
 if(future){
  out+=p('M258 552V485Q270 470 292 485V553M574 552V485Q590 469 608 485V552','url(#stone)','#526e77',2)+l('M270 527Q438 448 595 527','#668991',14)+l('M270 523Q438 444 595 523','#bfd6c4',3);
  out+=r(377,550,127,11,2,'#adbaa7',no,1)+e(441,550,53,9,'#6a9d9a','#b4c9b6',2)+lantern(279,494,.65)+lantern(594,494,.65);
 }else{
  out+=l('M42 349Q409 403 863 357','#304d58',2)+l('M182 357L182 480M766 366V496','#4a6769',3)+lantern(390,376,.65);
 }
 return out;
}
function foreground(age:number):string {
 let out='';
 // Edge-only shapes start below source y=790. Crop tests protect the entire road.
 for(const side of [0,1]){
  const x=side?900:0,sign=side?-1:1;
  let edge='';
  if(age===0)edge=p('M-20 1000V916L12 855 52 849 73 897 137 933 149 1000Z','#365355','#243e4b',2)+p('M11 858L52 851 67 886 30 913Z','#6e8279','none',0);
  else if(age===2)edge=r(-15,884,102,116,5,'#405f60','#294751',2)+l('M1 897H84M4 928H83M34 885V925M63 932V998','#758d7d',2)+p('M83 947Q129 926 126 955Q120 981 85 979Z','none','#aaa58b',5);
  else edge=p('M-10 1000V941L19 902 86 918 120 961 134 1000Z',age===5?'#3d5e6f':'#345756','none',0)+p('M-9 941L17 901 89 918 68 933Z','#728c83','none',0);
  if(age===1)edge+=r(37,932,52,44,9,'#a89e77','#335258',2)+e(63,933,25,7,'#526b62','#b5b18a',2)+l('M45 942H81M43 951H85M46 960H82M51 938V970M65 939V974M76 938V970','#6d785f',1.4);
  if(age===3)edge+=p('M-9 849L45 860 39 967-9 980Z','#4b6965','#284751',2)+l('M4 866L30 871M4 880L30 884M4 894L30 898M4 908L29 912M3 923L27 927','#98a58c',3);
  if(age===4)edge+=p('M-8 918L60 923 78 967-8 979Z','#7c9284','#34535b',2)+l('M-5 920V869M23 922V875M49 924V879M-9 869L51 879','#284b58',4);
  if(age===5)edge+=p('M-8 876L51 890 46 975-8 983Z','#587f85','#28475b',2)+l('M2 884L40 894 36 963M12 893L20 960M23 897L30 960','#afccba',2);
  for(let i=0;i<7;i++){
   const xx=12+i*11,yy=960+i%3*8;
   edge+=l(`M${xx} ${yy}Q${xx+32} ${yy-51} ${xx+19} ${yy-106}`,'#436a67',2);
   for(let j=0;j<4;j++){const sy=yy-j*20-15;edge+=p(`M${xx+18} ${sy}q-24-20-28-7 9 13 28 7M${xx+20} ${sy-9}q23-23 28-8-12 12-28 8Z`,j%2?'#6f8f7c':'#537a70','none',0);}
  }
  out+=`<g transform="translate(${x} 0) scale(${sign} 1)">${edge}</g>`;
 }
 return `<g data-layer="foreground">${out}${foregroundVignettesSvg(age)}</g>`;
}
export function foregroundSvg(input:number):string {
 const age=ageOf(input);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="220" viewBox="0 560 900 440">${foreground(age)}</svg>`;
}
export function landscapeSvg(input:number,includeForeground=true):string {
 const age=ageOf(input),c=palettes[age];
 let body=`<g data-setting="${settings[age]}"><g data-layer="sky">${r(0,0,900,1000,0,'url(#sky)','none',0)}`;
 body+=p('M707 181A31 31 0 1 0 719 229A28 28 0 0 1 707 181Z','#dbdbc0','none',0);
 for(let i=0;i<21;i++)body+=e(65+noise(i+8)*780,80+noise(i+54)*217,.6+noise(i+11)*.9,.6+noise(i+11)*.9,'#c0cfbf');
 body+=`<g opacity=".19">${p('M0 232Q120 202 277 230Q443 250 541 224Q706 208 900 239V254Q656 232 479 248Q244 255 0 246Z',c[2],'none',0)}${p('M0 308Q236 269 421 300Q653 277 900 312V326Q650 302 442 320Q182 304 0 330Z',c[2],'none',0)}</g></g>`;
 body+=`<g data-layer="distant-landscape">${ridge(age)}</g>`;
 body+=cinematicDepthSvg(age);
 body+=`<g data-layer="settlement">`;
 body+=[shelterValley,terraces,coast,quarter,()=>hillside(false),()=>hillside(true)][age]();
 body+='</g>';
 body+=environmentVignettesSvg(age);
 body+=sceneMaterialDetailSvg(age);
 body+=`<g data-layer="meadow">${p('M0 581Q248 559 473 578Q714 556 900 580V1000H0Z','url(#earth)','none',0)}</g>`;
 body+=`<g data-layer="battle-lane">${p('M0 625Q210 613 436 622Q682 614 900 626V757Q692 765 440 752Q220 762 0 751Z','#344e55','none',0)}${p('M0 622Q210 610 436 619Q682 611 900 623V747Q692 753 440 742Q220 752 0 741Z','url(#road)','none',0)}${l('M0 623Q210 611 436 620Q682 612 900 624',age===5?'#c0d0b9':'#c3b99d',3)}`;
 for(let i=0;i<70;i++){const x=noise(i+52)*900,y=638+noise(i+73)*91;body+=e(x,y,1+noise(i+21)*3,1,'#758777');}
 if(age>=2)for(let i=0;i<18;i++)body+=l(`M${i*56} 633l9 33-6 34 9 32`,'#7e8e80',.8);
 body+='</g>';
 for(let i=0;i<25;i++){const x=noise(i+150)*900,y=790+noise(i+92)*135;body+=l(`M${x} ${y}l-5-12 7 8 3-16 1 15 8-5`,'#728d76',1.5);}
 body+=`<g opacity=".14">${p('M151 833Q390 812 731 842L831 872Q486 847 215 868Z','#afb9a4','none',0)}</g>`;
 if(includeForeground)body+=foreground(age);
 return documentSvg(900,1000,body+'</g>',definitions(age));
}
