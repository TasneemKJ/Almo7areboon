export type AtmosphereKind='firefly'|'pollen'|'gull'|'ember'|'leaf'|'starlight';
export interface AtmosphereProfile {
  kind:AtmosphereKind;
  color:number;
  count:number;
  speed:number;
  band:[number,number];
}
export interface AtmosphereMark {
  kind:AtmosphereKind;
  x:number;
  y:number;
  size:number;
  alpha:number;
  color:number;
  angle:number;
}

export const ERA_ATMOSPHERE:readonly AtmosphereProfile[]=Object.freeze([
  {kind:'firefly', color:0xffe58c, count:12, speed:.12, band:[.47,.78]},
  {kind:'pollen', color:0xf4d58c, count:14, speed:.16, band:[.24,.73]},
  {kind:'gull', color:0xf4f0d4, count:6, speed:.08, band:[.20,.48]},
  {kind:'ember', color:0xffb16d, count:11, speed:.22, band:[.44,.76]},
  {kind:'leaf', color:0xb7c89f, count:10, speed:.18, band:[.30,.72]},
  {kind:'starlight', color:0xaef8f3, count:16, speed:.05, band:[.08,.64]},
]);

const fract=(value:number)=>value-Math.floor(value);
const noise=(seed:number)=>fract(Math.sin(seed*127.1+11.73)*43758.5453);
const wrap=(value:number,span:number)=>((value%span)+span)%span;
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

/** Pure presentation model for era ambience; gameplay never reads these marks. */
export function atmosphereFrame(age:number,time:number,width:number,groundY:number,reduced:boolean):AtmosphereMark[] {
  const index=Number.isInteger(age)&&age>=0&&age<ERA_ATMOSPHERE.length?age:0;
  const profile=ERA_ATMOSPHERE[index];
  const w=Number.isFinite(width)&&width>0?width:450;
  const ground=Number.isFinite(groundY)&&groundY>40?groundY:285;
  const t=reduced?0:(Number.isFinite(time)&&time>=0?time:0);
  const count=reduced?Math.max(3,Math.ceil(profile.count*.35)):profile.count;
  const upper=18,lower=Math.max(upper+24,Math.min(ground+25,310));
  const bandTop=upper+(lower-upper)*profile.band[0],bandBottom=upper+(lower-upper)*profile.band[1];
  const bandHeight=Math.max(12,bandBottom-bandTop);
  const marks:AtmosphereMark[]=[];
  for(let i=0;i<count;i++){
    const seed=index*97+i*19+7;
    const drift=(t*profile.speed*w*(.55+noise(seed+2)*.65));
    let x=wrap(noise(seed)*w+drift,w+36)-18;
    let y=bandTop+noise(seed+3)*bandHeight;
    let angle=-.35+noise(seed+5)*.7;
    let size=1.2+noise(seed+9)*2.8;
    let alpha=.28+noise(seed+11)*.48;
    if(profile.kind==='firefly'){
      y+=Math.sin(t*.8+i*1.7)*5;x+=Math.sin(t*.35+i)*4;size=1.1+noise(seed+4)*1.2;alpha=.28+.32*(.5+.5*Math.sin(t*1.7+i));
    }else if(profile.kind==='pollen'){
      y+=Math.sin(t*.7+i*.8)*7;angle=.6+noise(seed)*.45;size=1.1+noise(seed+6)*1.6;alpha=.22+noise(seed+8)*.34;
    }else if(profile.kind==='gull'){
      x=wrap(noise(seed)*w+t*profile.speed*w*(.7+noise(seed+3)),w+70)-35;y=bandTop+noise(seed+4)*bandHeight+Math.sin(t*.45+i)*4;size=4.5+noise(seed+2)*3;alpha=.42+noise(seed+7)*.32;angle=Math.sin(t*.35+i)*.12;
    }else if(profile.kind==='ember'){
      x=wrap(noise(seed)*w+Math.sin(t*.4+i)*18,w+30)-15;y=bandBottom-wrap(noise(seed+1)*bandHeight+t*profile.speed*42,bandHeight);size=1.3+noise(seed+4)*2;alpha=.25+.5*(1-(y-bandTop)/bandHeight);
    }else if(profile.kind==='leaf'){
      y+=Math.sin(t*.9+i*.6)*9;angle=t*.9+noise(seed)*Math.PI;size=2.5+noise(seed+2)*3;alpha=.25+noise(seed+6)*.35;
    }else{
      x=noise(seed)*w;y=bandTop+noise(seed+2)*bandHeight;size=.7+noise(seed+3)*1.5;alpha=.18+.46*(.5+.5*Math.sin(t*.9+i*1.9));angle=0;
    }
    marks.push({kind:profile.kind,x:clamp(x,-20,w+20),y:clamp(y,upper,lower),size:clamp(size,.5,12),alpha:clamp(alpha,0,1),color:profile.color,angle:Number.isFinite(angle)?angle:0});
  }
  return marks;
}
