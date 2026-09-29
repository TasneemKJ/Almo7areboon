/** Exports production SVG sources for asset review; it does not run the game. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {unitSvg,unitSheetSvg} from '../src/view/unit-illustrations.ts';
import {landscapeSvg,foregroundSvg,baseSvg} from '../src/view/world-illustrations.ts';
import {cardIllustration} from '../src/view/card-illustrations.ts';
import {CARD_DEFS,ERAS} from '../src/game/data.ts';
const destination=resolve(process.argv[2]||'artifacts/visual-assets');
mkdirSync(destination,{recursive:true});
const frames=[],bases=[];
for(let age=0;age<6;age++){
 writeFileSync(`${destination}/world-${age}.svg`,landscapeSvg(age));
 writeFileSync(`${destination}/foreground-${age}.svg`,foregroundSvg(age));
 writeFileSync(`${destination}/base-${age}.svg`,baseSvg(age,'player'));
 for(const side of ['player','enemy']){
  const svg=baseSvg(age,side);bases.push({age,side,svg});
  writeFileSync(`${destination}/base-${age}-${side}.svg`,svg);
  for(let kind=0;kind<3;kind++){
   const sheet=unitSheetSvg(age,kind,side);
   writeFileSync(`${destination}/sheet-${age}-${kind}-${side}.svg`,sheet);
   if(side==='player'){
    writeFileSync(`${destination}/unit-${age}-${kind}.svg`,unitSvg(age,kind));
    writeFileSync(`${destination}/sheet-${age}-${kind}.svg`,sheet);
   }
   for(let frame=0;frame<6;frame++)frames.push({age,kind,side,frame,svg:unitSvg(age,kind,side,frame)});
  }
 }
}
const cards=CARD_DEFS.map((card,index)=>({name:card.name,svg:decodeURIComponent(cardIllustration(index).split(',')[1])}));
writeFileSync(`${destination}/review.json`,JSON.stringify({frames,bases,cards,eras:ERAS.map(era=>era.name)}));
console.log(`Exported ${frames.length} faction/pose images to ${destination}. This is asset QA, not browser verification.`);
