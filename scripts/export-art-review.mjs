/** Exports production SVG sources for asset review; it does not run the game. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {unitSvg,unitSheetSvg} from '../src/view/unit-illustrations.ts';
import {landscapeSvg,baseSvg} from '../src/view/world-illustrations.ts';
import {cardIllustration} from '../src/view/card-illustrations.ts';
import {CARD_DEFS,ERAS} from '../src/game/data.ts';
const destination=resolve(process.argv[2]||'artifacts/visual-assets');
mkdirSync(destination,{recursive:true});
const frames=[];
for(let age=0;age<6;age++){
 writeFileSync(`${destination}/world-${age}.svg`,landscapeSvg(age));
 writeFileSync(`${destination}/base-${age}.svg`,baseSvg(age,'player'));
 for(let kind=0;kind<3;kind++){
  writeFileSync(`${destination}/unit-${age}-${kind}.svg`,unitSvg(age,kind));
  writeFileSync(`${destination}/sheet-${age}-${kind}.svg`,unitSheetSvg(age,kind,'player'));
  for(let frame=0;frame<6;frame++)frames.push({age,kind,frame,svg:unitSvg(age,kind,'player',frame)});
 }
}
const cards=CARD_DEFS.map((card,index)=>({name:card.name,svg:decodeURIComponent(cardIllustration(index).split(',')[1])}));
writeFileSync(`${destination}/review.json`,JSON.stringify({frames,cards,eras:ERAS.map(era=>era.name)}));
console.log(`Exported production art to ${destination}. This is asset QA, not browser verification.`);
