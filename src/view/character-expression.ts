import {ellipse as e,line as l,path as p,INK} from './illustration-kit.ts';

export type ExpressionIntent='ready'|'stride-a'|'stride-b'|'stride-c'|'anticipate'|'follow-through';
export type MouthShape='calm'|'focused'|'set'|'open';
export interface CharacterExpression {
  intent:ExpressionIntent;
  gazeX:number;
  gazeY:number;
  eyeOpen:number;
  browTilt:number;
  mouth:MouthShape;
}

const validKind=(kind:number)=>Number.isInteger(kind)&&kind>=0&&kind<3?kind:0;
const validFrame=(frame:number)=>Number.isInteger(frame)&&frame>=0&&frame<6?frame:0;
const intents:ExpressionIntent[]=['ready','stride-a','stride-b','stride-c','anticipate','follow-through'];

const bases=[
 {gazeX:.18,gazeY:0,eyeOpen:.98,browTilt:.68},
 {gazeX:.48,gazeY:-.02,eyeOpen:.94,browTilt:.32},
 {gazeX:.12,gazeY:.02,eyeOpen:.84,browTilt:.82},
] as const;
const movement=[
 {x:0,y:0,open:0,brow:0},
 {x:.10,y:-.04,open:-.03,brow:.16},
 {x:-.06,y:.03,open:.02,brow:-.08},
 {x:.14,y:0,open:-.02,brow:.12},
] as const;

export function characterExpression(inputKind:number,inputFrame:number):CharacterExpression {
 const kind=validKind(inputKind),frame=validFrame(inputFrame),base=bases[kind];
 if(frame<4){
  const mod=movement[frame];
  return {intent:intents[frame],gazeX:base.gazeX+mod.x,gazeY:base.gazeY+mod.y,eyeOpen:base.eyeOpen+mod.open,browTilt:base.browTilt+mod.brow,mouth:kind===1?'focused':'calm'};
 }
 if(frame===4){
  if(kind===0)return {intent:'anticipate',gazeX:.46,gazeY:-.10,eyeOpen:.90,browTilt:1.85,mouth:'set'};
  if(kind===1)return {intent:'anticipate',gazeX:1.08,gazeY:-.08,eyeOpen:1.02,browTilt:.78,mouth:'focused'};
  return {intent:'anticipate',gazeX:.28,gazeY:-.06,eyeOpen:.80,browTilt:1.42,mouth:'set'};
 }
 if(kind===0)return {intent:'follow-through',gazeX:.08,gazeY:.10,eyeOpen:.80,browTilt:1.05,mouth:'open'};
 if(kind===1)return {intent:'follow-through',gazeX:.62,gazeY:.06,eyeOpen:.86,browTilt:.44,mouth:'focused'};
 return {intent:'follow-through',gazeX:.02,gazeY:.08,eyeOpen:.76,browTilt:1.12,mouth:'set'};
}

function mouthSvg(shape:MouthShape):string {
 if(shape==='focused')return l('M65 65L74 64',INK,1.25);
 if(shape==='set')return l('M64 65L75 65',INK,1.35);
 if(shape==='open')return e(69.5,65,4.6,1.7,'#684a42',INK,.8)+l('M66 64.5Q70 66 73.5 64.5','#e7b394',.6);
 return l('M64 64Q70 67 75 64',INK,1.2);
}

/** Face-only details: the existing head silhouette and skin geometry remain untouched. */
export function characterExpressionSvg(inputKind:number,inputFrame:number,skin:string):string {
 const kind=validKind(inputKind),frame=validFrame(inputFrame),pose=characterExpression(kind,frame);
 const leftOpen=3.35*pose.eyeOpen,rightOpen=3.02*pose.eyeOpen;
 const leftHighlightX=62.7+pose.gazeX,rightHighlightX=76.6+pose.gazeX*.82;
 const highlightY=49.8+pose.gazeY;
 const browY=pose.browTilt;
 let body=e(62,51,2.5,leftOpen,INK)+e(76,51,2.2,rightOpen,INK);
 body+=e(leftHighlightX,highlightY,.8,.95,'#fffdf3')+e(rightHighlightX,highlightY+.15,.7,.86,'#fffdf3');
 // A faint lower-lid mark keeps attack squints readable without changing the eye silhouette.
 body+=p(`M59.5 ${53.7-pose.eyeOpen*.35}Q62 ${54.1-pose.eyeOpen*.28} 64.5 ${53.6-pose.eyeOpen*.35}`,'none',skin,.55);
 body+=l(`M59 ${42+browY*.35}L66 ${41-browY*.45}M74 ${41-browY*.25}L79 ${42+browY*.42}`,INK,2.05);
 body+=mouthSvg(pose.mouth);
 return `<g data-expression-frame="${frame}" data-expression-role="${kind}" data-expression-intent="${pose.intent}">${body}</g>`;
}
