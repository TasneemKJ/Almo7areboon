import type {Side} from '../game/types.ts';

export type BaseDamageStage='intact'|'worn'|'critical';
export type BaseDamageKind='crack'|'smoke'|'rubble'|'spark';
export interface BaseDamagePalette {crack:number;smoke:number;debris:number;accent:number;}
export interface BaseDamageMark {
  kind:BaseDamageKind;
  x:number;
  y:number;
  size:number;
  alpha:number;
  color:number;
  angle:number;
}

/** Material-specific colors only; base damage never changes simulation or asset identity. */
export const BASE_DAMAGE_PALETTES:readonly BaseDamagePalette[]=Object.freeze([
  {crack:0x5d5547,smoke:0x556157,debris:0xb0a68d,accent:0xf0d590},
  {crack:0x725c40,smoke:0x756b53,debris:0xd0b47a,accent:0xf5df9c},
  {crack:0x686a60,smoke:0x8c8d80,debris:0xd8d2b8,accent:0xf2e2b5},
  {crack:0x604f4d,smoke:0x544b50,debris:0xb59788,accent:0xffad72},
  {crack:0x42564f,smoke:0x3d4944,debris:0x87977f,accent:0xffd88b},
  {crack:0x628b98,smoke:0x4d6174,debris:0xa8bac5,accent:0x91f7f2},
]);

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const fract=(value:number)=>value-Math.floor(value);
const noise=(seed:number)=>fract(Math.sin(seed*91.73+17.11)*43758.5453);
type CrackAttachment=readonly [x:number,y:number,size:number,angle:number];
// Attach to opaque masonry in each painted shelter, with room for the 2.2px
// outline on both teams. These replace the rectangular legacy facade assumption.
const PAINTED_CRACKS:readonly (readonly CrackAttachment[])[]=[
  [[0,-45,9,.58],[28,-26,7,-.72],[-26,-11,8,-.4],[-12,-33,8,.78],[23,-9,9,-.48],[-28,-24,7,.34]],
  [[-15,-43,9,-.72],[11,-35,10,.58],[-5,-15,8,-.4],[-16,-57,8,.78],[25,-20,8,-.48],[-26,-27,7,.34]],
  [[-17,-43,9,-.72],[9,-39,10,.58],[-5,-25,8,-.4],[-14,-59,7,.78],[25,-20,8,-.48],[-25,-28,7,.34]],
  [[-17,-52,10,-.72],[9,-39,10,.58],[-5,-25,8,-.4],[14,-48,8,.78],[-27,-35,9,-.48],[25,-18,7,.34]],
  [[-21,-52,7,-.72],[26,-23,7,-.4],[-22,-23,7,.78],[17,-44,7,-.48],[27,-9,7,.34],[6,-39,7,.18]],
  [[-6,-49,6,-.4],[-16,-23,5,1.25],[19,-17,5,1.3],[12,-47,6,.58],[0,-38,6,-.1],[-33,-7,5,.34]],
];
const LEGACY_CRACKS:readonly CrackAttachment[]=[[-17,-52,12,-.72],[9,-39,10,.58],[-5,-25,8,-.4],[23,-61,14,.78],[-27,-35,11,-.48],[19,-18,9,.34]];

export function baseDamagePalette(age:number):BaseDamagePalette {
  return BASE_DAMAGE_PALETTES[Number.isInteger(age)&&age>=0&&age<BASE_DAMAGE_PALETTES.length?age:0];
}

export function baseDamageStage(hp:number,maxHp:number):BaseDamageStage {
  if(!Number.isFinite(hp)||!Number.isFinite(maxHp)||maxHp<=0)return 'intact';
  const ratio=clamp(hp/maxHp,0,1);
  return ratio>.72?'intact':ratio>.35?'worn':'critical';
}

/**
 * Local-space damage composition around a 160x160 base anchored near (0, 0).
 * Structural marks are mirrored between factions. Only smoke/sparks animate.
 */
export function baseDamageFrame(age:number,side:Side,hp:number,maxHp:number,time:number,reduced:boolean):BaseDamageMark[] {
  const stage=baseDamageStage(hp,maxHp);
  if(stage==='intact')return [];
  const palette=baseDamagePalette(age);
  const actualAge=Number.isInteger(age)&&age>=0&&age<6?age:0;
  const sign=side==='player'?1:-1;
  const t=reduced?0:(Number.isFinite(time)&&time>=0?time:0);
  const marks:BaseDamageMark[]=[];
  const add=(kind:BaseDamageKind,x:number,y:number,size:number,alpha:number,color:number,angle:number)=>marks.push({kind,x:clamp(x,-42,42),y:clamp(y,-82,8),size:clamp(size,.5,16),alpha:clamp(alpha,0,.82),color,angle:Number.isFinite(angle)?angle:0});

  const cracks=PAINTED_CRACKS[actualAge]??LEGACY_CRACKS;
  for(let i=0;i<3;i++){const [x,y,size,angle]=cracks[i];add('crack',x*sign,y,size,.65,palette.crack,angle*sign);}
  const rubble=[[-23,-2,6,-.34],[15,1,5,.26]] as const;
  for(const [x,y,size,angle] of rubble)add('rubble',x*sign,y,size,.7,palette.debris,angle*sign);

  if(stage==='critical'){
    for(let i=3;i<6;i++){const [x,y,size,angle]=cracks[i];add('crack',x*sign,y,size,.76,palette.crack,angle*sign);}
    const criticalRubble=[[29,3,7,.52],[-10,5,5,-.22],[4,2,4,.12]] as const;
    for(const [x,y,size,angle] of criticalRubble)add('rubble',x*sign,y,size,.76,palette.debris,angle*sign);

    const smokeCount=actualAge===5?2:3;
    for(let i=0;i<smokeCount;i++){
      const seed=actualAge*29+i*13+3;
      const rise=((t*(5.5+noise(seed)*2.5)+noise(seed+2)*20)%24);
      const x=(i-1)*10*sign+Math.sin(t*.7+i)*3;
      const y=-58-rise;
      const alpha=.2+noise(seed+5)*.18;
      add('smoke',x,y,7+noise(seed+7)*5,alpha,palette.smoke,0);
    }
    const sparkCount=actualAge>=3?3:1;
    for(let i=0;i<sparkCount;i++){
      const seed=actualAge*41+i*17+9;
      const rise=((t*(12+noise(seed)*5)+noise(seed+3)*18)%22);
      add('spark',(-8+i*8)*sign,-43-rise,1.3+noise(seed+4)*1.5,.36+noise(seed+8)*.24,palette.accent,(-.7+noise(seed+6)*1.4)*sign);
    }
  }else{
    const seed=actualAge*31+11;
    add('smoke',9*sign,-60-((t*3+noise(seed)*8)%9),6,.16,palette.smoke,0);
  }
  return marks;
}
