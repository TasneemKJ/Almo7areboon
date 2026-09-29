const fs=require('fs');
const sharp=require('sharp');
const names=['coin','gem','food','battle','evolution','cards','skills','shield','gear','quest','lock','freeze','meteor','heart','flag','trophy'];
(async()=>{
 const source=process.argv[2]||'art-source/storybook/interface/atlas.webp';
 const {width,height}=await sharp(source).metadata();
 for(const [i,name] of names.entries()){
  const col=i%4,row=Math.floor(i/4),left=Math.floor(col*width/4),top=Math.floor(row*height/4);
  const cell=await sharp(source).extract({left,top,width:Math.floor((col+1)*width/4)-left,height:Math.floor((row+1)*height/4)-top}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const w=cell.info.width,h=cell.info.height,data=cell.data,seen=new Uint8Array(w*h);let largest=[];
  // Keep the main connected silhouette; detached generation flecks are not UI content.
  for(let p=0;p<w*h;p++){
   if(seen[p]||data[p*4+3]<32)continue;
   const component=[p];seen[p]=1;
   for(let j=0;j<component.length;j++){
    const q=component[j],x=q%w,y=Math.floor(q/w);
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
     const nx=x+dx,ny=y+dy,n=ny*w+nx;
     if(nx<0||nx>=w||ny<0||ny>=h||seen[n]||data[n*4+3]<32)continue;
     seen[n]=1;component.push(n);
    }
   }
   if(component.length>largest.length)largest=component;
  }
  if(largest.length<1000)throw new Error(`Missing silhouette: ${name}`);
  const keep=new Uint8Array(w*h);for(const p of largest)keep[p]=1;
  for(let p=0;p<w*h;p++)if(!keep[p])data[p*4+3]=0;
  const trimmed=await sharp(data,{raw:cell.info}).trim().resize(116,116,{fit:'inside'}).png().toBuffer();
  const m=await sharp(trimmed).metadata();
  await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}}).composite([{input:trimmed,left:Math.floor((128-m.width)/2),top:Math.floor((128-m.height)/2)}]).webp({quality:94,alphaQuality:100}).toFile(`public/art/storybook/interface/${name}.webp`);
 }
})();
