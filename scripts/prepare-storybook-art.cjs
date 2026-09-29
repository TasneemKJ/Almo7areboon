/** Offline asset packing. Install sharp locally or expose it through NODE_PATH. */
const sharp=require('sharp');
const {mkdirSync,writeFileSync}=require('node:fs');
const path=require('node:path');
const olive=process.argv.includes('--olive');
const harbor=process.argv.includes('--harbor');
const lantern=process.argv.includes('--lantern');
const hillside=process.argv.includes('--hillside');
const courtyards=process.argv.includes('--courtyards');
if([olive,harbor,lantern,hillside,courtyards].filter(Boolean).length>1)throw new Error('Choose one chapter to pack');
const folder=courtyards?'courtyards':hillside?'hillside':lantern?'lantern':harbor?'harbor':olive?'olive':'';
const source=path.resolve('art-source/storybook',folder);
const output=path.resolve('public/art/storybook',folder);
mkdirSync(output,{recursive:true});
const WIDTH=hillside||courtyards?216:folder?224:256,HEIGHT=192,BASELINE=181,PADDING=8;

async function pack(name){
 const {data,info}=await sharp(path.join(source,`${name}.webp`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const rowSplit={rider:500,fieldhand:503,'quay-rider':496}[name]??info.height/2;
 const rows=[0,rowSplit,info.height],frames=[];
 for(let row=0;row<2;row++){
  const ranges=[];let start=-1;
  for(let x=0;x<=info.width;x++){
   let active=false;
   if(x<info.width)for(let y=rows[row];y<rows[row+1];y++)if(data[(y*info.width+x)*4+3]>64){active=true;break;}
   if(active&&start<0)start=x;
   if(!active&&start>=0){if(x-start>8)ranges.push([start,x-1]);start=-1;}
  }
  if(ranges.length!==3)throw new Error(`${name}: expected three separated figures in row ${row}, found ${ranges.length}`);
  for(const [left,right]of ranges){
   let top=info.height,bottom=-1;
   for(let y=rows[row];y<rows[row+1];y++)for(let x=left;x<=right;x++)if(data[(y*info.width+x)*4+3]>64){top=Math.min(top,y);bottom=Math.max(bottom,y);}
   let footLeft=right,footRight=left;
   for(let y=bottom-Math.floor((bottom-top)*.08);y<=bottom;y++)for(let x=left;x<=right;x++)if(data[(y*info.width+x)*4+3]>64){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);}
   const anchor=(footLeft+footRight)/2;
   frames.push({left:Math.max(0,left-2),right:Math.min(info.width-1,right+2),top:Math.max(rows[row],top-2),bottom:Math.min(rows[row+1]-1,bottom+2),anchor});
  }
 }
 // One shared scale preserves proportions and head size throughout the animation.
 const scale=Math.min(...frames.flatMap(f=>[(BASELINE-PADDING)/(f.bottom-f.top+1),(WIDTH/2-PADDING)/(f.anchor-f.left),(WIDTH/2-PADDING)/(f.right-f.anchor)]));
 const packed=[];
 for(const f of frames){
  const w=f.right-f.left+1,h=f.bottom-f.top+1,tw=Math.max(1,Math.round(w*scale)),th=Math.max(1,Math.round(h*scale));
  const input=await sharp(path.join(source,`${name}.webp`)).extract({left:f.left,top:f.top,width:w,height:h}).resize(tw,th).png().toBuffer();
  const left=Math.round(WIDTH/2-(f.anchor-f.left)*scale),top=BASELINE-th;
  if(left<0||left+tw>WIDTH||top<0)throw new Error(`${name}: frame exceeded cell`);
  packed.push(await sharp({create:{width:WIDTH,height:HEIGHT,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input,left,top}]).png().toBuffer());
 }
 await sharp({create:{width:WIDTH*6,height:HEIGHT,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(packed.map((input,i)=>({input,left:i*WIDTH,top:0}))).webp({quality:94,alphaQuality:100}).toFile(path.join(output,`${name}-strip.webp`));
 await sharp(packed[0]).webp({quality:94,alphaQuality:100}).toFile(path.join(output,`${name}-portrait.webp`));
 return {name,frames:6,frameWidth:WIDTH,frameHeight:HEIGHT,footBaseline:BASELINE,sharedScale:scale,sourceBounds:frames};
}
async function main(){
 const metadata=[];
 const names=courtyards?['light-guard','trooper','sky-skimmer']:hillside?['sentinel','scout','tank']:lantern?['gatekeeper','musketeer','cannon']:harbor?['quay-guard','archer','quay-rider']:olive?['fieldhand','slinger','harvester']:['pathkeeper','thrower','rider'];
 for(const name of names)metadata.push(await pack(name));
 await sharp(path.join(source,'village.webp')).resize(900,1000,{fit:'fill'}).webp({quality:92}).toFile(path.join(output,'village.webp'));
 const hut=await sharp(path.join(source,'shelter.webp')).trim({threshold:12}).resize(234,208,{fit:'inside'}).png().toBuffer();
 const m=await sharp(hut).metadata();
 await sharp({create:{width:256,height:256,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:hut,left:Math.round((256-m.width)/2),top:224-m.height}]).webp({quality:94,alphaQuality:100}).toFile(path.join(output,'shelter.webp'));
 writeFileSync(path.join(source,'packing.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log('Packed storybook landscape, shelter, three animation strips and portraits.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
