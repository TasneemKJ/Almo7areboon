/** HD copies of each chapter's village plate and shelter for the DOM (camp, entry, results, journey, intro), exported
 * from the original art in art-source at its own size: never upscaled. The battlefield's textures stay as packed by
 * prepare-storybook-art.cjs. Run: NODE_PATH=<dir with sharp> node scripts/prepare-storybook-hd.cjs */
const sharp=require('sharp'),path=require('path');
(async()=>{
 for(const folder of ['','olive','harbor','lantern','hillside','courtyards']){
  const source=path.resolve('art-source/storybook',folder),output=path.resolve('public/art/storybook',folder);
  const plate=await sharp(path.join(source,'village.webp')).metadata();
  // The shipped plate's 0.9 aspect, as large as the source allows without enlarging either side.
  const width=Math.floor(Math.min(plate.width,plate.height*.9)/2)*2,height=Math.round(width/.9);
  await sharp(path.join(source,'village.webp')).resize(width,height,{fit:'fill'}).webp({quality:90}).toFile(path.join(output,'village-hd.webp'));
  // The shelter at twice the packed layout (footprint at 448/512), only as large as the source allows.
  const hut=await sharp(path.join(source,'shelter.webp')).trim({threshold:12}).resize(468,416,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const m=await sharp(hut).metadata();
  await sharp({create:{width:512,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:hut,left:Math.round((512-m.width)/2),top:448-m.height}]).webp({quality:92,alphaQuality:100}).toFile(path.join(output,'shelter-hd.webp'));
  console.log(folder||'first-fires',`village-hd ${width}x${height}`,`shelter hut ${m.width}x${m.height}`);
 }
})();
