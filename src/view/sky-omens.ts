import {ellipse as e,path as p,line as l} from './illustration-kit.ts';

/** Quiet, chapter-specific sky compositions. The center stays clear for the stage HUD. */
const motifs=['valley-watch','terrace-wind','harbor-haze','quarter-smoke','hillside-storm','courtyard-light'] as const;
const index=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const bird=(x:number,y:number,scale:number,color:string)=>`<g transform="translate(${x} ${y}) scale(${scale})">${l('M-13 2Q-6-6 0 0Q6-7 14 1',color,1.8)}</g>`;
const cloud=(x:number,y:number,w:number,opacity:number)=>`<g opacity="${opacity}">${p(`M${x-w/2} ${y+8}Q${x-w*.29} ${y-13} ${x-w*.09} ${y-8}Q${x+w*.06} ${y-27} ${x+w*.22} ${y-6}Q${x+w*.39} ${y-13} ${x+w/2} ${y+7}Q${x+w*.21} ${y+17} ${x-w/2} ${y+8}Z`,'#e7d9bd','none',0)}${l(`M${x-w*.39} ${y+14}Q${x} ${y+22} ${x+w*.42} ${y+13}`,'#e3d6bd',2)}</g>`;

export function skyOmensSvg(input:number):string {
 const age=index(input);
 let art='';
 const moon=(x:number,y:number,r:number)=>`<g data-layer="moon">${e(x,y,r*1.8,r*1.8,'#eee1c7')}${e(x,y,r,r,'#e5ddc3')}${e(x-r*.22,y-r*.18,r*.18,r*.18,'#bdbfac')}${e(x+r*.3,y+r*.27,r*.12,r*.12,'#c3c2ad')}</g>`;
 if(age===0){
  art+=`<g opacity=".16">${e(710,204,79,79,'#f1e6c7')}${e(710,204,120,120,'none','#eee2c7',2)}</g>`;
  art+=p('M707 181A31 31 0 1 0 719 229A28 28 0 0 1 707 181Z','#dbdbc0','none',0);
  art+=cloud(170,188,240,.16)+cloud(758,260,180,.13);
  art+=[[-1,0],[0,15],[1,2],[2,21],[3,9]].map(([i,offset])=>bird(143+i*24,293+offset,.48,'#c1c5b2')).join('');
 }else if(age===1){
  art+=`<g opacity=".3">${moon(710,204,28)}</g>`;
  art+=cloud(124,149,280,.22)+cloud(792,227,232,.18)+cloud(198,320,163,.08);
  art+=p('M0 286Q126 260 208 283Q99 276 0 309Z','#e5c9ac','none',0);
  art+=[0,1,2,3,4,5,6].map(i=>bird(697+i*20,294+(i%3)*13,.52+i*.025,'#d4d1b5')).join('');
 }else if(age===2){
  art+=p('M725 173A31 31 0 1 0 738 225A25 25 0 0 1 725 173Z','#d5dfcb','none',0);
  art+=`<g opacity=".16">${p('M0 285Q160 248 324 288Q470 255 548 282Q703 259 900 275V345H0Z','#d4ddd0','none',0)}${p('M0 330Q170 300 295 332Q439 312 594 328Q734 300 900 321V369H0Z','#a8c3bc','none',0)}</g>`;
  art+=cloud(762,150,221,.16);
  art+=[0,1,2,3].map(i=>bird(116+i*43,211+i%2*15,.68,'#d9dac5')).join('');
 }else if(age===3){
  art+=p('M707 181A31 31 0 1 0 719 229A28 28 0 0 1 707 181Z','#dbdbc0','none',0);
  art+=cloud(141,244,177,.11)+cloud(802,191,196,.16);
  art+=`<g opacity=".19">${p('M123 361Q96 312 132 270Q157 238 135 207Q183 244 156 284Q143 312 174 358Z','#aeb1a8','none',0)}${p('M782 359Q751 311 776 271Q806 234 781 208Q822 252 802 286Q787 310 824 355Z','#b7b7aa','none',0)}</g>`;
  art+=`<g opacity=".35">${e(106,143,2,2,'#e3d9bf')}${e(826,106,1.5,1.5,'#e3d9bf')}${e(773,249,1,1,'#e3d9bf')}</g>`;
 }else if(age===4){
  art+=`<g opacity=".22">${moon(737,211,31)}</g>`;
  art+=`<g opacity=".13">${p('M0 164Q151 123 269 158Q385 116 474 166Q709 100 900 156V225Q742 197 591 214Q339 181 182 227Q65 203 0 221Z','#c4cbc1','none',0)}${p('M0 216Q150 187 284 223Q465 179 573 220Q740 176 900 213V261Q753 230 578 258Q399 225 249 267Q98 232 0 267Z','#aeb8b2','none',0)}</g>`;
  art+=`<g opacity=".13">${[0,1,2,3,4,5,6].map(i=>l(`M${37+i*44} ${254+i%3*8}l-17 66`,'#d4d8c5',1.4)).join('')}${[0,1,2,3,4].map(i=>l(`M${702+i*39} ${248+i%2*9}l-14 58`,'#d4d8c5',1.2)).join('')}</g>`;
 }else{
  art+=p('M713 182A30 30 0 1 0 725 229A26 26 0 0 1 713 182Z','#d6e2d4','none',0);
  art+=`<g opacity=".15">${p('M0 172Q141 83 301 139Q360 163 452 117Q567 53 683 122Q777 149 900 86V151Q749 229 648 179Q570 138 449 196Q344 241 260 184Q123 139 0 246Z','#b2d7cc','none',0)}${p('M0 206Q171 140 287 199Q398 254 523 168Q635 101 738 174Q812 205 900 155','none','#e0dfb8',3)}</g>`;
  art+=`<g opacity=".28">${l('M82 181L116 153 154 186 197 153','#a4d5d1',1)}${l('M716 262L754 226 803 245 836 217','#a4d5d1',1)}${[[82,181],[116,153],[154,186],[197,153],[716,262],[754,226],[803,245],[836,217]].map(([x,y])=>e(x,y,2,2,'#d0e5d1')).join('')}</g>`;
 }
 return `<g data-layer="sky-omens" data-motif="${motifs[age]}">${art}</g>`;
}
