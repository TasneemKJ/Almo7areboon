/** Source-art/effect composition only. This does not boot Phaser or open a browser. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {landscapeSvg,foregroundSvg} from '../src/view/world-illustrations.ts';
import {duskAtmosphereFrame,paintDuskAtmosphere} from '../src/view/dusk-atmosphere.ts';
import {chapterPresentation} from '../src/ui/chapter-presentation.ts';
const directory=resolve(process.argv[2]||'artifacts/dusk-review');
mkdirSync(directory,{recursive:true});
const hex=color=>`#${color.toString(16).padStart(6,'0')}`;
function effectSvg(age,time,reduced){
 let fill='',stroke='',markup='';
 const painter={
  fillStyle(color,alpha){fill=`fill="${hex(color)}" fill-opacity="${alpha}"`;},
  lineStyle(width,color,alpha){stroke=`stroke="${hex(color)}" stroke-width="${width}" stroke-opacity="${alpha}"`;},
  fillEllipse(x,y,w,h){markup+=`<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}" ${fill}/>`;},
  strokeEllipse(x,y,w,h){markup+=`<ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}" fill="none" ${stroke}/>`;},
 };
 paintDuskAtmosphere(painter,duskAtmosphereFrame(age,time,reduced),{x:0,y:0,scale:1});
 return `<g data-layer="living-dusk">${markup}</g>`;
}
const frames=[];
for(let age=0;age<6;age++){
 const base=landscapeSvg(age,false),fg=foregroundSvg(age),foreground=fg.slice(fg.indexOf('>')+1,fg.lastIndexOf('</svg>'));
 writeFileSync(`${directory}/before-${age}.svg`,landscapeSvg(age));
 for(const time of [0,10,20]){
  const name=`after-${age}-${time}.svg`,marks=duskAtmosphereFrame(age,time,false);
  writeFileSync(`${directory}/${name}`,base.replace('</svg>',effectSvg(age,time,false)+foreground+'</svg>'));
  frames.push({age,time,name,title:chapterPresentation(age).title,marks});
 }
 writeFileSync(`${directory}/reduced-${age}.svg`,base.replace('</svg>',effectSvg(age,999,true)+foreground+'</svg>'));
}
writeFileSync(`${directory}/manifest.json`,JSON.stringify({kind:'source-art composition, not a game screenshot',frames},null,2)+'\n');
console.log(`Exported ${frames.length} chapter/time compositions to ${directory}. Not browser verification.`);
