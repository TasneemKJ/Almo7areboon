import type {Side,UnitKind} from '../game/types.ts';

export type ImpactMaterial='earth'|'bronze'|'powder'|'steel'|'energy';
export type ImpactMarkKind='flash'|'dust'|'spark'|'shard'|'smoke'|'pulse';
export interface ImpactMark {
 kind:ImpactMarkKind;
 x:number;
 y:number;
 size:number;
 alpha:number;
 color:number;
 angle:number;
}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const validAge=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const validKind=(kind:number)=>(Number.isInteger(kind)&&kind>=0&&kind<3?kind:0) as UnitKind;

export function impactMaterial(age:number,_kind:number):ImpactMaterial {
 const actualAge=validAge(age);
 if(actualAge<=1)return 'earth';
 if(actualAge===2)return 'bronze';
 if(actualAge===3)return 'powder';
 if(actualAge===4)return 'steel';
 return 'energy';
}

/**
 * Contact -> breakup -> dissipation in a tiny local envelope. This is view-only;
 * damage, targeting and collision have already resolved before this model runs.
 */
export function impactMaterialFrame(age:number,kind:number,side:Side,progress:number,reduced:boolean):ImpactMark[] {
 const actualAge=validAge(age),actualKind=validKind(kind),family=impactMaterial(actualAge,actualKind);
 const sign=side==='player'?1:-1;
 const p=reduced?0:(Number.isFinite(progress)?clamp(progress,0,1):0);
 const mass=actualKind===2?1.3:actualKind===1?.92:1;
 const fade=clamp(1-p*.86,.08,1);
 const marks:ImpactMark[]=[];
 const add=(mark:ImpactMarkKind,x:number,y:number,size:number,alpha:number,color:number,angle=0)=>marks.push({
  kind:mark,x:clamp(x*sign,-30,30),y:clamp(y,-31,18),size:clamp(size*mass,.5,28),alpha:clamp(alpha,0,1),color,angle:(Number.isFinite(angle)?angle:0)*sign,
 });

 if(reduced){
  const color=family==='energy'?(side==='player'?0x8ff6ef:0xffabb1):family==='earth'?0xe3d2a9:0xffd69a;
  add(family==='energy'?'pulse':'flash',0,-3,actualKind===2?10:7,.72,color,0);
  if(family==='earth')add('dust',0,2,7,.22,0xc7b792,0);
  else if(family!=='energy')add('spark',5,-5,3,.6,0xffe6aa,-.7);
  return marks;
 }

 const contact=clamp(1-p*2.8,0,1);
 const disperse=clamp(p*1.6,0,1);
 if(family==='earth'){
  add('flash',0,-3,6+contact*3,.58*fade,0xe8ddb9,0);
  add('shard',7+p*8,-5-p*5,4.2,.7*fade,0x7f8171,-.65);
  add('shard',-5-p*6,-2-p*3,3.2,.55*fade,0xb5a482,.55);
  add('dust',2+p*5,3-p*7,8+disperse*4,.24*fade,0xc7b792,.08);
  if(actualKind===2)add('dust',-6-p*5,5-p*4,10,.2*fade,0xa99877,-.12);
 }else if(family==='bronze'){
  add('flash',0,-5,7+contact*3,.82*fade,0xffe4a1,0);
  add('spark',8+p*8,-8-p*5,3.2,.9*fade,0xffc56b,-.8);
  add('spark',-6-p*7,-4-p*7,2.5,.72*fade,0xf6e0a6,.65);
  add('shard',4+p*5,0-p*4,3.6,.55*fade,0x9d8963,-.2);
  if(actualKind===2)add('dust',-3,5-p*5,8,.18*fade,0xb7a47f,.1);
 }else if(family==='powder'){
  add('flash',0,-5,8+contact*4,.9*fade,0xffd17f,0);
  add('spark',8+p*9,-7-p*7,3.2,.86*fade,0xffe0a0,-.7);
  add('spark',-5-p*7,-3-p*4,2.3,.62*fade,0xf6bd72,.5);
  add('smoke',2+p*5,-8-p*13,7+disperse*4,.25*fade,0xadb6aa,-.12);
  if(actualKind===2)add('smoke',-5-p*4,-4-p*10,9,.2*fade,0x8f9c97,.18);
 }else if(family==='steel'){
  add('flash',0,-4,7+contact*4,.92*fade,0xffd89b,0);
  add('spark',9+p*10,-8-p*8,3.5,.92*fade,0xffc76d,-.8);
  add('spark',-7-p*8,-5-p*6,2.8,.74*fade,0xffedbd,.68);
  add('shard',5+p*7,1-p*4,3.5,.58*fade,0x728a87,-.35);
  add('smoke',0,-8-p*13,6+disperse*3,.18*fade,0x9eaaa3,.05);
  if(actualKind===2)add('spark',1,-12-p*7,4,.68*fade,0xffa85f,.15);
 }else{
  const color=side==='player'?0x82eee7:0xff9ea8,white=0xeafff4;
  add('pulse',0,-5,9+disperse*7,.72*fade,color,0);
  add('flash',0,-5,5+contact*4,.92*fade,white,0);
  add('spark',8+p*10,-7-p*7,3.4,.78*fade,color,-.75);
  add('spark',-7-p*8,-3-p*9,2.8,.62*fade,white,.58);
  if(actualKind===2)add('pulse',0,-5,14+disperse*6,.3*fade,color,0);
 }
 return marks;
}
