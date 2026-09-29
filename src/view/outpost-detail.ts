import type {Side} from '../game/types.ts';
import {path as p,ellipse as e,rect as r,line as l} from './illustration-kit.ts';

export interface OutpostDetailSpec {marks:number;minX:number;maxX:number;maxY:number}
const SPECS:readonly OutpostDetailSpec[]=[
 {marks:9,minX:22,maxX:138,maxY:136},
 {marks:12,minX:24,maxX:136,maxY:137},
 {marks:13,minX:20,maxX:141,maxY:136},
 {marks:14,minX:23,maxX:137,maxY:138},
 {marks:12,minX:25,maxX:139,maxY:136},
 {marks:14,minX:24,maxX:140,maxY:137},
];
const ageOf=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
export function outpostDetailSpec(age:number):OutpostDetailSpec{return {...SPECS[ageOf(age)]};}
const colors=(side:Side)=>side==='enemy'?{accent:'#e58b76',bright:'#ffe0b2'}:{accent:'#71bdd1',bright:'#b6edf0'};
const stud=(x:number,y:number,fill:string)=>e(x,y,1.8,1.8,fill,'#344e53',.6);
const hinge=(x:number,y:number,flip=false)=>p(`M${x} ${y}h${flip?-12:12}l${flip?2:-2} 4h${flip?10:-10}Z`,'#52696a','#324b50',.8);
const bracket=(x:number,y:number,flip=false)=>l(`M${x} ${y}v11h${flip?-8:8}M${x} ${y+4}l${flip?-6:6} 7`,'#d2c29d',1.2);
const rope=(x:number,y:number)=>l(`M${x} ${y}q8 6 0 12q-8 6 0 12`,'#9f8967',1.4);

/** Micro-detail stays inside the existing 160×160 outpost silhouette. */
export function outpostDetailSvg(input:number,side:Side):string {
 const age=ageOf(input),{accent,bright}=colors(side);
 let body='';
 if(age===0){
  body+=l('M29 70l13-8M37 82l15-5M119 77l13 7M116 91l15 4','#776f5f',1.2);
  body+=l('M47 44l5 7M94 41l-4 8M126 111l9 7','#e0cda4',1);
  body+=rope(26,102)+stud(118,63,accent)+stud(128,68,bright);
  body+=p('M111 121l7-4 7 4-7 5Z',accent,'#344e53',.8);
 }else if(age===1){
  body+=bracket(32,77)+bracket(129,77,true)+hinge(60,113)+hinge(101,113,true);
  body+=r(26,116,12,15,3,'#9c805e','#40565a',.8)+e(32,116,6,2,'#ceb887','#40565a',.6);
  body+=r(122,115,11,16,3,'#8f775d','#40565a',.8)+e(127.5,115,5.5,2,'#c9b486','#40565a',.6);
  body+=l('M49 66v11M112 66v11','#ddc99f',1.1)+stud(77,67,accent)+stud(84,67,bright);
 }else if(age===2){
  body+=hinge(56,105)+hinge(105,105,true)+l('M24 111h18M119 110h18','#576f6d',1.6);
  body+=e(31,122,5,5,'none','#c4b38c',1.5)+l('M27 122q4-5 8 0q-4 5-8 0','#7e7664',1);
  body+=rope(135,96)+r(23,67,9,5,1,accent,'#344e53',.8)+r(128,67,9,5,1,accent,'#344e53',.8);
  body+=l('M69 57h22M75 61h11','#e4d1aa',1.2)+stud(81,57,bright);
 }else if(age===3){
  body+=bracket(27,50)+bracket(132,50,true)+stud(43,92,accent)+stud(116,92,accent);
  body+=l('M37 104l8 9M54 104l6 9M105 104l-6 9M122 104l-8 9','#c0b18e',1.1);
  body+=p('M29 118l8-5 7 5-7 5Z',bright,'#344e53',.7)+p('M116 118l7-5 8 5-8 5Z',bright,'#344e53',.7);
  body+=l('M48 128h16M96 128h16','#786c59',1.4)+stud(80,102,accent);
 }else if(age===4){
  body+=r(51,41,36,8,2,'#657c75','#364e53',.9)+l('M56 45h9M72 45h10','#b7c6a7',1.1);
  body+=l('M111 57l12 8M108 62l12 8','#596f6c',1.2)+e(124,70,3,3,accent,'#344e53',.8);
  body+=hinge(58,111)+hinge(105,111,true)+stud(34,106,bright)+stud(127,106,bright);
  body+=l('M26 124h22M114 124h22','#c8b78f',1.2)+r(74,76,13,5,1,accent,'#344e53',.7);
 }else{
  body+=l('M43 49h75M48 54h64','#a6d4ca',1.2)+stud(55,48,bright)+stud(80,48,accent)+stud(105,48,bright);
  body+=r(30,91,6,19,3,'#4f777e','#344e53',.8)+r(126,91,6,19,3,'#4f777e','#344e53',.8);
  body+=l('M33 96v9M129 96v9','#c6eee1',1)+p('M67 121l13-7 13 7-13 6Z',accent,'#344e53',.8);
  body+=l('M57 131h47','#8fc2b6',1.2)+l('M61 134h39','#d2eee4',.8)+stud(119,69,accent);
 }
 return `<g data-layer="outpost-detail" data-age="${age}">${body}</g>`;
}
