import {storybookArt} from './storybook-art.ts';
import {baseSvg} from './world-illustrations.ts';
import {dataSvg} from './illustration-kit.ts';
/** Painted local work props share the existing stone, cloth, ink and brass palette.
 * They depict their function at scene scale; they are not navigation glyphs. */
export function storehouseIllustration(level:number):string {
 const worked=Number.isFinite(level)&&level>0;
 return `<span class="camp-storehouse" data-work-level="${Math.max(0,Math.floor(Number.isFinite(level)?level:0))}"><img class="camp-storehouse-image" src="/art/storybook/camp/storehouse.webp" alt="" width="640" height="427"/>${worked?'<img class="camp-stock-food" src="/art/storybook/interface/food.webp" alt=""/>':''}</span>`;
}
export function journalIllustration():string {
 return '<img src="/art/storybook/camp/journal.webp" alt="" width="512" height="468"/>';
}
export function campGateImage(age:number):string {
 const art=storybookArt(age);return art?`${art.folder}/shelter.webp`:dataSvg(baseSvg(age,'player'));
}
