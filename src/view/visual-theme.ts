/** Presentation-only tuning. None of these values are read by combat or saves. */
export const VISUAL_ERAS = [
  { name:'Stone Age', scene:'The emerald wilds', sky:['#2589a2','#b5e7da'], far:'#629e94', ridge:'#36796e', light:'#a5cf90', ground:'#689750', soil:'#385b43', path:'#dfc493', accent:'#b9db8d', mote:0xffe9a0 },
  { name:'Farm Age', scene:'The golden harvest', sky:['#348997','#ffebc0'], far:'#b0b47a', ridge:'#839a61', light:'#dec779', ground:'#a6ac56', soil:'#716e3d', path:'#ebc895', accent:'#f4cf7c', mote:0xffe4a1 },
  { name:'Spartan Age', scene:'The marble coast', sky:['#397ba1','#d7edf0'], far:'#81b0c2', ridge:'#5c939d', light:'#d5cd9e', ground:'#99a96a', soil:'#666e46', path:'#ecdbb2', accent:'#e5c38a', mote:0xf2e4bc },
  { name:'Renaissance', scene:'The citadel at sundown', sky:['#6d6795','#f3c8a0'], far:'#b38d9b', ridge:'#7f7184', light:'#baa077', ground:'#8d9271', soil:'#4f6259', path:'#cfb39b', accent:'#eeaa87', mote:0xffd6a0 },
  { name:'Modern Age', scene:'The silent frontier', sky:['#3d6178','#c5d6cc'], far:'#8baba6', ridge:'#577a77', light:'#a2b78b', ground:'#6e8b67', soil:'#394f48', path:'#b7b69b', accent:'#b3c6a4', mote:0xe1e9c7 },
  { name:'Space Age', scene:'Beyond the last horizon', sky:['#171b49','#586b98'], far:'#687fa7', ridge:'#3b527d', light:'#718bae', ground:'#465878', soil:'#26324f', path:'#8fa6bf', accent:'#87ede9', mote:0xb3fbff },
] as const;
export function visualEra(age:number) { return VISUAL_ERAS[Number.isInteger(age)&&age>=0&&age<6?age:0]; }
export const ART_WIDTH=450;
export const LANDSCAPE_WIDTH=900;
export const LANDSCAPE_HEIGHT=1000;
export const LANDSCAPE_GROUND_Y=660;
export function arenaLayout(width:number,height:number) {
  const w=Number.isFinite(width)&&width>0?width:450;
  const h=Number.isFinite(height)&&height>0?height:430;
  const scale=w/ART_WIDTH, logicalHeight=h/scale;
  return {scale,width:ART_WIDTH,height:logicalHeight,groundY:logicalHeight*.66,laneGap:12};
}
/**
 * Uniform cover crop for the 900×1000 illustrated world. It keeps the source
 * ground anchor under troop feet instead of vertically squashing mountains,
 * buildings and trees to whatever height the browser gives the canvas.
 */
export function landscapePlacement(width:number,height:number,groundY?:number) {
  const w=Number.isFinite(width)&&width>0?width:ART_WIDTH;
  const h=Number.isFinite(height)&&height>0?height:430;
  const requested=Number.isFinite(groundY)?Number(groundY):h*.66;
  const ground=Math.max(0,Math.min(h,requested));
  const below=LANDSCAPE_HEIGHT-LANDSCAPE_GROUND_Y;
  const scale=Math.max(
    w/LANDSCAPE_WIDTH,
    ground/LANDSCAPE_GROUND_Y,
    (h-ground)/below,
  );
  const scaledWidth=LANDSCAPE_WIDTH*scale,scaledHeight=LANDSCAPE_HEIGHT*scale;
  return {
    x:(w-scaledWidth)/2,
    y:ground-LANDSCAPE_GROUND_Y*scale,
    scale,
    scaleX:scale,
    scaleY:scale,
    width:scaledWidth,
    height:scaledHeight,
  };
}
/** All world actors and illustrated scenery preserve their authored proportions. */
export function troopPose(time:number,moving:boolean,attacking:boolean,reduced:boolean) {
  if(reduced||(!moving&&!attacking))return {frame:0,lift:0,angle:0};
  const t=Number.isFinite(time)?Math.max(0,time):0;
  if(attacking)return {frame:4+Math.floor(t*7)%2,lift:0,angle:Math.sin(t*14)*2};
  return {frame:Math.floor(t*9)%4,lift:Math.abs(Math.sin(t*9))*1.1,angle:Math.sin(t*9)*1.1};
}
export function projectilePoint(from:{x:number;y:number},to:{x:number;y:number},progress:number,arc=0) {
 const t=Number.isFinite(progress)?Math.min(1,Math.max(0,progress)):0;
 return {x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t-(t===0||t===1?0:Math.sin(t*Math.PI)*arc)};
}
