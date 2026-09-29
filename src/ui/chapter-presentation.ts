import type {UnitKind} from '../game/types.ts';
import {landscapeSvg} from '../view/world-illustrations.ts';
import {dataSvg} from '../view/illustration-kit.ts';

interface ChapterPresentation {
 readonly title:string;
 readonly subtitle:string;
 readonly period:string;
 readonly units:readonly [string,string,string];
}
/** Fictional presentation only: indices, prices, progression and saves stay in game/. */
const chapters:readonly ChapterPresentation[]=Object.freeze([
 {title:'First Fires',subtitle:'A warm threshold. A silent valley.',period:'EARLY SETTLEMENTS',units:['Pathkeeper','Thrower','Dino Rider']},
 {title:'Olive Terraces',subtitle:'The last lamps above the fields.',period:'FARMING COMMUNITIES',units:['Fieldhand','Slinger','Harvester']},
 {title:'Harbor Watch',subtitle:'Quiet quays after the ships depart.',period:'COASTAL ANTIQUITY',units:['Quay Guard','Archer','Rider']},
 {title:'Lantern Quarter',subtitle:'Shutters close around the courtyard.',period:'HISTORIC CRAFT TOWNS',units:['Gatekeeper','Musketeer','Cannon']},
 {title:'Hillside Watch',subtitle:'One lit window above a sleeping town.',period:'AN IMAGINED PRESENT',units:['Sentinel','Scout','Tank']},
 {title:'Courtyards Beyond',subtitle:'Old thresholds beneath unfamiliar stars.',period:'AN IMAGINED FUTURE',units:['Light Guard','Trooper','Sky Skimmer']},
].map(chapter=>Object.freeze({...chapter,units:Object.freeze(chapter.units) as readonly [string,string,string]})));
const chapterIndex=(age:number)=>Number.isInteger(age)&&age>=0&&age<chapters.length?age:0;
export function chapterPresentation(age:number):ChapterPresentation {return chapters[chapterIndex(age)];}
export function unitPresentationName(age:number,kind:UnitKind):string {
 return chapterPresentation(age).units[[0,1,2].includes(kind)?kind:0];
}
const landscapes=new Map<number,string>();
/** Shared immutable DOM image URI, with no per-frame regeneration or network fetch. */
export function chapterLandscape(age:number):string {
 const index=chapterIndex(age);
 let image=landscapes.get(index);
 if(!image){image=dataSvg(landscapeSvg(index,false));landscapes.set(index,image);}
 return image;
}
