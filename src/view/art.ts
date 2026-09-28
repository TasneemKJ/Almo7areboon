import type Phaser from 'phaser';
import type { Side, UnitKind } from '../game/types';

type G = Phaser.GameObjects.Graphics;
const ink = 0x332d25;
const skin = 0xffdfab;

export function circle(g:G,x:number,y:number,r:number,color:number,stroke=ink,line=1.5):void {
  g.fillStyle(color,1); g.fillCircle(x,y,r);
  if(line){g.lineStyle(line,stroke,1);g.strokeCircle(x,y,r);}
}
export function ellipse(g:G,x:number,y:number,w:number,h:number,color:number,alpha=1):void {
  g.fillStyle(color,alpha);g.fillEllipse(x,y,w,h);
}
export function poly(g:G, points:number[],color:number,stroke=ink,line=1.5):void {
  g.fillStyle(color,1);g.lineStyle(line,stroke,1);g.beginPath();g.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)g.lineTo(points[i],points[i+1]);g.closePath();g.fillPath();if(line)g.strokePath();
}
export function line(g:G,points:number[],color=ink,width=2):void {
  g.lineStyle(width,color,1);g.beginPath();g.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)g.lineTo(points[i],points[i+1]);g.strokePath();
}
function rect(g:G,x:number,y:number,w:number,h:number,color:number,r=0,stroke=ink,lw=1.5):void {
  g.fillStyle(color,1);g.lineStyle(lw,stroke,1);if(r){g.fillRoundedRect(x,y,w,h,r);if(lw)g.strokeRoundedRect(x,y,w,h,r);}else{g.fillRect(x,y,w,h);if(lw)g.strokeRect(x,y,w,h);}
}

/** A small, original, outlined warrior. The rig is redrawn from one pose clock. */
export function drawTroop(g:G,age:number,kind:UnitKind,side:Side,clock:number,attacking:boolean,flash=false):void {
  g.clear();
  const accent=side==='player'?0x358bea:0xe85849;
  const uniform=[0xb78451,0xd8c9a0,0xe1b778,0x637bb2,0x6b8a55,0xd3e0e4][age%6];
  const gait=attacking?0:Math.sin(clock*11)*3.4;
  const swing=attacking?Math.sin(clock*17)*5:Math.sin(clock*6)*1.1;
  const heavy=kind===2;
  const rider=heavy&&(age===0||age===2);
  const offset=rider?-12:0;

  if(heavy){
    if(age===0){
      // Plump prehistoric mount, with a chunky tail and pale jaw.
      poly(g,[-17,-11,-31,-17,-28,-9,-13,-3],0x759941);
      ellipse(g,-2,-11,39,23,0x97b957);g.lineStyle(1.7,ink,1);g.strokeEllipse(-2,-11,39,23);
      poly(g,[8,-14,15,-28,25,-25,30,-15,26,-8,10,-6],0x97b957);
      ellipse(g,23,-12,14,8,0xd1d48b);circle(g,24,-22,1.6,ink,ink,0);
      line(g,[19,-7,28,-7],ink,1.4);
      for(let i=0;i<3;i++)poly(g,[-20+i*8,-20-i%2*3,-15+i*8,-26-i%2*3,-11+i*8,-20-i%2*3],0x668638,ink,1);
      line(g,[-11,-5,-13+gait,4,-8+gait,4],ink,5);line(g,[10,-5,11-gait,4,17-gait,4],ink,5);
      line(g,[-11,-6,-13+gait,2],0x89a74b,3);line(g,[10,-6,11-gait,2],0x89a74b,3);
    }else if(age===1){
      // The Scythe is a large foot soldier; it has no mount.
    }else if(age===2){
      // A Spartan rider on a horse, with no chariot or wheels.
      ellipse(g,0,-10,34,18,0xaf9372);g.lineStyle(1.7,ink,1);g.strokeEllipse(0,-10,34,18);
      poly(g,[9,-12,13,-29,23,-29,28,-22,21,-17,17,-9],0xaf9372);
      poly(g,[13,-28,12,-33,16,-31,18,-34,20,-29],0x625248);
      line(g,[-14,-10,-23,-7,-23,-15],0x625248,3);circle(g,23,-26,1.4,ink,ink,0);
      line(g,[-11,-5,-14+gait,5],ink,3);line(g,[11,-5,13-gait,5],ink,3);
      rect(g,-9,-19,19,11,accent,1);line(g,[18,-20,2,-19],0x49382c,1);
    }else if(age===3){
      // A wheeled field cannon and its little artilleryman.
      line(g,[-23,-8,6,-15,18,-6],0x77573a,4);
      poly(g,[-12,-26,31,-29,34,-20,-10,-16],0x58625b);
      ellipse(g,33,-24,5,10,0x333c38);line(g,[-8,-23,29,-26],0x879088,2);
      for(const x of [-9,14]){circle(g,x,-5,9,0x957348);circle(g,x,-5,3,0x4f4b3d);for(let i=0;i<4;i++){const a=(attacking?0:clock*.7)+i*Math.PI/2;line(g,[x-Math.cos(a)*7,-5-Math.sin(a)*7,x+Math.cos(a)*7,-5+Math.sin(a)*7],0x534b39,1.2);}}
      rect(g,-31,-25,12,16,accent,2);circle(g,-25,-35,9,skin);poly(g,[-35,-40,-32,-48,-24,-44,-17,-48,-14,-40],0x41484c);
      line(g,[-23,-36,-23,-32],ink,1.5);line(g,[-19,-36,-19,-32],ink,1.5);
      line(g,[-30,-10,-31,2,-26,2],ink,2.6);line(g,[-22,-10,-20,2,-16,2],ink,2.6);
      line(g,[-21,-23,-13,-17],skin,3);return;
    }else if(age===4){
      rect(g,-25,-14,51,17,0x495c38,7);rect(g,-21,-12,43,13,0x29392b,5);
      for(let x=-16;x<=17;x+=11)circle(g,x,-5,4,0x92916c,ink,1.2);
      poly(g,[-26,-16,-15,-28,13,-28,25,-15],0x849458);rect(g,-12,-35,25,12,0x96a56a,4);
      rect(g,9,-31,30,5,0x647749,0);rect(g,-22,-21,45,6,0xa5b67c,2,ink,0);
      rect(g,-9,-24,11,4,accent,1,ink,0);circle(g,-1,-34,4,0x697b4b,ink,1.3);
      return;
    }else{
      const hover=-14+Math.sin(clock*3)*2;
      ellipse(g,0,hover+7,37,9,0x97e7ef,.32);
      ellipse(g,0,hover+5,24,6,0xc4ffff,.75);
      ellipse(g,0,hover-8,27,26,0xaad7e3);g.lineStyle(1.5,ink,1);g.strokeEllipse(0,hover-8,27,26);
      ellipse(g,-4,hover-13,12,10,0xe5faff,.8);
      ellipse(g,0,hover,60,18,flash?0xffffff:0xabbac5);g.lineStyle(1.5,ink,1);g.strokeEllipse(0,hover,60,18);
      ellipse(g,0,hover-3,56,9,0xd9e4e7);line(g,[-25,hover+1,25,hover+1],0x6b8190,1.4);
      for(const x of [-18,-6,6,18])circle(g,x,hover+2,2,accent,ink,.8);
      rect(g,22,hover-2,12,4,0x6d8b9a,1);circle(g,33,hover,2,0xc5fdff,ink,.7);
      return;
    }
  }

  const y=offset;
  const body=flash?0xffffff:uniform;
  // Legs, torso and broad friendly round head.
  if(!rider){line(g,[-4,y-10,-5-gait,y-1,-1-gait,y],ink,3);line(g,[4,y-10,5+gait,y-1,9+gait,y],ink,3);}
  else{line(g,[-3,y-10,-7,y-1,-2,y],ink,3);line(g,[4,y-10,7,y-2,11,y-2],ink,2.5);}
  poly(g,[-7,y-24,6,y-24,9,y-10,-7,y-10],body,ink,1.4);
  if(age===0){poly(g,[-7,y-23,0,y-22,5,y-10,0,y-10,-4,y-16],0xc69761,ink,0);poly(g,[-7,y-10,-3,y-13,0,y-10,4,y-13,9,y-10],body,ink,1);circle(g,-2,y-18,1,0x694728,ink,0);circle(g,4,y-14,1.3,0x694728,ink,0);}
  else{rect(g,-6,y-15,13,3,age===2?0x9c6040:0x65503e,0,ink,0);}
  line(g,[-5,y-22,-11,y-16+gait*.5,-8,y-11+gait*.5],skin,4);line(g,[-5,y-22,-11,y-16+gait*.5],ink,1.2);
  circle(g,0,y-33,10.7,flash?0xffffff:skin,ink,1.4);
  ellipse(g,-3,y-37,11,7,0xffe9c3,.66);
  // Both tiny vertical eyes remain readable at phone size.
  line(g,[3,y-35,3,y-31],ink,1.7);line(g,[7,y-35,7,y-31],ink,1.7);
  if(age===0){poly(g,[-10,y-37,-6,y-43,0,y-42,4,y-43,7,y-40,-1,y-40,-4,y-36],0x725132,ink,1.2);line(g,[-8,y-40,8,y-40],accent,2.5);}
  if(age===1){ellipse(g,-1,y-41,28,5,0xd9b36b);poly(g,[-8,y-42,-5,y-49,5,y-49,9,y-42],0xe9c47c);line(g,[-7,y-42,7,y-42],accent,2);}
  if(age===2){poly(g,[-11,y-34,-11,y-41,-6,y-46,5,y-46,10,y-41,10,y-38,-2,y-38,-3,y-28,-8,y-30],0xe2bd66);poly(g,[-7,y-47,-6,y-51,5,y-51,10,y-45],accent);line(g,[-9,y-40,8,y-40],0xf9de8d,2);}
  if(age===3){poly(g,[-12,y-41,-10,y-48,0,y-44,10,y-49,13,y-42,8,y-39,-7,y-39],0x41484c);rect(g,-4,y-43,8,3,accent,0,ink,0);poly(g,[-8,y-46,-10,y-56,-5,y-53,-5,y-46],0xf0e7ca,ink,.8);}
  if(age===4){poly(g,[-12,y-37,-11,y-44,-7,y-48,5,y-48,11,y-44,12,y-37],0x6c8952);line(g,[-12,y-37,12,y-37],0x405332,2);rect(g,-8,y-43,6,3,0x8d9f68,1,ink,0);}
  if(age===5){
    poly(g,[-12,y-30,-12,y-40,-8,y-47,4,y-48,11,y-43,12,y-37,8,y-38,6,y-42,-6,y-42,-8,y-36,-7,y-29],0xe2eced);
    line(g,[-8,y-40,7,y-40],0x8edee9,2);circle(g,-9,y-33,3,accent,ink,1);
    line(g,[-7,y-25,7,y-25],0x8ad7e5,2);rect(g,-4,y-21,8,4,accent,1,ink,.5);
  }
  const handY=y-19+(attacking?-swing:0);
  line(g,[6,y-22,12,handY,16,handY],ink,4.7);line(g,[6,y-22,12,handY,16,handY],skin,2.8);
  if(kind===1){
    if(age===0){poly(g,[13,handY-2,14,handY-9,20,handY-12,25,handY-7,23,handY-1],0xa8aaa0);poly(g,[14,handY-9,20,handY-12,23,handY-8,18,handY-6],0xc6c7b8,ink,0);}
    else if(age===1){line(g,[18,handY+3,19,handY-6,14,handY-13],0x795434,2.6);line(g,[19,handY-6,25,handY-13],0x795434,2.6);line(g,[14,handY-13,19-(attacking?swing:0),handY-9,25,handY-13],0xdacda2,1.2);circle(g,19-(attacking?swing:0),handY-9,2,0xa5a899,ink,.7);}
    else if(age===2){line(g,[20,handY-16,26,handY-11,29,handY,26,handY+11,20,handY+16],0x885b32,2.2);line(g,[20,handY-16,20,handY+16],0xf4eddd,1);line(g,[13,handY,34,handY],ink,1);poly(g,[34,handY,29,handY-2,29,handY+2],0xdadcd2,ink,.6);}
    else if(age===3){line(g,[10,handY+2,25,handY],0x825935,4);line(g,[21,handY,39,handY],0x59605a,2.8);rect(g,17,handY-3,4,3,0xa4aca2,0,ink,.5);}
    else if(age===4){line(g,[10,handY,36,handY],ink,4);line(g,[14,handY+1,24,handY+1],0x6e7953,2.5);rect(g,22,handY-5,7,3,0x414b49,1);}
    else{rect(g,12,handY-4,22,8,0x728a9d,2);rect(g,19,handY-3,11,3,0x98e8f0,1,ink,0);line(g,[33,handY,40,handY],0xd9f7f8,3);line(g,[34,handY,40,handY],accent,1.3);}
  }else if(age===0){
    if(heavy){line(g,[7,handY+9,25+swing,handY-22],0x765537,2.2);poly(g,[22+swing,handY-22,30+swing,handY-30,28+swing,handY-19],0xb7c0be);}
    else{line(g,[16,handY+4,18+swing,handY-12],0x745236,4);ellipse(g,19+swing,handY-15,9,15,0x8b633d);g.lineStyle(1.3,ink,1);g.strokeEllipse(19+swing,handY-15,9,15);line(g,[18+swing,handY-18,19+swing,handY-12],0xa67a4a,1.2);}
  }else if(age===1){
    line(g,[16,handY+10,20+swing,handY-25],0x85623d,2.6);
    if(heavy){poly(g,[20+swing,handY-24,13+swing,handY-32,1+swing,handY-31,-8+swing,handY-26,3+swing,handY-28,12+swing,handY-27,20+swing,handY-18],0xc7d0c4);line(g,[12,handY-3,20,handY-4],0x85623d,2.2);}
    else{line(g,[15+swing,handY-25,25+swing,handY-25],0xabb3a6,2);for(const dx of [15,20,25])line(g,[dx+swing,handY-25,dx+swing,handY-34],0xabb3a6,1.8);}
  }
  else if(age===2&&heavy){line(g,[8,handY+10,26+swing,handY-22],0x765537,2.2);poly(g,[23+swing,handY-22,31+swing,handY-30,29+swing,handY-19],0xc2cac1);circle(g,-7,y-17,7,0xd4ab62);circle(g,-7,y-17,2,0xf0d68d,ink,.7);}
  else if(age===2||age===3){line(g,[15,handY+5,17+swing,handY-17],0xd8dce0,3);poly(g,[15+swing,handY-17,19+swing,handY-22,20+swing,handY-15],0xd8dce0);line(g,[11,handY+1,21,handY+1],0xb9a161,2.5);circle(g,-7,y-17,7,age===2?0xd4ab62:accent);circle(g,-7,y-17,2,age===2?0xf0d68d:0xb9d9ed,ink,.7);}
  else if(age===4){line(g,[11,handY+1,31,handY-1],ink,4);line(g,[12,handY+1,20,handY],0x67784d,2);line(g,[30,handY-1,35,handY-1],0x626c66,2);}
  else{line(g,[16,handY+6,18+swing,handY-1],0x577285,4);line(g,[18+swing,handY-3,20+swing,handY-26],accent,6);line(g,[18+swing,handY-3,20+swing,handY-26],0xd7fdff,2.6);line(g,[12,handY+1,23,handY+1],0x7896a7,2);}
}

/** Data URI portraits share the battlefield's visual language without external assets. */
export function unitPortrait(age:number,kind:UnitKind):string {
  const body=['#b78451','#ded0a3','#e0b86b','#6884b7','#749158','#d3e0e4'][age%6];
  const hat=[
    '<path d="M27 25l4-8 12-3 11 5-9 3-8-1-3 5" fill="#795635"/><path d="M29 20h25" stroke="#4b9ff9" stroke-width="4"/>',
    '<path d="M26 19l7-12h17l6 12" fill="#e8c076"/><ellipse cx="41" cy="20" rx="23" ry="4" fill="#dab576"/>',
    '<path d="M25 31V18l10-8h14l9 10v6H42v16l-8-5V26" fill="#d6ae54"/><path d="M31 11V4h20l7 12" fill="#529af0"/>',
    '<path d="M21 21l4-13 15 7L57 7l6 15-12 6H32z" fill="#454b54"/><path d="M36 19h12" stroke="#61aaff" stroke-width="4"/><path d="M29 15L25 2l8 4 2 11" fill="#ede4cc"/>',
    '<path d="M24 25V16L32 8h17l10 9v10z" fill="#72904f"/><path d="M22 26h40" stroke="#465b35" stroke-width="4"/>',
    '<path d="M23 35V18L32 7h20l10 13v8l-8-2-5-10H32l-3 21z" fill="#e0eaed"/><path d="M28 20h26" stroke="#8ddeed" stroke-width="4"/><circle cx="25" cy="32" r="5" fill="#539ded"/>'
  ][age%6];
  const spear='<path d="M57 70l19-48" stroke="#755437" stroke-width="4"/><path d="M72 27l9-15-1 17" fill="#c7ccbf"/>';
  const sword='<path d="M65 64V28l4-9 4 9v29" fill="#dae1df"/><path d="M60 55h17" stroke="#796139" stroke-width="4"/>';
  const ranged=[
    '<path d="M61 53l-2-9 6-7 9 2 5 8-5 7z" fill="#a8aaa0"/><path d="M60 44l5-7 9 2-8 8z" fill="#c7c8b9" stroke="none"/>',
    '<path d="M68 65V44l-9-12m9 12 10-12" fill="none" stroke="#855c35" stroke-width="5"/><path d="M59 32l8 7 11-7" fill="none" stroke="#e2d6af" stroke-width="2"/><circle cx="67" cy="39" r="3" fill="#aeb1a3"/>',
    '<path d="M66 30q23 18 0 39M66 30v39" fill="none" stroke="#805835" stroke-width="3"/><path d="M55 49h30" stroke="#493a2b" stroke-width="2"/><path d="M85 49l-6-3v6z" fill="#d9dfd1"/>',
    '<path d="M56 54l17-3" stroke="#805630" stroke-width="7"/><path d="M70 50h21" stroke="#5d645b" stroke-width="4"/><path d="M65 47v-3h6" fill="none" stroke="#6a6a59" stroke-width="2"/>',
    '<path d="M55 51h33" stroke="#38453e" stroke-width="6"/><path d="M60 53h11" stroke="#738252" stroke-width="4"/><path d="M71 46h10" stroke="#38453e" stroke-width="4"/>',
    '<rect x="57" y="43" width="27" height="12" rx="3" fill="#7e94a8"/><path d="M64 47h14" stroke="#91eaf2" stroke-width="3"/><path d="M83 49h9" stroke="#5bbffa" stroke-width="4"/>'
  ][age%6];
  const melee=[
    kind===2?spear:'<path d="M62 60l5-23" stroke="#7a5736" stroke-width="6"/><ellipse cx="68" cy="32" rx="7" ry="13" fill="#997144"/>',
    kind===2?'<path d="M66 74l4-48" stroke="#85603a" stroke-width="4"/><path d="M70 27l-9-13-17-1-15 7 17-3 13 5 10 14z" fill="#cbd3c5"/>':'<path d="M69 74V34" stroke="#85603a" stroke-width="4"/><path d="M60 18v16h18V18m-9 0v16" fill="none" stroke="#b7c2ac" stroke-width="3"/>',
    kind===2?spear:sword,
    sword,
    '<path d="M57 52h30" stroke="#38453e" stroke-width="5"/><path d="M62 53h10" stroke="#758455" stroke-width="3"/>',
    '<path d="M66 66l2-12" stroke="#668499" stroke-width="6"/><path d="M68 52l3-30" stroke="#5cb7ff" stroke-width="8"/><path d="M68 52l3-30" stroke="#d8fcff" stroke-width="3"/><path d="M61 55h15" stroke="#668499" stroke-width="4"/>'
  ][age%6];
  const weapon=kind===1?ranged:melee;
  const mounted=kind===2&&(age===0||age===2);
  const mount=mounted?age===0?'<path d="M22 68L3 51l8 22 21 2" fill="#91b653"/><ellipse cx="42" cy="65" rx="29" ry="13" fill="#a8c465"/><path d="M62 66l3-25 14 1 6 16-15 8" fill="#a8c465"/><circle cx="76" cy="48" r="2" fill="#332d25"/><path d="M23 73v7h8m25-7v7h8" stroke="#668640" stroke-width="5"/>':'<ellipse cx="42" cy="64" rx="27" ry="12" fill="#bdaa8c"/><path d="M60 65l4-26h12l8 14-15 11" fill="#bdaa8c"/><path d="M65 41l-2-10 7 7 7-7-1 12" fill="#635347"/><circle cx="76" cy="47" r="2" fill="#332d25"/><path d="M20 68l-3-17m12 20-3 10m29-10 3 10" stroke="#635347" stroke-width="4"/>':'';
  const human=kind===2&&age>=3?'':`<g transform="${mounted?'translate(5,-6) scale(.85)':kind===2?'translate(-4,-4) scale(1.08)':''}"><path d="M34 60l-3 15h8M48 60l4 15h8" fill="none" stroke="#332d25" stroke-width="4"/><path d="M30 43h22l6 24H28z" fill="${body}"/><path d="M30 47l-9 10 5 7M53 46l8 11 7-3" fill="none" stroke="#ffdbac" stroke-width="6"/><circle cx="41" cy="31" r="17" fill="#ffe0af"/><path d="M46 28v6m7-6v6" stroke="#332d25" stroke-width="2.6"/>${hat}${weapon}</g>`;
  const cannon='<path d="M14 64l45-12 17 14" fill="none" stroke="#805f3c" stroke-width="8"/><path d="M20 41l59-8 4 17-61 8z" fill="#667469"/><ellipse cx="82" cy="41" rx="5" ry="9" fill="#303a34"/><path d="M29 43l44-6" stroke="#95a392" stroke-width="3"/><g fill="#ab8654"><circle cx="29" cy="66" r="14"/><circle cx="66" cy="66" r="14"/></g><g stroke="#594c37" stroke-width="3"><path d="M17 66h24m-12-12v24M54 66h24M66 54v24"/></g>';
  const tank='<rect x="9" y="48" width="70" height="27" rx="10" fill="#596b42"/><path d="M16 51l11-18h33l14 18" fill="#9bae72"/><rect x="28" y="22" width="33" height="17" rx="5" fill="#95a868"/><path d="M48 31h38" stroke="#657b45" stroke-width="8"/><g fill="#303e2c"><circle cx="23" cy="68" r="7"/><circle cx="43" cy="68" r="7"/><circle cx="64" cy="68" r="7"/></g><path d="M21 47h46" stroke="#b4c48c" stroke-width="4"/>';
  const spaceship='<ellipse cx="47" cy="74" rx="26" ry="6" fill="#b4f6fc" stroke="none"/><ellipse cx="47" cy="39" rx="21" ry="23" fill="#a8dbe6"/><ellipse cx="41" cy="29" rx="10" ry="9" fill="#e0fbff" stroke="none"/><ellipse cx="47" cy="55" rx="39" ry="15" fill="#a8bac9"/><ellipse cx="47" cy="49" rx="36" ry="8" fill="#dce8eb"/><path d="M13 56h68" stroke="#698497"/><g fill="#5aa9f8"><circle cx="24" cy="59" r="3"/><circle cx="40" cy="61" r="3"/><circle cx="56" cy="61" r="3"/><circle cx="72" cy="59" r="3"/></g>';
  const vehicle=kind===2&&age>=3?[cannon,tank,spaceship][age-3]:mount+human;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="88" viewBox="0 0 96 88"><ellipse cx="47" cy="78" rx="29" ry="5" fill="#247cc4" opacity=".25"/><g stroke="#332d25" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${vehicle}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function drawBase(g:G,age:number,side:Side):void {
  const accent=side==='player'?0x4599ee:0xea6151;
  g.clear();ellipse(g,0,5,74,22,0x566c37,.18);
  if(age===0){
    poly(g,[-35,3,-33,-23,-24,-43,-10,-55,8,-56,25,-41,34,-19,37,3],0xa8a38a,0x655f51,2);
    poly(g,[-33,-22,-24,-43,-9,-53,0,-36,-14,-14,-18,3,-34,3],0xbdb89c,0x8c8671,1.2);
    poly(g,[-9,-53,9,-54,25,-40,18,-26,0,-36],0xcbbea0,0x8c8671,1.2);
    poly(g,[18,-27,27,-40,34,-19,36,3,21,3,17,-12],0x8e8d78,0x746e5d,1);
    poly(g,[-17,3,-17,-17,-11,-30,0,-36,12,-30,20,-15,22,3],0x4e4636,0x5c5140,1.7);
    poly(g,[-11,3,-11,-16,-6,-26,4,-30,12,-23,18,-12,20,3],0x39392b,0x39392b,0);
    line(g,[-24,-39,-18,-29,-23,-19],0xd7ccb0,1.3);line(g,[7,-48,15,-41,9,-38],0xe0d2b5,1.3);
    line(g,[-32,2,32,2],0x777450,2);
  }else if(age===1){
    rect(g,-29,-40,57,44,0xcabc84,2,0x756345,2);poly(g,[-39,-35,0,-68,39,-34],0xd4b36e,0x766345,2);
    for(let i=-28;i<32;i+=7)line(g,[i,-37,i*.18,-60],0xb28c4d,1.3);
    rect(g,-10,-25,20,29,0x514532,3);rect(g,-26,-19,10,11,0x756c4c,0);line(g,[-29,1,28,1],0x766345,3);
  }else if(age===2){
    rect(g,-33,-36,66,40,0xcac5ad,0,0x776b54,1.6);poly(g,[-39,-42,0,-63,38,-42],0xddd9bc,0x776b54,1.7);
    rect(g,-40,-42,80,7,0xeee6c9,1);rect(g,-37,-2,74,7,0xdad5bc,1);
    for(const x of [-28,-12,10,26]){rect(g,x-4,-34,8,31,0xeee7cd,1);line(g,[x-1,-30,x-1,-7],0xc9bfa3,1);}
    rect(g,-5,-30,13,28,0x5c5a49,1);circle(g,0,-49,4,accent,0x8e866c,1);
  }else if(age===3){
    // Renaissance fortified residence, with a pitched roof and corner tower.
    rect(g,-34,-41,68,45,0xc4ab82,1,0x6f634c,1.8);poly(g,[-39,-40,-24,-53,25,-53,38,-40],0x77716a);
    rect(g,-28,-64,15,22,0xd0b78d,0);poly(g,[-32,-64,-21,-73,-10,-64],0x726b60);
    rect(g,-10,-23,21,28,0x534939,7);rect(g,19,-29,9,11,0x494b42,1);rect(g,-26,-28,9,12,0x494b42,1);
    line(g,[-34,-6,-10,-6],0x9d8767,2);line(g,[12,-6,34,-6],0x9d8767,2);
  }else if(age===4){
    poly(g,[-37,4,-31,-32,-14,-46,18,-46,33,-31,38,4],0x9da58c,0x5d6652,1.8);
    poly(g,[-30,-30,-14,-45,18,-45,30,-30],0xb6bba2,0x69725e,1);
    rect(g,-27,-24,54,12,0x414d3a,3);line(g,[-22,-19,22,-19],0x303a2c,4);rect(g,-11,-8,22,12,0x647357,2);
    for(const x of [-30,-15,0,15,30])rect(g,x-7,-1,15,8,0xabaf8c,3,0x747c60,1);
    rect(g,-23,-35,11,4,accent,1,ink,0);
  }else{
    // A compact future station retains the readable central base doorway.
    ellipse(g,0,2,78,15,0x78938a,.35);
    poly(g,[-38,3,-32,-36,-18,-50,17,-50,32,-36,38,3],0xb5c6c9,0x5e7880,1.8);
    poly(g,[-32,-36,-17,-50,17,-50,32,-36],0xe0ebea,0x789298,1.2);
    rect(g,-26,-35,52,32,0xd9e5e4,5,0x718b94,1.3);
    rect(g,-11,-28,22,32,0x36566b,8,0x66818b,1.4);
    line(g,[-9,0,-9,-20,-5,-25,5,-25,9,-20,9,0],0x8fe9ed,1.8);
    for(const x of [-25,23])rect(g,x,-26,4,18,accent,1,0x556f79,.8);
    rect(g,-33,-5,66,9,0x99b3ba,2,0x667d84,1);
    line(g,[-15,-53,-15,-66],0x708b93,1.5);circle(g,-15,-66,3,accent,0x546f7b,1);
    ellipse(g,9,-51,22,5,0xc5e5e5);line(g,[9,-52,9,-62,15,-64],0x7e9b9f,1.5);
    rect(g,-25,-42,49,3,0x91dce3,1,ink,0);
  }
}
