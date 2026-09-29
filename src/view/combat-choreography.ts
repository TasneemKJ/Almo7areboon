import type {Side,UnitKind} from '../game/types.ts';

export type AttackFamily='melee'|'thrown'|'bow'|'firearm'|'mounted'|'artillery'|'energy-melee'|'energy';
export type AttackCueKind='slash'|'flash'|'muzzle'|'smoke'|'dust'|'energy'|'trail';
export interface AttackCueMark {
  kind:AttackCueKind;
  x:number;
  y:number;
  size:number;
  alpha:number;
  color:number;
  angle:number;
}
export interface HitReaction {x:number;y:number;angle:number;}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

/** Presentation family follows what the current renderer actually shows, not hidden balance rules. */
export function attackFamily(age:number,kind:number):AttackFamily {
  const actualAge=Number.isInteger(age)&&age>=0&&age<6?age:0;
  const actualKind=([0,1,2].includes(kind)?kind:0) as UnitKind;
  if(actualAge===5)return actualKind===0?'energy-melee':actualKind===1?'energy':'artillery';
  if(actualKind===2)return actualAge===0||actualAge===2?'mounted':actualAge>=3?'artillery':'melee';
  if(actualKind===1)return actualAge===2?'bow':actualAge<=1?'thrown':'firearm';
  if(actualAge===4)return 'firearm';
  return 'melee';
}

/** Tiny view-only recoil: enough to sell contact without shifting targeting or collision positions. */
export function hitReaction(hitFlash:number,side:Side,kind:UnitKind,reduced:boolean):HitReaction {
  if(reduced||!Number.isFinite(hitFlash)||hitFlash<=0)return {x:0,y:0,angle:0};
  const strength=clamp(hitFlash/.16,0,1);
  const direction=side==='player'?-1:1;
  const travel=(kind===2?1.7:kind===1?2.5:3.2)*strength;
  const turn=(kind===2?1.5:kind===1?2.1:2.8)*strength;
  return {x:direction*travel,y:.9*strength,angle:direction*turn};
}

/**
 * Local-space cue emitted only for an actual combat hit. The renderer owns lifetime and world placement.
 * Reduced motion keeps one static readable contact flash while removing trails, dust and drifting smoke.
 */
export function attackCueFrame(age:number,kind:UnitKind,side:Side,progress:number,reduced:boolean):AttackCueMark[] {
  const family=attackFamily(age,kind);
  const sign=side==='player'?1:-1;
  const p=Number.isFinite(progress)?clamp(progress,0,1):0;
  const fade=clamp(1-p*.92,.08,1);
  const marks:AttackCueMark[]=[];
  const add=(cue:AttackCueKind,x:number,y:number,size:number,alpha:number,color:number,angle=0)=>{
    marks.push({kind:cue,x:clamp(x*sign,-48,48),y:clamp(y,-64,8),size:clamp(size,.5,22),alpha:clamp(alpha*fade,0,1),color,angle:Number.isFinite(angle)?angle*sign:0});
  };

  if(family==='melee'||family==='energy-melee'){
    add('slash',24,-31,family==='energy-melee'?17:14,.9,family==='energy-melee'?0x9af8f1:0xffefb9,-.58);
    if(!reduced){add('trail',15,-28,10,.42,family==='energy-melee'?0x73ddd8:0xe8d399,-.45);add('dust',3,1,4,.24,0xd9c9a0,.15);}
  }else if(family==='mounted'){
    add('slash',31,-42,18,.88,age===0?0xf0d699:0xe8e4cc,-.2);
    if(!reduced){add('trail',22,-39,13,.4,0xcad7b6,-.18);add('dust',4,2,7,.34,0xcdbb92,.2);}
  }else if(family==='thrown'||family==='bow'){
    add('flash',26,-38,family==='bow'?5.5:4.5,.78,family==='bow'?0xffedb8:0xd9e4d0,0);
    if(!reduced)add('trail',18,-36,9,.32,family==='bow'?0xd2bd83:0xabb9aa,-.05);
  }else if(family==='firearm'){
    add('muzzle',31,-35,7,.96,0xffd37f,0);
    if(!reduced){add('smoke',26,-40,5,.26,0xc9cfbd,-.28);add('trail',24,-35,8,.34,0xffe9b3,0);}
  }else if(family==='energy'){
    add('energy',32,-35,8,.92,side==='player'?0x86f8f0:0xffa6ad,0);
    if(!reduced)add('trail',23,-35,12,.42,side==='player'?0x70ddd9:0xe98d96,0);
  }else{
    // Artillery: cannon, tank and spacecraft need a larger source-side reaction than infantry.
    add(age===5?'energy':'muzzle',39,-42,age===5?11:10,.98,age===5?(side==='player'?0x86f8f0:0xffa6ad):0xffc777,0);
    if(!reduced){add('smoke',30,-47,8,.3,age===5?0x7ba9b7:0xb7b9a5,-.2);add('dust',8,1,8,.28,0xc7b792,.12);add('trail',28,-42,13,.34,age===5?0x8ce8e1:0xffdd9b,0);}
  }
  return marks;
}
