import type {Side} from '../game/types.ts';
import {visualEra} from './visual-theme.ts';
import {path as p,ellipse as e,rect as r,line as l,gradient,documentSvg} from './illustration-kit.ts';
const noise=(n:number)=>{const x=Math.sin(n*91.31+4.9)*43758.5453;return x-Math.floor(x);};
function cloud(x:number,y:number,s:number,color='#eef6df') {
 return `<g transform="translate(${x} ${y}) scale(${s})" opacity=".62">${p('M-88 8Q-104-17-72-22Q-58-54-24-38Q0-75 35-45Q64-48 73-17Q112-21 112 8Z',color,'none',0)}${e(5,12,107,5,color)}</g>`;
}
function tree(x:number,y:number,scale:number,variant='broad'){
 const trunk=p('M-9 0L-6-72-27-102-18-105 0-82 17-115 22-109 6-62 10 0Z','#6c674c','none',0)+l('M0-4L0-66','#a19764',3);
 let crown='';
 if(variant==='pine')crown=p('M0-162L-27-117-16-116-42-83-28-82-57-43 52-43 27-80 40-79 16-116 26-116Z','url(#leaf)','none',0)+l('M0-149L-17-117M-21-83L-35-58','#b8d58f',2);
 else if(variant==='cypress')crown=p('M0-174Q-50-72-21-43Q-4-25 18-44Q40-83 0-174Z','url(#leaf)','none',0)+p('M0-160Q-26-91-12-56L-4-49Q-17-94 0-160Z','#9bbb7a','none',0);
 else{
  crown=p('M-89-71Q-106-91-83-114Q-87-142-53-143Q-37-172-8-158Q20-179 48-152Q86-163 92-129Q122-112 101-84Q85-62 53-64Q18-42-9-62Q-48-46-71-71Z','url(#leaf)','none',0);
  crown+=p('M-86-112Q-81-139-49-137Q-34-164-9-151Q19-168 42-146Q70-148 86-130Q48-139 28-122Q5-142-16-124Q-46-143-63-117Z','#b3d888','none',0);
  crown+=p('M-55-88Q-37-102-13-91Q7-115 34-91Q62-107 80-89Q44-82 31-74Q1-82-14-74Q-32-89-55-88Z','#7aaa68','none',0);
 }
 return `<g transform="translate(${x} ${y}) scale(${scale})">${e(4,5,67,13,'#304e49')}${trunk}${crown}</g>`;
}
function windmill(x:number,y:number,s:number){
 return `<g transform="translate(${x} ${y}) scale(${s})">${p('M-27 0L-16-92 14-92 28 0Z','#eaddb2','none',0)}${p('M-25-90L0-118 24-90Z','#a9774c','none',0)}${r(-6,-36,12,36,4,'#65705b','none',0)}${[0,90,180,270].map(a=>`<g transform="rotate(${a} 0 -82)">${l('M0-82L0-145','#6e7759',5)}${p('M4-96L20-98 20-145 4-147Z','#f1e4b5','#9a9d70',1.5)}${l('M5-110H18M5-125H18','#b7b38c',2)}</g>`).join('')}${e(0,-82,7,7,'#7c765b')}</g>`;
}
function temple(x:number,y:number,s:number){return `<g transform="translate(${x} ${y}) scale(${s})">${r(-83,-70,167,68,1,'#919f98','none',0)}${p('M-100-78L0-132 103-78Z','#e7e2c5','none',0)}${p('M-78-84L0-121 75-84Z','#c0bfac','none',0)}${r(-96,-77,193,12,2,'#f4edce','none',0)}${[-69,-36,0,34,69].map(x=>r(x-8,-65,16,62,1,'#e1dec4','none',0)+l(`M${x-3}-61v52`,'#f7efd2',3)).join('')}${r(-99,-4,199,8,1,'#d0cfb6','none',0)}${r(-107,4,214,9,2,'#ebdfc1','none',0)}</g>`;}
function citadel(){
 let town='';
 for(let i=0;i<9;i++){const x=320+i*53,y=420-noise(i)*45;town+=r(x,y-74,45,80,0,'#c4a89b','none',0)+p(`M${x-4} ${y-73}l27-26 26 26Z`,'#765d76','none',0)+r(x+17,y-50,10,17,4,'#f0c990','none',0);}
 return `<g opacity=".9">${town}${r(247,290,48,172,2,'#b7a09a','none',0)}${p('M239 292l31-50 33 50Z','#695a74','none',0)}${r(263,315,14,23,6,'#e7c99f','none',0)}${r(720,330,51,125,2,'#bbaa9e','none',0)}${p('M711 330l34-47 37 47Z','#735c74','none',0)}${p('M225 433L797 431 797 494 225 492Z','#a79890','none',0)}${Array.from({length:23},(_,i)=>r(229+i*25,421,12,20,0,'#b8a49b','none',0)).join('')}</g>`;
}
function foreground(age:number){
 const bottom=(color:string)=>p('M0 956Q165 982 302 968Q493 994 628 971Q785 958 900 939V1000H0Z',color,'none',0);
 if(age===0){
  let art=bottom('#244f45');
  for(const side of [0,1])for(let i=0;i<5;i++){
   const x=side===0?-18+i*23:918-i*23,dir=side===0?1:-1,top=610+i*23;
   art+=p(`M${x} 968Q${x+dir*22} ${900-i*6} ${x+dir*(63+i*12)} ${top}Q${x+dir*54} 905 ${x+dir*4} 982Z`,i%2?'#4f8864':'#326d55','none',0);
   art+=l(`M${x+dir*4} 970Q${x+dir*30} 890 ${x+dir*(55+i*8)} ${top+22}`,'#8aaa72',2);
  }
  return `<g data-layer="foreground" data-era="stone">${art}${e(55,954,36,13,'#596c53')}${e(846,958,42,14,'#52664f')}</g>`;
 }
 if(age===1){
  let art=bottom('#6f713e');
  for(const side of [0,1])for(let i=0;i<8;i++){
   const x=side===0?8+i*17:892-i*17,dir=side===0?1:-1,h=238+(i%3)*28;
   art+=l(`M${x} 974Q${x+dir*5} ${928-h*.35} ${x+dir*(10+i%2*5)} ${974-h}`,'#b89948',3);
   art+=p(`M${x+dir*(10+i%2*5)} ${974-h}q${dir*18}-8 ${dir*24} 4q${-dir*18} 9 ${-dir*24} 2Z`,'#e5ca72','none',0);
   art+=p(`M${x+dir*8} ${952-h*.3}q${dir*14}-6 ${dir*20} 3q${-dir*13} 8 ${-dir*20} 2Z`,'#cfb45e','none',0);
  }
  return `<g data-layer="foreground" data-era="farm">${art}${p('M0 973Q66 949 133 970V1000H0Z','#8a7d43','none',0)}${p('M767 971Q840 947 900 970V1000H767Z','#8a7d43','none',0)}</g>`;
 }
 if(age===2){
  let art=bottom('#4f6956');
  for(const side of [0,1]){
   const x=side===0?18:882,dir=side===0?1:-1;
   art+=l(`M${x} 983Q${x+dir*35} 807 ${x+dir*73} 630`,'#6f6b50',6);
   for(let i=0;i<7;i++){
    const bx=x+dir*(26+i*8),by=900-i*34;
    art+=e(bx+dir*12,by,17,6,i%2?'#758866':'#8f9c70','none',0)+e(bx-dir*3,by+8,14,5,'#697d5c','none',0);
   }
  }
  art+=r(19,944,67,32,2,'#b8b5a0','#747967',1)+r(815,946,61,30,2,'#aaa998','#747967',1)+l('M24 956H80M820 958H871','#dfd6bb',2);
  return `<g data-layer="foreground" data-era="spartan">${art}</g>`;
 }
 if(age===3){
  let art=bottom('#374f4d');
  for(const side of [0,1]){
   const x=side===0?5:895,dir=side===0?1:-1;
   art+=l(`M${x} 995Q${x+dir*31} 808 ${x+dir*83} 615`,'#6c6256',5);
   for(let i=0;i<8;i++){
    const bx=x+dir*(20+i*9),by=918-i*38;
    art+=p(`M${bx} ${by}q${dir*17}-14 ${dir*31}-2q${-dir*13} 17 ${-dir*31} 9Z`,i%2?'#8e7265':'#5f7765','none',0);
   }
  }
  art+=r(0,964,96,36,0,'#5b5b55','none',0)+r(804,965,96,35,0,'#555a58','none',0);
  for(const x of [14,44,74,819,849,879])art+=l(`M${x} 968v30`,'#74746d',2);
  return `<g data-layer="foreground" data-era="renaissance">${art}</g>`;
 }
 if(age===4){
  let art=bottom('#304c45');
  for(const side of [0,1])for(let i=0;i<6;i++){
   const x=side===0?5+i*19:895-i*19,dir=side===0?1:-1,h=228+i*15;
   art+=p(`M${x} 988L${x+dir*7} ${988-h}L${x+dir*14} 988Z`,i%2?'#516b54':'#3d5c4d','none',0);
   art+=l(`M${x+dir*7} ${988-h+6}l${dir*18} 14M${x+dir*7} ${988-h+21}l${-dir*15} 12M${x+dir*8} ${988-h+38}l${dir*17} 12`,'#80906c',2);
  }
  art+=r(19,950,72,24,7,'#7f8d74','#4d6257',1)+r(809,952,72,23,7,'#788774','#4d6257',1);
  return `<g data-layer="foreground" data-era="modern">${art}</g>`;
 }
 let art=bottom('#223553');
 for(const side of [0,1])for(let i=0;i<5;i++){
  const x=side===0?4+i*22:896-i*22,dir=side===0?1:-1,h=230+i*24;
  art+=p(`M${x} 982L${x+dir*(14+i*2)} ${982-h}L${x+dir*(32+i*3)} 982Z`,i%2?'#507696':'#3e5d84','#6da5a7',1.2);
  art+=p(`M${x+dir*(15+i*2)} ${982-h+6}L${x+dir*(20+i*2)} ${982-h+31}L${x+dir*(10+i*2)} ${982-h+31}Z`,'#9be8d7','none',0);
 }
 art+=l('M20 975Q119 945 189 973M711 974Q786 946 884 974','#70a3a7',2);
 return `<g data-layer="foreground" data-era="space">${art}</g>`;
}

export function foregroundSvg(age:number):string {
 age=Number.isInteger(age)&&age>=0&&age<6?age:0;
 const body=foreground(age);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="220" viewBox="0 560 900 440">${body}</svg>`;
}
/** A hand-authored composition per era; the combat lane is always unobstructed. */
export function landscapeSvg(age:number,includeForeground=true):string {
 const t=visualEra(age);const actual=['Stone Age','Farm Age','Spartan Age','Renaissance','Modern Age','Space Age'].indexOf(t.name);age=actual;
 const defs=gradient('sky',t.sky[0],t.sky[1])+gradient('far',t.far,t.sky[1])+gradient('ridge',t.ridge,t.far)+gradient('meadow',t.light,t.ground)+gradient('earth',t.ground,t.soil)+gradient('lane',t.path,age===5?'#55748b':'#bba278')+gradient('leaf',age===5?'#739aab':age===3?'#d39c80':'#77ad6e',age===5?'#3e567d':'#376c58')+`<radialGradient id="sun"><stop stop-color="#fff7cf" stop-opacity=".55"/><stop offset="1" stop-color="#fff3bb" stop-opacity="0"/></radialGradient>`;
 let out=`<g data-layer="sky">${r(0,0,900,1000,0,'url(#sky)','none',0)}`;
 if(age===5){
  for(let i=0;i<65;i++)out+=e(noise(i+3)*900,noise(i+91)*440,noise(i+8)*1.7+.4,noise(i+8)*1.7+.4,i%5?'#acc9e3':'#fcecc1');
  out+=e(685,217,120,120,'#b0d6db')+p('M692 98Q831 113 805 256Q772 354 671 337Q758 301 765 220Q775 148 692 98Z','#6facc0','none',0)+`<ellipse cx="685" cy="228" rx="178" ry="27" fill="none" stroke="#91dedc" stroke-width="9" opacity=".65" transform="rotate(-25 685 228)"/>`;
 }else{
  out+=e(690,205,225,225,'url(#sun)')+e(690,205,58,58,'#fff1bd')+e(690,205,82,82,'none','#ffe9b7',1);
  out+=cloud(158,189,1.2)+cloud(717,323,.78)+cloud(372,242,.52);
 }
 out+='</g><g data-layer="distant-landscape">';
 out+=p('M0 476L0 391 80 353 128 368 193 285 222 302 301 416 351 356 427 405 492 313 548 331 607 399 678 339 705 356 783 305 825 348 900 363V568H0Z','url(#far)','none',0);
 if(age===0){
  out+=p('M0 543L0 399 62 342 93 344 117 239 159 222 185 244 201 422 228 489 240 402 282 384 304 462 363 522 399 513 435 560Z','url(#ridge)','none',0)+p('M94 344L117 239 151 231 130 388 150 469 93 479Z','#609c85','none',0)+p('M124 243L159 225 184 246 149 255Z','#b4c9a3','none',0)+p('M477 559L551 471 599 453 627 329 672 295 721 302 774 396 790 493 900 445V563Z','url(#ridge)','none',0)+p('M625 335L672 299 719 306 700 321 652 346Z','#b4d0ad','none',0)+p('M675 330L696 327 700 494 681 545 649 552 670 492Z','#b6e6df','none',0)+l('M686 339L686 469 668 522','#edfff0',4)+e(666,550,69,7,'#c4e6d7');
 }else if(age===1){
  out+=p('M0 469Q213 355 430 481Q720 364 900 449V595H0Z',t.ridge,'none',0)+p('M0 511Q271 427 900 516V619H0Z','#b2b678','none',0);
  for(let i=0;i<6;i++)out+=l(`M${-80+i*7} ${522+i*13}Q390 ${447+i*10} 973 ${529+i*14}`,'#dfcc87',9);
  out+=windmill(647,460,.95)+windmill(766,443,.52);
  out+=r(199,427,65,35,1,'#eadcb0','none',0)+p('M187 430L229 397 276 428Z','#a78754','none',0);
 }else if(age===2){
  out+=p('M0 433Q392 401 900 472V619H0Z','#92c4c6','none',0)+p('M139 467L224 425 494 392 660 422 727 451 639 476 522 507 284 521Z','#819e95','none',0)+p('M226 424L495 394 655 420 579 441 318 457Z','#c6c6a4','none',0)+temple(462,424,.84);
  out+=l('M51 478L171 478M714 494H852M8 518H102M641 525H842','#d5e8d7',3)+tree(743,494,.62,'cypress')+tree(206,507,.47,'cypress');
 }else if(age===3){out+=p('M0 503Q223 389 412 470Q710 400 900 485V584H0Z','#9b8992','none',0)+citadel();}
 else if(age===4){
  out+=p('M0 517L87 390 133 364 178 403 231 460 299 386 342 434 400 486 460 411 533 432 580 479 639 396 688 359 739 427 782 425 900 494V601H0Z','url(#ridge)','none',0);
  for(let i=0;i<12;i++)out+=tree(34+i*83,551-noise(i+2)*39,.25+noise(i+6)*.2,'pine');
  out+=l('M680 497L702 335 726 497M691 431H714M693 407H711M697 378H708','#8fa49b',5)+l('M702 337V311M684 351H721','#dce1c8',3)+r(579,478,92,27,5,'#93a594','none',0)+p('M566 480l26-23h68l28 23Z','#bac0a3','none',0);
 }else{
  out+=p('M0 529L82 452 153 410 230 472 296 411 348 489 407 461 483 375 529 440 590 484 656 418 722 408 788 477 900 423V604H0Z','url(#ridge)','none',0);
  for(const [x,y,s]of [[205,520,.9],[689,509,1.1],[764,482,.45]])out+=`<g transform="translate(${x} ${y}) scale(${s})">${p('M-32 0L-25-108 0-146 28-110 34 0Z','#9fb8c7','none',0)}${p('M-15-8V-101L0-122 13-101V-8Z','#365b83','none',0)}${l('M-12-26V-96L0-111 10-95V-26','#86eced',3)}${r(-39,0,79,10,3,'#637e9b','none',0)}</g>`;
 }
 out+='</g>';
 out+=`<g data-layer="meadow">${p('M0 540Q135 514 277 549Q455 514 638 547Q780 514 900 546V1000H0Z','url(#meadow)','none',0)}${p('M0 595Q258 556 522 591Q727 571 900 590V1000H0Z','url(#earth)','none',0)}</g>`;
 // A recessed, bevelled battle road supports feet and shadows without visual noise.
 out+=`<g data-layer="battle-lane">${p('M-10 638Q170 614 301 630Q472 617 647 631Q815 612 910 636V757Q724 769 567 752Q322 764 0 751Z',t.soil,'none',0)}${p('M-10 626Q170 606 301 622Q472 609 647 623Q815 604 910 628V743Q724 755 567 739Q322 751 0 737Z','url(#lane)','none',0)}${l('M0 628Q169 608 302 624Q472 611 647 625Q815 606 900 629',age===5?'#aee8e3':'#f7e4b4',4)}${l('M0 740Q277 753 571 742Q791 755 900 743',age===5?'#60788c':'#a39468',5)}`;
 for(let i=0;i<90;i++){const x=noise(i+40)*900,y=639+noise(i+110)*87;out+=e(x,y,1+noise(i+99)*4,1.1,age===5?'#b9d1d7':'#a49774');}
 if(age===3||age===5)for(let i=0;i<18;i++){const x=i*54;out+=l(`M${x} 641l13 25-14 24 9 35`,age===5?'#829bad':'#b4a188',1.5);}
 out+='</g>';
 if(age!==5){out+=tree(-4,583,.95,age===4?'pine':'broad')+tree(937,594,1.06,age===4?'pine':'broad');}
 else for(const [x,y,s]of [[38,589,.9],[861,584,1.1],[735,858,.6]])out+=`<g transform="translate(${x} ${y}) scale(${s})">${p('M-31 0L-29-81-4-137 21-84 38 0Z','#6ba0ac','#456582',2)}${p('M-4-136L-4-7 20-83Z','#aff5df','none',0)}${p('M-36 0L-63-42-49-77-25-61-15 0Z','#537aab','none',0)}</g>`;
 // Ground detail is kept below the actors, not sprinkled over silhouettes.
 for(let i=0;i<52;i++){
  const x=noise(i+571)*900,y=782+noise(i+990)*139;
  if(age!==5)out+=l(`M${x} ${y}l-5-12 6 7 3-17 2 15 8-6-5 13`,i%3?'#829b68':'#aabe78',2.6);
  else out+=p(`M${x} ${y}l5-7 12 0 6 7-6 7-12 0Z`,'none','#5d7393',1);
 }
 if(age===0){out+=p('M209 846Q293 823 331 850L346 864Q279 849 227 866Z','#ddceaa','#657556',2)+l('M245 843L248 857M267 839L268 852M291 841L289 853M315 847L309 857','#8b9671',2.3)+e(196,855,19,13,'#e6d6b6')+e(194,852,5,6,'#718565');}
 if(age===1){for(const x of [194,246])out+=r(x,810,39,27,8,'#e3c777','#9a8e51',2)+l(`M${x+12} 813v23M${x+27} 813v23`,'#9e9556',3);}
 if(age===2)out+=p('M211 832L225 823 225 812 246 812 246 823 257 832 253 862 217 862Z','#c99469','#706c4c',2)+l('M222 837H249M223 842H248','#e3bf7b',3);
 if(age===3)out+=e(715,839,35,17,'#967e6c')+l('M684 838H745M714 824V853','#c0a27d',3);
 if(age===4)out+=r(209,829,42,22,3,'#708267','#465d54',2)+l('M213 832L247 847M248 832L213 847','#a4b38e',2);
 return documentSvg(900,1000,out+(includeForeground?foreground(age):''),defs);
}
export function baseSvg(age:number,side:Side):string {
 age=Number.isInteger(age)&&age>=0&&age<6?age:0;
 const accent=side==='player'?'#45aee4':'#ed805c',bright=side==='player'?'#b3f4ff':'#ffe2b6';
 const defs=gradient('stone','#d8cdad','#8e957e')+gradient('roof','#efd79a','#a77b45')+gradient('metal','#f1f7ea','#809caf')+gradient('door','#264659','#122b39')+gradient('team',bright,accent)+gradient('wood','#c99460','#806342');
 let out=`<g opacity=".25">${e(80,144,72,11,'#21433e')}</g>`;
 if(age===0){
  out+=p('M11 137L16 94 32 62 62 43 96 43 125 65 143 98 149 139Z','url(#stone)','#5b7061',2.5)+p('M17 94L32 63 60 47 54 83 35 105 29 138H12Z','#b6b79a','none',0)+p('M61 46L96 45 126 65 92 79 54 83Z','#eee0b9','#b1ad8e',1.3)+p('M95 80L126 67 142 99 147 137 123 134 117 106Z','#818e77','none',0);
  out+=p('M42 138L46 106Q53 81 79 82Q105 80 119 110L125 139Z','#6c7961','#6d765c',2)+p('M51 138L54 109Q61 92 81 93Q102 94 109 114L114 139Z','url(#door)','none',0)+p('M56 136Q58 110 73 102L67 123 69 137Z','#d9984b','none',0)+p('M25 87L32 70 51 61 59 60 47 76 42 91Z','#819a5a','none',0)+p('M104 51L123 65 131 77 113 79 111 69 93 64Z','#9ab770','none',0);
  out+=l('M45 127Q38 96 60 86M117 126Q119 96 99 86','#f3e1ad',5)+r(65,68,33,13,4,'url(#wood)','#7c7759',1.4)+p('M77 71l5 5-5 3-4-4Z',accent,'none',0)+l('M20 115L25 103M129 98l7 13','#d5c9a8',2);
 }else if(age===1){
  out+=r(24,80,112,59,3,'#e1d7ab','#716d53',2.5)+p('M16 84L35 58 78 34 124 61 147 87Z','url(#roof)','#80734e',2.5);
  for(let i=0;i<9;i++)out+=l(`M${27+i*13} 79L${75+(i-4)*4} ${43+Math.abs(i-4)*3}`,'#fff1bd',1.8);
  out+=p('M55 138V102Q78 85 104 102V138Z','url(#wood)','#686c53',2)+l('M79 103V136M59 111L100 130M100 111L59 130','#e3c588',2)+r(32,94,16,21,3,'url(#door)')+r(113,94,14,21,3,'url(#door)')+l('M27 84V136M132 86V138M26 123H52M106 123H133','#997b51',4)+e(81,72,9,8,'url(#door)','#f0d796',3)+r(19,131,32,14,5,'#d4b46f','#85724a',1.6)+l('M29 133v9M41 133v9','#88704b',2);
 }else if(age===2){
  out+=r(27,73,107,64,1,'#959d8c','none',0)+p('M11 69L80 25 151 69Z','url(#stone)','#797d67',2)+p('M36 62L80 36 127 62Z','#a3b1a0','none',0)+r(11,68,140,12,2,'#eddfb8','#8e8e73',1.5);
  for(const x of [28,52,108,131])out+=r(x-7,79,14,51,2,'url(#stone)','#7d896e',1.3)+r(x-10,78,20,6,1,'#f0e4c5','#7d896e',1)+l(`M${x-2} 87v36`,'#fff1d1',2.5);
  out+=p('M67 132V99Q80 88 94 99V132Z','url(#door)','none',0)+r(13,131,135,8,1,'#cfc9a5','#7b856c',1.5)+r(7,139,147,7,1,'#e5d9b3','#7b856c',1.5)+e(80,57,9,9,'url(#team)','#6a7970',1.7)+p('M78 49l7 8-6 6-5-7Z','#ffe9ac','none',0);
 }else if(age===3){
  out+=r(38,70,87,67,1,'url(#stone)','#687363',2)+r(16,56,32,82,2,'#b9b7a0','#6e7969',2)+r(113,56,32,82,2,'#a6ab97','#6e7969',2);
  out+=p('M10 59L31 20 53 59Z','#536b80','#4b5d65',2)+p('M107 58L128 20 151 58Z','#536b80','#4b5d65',2)+p('M41 71L64 49 103 48 125 71Z','#788196','#5a6b6e',2);
  out+=p('M61 138V102Q80 80 100 102V138Z','url(#door)','#e4d3ad',4)+r(27,72,10,18,4,'url(#door)','none',0)+r(123,72,10,18,4,'url(#door)','none',0);
  for(let i=0;i<4;i++)out+=l(`M18 ${94+i*10}h28M115 ${94+i*10}h29`,'#8b967f',1.3);
  out+=p('M118 97H138V126L128 134 118 126Z','url(#team)','#566d69',1.2)+p('M126 104l5 7-4 8-4-8Z','#ffe7ab','none',0);
 }else if(age===4){
  out+=p('M11 137L18 84 43 63 110 62 141 86 149 137Z','#90a38e','#526e63',2.5)+p('M18 84L43 63 110 62 142 86Z','#c0c6aa','#7b8e7b',1.5)+r(24,87,109,22,7,'url(#door)','#6b8375',2)+l('M32 93H122','#243c42',3)+r(53,113,54,25,3,'#455e58','#667d66',1.5)+l('M80 116V135','#a7b897',2);
  for(let i=0;i<6;i++)out+=r(6+i*25,135-(i%2)*3,29,12,5,'#bfc49e','#798d73',1.4);
  out+=l('M111 65L114 23M101 35H128','#5b756d',3)+e(114,24,3,3,'#deebc6')+r(47,72,57,8,2,'url(#team)','#4e6c67',1.3)+r(16,119,21,17,3,'#667c62','#4d695b',1.5);
 }else{
  out+=p('M10 135L21 74 48 41 111 41 140 76 150 135Z','url(#metal)','#46667a',2.5)+p('M21 75L48 43 111 43 137 74Z','#e7f6ed','#789da2',1.5)+p('M46 138V89L58 72H102L115 90V138Z','url(#door)','#759fba',3)+l('M50 131V91L61 78H100L110 93V131','#8beadd',3)+r(23,88,12,32,3,'url(#team)','#547a8b',1.5)+r(125,88,12,32,3,'url(#team)','#547a8b',1.5)+r(28,56,104,7,3,'#a2dddd','none',0)+r(8,133,144,11,3,'#8eafba','#527588',2)+l('M42 139H116','#d2ffff',2)+r(67,92,27,4,2,accent,'none',0)+l('M119 44L125 26','#b4d5d5',3)+e(128,21,7,6,bright,'#4d738d',1.8);
 }
 if(age!==3){out+=l('M139 129V71','#5c735e',2.5)+p('M140 74L157 78 151 85 157 92 140 89Z','url(#team)','#617861',1.1);}
 return documentSvg(160,160,`<g transform="translate(80 140) scale(0.96) translate(-80 -140)">${out}</g>`,defs);
}
