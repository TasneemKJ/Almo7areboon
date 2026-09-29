import {path as p,ellipse as e,rect as r,line as l} from './illustration-kit.ts';
const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const group=(depth:'far'|'mid',weight:number,y:number,body:string)=>`<g data-depth="${depth}" data-weight="${weight}" data-y="${y}">${body}</g>`;
const farHouse=(x:number,y:number,s:number,lit:boolean)=>`<g transform="translate(${x} ${y}) scale(${s})">${r(-18,-28,36,28,1,'#6f8581','#37545b',.7)}${p('M-20-28L-9-38 20-33 18-28Z','#87978a','none',0)}${r(-4,-14,8,14,3,'#355663','none',0)}${lit?e(9,-17,2.4,3.5,'#d8b174'):''}</g>`;
const cypress=(x:number,y:number,s:number)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M0-55Q-17-29-9-2Q0 7 9-2Q17-28 0-55Z','#2d5052','none',0)}${l('M0-47V4','#6f7464',1)}</g>`;
const banner=(x:number,y:number,s:number,color:string)=>`<g transform="translate(${x} ${y}) scale(${s})">${l('M0 14V-26','#35505a',1.4)}${p('M1-25L20-21 16-10 1-13Z',color,'#35505a',.7)}</g>`;
const torch=(x:number,y:number,s:number)=>`<g transform="translate(${x} ${y}) scale(${s})">${l('M0 9V-1','#5b4b3f',1.3)}${e(0,-4,5,8,'#c88a55')}${e(0,-5,2.4,4.5,'#f1ca82')}</g>`;
const boat=(x:number,y:number,s:number)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M-28 0Q0 12 28 0L19 11-18 11Z','#596d6b','#344e55',1)}${l('M0-3V-34','#7b7763',1.4)}${p('M1-31Q21-24 23-9L2-13Z','#aab8a3','#506c70',.7)}</g>`;
const haze=(x:number,y:number,w:number)=>`<g opacity=".13">${e(x,y,w,7,'#d7d7be')}${e(x+w*.18,y+7,w*.72,4,'#b6c6bd')}</g>`;

export function cinematicDepthSvg(input:number):string {
 const age=validAge(input),blue='#5c8292',coral='#ad7869';
 let far='',mid='';
 // Far field: small, low-contrast repeated forms. Three groups minimum by contract.
 far+=group('far',1.2,364,haze(220+age*17,324+age%2*9,170)+haze(650-age*13,353,135));
 let houses='';for(let i=0;i<7;i++){const x=72+i*122+(age%2)*22,y=390-(i%3)*14+(age%3)*5;houses+=farHouse(x,y,.36+(i%2)*.05,(i+age)%3===1);}far+=group('far',1.5,390,houses);
 let trees='';for(let i=0;i<9;i++)trees+=cypress(42+i*102+(age%2)*18,425-(i%2)*13,.31+(i%3)*.04);far+=group('far',1.7,425,trees);
 // Chapter-specific far silhouette rhythm.
 if(age===2)far+=group('far',1.9,448,boat(145,448,.42)+boat(770,438,.34)+l('M70 454Q268 443 391 452M602 448Q742 440 858 450','#7fa4a0',1));
 else if(age===5)far+=group('far',1.9,432,p('M83 432L96 392 109 432ZM742 435L758 385 775 435Z','#5d7d85','none',0)+l('M96 397v34M758 391v42','#a3c9c0',1));
 else far+=group('far',1.9,438,l('M94 438Q237 420 355 433M554 431Q704 414 826 434','#7d948a',1.2));
 // Mid field: stronger accents guide the eye toward inhabited focal areas without entering y>590.
 mid+=group('mid',3.2,486,banner(246+age*8,486,.52,blue)+banner(655-age*6,479,.5,coral));
 mid+=group('mid',3.6,510,cypress(208,510,.52)+cypress(708,508,.56));
 mid+=group('mid',4.1,535,torch(319,535,.58)+torch(581,531,.58));
 mid+=group('mid',4.8,552,l('M340 552Q449 535 558 552','#c9b995',2)+e(449,547,3.5,2,'#dcb575'));
 mid+=group('mid',4.9,568,torch(394,568,.38)+torch(449,562,.34)+torch(508,567,.38));
 if(age===0)mid+=group('mid',5.2,564,p('M376 565l19-13 28 2 18 10Z','#8d7a62','#3f5958',1)+pottery(622,553));
 else if(age===1)mid+=group('mid',5.2,560,oliveRow(350,559)+oliveRow(573,553));
 else if(age===2)mid+=group('mid',5.2,558,boat(341,552,.34)+boat(675,548,.28));
 else if(age===3)mid+=group('mid',5.2,558,awning(347,540,74,blue)+pottery(604,551));
 else if(age===4)mid+=group('mid',5.2,557,l('M349 556l39-16 39 15M562 553l33-13 33 12','#a0aa8d',2)+pottery(673,550));
 else mid+=group('mid',5.2,553,p('M376 553l17-20 16 20-16 20ZM512 553l17-20 16 20-16 20Z','#78a6a2','#3d616a',1)+e(393,548,2.5,2.5,'#d6fff1')+e(529,548,2.5,2.5,'#d6fff1'));
 return `<g data-design-layer="atmospheric-perspective" data-principle="detail-falloff">${far}${mid}</g>`;
}
function pottery(x:number,y:number){return `<g transform="translate(${x} ${y})">${p('M-8-7Q0-11 8-7L6 8Q0 13-6 8Z','#98745b','#3e5657',1)}${e(0,-7,8,2,'#c09a72')}</g>`;}
function oliveRow(x:number,y:number){return `<g transform="translate(${x} ${y})">${l('M0 0V-24','#696d5d',2)}${e(-9,-27,15,6,'#748d73')}${e(8,-30,17,7,'#879778')}${e(0,-38,14,7,'#6b8470')}</g>`;}
function awning(x:number,y:number,w:number,color:string){return p(`M${x} ${y}Q${x+w/2} ${y-10} ${x+w} ${y}L${x+w-5} ${y+14}Q${x+w/2} ${y+7} ${x+5} ${y+14}Z`,color,'#365057',1);}
