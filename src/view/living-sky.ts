/**
 * Upper-sky life: parallax cloud banks, twinkling stars and a rare shooting star.
 * World space (450 wide). Everything stays inside a band above the tallest authored
 * skyline (≤ .42 × groundY) so it never crosses buildings, bases or troops.
 */
export interface Puff {x:number;y:number;rx:number;ry:number;color:number;alpha:number}
export interface Star {x:number;y:number;size:number;alpha:number}
export interface Streak {x1:number;y1:number;x2:number;y2:number;alpha:number}

interface SkyProfile {top:number;lit:number;shade:number;cloudAlpha:number;stars:number;starAlpha:number}
const PROFILES:readonly SkyProfile[]=Object.freeze([
  {top:0xf2c7a8,lit:0xe9d6c0,shade:0x6d7a92,cloudAlpha:0.46,stars:14,starAlpha:.55},
  {top:0xf4cfa2,lit:0xefdcc0,shade:0x7a7c90,cloudAlpha:0.46,stars:12,starAlpha:.5},
  {top:0xe8d2c0,lit:0xdfe4df,shade:0x5f7d93,cloudAlpha:0.41,stars:16,starAlpha:.55},
  {top:0xf0b9a4,lit:0xe7c8c6,shade:0x6b5f86,cloudAlpha:0.51,stars:18,starAlpha:.6},
  {top:0xd9d6c4,lit:0xd4dccf,shade:0x5c7482,cloudAlpha:0.41,stars:20,starAlpha:.6},
  {top:0xa9c9ff,lit:0xbcd6f2,shade:0x3c4a82,cloudAlpha:0.37,stars:30,starAlpha:.8},
].map(profile=>Object.freeze(profile)));

export const SKY_CEILING=.42;
const scene=(age:number)=>Number.isInteger(age)&&age>=0&&age<6?age:0;
const clock=(time:number,reduced:boolean)=>reduced||!Number.isFinite(time)||time<0?0:Math.min(1e6,time);
const noise=(seed:number)=>{const v=Math.sin(seed*127.1+11.73)*43758.5453;return v-Math.floor(v);};
const wrap=(v:number,span:number)=>((v%span)+span)%span;
const ground=(groundY:number)=>Number.isFinite(groundY)&&groundY>60?groundY:285;

export function skyProfile(age:number):SkyProfile {return PROFILES[scene(age)];}

/** Three parallax banks: far clouds are small, pale and slow; near ones larger, shaded and faster. */
export function cloudFrame(age:number,time:number,groundY:number,reduced:boolean):readonly Puff[] {
  const a=scene(age),p=PROFILES[a],t=clock(time,reduced),g=ground(groundY),puffs:Puff[]=[];
  const banks=[{depth:0,count:3,speed:1.4,y:.13,size:.7},{depth:1,count:3,speed:2.6,y:.22,size:.9},{depth:2,count:2,speed:4.2,y:.27,size:1.15}];
  for(const bank of banks)for(let i=0;i<bank.count;i++){
    const seed=a*53+bank.depth*17+i*7,span=450+260;
    const cx=wrap(noise(seed)*span+t*bank.speed,span)-130,cy=g*(bank.y+noise(seed+1)*.04);
    const w=(64+noise(seed+2)*44)*bank.size,h=w*.26;
    // Shaded base, lit body, warm crest: three puffs read as one sunset-lit cloud.
    puffs.push({x:cx,y:cy+h*.35,rx:w,ry:h*.7,color:p.shade,alpha:p.cloudAlpha*(.7+bank.depth*.15)});
    puffs.push({x:cx-w*.18,y:cy,rx:w*.72,ry:h,color:p.lit,alpha:p.cloudAlpha*(.8+bank.depth*.1)});
    puffs.push({x:cx+w*.12,y:cy-h*.35,rx:w*.46,ry:h*.62,color:p.top,alpha:p.cloudAlpha*.9});
  }
  return puffs;
}

/** Sparse stars in the top band that twinkle out of phase; still under reduced motion. */
export function starFrame(age:number,time:number,groundY:number,reduced:boolean):readonly Star[] {
  const a=scene(age),p=PROFILES[a],t=clock(time,reduced),g=ground(groundY),stars:Star[]=[];
  for(let i=0;i<p.stars;i++){
    const seed=a*211+i*13;
    const twinkle=reduced?.75:.55+.45*Math.sin(t*(1.1+noise(seed+3)*2.3)+noise(seed+4)*6.28);
    stars.push({x:6+noise(seed)*438,y:g*(.03+noise(seed+1)*.3),size:.9+noise(seed+2)*1.5,alpha:p.starAlpha*twinkle});
  }
  return stars;
}

/** One shooting star per ~11s window, visible for .7s; never under reduced motion. */
export function shootingStar(age:number,time:number,groundY:number,reduced:boolean):Streak|null {
  if(reduced||!Number.isFinite(time)||time<0)return null;
  const period=11,window=Math.floor(time/period),phase=time-window*period,life=.7;
  const start=2+noise(window*31+scene(age))*6;
  if(phase<start||phase>start+life)return null;
  const k=(phase-start)/life,g=ground(groundY),seed=window*17+scene(age);
  const x0=60+noise(seed)*260,y0=g*(.04+noise(seed+1)*.1),len=70,dx=len*.86,dy=len*.5;
  const head={x:x0+dx*k,y:y0+dy*k};
  return {x1:head.x-dx*.45,y1:head.y-dy*.45,x2:head.x,y2:head.y,alpha:Math.sin(k*Math.PI)*.8};
}
